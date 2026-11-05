export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_RESUME_CHARS = 6000;
const MAX_XML_BYTES = 2_000_000;
class ResumeExtractionError extends Error {}
export const resumeErrorMessage = (error: unknown) =>
  error instanceof ResumeExtractionError
    ? error.message
    : "Could not read this file. Please retry or paste text instead.";
const readBytes = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(
        new ResumeExtractionError("Could not read this file. Please try again or paste text."),
      );
    reader.readAsArrayBuffer(file);
  });

/** Validate ZIP central directory before decompressing the one DOCX XML part. */
export async function extractDocx(bytes: Uint8Array): Promise<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const fail = () => {
    throw new ResumeExtractionError(
      "This DOCX is invalid or too large. Try a smaller file or paste text.",
    );
  };
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return fail();
  const count = view.getUint16(eocd + 10, true),
    cdSize = view.getUint32(eocd + 12, true),
    cdOffset = view.getUint32(eocd + 16, true);
  if (
    count > 1000 ||
    cdOffset + cdSize > eocd ||
    view.getUint16(eocd + 4, true) !== 0 ||
    view.getUint16(eocd + 6, true) !== 0
  )
    return fail();
  let at = cdOffset,
    total = 0,
    target: { offset: number; compressed: number; size: number; method: number } | undefined;
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (at + 46 > cdOffset + cdSize || view.getUint32(at, true) !== 0x02014b50) return fail();
    const flags = view.getUint16(at + 8, true),
      method = view.getUint16(at + 10, true),
      compressed = view.getUint32(at + 20, true),
      size = view.getUint32(at + 24, true),
      nameLength = view.getUint16(at + 28, true),
      extra = view.getUint16(at + 30, true),
      comment = view.getUint16(at + 32, true),
      offset = view.getUint32(at + 42, true);
    if (at + 46 + nameLength + extra + comment > cdOffset + cdSize || flags & 1) return fail();
    total += size;
    if (size === 0xffffffff || compressed === 0xffffffff || total > MAX_XML_BYTES) return fail();
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    if (name === "word/document.xml") {
      if (target || ![0, 8].includes(method)) return fail();
      target = { offset, compressed, size, method };
    }
    at += 46 + nameLength + extra + comment;
  }
  if (
    !target ||
    target.offset + 30 > cdOffset ||
    view.getUint32(target.offset, true) !== 0x04034b50
  )
    return fail();
  const start =
    target.offset +
    30 +
    view.getUint16(target.offset + 26, true) +
    view.getUint16(target.offset + 28, true);
  if (start + target.compressed > cdOffset) return fail();
  const data = bytes.subarray(start, start + target.compressed);
  let xml = data;
  if (target.method === 8) {
    const { Inflate } = await import("fflate");
    const chunks: Uint8Array[] = [];
    let length = 0;
    const limit = target.size;
    const stream = new Inflate((chunk) => {
      length += chunk.length;
      if (length > limit || length > MAX_XML_BYTES) fail();
      chunks.push(chunk);
    });
    for (let i = 0; i < data.length; i += 256)
      stream.push(data.subarray(i, i + 256), i + 256 >= data.length);
    xml = new Uint8Array(length);
    let position = 0;
    for (const chunk of chunks) {
      xml.set(chunk, position);
      position += chunk.length;
    }
  }
  if (xml.length !== target.size) return fail();
  const xmlText = decoder.decode(xml);
  if (/<!DOCTYPE|<!ENTITY/i.test(xmlText)) return fail();
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return fail();
  const paragraphs = Array.from(
    doc.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "p"),
  );
  return paragraphs
    .map((p) =>
      Array.from(
        p.getElementsByTagNameNS(
          "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
          "t",
        ),
      )
        .map((t) => t.textContent ?? "")
        .join(""),
    )
    .join("\n");
}

export async function extractResume(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES)
    throw new ResumeExtractionError("File is over 4 MB. Choose a smaller file or paste text.");
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["txt", "docx", "pdf"].includes(ext ?? ""))
    throw new ResumeExtractionError("Choose a PDF, DOCX or TXT file.");
  const bytes = new Uint8Array(await readBytes(file));
  let text = "";
  if (ext === "txt") text = new TextDecoder().decode(bytes);
  else if (ext === "docx") text = await extractDocx(bytes);
  else {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "../../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
    const task = pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: false });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 20)
        throw new ResumeExtractionError(
          "PDF has more than 20 pages. Try a shorter file or paste text.",
        );
      for (let i = 1; i <= pdf.numPages && text.length < MAX_RESUME_CHARS; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
        page.cleanup();
      }
    } finally {
      await task.destroy();
    }
  }
  text = text.replace(/\0/g, "").trim().slice(0, MAX_RESUME_CHARS);
  if (text.length < 40)
    throw new ResumeExtractionError(
      "Not enough selectable text was found. Scanned PDFs need OCR; paste your résumé text instead.",
    );
  return text;
}

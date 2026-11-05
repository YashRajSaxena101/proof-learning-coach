import { expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { extractResume, extractDocx, MAX_FILE_BYTES, resumeErrorMessage } from "./extract";

it("does not expose dependency URLs when extraction fails unexpectedly", () => {
  expect(
    resumeErrorMessage(
      new Error("Failed to fetch dynamically imported module: http://localhost/private"),
    ),
  ).toBe("Could not read this file. Please retry or paste text instead.");
});

it("extracts bounded plain text and rejects unsupported or oversized files", async () => {
  expect(
    await extractResume(
      new File(
        ["Sample analyst résumé with experience building SQL reports for a student team."],
        "resume.txt",
      ),
    ),
  ).toContain("SQL reports");
  await expect(extractResume(new File(["x"], "resume.png"))).rejects.toThrow(/PDF, DOCX or TXT/i);
  await expect(
    extractResume(new File([new Uint8Array(MAX_FILE_BYTES + 1)], "resume.txt")),
  ).rejects.toThrow(/4 MB/i);
});
it("extracts document text from DOCX and rejects inflated archives over the limit", async () => {
  const xml =
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Data analyst</w:t></w:r></w:p><w:p><w:r><w:t>Built reports for a student organization and explained results.</w:t></w:r></w:p></w:body></w:document>';
  const bytes = zipSync({ "word/document.xml": Uint8Array.from(strToU8(xml)) });
  expect(await extractDocx(bytes)).toContain("Data analyst\nBuilt reports");
  const bomb = zipSync({ "word/document.xml": new Uint8Array(2_000_001).fill(65) });
  await expect(extractDocx(bomb)).rejects.toThrow(/too large/i);
  const forged = zipSync({ "word/document.xml": new Uint8Array(100_000).fill(65) });
  const v = new DataView(forged.buffer, forged.byteOffset, forged.byteLength);
  const directory = v.getUint32(forged.length - 22 + 16, true);
  v.setUint32(directory + 24, 30, true);
  await expect(extractDocx(forged)).rejects.toThrow(/invalid or too large/i);
});

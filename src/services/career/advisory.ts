import { z } from "zod";
import { supabase } from "@/integrations/supabase";

const text = (max: number) => z.string().trim().min(1).max(max);
const safeText = (max: number) =>
  text(max).refine(
    (v) => !/<\/?(?:script|iframe|style|img|svg|object)\b|https?:\/\/|javascript:/i.test(v),
  );
const resumeInput = z.string().trim().min(40).max(6000);
const resumeResult = z
  .object({
    role: safeText(100),
    skills: z.array(safeText(80)).max(8),
    focus: safeText(400),
    evidence: z.array(safeText(200)).min(1).max(4),
  })
  .strict();
const companionInput = z
  .object({
    topic: text(100),
    interest: z.string().trim().max(600),
    text: text(800),
    history: z
      .array(z.object({ role: z.enum(["user", "assistant"]), text: text(800) }).strict())
      .max(6),
  })
  .strict();
const companionResult = z.object({ message: safeText(800) }).strict();
export type ResumeSuggestions = z.infer<typeof resumeResult>;
export type CompanionInput = z.infer<typeof companionInput>;
export type CompanionReply = z.infer<typeof companionResult>;

async function invoke(body: Record<string, unknown>, signal: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(45000);
  try {
    const { data, error } = await supabase.functions.invoke("career-coach", {
      body,
      signal: AbortSignal.any([signal, timeout]),
    });
    if (signal.aborted) throw new Error("Request stopped. Your input is kept.");
    if (timeout.aborted) throw new Error("The coach took too long. Your input is kept.");
    if (error) {
      const response =
        "context" in error && error.context instanceof Response ? error.context : undefined;
      if (response?.status === 429)
        throw new Error("The coach request limit has been reached. Try again later.");
      throw new Error("The coach could not respond. Your input is kept; please retry.");
    }
    return data;
  } catch (error) {
    if (signal.aborted) throw new Error("Request stopped. Your input is kept.");
    if (timeout.aborted) throw new Error("The coach took too long. Your input is kept.");
    if (error instanceof Error) throw error;
    throw new Error("The coach could not respond. Your input is kept; please retry.");
  }
}
export async function analyzeResume(
  textInput: string,
  signal: AbortSignal,
): Promise<ResumeSuggestions> {
  const cleaned = resumeInput.parse(textInput);
  const verified = resumeResult.safeParse(
    await invoke({ action: "resume", text: cleaned }, signal),
  );
  if (!verified.success)
    throw new Error(
      "Proof couldn’t verify the suggested practice focus. Your excerpt is ready to edit or retry.",
    );
  const result = verified.data;
  if (result.evidence.some((quote) => !cleaned.includes(quote)))
    throw new Error("The résumé suggestions could not be verified. Please retry.");
  return result;
}
export async function askCompanion(
  input: CompanionInput,
  signal: AbortSignal,
): Promise<CompanionReply> {
  const cleaned = companionInput.parse(input);
  const verified = companionResult.safeParse(
    await invoke({ action: "companion", ...cleaned }, signal),
  );
  if (!verified.success)
    throw new Error("Proof couldn’t finish that reply. Your question is ready to retry.");
  return verified.data;
}

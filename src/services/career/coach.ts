import { z } from "zod";
import { supabase } from "@/integrations/supabase";
import { requestSchema, scenarioSchema, feedbackSchema, capabilitySchema } from "@/domain/career/contracts";

const generatedSchema = z
  .object({
    id: z.string().uuid(),
    scenario: scenarioSchema,
    mode: z.literal("live-ai"),
    provider: z.literal("Ollama"),
    model: z.string().min(1).max(100),
    capability: capabilitySchema,
  })
  .strict();
export class CareerCoachError extends Error {}
/** External career-coach owns inference and authoritative feedback; no browser credential or evaluation write. */
export async function requestCareerCoach(input: unknown, signal: AbortSignal) {
  const request = requestSchema.parse(input);
  // functions.invoke preserves legitimate account JWTs; guests use the public
  // client bearer plus scoped capability. Do not create anonymous Auth users.
  const timeout = AbortSignal.timeout(45000);
  const combined = AbortSignal.any([signal, timeout]);
  try {
    const { data, error } = await supabase.functions.invoke("career-coach", {
      body: request,
      signal: combined,
    });
    if (error) {
      const response =
        "context" in error && error.context instanceof Response ? error.context : undefined;
      const status = response?.status;
      throw new CareerCoachError(
        status === 429
          ? "Today’s coach request limit has been reached. Your work is kept; continue the example or return tomorrow."
          : status === 404
            ? "The career coach is not deployed yet. Your inputs are kept; an example scenario is available."
            : status === 401 || status === 403
              ? "The coach could not confirm access to this practice. Your work is kept. Retry, or start a new practice if access has expired."
              : "The coach could not respond. Your work is kept. Please retry when the service is available.",
      );
    }
    const parsed =
      request.action === "generate"
        ? generatedSchema.safeParse(data)
        : feedbackSchema.safeParse(data);
    if (!parsed.success)
      throw new CareerCoachError(
        "The coach returned an unexpected response. Nothing was marked as AI feedback. Please retry.",
      );
    return parsed.data;
  } catch (error) {
    if (error instanceof CareerCoachError) throw error;
    if (signal.aborted)
      throw new CareerCoachError("Request stopped. Your inputs and previous work are kept.");
    if (timeout.aborted)
      throw new CareerCoachError("The coach took too long. Your inputs are kept. Please retry.");
    throw new CareerCoachError(
      "Unable to reach your coach. Your work is kept; check your connection and retry.",
    );
  }
}

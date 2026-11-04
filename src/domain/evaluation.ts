import { z } from "zod";

/** Response contract of the `proof-coach` Edge Function. Validated before display. */
export const CoachResponseSchema = z.object({
  feedback: z.string().min(1),
  criteria: z.object({ duplication: z.boolean(), grain: z.boolean(), fix: z.boolean() }),
  evidence: z.array(z.string()),
  needs_clarification: z.boolean(),
  passed: z.boolean(),
  mode: z.literal("live-ai"),
  provider: z.literal("Ollama"),
  model: z.string().min(1),
});
export type CoachResponse = z.infer<typeof CoachResponseSchema>;

export function parseCoachResponse(raw: unknown): CoachResponse | null {
  const r = CoachResponseSchema.safeParse(raw);
  return r.success ? r.data : null;
}

export const coachMet = (c: CoachResponse) => (["duplication", "grain", "fix"] as const).filter((k) => c.criteria[k]);

/** Confidence labels → stored integer 1..5. */
export const CONFIDENCE_INT = { low: 1, medium: 3, high: 5 } as const;

/** Classify a failed coach call into a user-facing fallback reason. */
export type CoachUnavailable = { code: "AI_NOT_CONFIGURED" | "UNAUTHENTICATED" | "INVALID_RESPONSE" | "ERROR"; message: string };
export function classifyCoachError(status: number | undefined, body: unknown): CoachUnavailable {
  const code = (body as { code?: string } | null)?.code;
  if (status === 503 && code === "AI_NOT_CONFIGURED") return { code: "AI_NOT_CONFIGURED", message: "Live AI isn't configured on the server yet." };
  if (status === 401) return { code: "UNAUTHENTICATED", message: "Your session expired. Sign in again for AI feedback." };
  return { code: "ERROR", message: `The AI coach couldn't respond${status ? ` (HTTP ${status})` : ""}.` };
}

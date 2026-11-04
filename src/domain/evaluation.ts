import { z } from "zod";
import { TEACH_CRITERIA } from "./learning";

/** Shape the server-side AI evaluator must return. Validated before it is trusted or stored. */
export const EvaluationSchema = z.object({
  criteria: z.object({ duplication: z.boolean(), grain: z.boolean(), fix: z.boolean(), distinct: z.boolean() }),
  verdict: z.enum(["pass", "revise"]),
  feedback: z.string().min(1).max(600),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;
export const EVALUATOR_VERSION = "ai-teachback-v1";

export function parseEvaluation(raw: string): Evaluation | null {
  try {
    const r = EvaluationSchema.safeParse(JSON.parse(raw));
    if (!r.success) return null;
    // Verdict must be consistent with criteria: pass requires >= 3 criteria met.
    const met = metCriteria(r.data);
    return { ...r.data, verdict: met.length >= 3 && r.data.verdict === "pass" ? "pass" : "revise" };
  } catch {
    return null;
  }
}
export const metCriteria = (e: Evaluation) => TEACH_CRITERIA.map((c) => c.id).filter((id) => e.criteria[id as keyof Evaluation["criteria"]]);

/** Confidence labels → stored integer 1..5. */
export const CONFIDENCE_INT = { low: 1, medium: 3, high: 5 } as const;

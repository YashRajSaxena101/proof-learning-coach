import { TEACH_CRITERIA, TEACH_PASS, scoreTeachBack } from "./learning";

/** Deterministic keyword-rubric feedback. Explicitly a fallback — never presented as AI. */
export interface CuratedReply { met: string[]; passed: boolean; message: string }

export function curatedFeedback(text: string): CuratedReply {
  const met = scoreTeachBack(text);
  const missing = TEACH_CRITERIA.filter((c) => !met.includes(c.id));
  const passed = met.length >= TEACH_PASS;
  const message = passed
    ? missing.length ? `Covers the key ideas. Still missing: ${missing[0]!.label.toLowerCase()}.` : "Covers all four rubric points."
    : `Missing: ${missing.slice(0, 2).map((m) => m.label.toLowerCase()).join("; ")}.`;
  return { met, passed, message };
}

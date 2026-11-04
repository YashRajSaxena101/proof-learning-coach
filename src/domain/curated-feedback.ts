import { CORE_CRITERIA, TEACH_CRITERIA, hasCoreCriteria, hasNegatedFix, scoreTeachBack } from "./learning";

/**
 * Provisional keyword checklist. It only spots words — it can't verify meaning — so it never
 * passes a teach-back. Verification requires the live AI coach.
 */
export interface CuratedReply { met: string[]; coreCovered: boolean; negationFlag: boolean; suggestions: string[]; message: string }

export function curatedFeedback(text: string): CuratedReply {
  const met = scoreTeachBack(text);
  const negationFlag = hasNegatedFix(text);
  const suggestions = TEACH_CRITERIA.filter((c) => !met.includes(c.id))
    .map((c) => (CORE_CRITERIA as readonly string[]).includes(c.id) ? `Add: ${c.label.toLowerCase()}` : `Optional: ${c.label.toLowerCase()}`);
  if (negationFlag) suggestions.unshift("Your fix may be phrased as a negative — state clearly what the query should do.");
  const coreCovered = hasCoreCriteria(met);
  const message = coreCovered
    ? "Checklist keywords for all three core ideas were found. This is not a verified assessment — only the live AI coach can verify your explanation."
    : "Some core ideas weren't detected. This checklist is provisional and can't verify meaning.";
  return { met, coreCovered, negationFlag, suggestions, message };
}

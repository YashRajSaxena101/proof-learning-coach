// Pure learning-state logic: adaptive branching, hints, outcomes, teach-back rubric.

export type Confidence = "low" | "medium" | "high";
export type StepId = "brief" | "predict" | "explore" | "join" | "trace" | "repair" | "teach" | "transfer";

export const STEPS: { id: StepId; title: string }[] = [
  { id: "brief", title: "CFO brief" },
  { id: "predict", title: "Predict" },
  { id: "explore", title: "Inspect tables" },
  { id: "join", title: "Watch the join" },
  { id: "trace", title: "Trace the total" },
  { id: "repair", title: "Repair query" },
  { id: "teach", title: "Teach back" },
  { id: "transfer", title: "Transfer" },
];

export type PredictionBranch = "confirm" | "misconception" | "scaffold" | "nudge";
export function predictionBranch(correct: boolean, confidence: Confidence): PredictionBranch {
  if (correct) return "confirm";
  if (confidence === "high") return "misconception";
  if (confidence === "low") return "scaffold";
  return "nudge";
}

export interface EvidenceEvent {
  at: string; step: StepId; kind: "answer" | "hint" | "repair" | "teach" | "transfer" | "view";
  detail: string; correct?: boolean; assisted?: boolean; confidence?: Confidence;
}

export interface Progress {
  version: 1;
  current: StepId;
  completed: StepId[];
  hints: Partial<Record<StepId, number>>;
  prediction?: { choice: string; confidence: Confidence; correct: boolean; branch: PredictionBranch };
  repairAttempts: string[];
  repairSolved: boolean;
  teach?: { text: string; met: string[] };
  transfer: { attempts: number[]; solved: boolean };
  events: EvidenceEvent[];
}

export const emptyProgress = (): Progress => ({
  version: 1, current: "brief", completed: [], hints: {}, repairAttempts: [], repairSolved: false,
  transfer: { attempts: [], solved: false }, events: [],
});

/**
 * Outcome is based only on the locally checkable transfer exercise. Teach-back is never verified
 * locally (only the live AI coach can verify it), so no outcome here claims mastery.
 */
export type Outcome = "not_started" | "in_progress" | "transfer_correct_assisted" | "transfer_correct_unassisted";
export function outcome(p: Progress): Outcome {
  if (p.events.length === 0) return "not_started";
  if (!p.transfer.solved) return "in_progress";
  return transferUnassisted(p) ? "transfer_correct_unassisted" : "transfer_correct_assisted";
}
/** Unassisted transfer = correct on the first attempt with zero transfer hints. Earlier-step hints don't change this, but are reported separately. */
export const transferUnassisted = (p: Progress) =>
  p.transfer.solved && p.transfer.attempts.length === 1 && !(p.hints.transfer ?? 0);
/** Hints used in any step before transfer. */
export const earlierHints = (p: Progress) =>
  Object.entries(p.hints).filter(([k]) => k !== "transfer").reduce((a, [, v]) => a + (v ?? 0), 0);

export const HINTS: Record<StepId, [string, string, string]> = {
  brief: ["Ask: what does one row in the query represent?", "The dashboard joins orders to line items.", "Joins can repeat parent rows once per child row."],
  predict: ["Previous month was $500. Did the number of orders change?", "There are still 4 orders. Each has 2 line items.", "Each order total is counted twice after the join — divide the $1000 by 2."],
  explore: ["Click an order to see its line items.", "Count the line items for each order.", "Every order has exactly 2 — so every order total will appear twice."],
  join: ["Step through the rows one at a time.", "Watch the order_total column — does it repeat?", "8 rows, each carrying its order's full total: 2 × $500 = $1000."],
  trace: ["Click the inflated $1000 total.", "Each order contributes its total twice.", "The excess is exactly one extra copy of every order: $500."],
  repair: ["Which column belongs to the joined grain (one row per line item)?", "DISTINCT works on values, and two orders share $120.", "Use SUM(li.amount), or sum orders.total without the join."],
  teach: ["Mention why the number doubled.", "Use the word grain or explain one-row-per-line-item.", "State a fix and why DISTINCT is not one."],
  transfer: ["What does one row represent after joining suppliers?", "Each warehouse appears once per supplier — twice.", "Sum each warehouse's quantity once: 30 + 20."],
};

export const TEACH_CRITERIA: { id: string; label: string; patterns: RegExp[] }[] = [
  { id: "duplication", label: "Explains the duplication", patterns: [/duplicat/i, /twice/i, /double/i, /repeat/i, /fan.?out/i, /multiple (line )?items/i, /counted (more than )?once/i] },
  { id: "grain", label: "Names the grain / row meaning", patterns: [/grain/i, /per (line )?item/i, /one row (per|for)/i, /each line/i, /level/i] },
  { id: "fix", label: "Gives a valid fix", patterns: [/sum\(?\s*(li\.)?amount/i, /line amount/i, /without (the )?join/i, /order (grain|level)/i, /aggregate (first|before)/i, /from orders/i] },
  { id: "distinct", label: "Explains why DISTINCT fails", patterns: [/distinct/i, /same (value|amount|total)/i, /\$?120/] },
];
/** The three core ideas a valid explanation must contain. DISTINCT is a bonus and cannot substitute for any of them. */
export const CORE_CRITERIA = ["duplication", "grain", "fix"] as const;
export const hasCoreCriteria = (met: string[]) => CORE_CRITERIA.every((c) => met.includes(c));
const NEGATED_FIX = /\b(do not|don't|dont|never|not|avoid|shouldn't|should not|stop)\b[^.]{0,40}(sum|line amount|aggregate|order (grain|level)|from orders)/i;
export const hasNegatedFix = (text: string) => NEGATED_FIX.test(text);

/** Keyword checklist only — cannot understand meaning. A negated fix ("do not sum line amounts") is never counted. */
export function scoreTeachBack(text: string): string[] {
  const met = TEACH_CRITERIA.filter((c) => c.patterns.some((p) => p.test(text))).map((c) => c.id);
  return hasNegatedFix(text) ? met.filter((m) => m !== "fix") : met;
}

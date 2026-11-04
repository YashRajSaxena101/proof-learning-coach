import { TEACH_CRITERIA, TEACH_PASS, scoreTeachBack } from "@/domain/learning";

/**
 * Teaching colleague interface. The live implementation must run server-side
 * (see src/server/coach.functions.ts) so model keys never reach the browser.
 * Today only the rule-based ScriptedCoach is active.
 */
export interface CoachReply { mode: "scripted" | "live"; message: string; met: string[]; passed: boolean }
export interface TeachingCoach { readonly mode: "scripted" | "live"; review(text: string): Promise<CoachReply> }

export const scriptedCoach: TeachingCoach = {
  mode: "scripted",
  async review(text) {
    const met = scoreTeachBack(text);
    const missing = TEACH_CRITERIA.filter((c) => !met.includes(c.id));
    const passed = met.length >= TEACH_PASS;
    const message = passed
      ? `That's clear enough that I could fix the dashboard myself. ${missing.length ? `One thing I'd still ask: ${missing[0].label.toLowerCase()}?` : "You covered every point."}`
      : `I'm still confused. Could you ${missing.slice(0, 2).map((m) => m.label.toLowerCase()).join(", and ")}?`;
    return { mode: "scripted", message, met, passed };
  },
};

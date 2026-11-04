import { describe, expect, it, beforeEach } from "vitest";
import { progressStore, LocalProgressRepository } from "./progress-store";
import { emptyProgress } from "@/domain/learning";
import { parseEvaluation, CONFIDENCE_INT } from "@/domain/evaluation";
import { curatedFeedback } from "@/domain/curated-feedback";

describe("session reset", () => {
  beforeEach(() => { window.localStorage.clear(); progressStore.useRepository(new LocalProgressRepository()); });
  it("reset clears progress in memory and in browser storage", () => {
    progressStore.set((p) => ({ ...p, current: "repair", repairSolved: true, hints: { predict: 2 } }));
    progressStore.log({ step: "repair", kind: "repair", detail: "x" });
    expect(new LocalProgressRepository().load().repairSolved).toBe(true);
    progressStore.reset();
    expect(progressStore.get()).toEqual(emptyProgress());
    expect(new LocalProgressRepository().load()).toEqual(emptyProgress());
  });
  it("attempts carry hint count capped at 3", () => {
    const seen: number[] = [];
    const off = progressStore.onAttempt((a) => seen.push(a.hintsUsed));
    progressStore.set((p) => ({ ...p, hints: { transfer: 5 } }));
    progressStore.log({ step: "transfer", kind: "transfer", detail: "50" }, { activity: "transfer", answer: "50" });
    off();
    expect(seen).toEqual([3]);
  });
});

describe("AI evaluation validation", () => {
  const ok = { criteria: { duplication: true, grain: true, fix: true, distinct: false }, verdict: "pass", feedback: "Good." };
  it("accepts a well-formed evaluation", () => expect(parseEvaluation(JSON.stringify(ok))?.verdict).toBe("pass"));
  it("downgrades a pass that meets fewer than 3 criteria", () => {
    const bad = { ...ok, criteria: { duplication: true, grain: false, fix: false, distinct: false } };
    expect(parseEvaluation(JSON.stringify(bad))?.verdict).toBe("revise");
  });
  it("rejects malformed output", () => {
    expect(parseEvaluation("not json")).toBeNull();
    expect(parseEvaluation(JSON.stringify({ verdict: "pass" }))).toBeNull();
  });
  it("maps confidence to the 1..5 database range", () => expect(CONFIDENCE_INT).toEqual({ low: 1, medium: 3, high: 5 }));
  it("curated fallback fails a vague answer", () => expect(curatedFeedback("revenue went up a lot").passed).toBe(false));
});

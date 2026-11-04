import { describe, expect, it, beforeEach } from "vitest";
import { progressStore, LocalProgressRepository } from "./progress-store";
import { emptyProgress } from "@/domain/learning";
import { parseCoachResponse, classifyCoachError, coachMet, CONFIDENCE_INT } from "@/domain/evaluation";
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

describe("proof-coach response handling", () => {
  const ok = { feedback: "Clear.", criteria: { duplication: true, grain: true, fix: false }, evidence: ["repeated per line item"],
    needs_clarification: false, passed: false, mode: "live-ai", provider: "Ollama", model: "gemma4:31b" };
  it("accepts the documented success shape", () => {
    const r = parseCoachResponse(ok);
    expect(r?.model).toBe("gemma4:31b");
    expect(coachMet(r!)).toEqual(["duplication", "grain"]);
  });
  it("rejects anything not marked live-ai from Ollama", () => {
    expect(parseCoachResponse({ ...ok, mode: "scripted" })).toBeNull();
    expect(parseCoachResponse({ ...ok, criteria: { duplication: true } })).toBeNull();
    expect(parseCoachResponse(null)).toBeNull();
  });
  it("503 AI_NOT_CONFIGURED is reported as not configured", () => {
    expect(classifyCoachError(503, { code: "AI_NOT_CONFIGURED" }).code).toBe("AI_NOT_CONFIGURED");
    expect(classifyCoachError(500, null).code).toBe("ERROR");
    expect(classifyCoachError(401, null).code).toBe("UNAUTHENTICATED");
  });
  it("maps confidence to the 1..5 database range", () => expect(CONFIDENCE_INT).toEqual({ low: 1, medium: 3, high: 5 }));
  it("curated fallback fails a vague answer", () => expect(curatedFeedback("revenue went up a lot").passed).toBe(false));
});

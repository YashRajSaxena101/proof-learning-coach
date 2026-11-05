import { describe, expect, it } from "vitest";
import { exampleScenario } from "./examples";
import { profileSchema, requestSchema, type CareerSession, type Feedback } from "./contracts";
import { attemptForStage, canAdvance, latestFeedback, feedbackRequestGate } from "./attempts";
const feedback: Feedback = { mode: "live-ai", provider: "Ollama", model: "test", message: "Check the boundary", strengths: [], gaps: ["permissions"], nextQuestion: "What would you check?", retrySuggestions: [], independent: false };
const session = (id: string, createdAt: string): CareerSession => ({ id, createdAt, source: "example", profile: { topic: "Data analyst", experience: "new", interest: "", goal: "interview", minutes: 15, diagnostic: "" }, scenario: exampleScenario("Data analyst"), stage: "decisions", choices: {}, answers: [], messages: [], helpUsed: 0 });
describe("Career integration regressions", () => {
  it.each([73, 85, 100])("creates a bounded readable example for a %i-character custom topic", length => {
    const topic = "Marine robotics ".repeat(8).slice(0, length);
    expect(profileSchema.safeParse({ ...session("a", "2026-11-05T00:00:00Z").profile, topic }).success).toBe(true);
    const scenario = exampleScenario(topic);
    expect(scenario.title.length).toBeLessThanOrEqual(100);
    expect(scenario.title).toContain("Marine robotics");
  });
  it.each(["SELECT SUM(amount) FROM orders", "latency < 100 ms", "C++ templates <T>"])("accepts inert learner expression %s", text => {
    const profile = { ...session("a", "2026-11-05T00:00:00Z").profile, topic: text, interest: text, diagnostic: text };
    expect(profileSchema.safeParse(profile).success).toBe(true);
    expect(requestSchema.safeParse({ action: "feedback", sessionId: "00000000-0000-4000-8000-000000000001", capability: "opaque-test-capability", text, intent: "answer", stage: "decisions" }).success).toBe(true);
  });
  it("keeps pending and failed live attempts from silently advancing", () => {
    const s = session("a", "2026-11-05T00:00:00Z"); s.source = "live-ai";
    s.answers.push({ id: "attempt-1", createdAt: s.createdAt, stage: "decisions", text: "my answer", helpUsed: 0, status: "pending" });
    expect(canAdvance(s, true)).toBe(false); expect(canAdvance(s, false)).toBe(false);
    s.answers[0].status = "failed"; expect(canAdvance(s, false)).toBe(false);
    s.answers[0].feedback = feedback; s.answers[0].status = "complete"; expect(canAdvance(s, false)).toBe(true);
  });
  it("isolates latest attempts and revise text to the current stage", () => {
    const s = session("a", "2026-11-05T00:00:00Z");
    s.answers = [{ stage: "decisions", text: "decision draft", helpUsed: 0, feedback }, { stage: "interview", text: "interview draft", helpUsed: 0 }];
    s.stage = "interview"; expect(attemptForStage(s)?.text).toBe("interview draft"); expect(attemptForStage(s)?.feedback).toBeUndefined();
    s.stage = "decisions"; expect(attemptForStage(s)?.text).toBe("decision draft");
  });
  it("rejects delayed feedback after advance/back, changed draft or another session", async () => {
    const gate = feedbackRequestGate(); const old = gate.begin("s1", "decisions", "a1");
    const delayed = Promise.resolve().then(() => gate.accepts(old, "s1", "decisions", "a1"));
    gate.cancel(); expect(await delayed).toBe(false);
    const retry = gate.begin("s1", "decisions", "a2");
    expect(gate.accepts(old, "s1", "decisions", "a1")).toBe(false);
    expect(gate.accepts(retry, "s1", "interview", "a2")).toBe(false);
    expect(gate.accepts(retry, "s2", "decisions", "a2")).toBe(false);
    expect(gate.accepts(retry, "s1", "decisions", "a2")).toBe(true);
  });
  it("selects newest timestamped feedback rather than the oldest session's last answer", () => {
    const newer = session("new", "2026-11-05T01:00:00Z"), older = session("old", "2026-11-04T01:00:00Z");
    newer.answers = [{ stage: "decisions", text: "new", helpUsed: 0, createdAt: "2026-11-05T01:05:00Z", feedback: { ...feedback, gaps: ["lineage"] } }];
    older.answers = [{ stage: "transfer", text: "old", helpUsed: 0, feedback: { ...feedback, gaps: ["cost"] } }];
    expect(latestFeedback([newer, older])?.feedback.gaps).toEqual(["lineage"]);
    older.answers[0].feedbackAt = "2026-11-05T01:06:00Z";
    expect(latestFeedback([newer, older])?.feedback.gaps).toEqual(["cost"]);
  });
});
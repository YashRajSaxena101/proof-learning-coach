import { describe, expect, it } from "vitest";
import {
  profileSchema,
  scenarioSchema,
  feedbackSchema,
  canRequest,
  visibleDecision,
  nextSuggestion,
  requestSchema,
} from "./contracts";
import { exampleScenario } from "./examples";
import { CareerRepository, latestRequest } from "@/services/career/store";
const profile = {
  topic: "AI engineer",
  experience: "new",
  interest: "private documents",
  goal: "interview",
  minutes: 15,
  diagnostic: "I'm not sure",
};
describe("Career contracts", () => {
  it("accepts bounded custom topics and rejects oversized inputs", () => {
    expect(profileSchema.safeParse({ ...profile, topic: "Marine robotics" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...profile, interest: "x".repeat(601) }).success).toBe(false);
  });
  it("rejects malformed AI and executable content", () => {
    expect(scenarioSchema.safeParse({ title: "oops" }).success).toBe(false);
    expect(
      scenarioSchema.safeParse({
        ...exampleScenario("AI engineer"),
        title: "<script>alert(1)</script>",
      }).success,
    ).toBe(false);
  });
  it("rejects dangling graph references and out-of-range metrics", () => {
    const s = exampleScenario("AI engineer");
    expect(
      scenarioSchema.safeParse({
        ...s,
        scene: { ...s.scene, edges: [{ from: "missing", to: "answer" }] },
      }).success,
    ).toBe(false);
    expect(
      scenarioSchema.safeParse({
        ...s,
        decisions: s.decisions.map((d, i) =>
          i
            ? d
            : {
                ...d,
                choices: d.choices.map((c) => ({ ...c, metrics: { ...c.metrics, quality: 101 } })),
              },
        ),
      }).success,
    ).toBe(false);
  });
  it("does not expose consequences before commitment", () => {
    const d = exampleScenario("AI engineer").decisions[0];
    if (!d || !d.choices[0]) throw Error("Missing fixture");
    expect(visibleDecision(d, undefined)).toBe(null);
    expect(visibleDecision(d, d.choices[0].id)?.consequence).toBe(d.choices[0].consequence);
  });
  it("limits guests to 12 requests daily and global requests to 200", () => {
    expect(canRequest(11, 199)).toBe(true);
    expect(canRequest(12, 0)).toBe(false);
    expect(canRequest(0, 200)).toBe(false);
  });
  it("requires server AI provenance for feedback", () => {
    expect(feedbackSchema.safeParse({ message: "great", mode: "example" }).success).toBe(false);
  });
  it("does not accept caller-supplied user IDs or invalid actions", () => {
    expect(
      requestSchema.safeParse({ action: "generate", profile, userId: "someone" }).success,
    ).toBe(false);
    expect(requestSchema.safeParse({ action: "eval", profile }).success).toBe(false);
  });
  it("suggests concrete practice from demonstrated gaps, not self-report", () => {
    expect(nextSuggestion(["data boundaries"])).toContain("data boundaries");
  });
});
describe("Career persistence and request ordering", () => {
  it("handles corrupt JSON without overwriting it", () => {
    const storage = {
      getItem: () => "{oops",
      setItem: () => {
        throw Error("must not overwrite");
      },
    };
    const r = new CareerRepository(storage);
    expect(r.load().sessions).toEqual([]);
    expect(r.status).toBe("corrupt");
  });
  it("reports quota as memory-only", () => {
    const r = new CareerRepository({
      getItem: () => null,
      setItem: () => {
        throw Error("quota");
      },
    });
    expect(r.save(r.load())).toBe(false);
    expect(r.status).toBe("memory-only");
  });
  it("rejects malformed stored sessions", () => {
    const r = new CareerRepository({
      getItem: () => JSON.stringify({ version: 1, sessions: [{ id: "bad" }], profile }),
      setItem: () => {},
    });
    expect(r.load().sessions).toEqual([]);
    expect(r.status).toBe("corrupt");
  });
  it("ignores stale results after a later request or cancellation", () => {
    const gate = latestRequest();
    const a = gate.begin();
    const b = gate.begin();
    expect(gate.current(a)).toBe(false);
    expect(gate.current(b)).toBe(true);
    gate.cancel();
    expect(gate.current(b)).toBe(false);
  });
  it("preserves inputs when generation is interrupted", () => {
    let raw = "";
    const r = new CareerRepository({
      getItem: () => raw || null,
      setItem: (_, v) => {
        raw = v;
      },
    });
    r.save({ version: 1, profile: profileSchema.parse(profile), sessions: [] });
    expect(r.load().profile?.diagnostic).toBe("I'm not sure");
  });
});

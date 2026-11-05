import { expect, it } from "vitest";
import { canAdvance } from "./attempts";
import { exampleScenario } from "./examples";
import type { CareerSession } from "./contracts";

it("allows revisiting an explicitly recorded unevaluated attempt only while its draft and choices match", () => {
  const session: CareerSession = {
    id: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-11-05T01:00:00Z",
    profile: {
      topic: "Data analyst",
      experience: "new",
      interest: "",
      goal: "interview",
      minutes: 15,
      diagnostic: "",
    },
    scenario: exampleScenario("Data analyst"),
    source: "live-ai",
    stage: "decisions",
    choices: { approach: "choice-0", evidence: "trial" },
    drafts: { decisions: "My reasoning" },
    answers: [
      {
        stage: "decisions",
        status: "recorded",
        text: "My reasoning",
        helpUsed: 0,
        choices: { approach: "choice-0", evidence: "trial" },
      },
    ],
    messages: [],
    helpUsed: 0,
  };
  expect(canAdvance(session, false)).toBe(true);
  expect(canAdvance(session, true)).toBe(false);
  expect(canAdvance({ ...session, drafts: { decisions: "Changed" } }, false)).toBe(false);
  expect(
    canAdvance({ ...session, choices: { ...session.choices, approach: "choice-1" } }, false),
  ).toBe(false);
  expect(
    canAdvance({ ...session, answers: [{ ...session.answers[0]!, status: "failed" }] }, false),
  ).toBe(false);
});

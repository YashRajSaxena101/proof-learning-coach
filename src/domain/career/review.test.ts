import { expect, it } from "vitest";
import { exampleScenario } from "./examples";
import { type CareerSession } from "./contracts";
import { latestAnswersByStage, reviseChoice, attemptMatchesChoices, canAdvance } from "./attempts";
import { isPresentationShortcutTarget, isProgressPath } from "@/lib/navigation-accessibility";
const fixture = (): CareerSession => ({ id: "00000000-0000-4000-8000-000000000001", createdAt: "2026-11-05T00:00:00Z", profile: { topic: "Data analyst", experience: "new", interest: "", goal: "interview", minutes: 15, diagnostic: "" }, scenario: exampleScenario("Data analyst"), source: "example", stage: "decisions", choices: { approach: "choice-0" }, answers: [{ stage: "decisions", text: "Initial reasoning", helpUsed: 1 }], messages: [{ role: "user", text: "Explain grain" }], helpUsed: 1 });
it("revises a committed choice without overwriting initial choices, attempts or help", () => {
  const original = fixture(); const revised = reviseChoice(original, "approach", "choice-1", "2026-11-05T01:00:00Z");
  expect(revised.choices.approach).toBe("choice-1");
  expect(revised.choiceHistory?.map(v => v.choiceId)).toEqual(["choice-0", "choice-1"]);
  expect(revised.answers).toEqual(original.answers); expect(revised.helpUsed).toBe(1); expect(revised.messages).toEqual(original.messages);
  expect(original.choices.approach).toBe("choice-0");
  expect(attemptMatchesChoices(revised, revised.answers[0])).toBe(false);
  expect(canAdvance(revised, false)).toBe(false);
});
it("retains latest answer for all three stages and leaves full revision history intact", () => {
  const s = fixture(); s.answers.push({ stage: "decisions", text: "Revised reasoning", helpUsed: 1 }, { stage: "interview", text: "Interview answer", helpUsed: 1 }, { stage: "transfer", text: "Transfer answer", helpUsed: 2 });
  expect(latestAnswersByStage(s).map(a => a.text)).toEqual(["Revised reasoning", "Interview answer", "Transfer answer"]);
  expect(s.answers.map(a => a.text)).toContain("Initial reasoning");
});
it("does not consume presentation shortcuts inside focused controls or editable text", () => {
  for (const tag of ["button", "input", "textarea", "select", "a"]) { const el = document.createElement(tag); expect(isPresentationShortcutTarget(el)).toBe(false); }
  const editable = document.createElement("div"); editable.setAttribute("contenteditable", "true"); expect(isPresentationShortcutTarget(editable)).toBe(false);
  const nested = document.createElement("span"), button = document.createElement("button"); button.append(nested); expect(isPresentationShortcutTarget(nested)).toBe(false);
  expect(isPresentationShortcutTarget(document.createElement("section"))).toBe(true);
});
it("activates Progress for both dashboard and progress aliases", () => {
  expect(isProgressPath("/progress")).toBe(true); expect(isProgressPath("/dashboard")).toBe(true); expect(isProgressPath("/practice")).toBe(false);
});
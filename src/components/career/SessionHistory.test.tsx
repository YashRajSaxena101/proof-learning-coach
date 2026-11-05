import { expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SessionHistory } from "./SessionHistory";
import { exampleScenario } from "@/domain/career/examples";
it("offers latest reflections for every stage plus original revisions and tutor transcript", () => {
  render(
    <SessionHistory
      session={{
        id: "00000000-0000-4000-8000-000000000001",
        createdAt: "2026-11-05T00:00:00Z",
        profile: {
          topic: "Data analyst",
          experience: "new",
          interest: "",
          goal: "interview",
          minutes: 15,
          diagnostic: "",
        },
        scenario: exampleScenario("Data analyst"),
        source: "example",
        stage: "complete",
        choices: {},
        answers: [
          { stage: "decisions", text: "Original answer", helpUsed: 0 },
          { stage: "decisions", text: "Revised answer", helpUsed: 1 },
          { stage: "interview", text: "Interview answer", helpUsed: 1 },
          { stage: "transfer", text: "Transfer answer", helpUsed: 1 },
        ],
        messages: [
          { role: "user", text: "My technical question" },
          { role: "coach", text: "Example reflection, not AI" },
        ],
        helpUsed: 1,
      }}
    />,
  );
  const summaries = Array.from(document.querySelectorAll("div > details > summary")).map(
    (v) => v.textContent,
  );
  expect(summaries.some((v) => v?.startsWith("Decision reflection"))).toBe(true);
  expect(summaries.some((v) => v?.startsWith("Interview reflection"))).toBe(true);
  expect(summaries.some((v) => v?.startsWith("New constraint reflection"))).toBe(true);
  fireEvent.click(screen.getByText("Full attempt history (4)"));
  expect(screen.getByText("Original answer")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Tutor transcript (2)"));
  expect(screen.getByText("My technical question")).toBeInTheDocument();
  expect(screen.getByText("Example reflection, not AI")).toBeInTheDocument();
  cleanup();
});

import { beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ analyze: vi.fn() }));
vi.mock("@/services/career/advisory", () => ({ analyzeResume: mocks.analyze }));
import { ResumeOnboarding } from "./ResumeOnboarding";
beforeEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("requires explicit analysis and applies edited suggestions, without sending the file", async () => {
  mocks.analyze.mockResolvedValue({
    role: "Data analyst",
    skills: ["SQL"],
    focus: "Explain evidence",
    evidence: ["SQL reports"],
  });
  const apply = vi.fn();
  render(<ResumeOnboarding onApply={apply} />);
  fireEvent.click(screen.getByText("Optional: start from your résumé"));
  fireEvent.click(screen.getByRole("button", { name: "Use sample résumé" }));
  expect(mocks.analyze).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Analyze with AI" }));
  await waitFor(() => expect(screen.getByLabelText("Suggested role")).toHaveValue("Data analyst"));
  fireEvent.change(screen.getByLabelText("Suggested role"), {
    target: { value: "Product analyst" },
  });
  fireEvent.change(screen.getByLabelText("Targeted help"), {
    target: { value: "Practice interpreting data" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Use these suggestions" }));
  expect(apply).toHaveBeenCalledWith("Product analyst", "Skills: SQL. Practice interpreting data");
});
it("discards a late analysis after the reviewed text changes", async () => {
  let resolve!: (value: unknown) => void;
  mocks.analyze.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render(<ResumeOnboarding onApply={() => {}} />);
  fireEvent.click(screen.getByText("Optional: start from your résumé"));
  fireEvent.click(screen.getByRole("button", { name: "Use sample résumé" }));
  fireEvent.click(screen.getByRole("button", { name: "Analyze with AI" }));
  fireEvent.change(screen.getByLabelText("Review and edit your résumé excerpt"), {
    target: { value: "Changed after starting analysis" },
  });
  await act(async () => resolve({ role: "Stale result", skills: [], focus: "old", evidence: [] }));
  expect(screen.queryByLabelText("Suggested role")).toBeNull();
});

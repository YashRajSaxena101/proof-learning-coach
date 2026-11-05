import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as companion from "./ProofCompanion";
import { careerStore } from "@/services/career/store";
import { exampleScenario } from "@/domain/career/examples";
const ask = vi.hoisted(() => vi.fn());
vi.mock("@/services/career/advisory", () => ({ askCompanion: ask }));
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  careerStore.init();
  careerStore.set(() => ({ version: 1, sessions: [] }));
  ask.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("sleeps without a network call, ignores typing until explicitly woken", () => {
  expect(typeof companion.ProofCompanion).toBe("function");
  render(<companion.ProofCompanion />);
  act(() => vi.advanceTimersByTime(60_000));
  expect(screen.getByRole("button", { name: "Wake Proof" })).toBeInTheDocument();
  fireEvent.keyDown(window, { key: "a" });
  expect(screen.getByRole("button", { name: "Wake Proof" })).toBeInTheDocument();
  expect(ask).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Wake Proof" }));
  expect(screen.getByRole("button", { name: "Minimize companion" })).toBeInTheDocument();
});

it("sends chat only on explicit submission and discards a reply after minimizing", async () => {
  expect(typeof companion.ProofCompanion).toBe("function");
  let resolve!: (value: { message: string }) => void;
  ask.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<companion.ProofCompanion />);
  fireEvent.click(screen.getByRole("button", { name: "Open Proof companion" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Ask Proof" }), {
    target: { value: "How can I practice cloud skills?" },
  });
  expect(ask).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Send to Proof" }));
  expect(ask).toHaveBeenCalledOnce();
  const signal = ask.mock.calls[0]![1] as AbortSignal;
  fireEvent.click(screen.getByRole("button", { name: "Minimize companion" }));
  expect(signal.aborted).toBe(true);
  expect(screen.getByRole("img", { name: /companion, idle/ })).toBeInTheDocument();
  await act(async () => resolve({ message: "A late response should not appear" }));
  fireEvent.click(screen.getByRole("button", { name: "Open Proof companion" }));
  expect(screen.queryByText("A late response should not appear")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Ask Proof" })).toHaveValue(
    "How can I practice cloud skills?",
  );
});

it("aborts an explicit chat when sleep starts and never displays its late answer", async () => {
  let resolve!: (value: { message: string }) => void;
  ask.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<companion.ProofCompanion />);
  fireEvent.click(screen.getByRole("button", { name: "Open Proof companion" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Ask Proof" }), {
    target: { value: "Help me reflect" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send to Proof" }));
  const signal = ask.mock.calls[0]![1] as AbortSignal;
  act(() => vi.advanceTimersByTime(60_000));
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ message: "This should remain discarded" }));
  expect(screen.queryByText("This should remain discarded")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Wake Proof" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Wake Proof" }));
  expect(screen.getByRole("textbox", { name: "Ask Proof" })).toHaveFocus();
});

it("uses the latest selected role and cancels chat when its context changes", async () => {
  let resolve!: (value: { message: string }) => void;
  ask.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<companion.ProofCompanion />);
  fireEvent.click(screen.getByRole("button", { name: "Open Proof companion" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Ask Proof" }), {
    target: { value: "An earlier question" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send to Proof" }));
  const signal = ask.mock.calls[0]![1] as AbortSignal;
  act(() =>
    careerStore.set((value) => ({
      ...value,
      profile: {
        topic: "Cloud/DevOps",
        experience: "new",
        interest: "Container networking",
        goal: "interview",
        minutes: 15,
        diagnostic: "",
      },
    })),
  );
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ message: "A stale career reply" }));
  expect(screen.queryByText("A stale career reply")).not.toBeInTheDocument();
  ask.mockResolvedValue({ message: "A cloud question" });
  fireEvent.change(screen.getByRole("textbox", { name: "Ask Proof" }), {
    target: { value: "What should I practice next?" },
  });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Send to Proof" })));
  expect(ask.mock.calls[1]![0]).toMatchObject({
    topic: "Cloud/DevOps",
    interest: "Container networking",
    history: [],
  });
});

it("does not react to stored feedback, then responds to newly received coach evidence", () => {
  expect(typeof companion.ProofCompanion).toBe("function");
  const feedback = {
    mode: "live-ai" as const,
    provider: "Ollama" as const,
    model: "test",
    message: "A response",
    strengths: ["A historical strength"],
    gaps: [],
    nextQuestion: "What next?",
    retrySuggestions: [],
    independent: false,
  };
  const session = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source: "example" as const,
    profile: {
      topic: "AI engineer",
      experience: "new" as const,
      interest: "",
      goal: "interview" as const,
      minutes: 15 as const,
      diagnostic: "",
    },
    scenario: exampleScenario("AI engineer"),
    stage: "decisions" as const,
    choices: {},
    answers: [{ id: "old", stage: "decisions" as const, text: "My answer", helpUsed: 0, feedback }],
    messages: [],
    helpUsed: 0,
  };
  careerStore.add(session);
  render(<companion.ProofCompanion />);
  expect(screen.queryByText(/A historical strength/)).not.toBeInTheDocument();
  act(() =>
    careerStore.updateSession(session.id, (value) => ({
      ...value,
      answers: [
        ...value.answers,
        {
          id: "fresh",
          stage: "decisions",
          text: "A new answer",
          helpUsed: 0,
          feedback: { ...feedback, strengths: ["Connects the evidence"] },
        },
      ],
    })),
  );
  expect(screen.getByText(/Connects the evidence/)).toBeInTheDocument();
  expect(ask).not.toHaveBeenCalled();
});

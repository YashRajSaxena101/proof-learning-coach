import { beforeEach, describe, expect, it, vi } from "vitest";
const mocked = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase", () => ({ supabase: { functions: { invoke: mocked.invoke } } }));
import { analyzeResume, askCompanion } from "./advisory";
const resume = "Built SQL reports for a student team, and explained changes to stakeholders.";
beforeEach(() => vi.resetAllMocks());
describe("advisory boundary", () => {
  it("sends a resume only on explicit call and accepts grounded suggestions", async () => {
    const data = {
      role: "Data analyst",
      skills: ["SQL"],
      focus: "Practice explaining data choices",
      evidence: ["Built SQL reports"],
    };
    mocked.invoke.mockResolvedValue({ data, error: null });
    expect(await analyzeResume(resume, new AbortController().signal)).toEqual(data);
    expect(mocked.invoke.mock.calls[0]?.[1].body).toEqual({ action: "resume", text: resume });
  });
  it("rejects fabricated resume quotations", async () => {
    mocked.invoke.mockResolvedValue({
      data: {
        role: "Analyst",
        skills: ["SQL"],
        focus: "Practice",
        evidence: ["invented evidence"],
      },
      error: null,
    });
    await expect(analyzeResume(resume, new AbortController().signal)).rejects.toThrow();
  });
  it("calls companion statelessly with bounded history", async () => {
    mocked.invoke.mockResolvedValue({
      data: { message: "What part of that problem interests you?" },
      error: null,
    });
    const input = {
      topic: "Data",
      interest: "SQL",
      text: "Where should I start?",
      history: [{ role: "user" as const, text: "Hello" }],
    };
    expect(await askCompanion(input, new AbortController().signal)).toEqual({
      message: "What part of that problem interests you?",
    });
    expect(mocked.invoke.mock.calls[0]?.[1].body).toEqual({ action: "companion", ...input });
  });
  it("rejects oversized history before invoking the service", async () => {
    const history = Array.from({ length: 7 }, () => ({ role: "user" as const, text: "hi" }));
    await expect(
      askCompanion(
        { topic: "Data", interest: "", text: "Help", history },
        new AbortController().signal,
      ),
    ).rejects.toThrow();
    expect(mocked.invoke).not.toHaveBeenCalled();
  });
  it("reports a quota failure without replaying", async () => {
    mocked.invoke.mockResolvedValue({
      data: null,
      error: { context: new Response("", { status: 429 }) },
    });
    await expect(analyzeResume(resume, new AbortController().signal)).rejects.toThrow(/limit/i);
    expect(mocked.invoke).toHaveBeenCalledTimes(1);
  });
});

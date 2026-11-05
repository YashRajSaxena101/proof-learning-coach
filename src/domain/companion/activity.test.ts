import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as activity from "./activity";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-05T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());

it("sleeps at exactly 60 seconds and ordinary activity cannot wake it", () => {
  expect(typeof activity.createInactivityClock).toBe("function");
  const sleep = vi.fn();
  const clock = activity.createInactivityClock({
    onSleep: sleep,
    onNudge: vi.fn(),
    visible: () => true,
  });
  vi.advanceTimersByTime(59_999);
  expect(sleep).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(sleep).toHaveBeenCalledTimes(1);
  clock.activity();
  vi.advanceTimersByTime(60_000);
  expect(sleep).toHaveBeenCalledTimes(1);
  clock.wake();
  vi.advanceTimersByTime(60_000);
  expect(sleep).toHaveBeenCalledTimes(2);
  clock.dispose();
});

it("resets only awake activity and reconciles a suspended background deadline", () => {
  expect(typeof activity.createInactivityClock).toBe("function");
  const sleep = vi.fn(),
    nudge = vi.fn();
  const clock = activity.createInactivityClock({
    onSleep: sleep,
    onNudge: nudge,
    visible: () => false,
  });
  vi.advanceTimersByTime(45_000);
  clock.activity();
  vi.advanceTimersByTime(59_999);
  expect(sleep).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(sleep).toHaveBeenCalledOnce();
  expect(nudge).not.toHaveBeenCalled();
  clock.wake();
  vi.setSystemTime(Date.now() + 61_000);
  clock.check();
  expect(sleep).toHaveBeenCalledTimes(2);
  clock.dispose();
});

it("bounds local nudges and clears every timer on disposal", () => {
  expect(typeof activity.createInactivityClock).toBe("function");
  const sleep = vi.fn(),
    nudge = vi.fn();
  const clock = activity.createInactivityClock({
    onSleep: sleep,
    onNudge: nudge,
    visible: () => true,
  });
  vi.advanceTimersByTime(35_000);
  expect(nudge).toHaveBeenCalledOnce();
  clock.activity();
  vi.advanceTimersByTime(35_000);
  expect(nudge).toHaveBeenCalledOnce();
  clock.dispose();
  vi.advanceTimersByTime(300_000);
  expect(sleep).not.toHaveBeenCalled();
});

it("responds to mixed coach evidence without calling an answer correct or wrong", () => {
  expect(typeof activity.feedbackReaction).toBe("function");
  const reaction = activity.feedbackReaction({
    strengths: ["Names the constraint"],
    gaps: ["Needs an evidence check"],
  });
  expect(reaction.mood).toBe("talking");
  expect(reaction.message).toContain("Needs an evidence check");
  expect(reaction.message).not.toMatch(/\b(correct|wrong|passed|failed|mastered)\b/i);
});

export type CompanionMood = "idle" | "happy" | "sad" | "bored" | "talking" | "asleep";
export function createInactivityClock(options: {
  onSleep: () => void;
  onNudge: () => void;
  visible: () => boolean;
}) {
  let asleep = false,
    disposed = false,
    lastActivity = Date.now(),
    nudged = false,
    lastNudge = -Infinity;
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    clearTimeout(timer);
    if (!asleep && !disposed)
      timer = setTimeout(
        check,
        Math.max(0, lastActivity + (nudged ? 60_000 : 35_000) - Date.now()),
      );
  };
  function check() {
    if (disposed || asleep) return;
    const now = Date.now();
    if (now - lastActivity >= 60_000) {
      asleep = true;
      clearTimeout(timer);
      options.onSleep();
      return;
    }
    if (now - lastActivity >= 35_000 && !nudged) {
      nudged = true;
      if (options.visible() && now - lastNudge >= 120_000) {
        lastNudge = now;
        options.onNudge();
      }
    }
    schedule();
  }
  schedule();
  return {
    activity() {
      if (asleep || disposed) return;
      if (Date.now() - lastActivity >= 60_000) {
        check();
        return;
      }
      lastActivity = Date.now();
      nudged = false;
      schedule();
    },
    wake() {
      if (disposed) return;
      asleep = false;
      lastActivity = Date.now();
      nudged = false;
      schedule();
    },
    check,
    dispose() {
      disposed = true;
      clearTimeout(timer);
    },
  };
}

export function feedbackReaction(feedback: { strengths: string[]; gaps: string[] }): {
  mood: CompanionMood;
  message: string;
} {
  if (feedback.gaps.length)
    return {
      mood: feedback.strengths.length ? "talking" : "sad",
      message: `One step at a time. Your coach suggests: ${feedback.gaps[0]}`,
    };
  if (feedback.strengths.length)
    return { mood: "happy", message: `Your coach noticed a strength: ${feedback.strengths[0]}` };
  return {
    mood: "idle",
    message: "You’ve made room to reflect. What would you like to explore next?",
  };
}

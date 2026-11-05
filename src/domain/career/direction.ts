import type { Profile } from "./contracts";

/** Interest and calibration belong to the chosen topic. Time and goal can carry over. */
export function profileForDirection(topic: string, previous?: Profile): Profile {
  if (previous?.topic === topic) return { ...previous };
  return {
    topic,
    experience: "new",
    interest: "",
    diagnostic: "",
    goal: previous?.goal ?? "interview",
    minutes: previous?.minutes ?? 15,
  };
}

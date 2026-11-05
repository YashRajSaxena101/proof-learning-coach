import { expect, it } from "vitest";
import { applyResumeSuggestions } from "./profile";
it("keeps experience, goal and diagnostic while applying approved résumé direction", () => {
  const profile = {
    topic: "Cloud/DevOps",
    experience: "projects" as const,
    interest: "SRE practice",
    goal: "workplace" as const,
    minutes: 25 as const,
    diagnostic: "I would inspect latency.",
  };
  expect(applyResumeSuggestions(profile, "Data analyst", "Skills: SQL. Explain evidence")).toEqual({
    ...profile,
    topic: "Data analyst",
    interest: "Skills: SQL. Explain evidence",
  });
  const revised = applyResumeSuggestions(
    { ...profile, interest: "x".repeat(600) },
    "Data analyst",
    "Skills: SQL",
  );
  expect(revised.interest).toBe("Skills: SQL");
  expect(applyResumeSuggestions(revised, "Data analyst", "Skills: SQL").interest).toBe(
    "Skills: SQL",
  );
});

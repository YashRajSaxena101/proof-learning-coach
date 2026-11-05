import { createFileRoute } from "@tanstack/react-router";
import { CareerDashboard } from "./dashboard";
export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your career learning evidence — Proof" },
      {
        name: "description",
        content: "Review your workplace rehearsals, reflections and recorded feedback.",
      },
      { property: "og:title", content: "Your career learning evidence — Proof" },
      {
        property: "og:description",
        content: "Progress grounded in your recorded practice, not a job-readiness score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareerDashboard,
});

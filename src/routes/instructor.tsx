import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/SiteHeader";

export const Route = createFileRoute("/instructor")({
  head: () => ({
    meta: [
      { title: "Instructor dashboard (sample) — Proof" },
      { name: "description", content: "Illustrative instructor view of misconceptions and assisted vs. independent success." },
      { property: "og:title", content: "Instructor dashboard (sample) — Proof" },
      { property: "og:description", content: "Sample data only — shows how cohort evidence would be summarized." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Instructor,
});

// Fictional illustrative learners — not real students or measured results.
const SAMPLE = [
  { name: "Learner A", prediction: "High-confidence wrong", hints: 1, repair: "2 attempts", outcome: "Assisted success" },
  { name: "Learner B", prediction: "Correct", hints: 0, repair: "1 attempt", outcome: "Mastery" },
  { name: "Learner C", prediction: "Low-confidence wrong", hints: 5, repair: "3 attempts", outcome: "In progress" },
  { name: "Learner D", prediction: "Correct", hints: 2, repair: "1 attempt", outcome: "Assisted success" },
];

function Instructor() {
  return (
    <Page>
      <div role="note" className="rounded-lg border border-warn/40 bg-warn-soft p-4 text-sm">
        <strong>Sample dashboard.</strong> All rows below are invented placeholders to illustrate the layout. No authentication or real learner data is connected.
      </div>
      <h1 className="mt-8 text-4xl">Cohort · Revenue Mirage</h1>
      <div className="paper mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left font-mono text-[11px] uppercase text-muted-foreground">
            {["Learner", "Prediction", "Hints", "Repair", "Outcome"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>{SAMPLE.map((r) => (
            <tr key={r.name} className="border-t"><td className="px-4 py-3">{r.name}</td><td className="px-4 py-3">{r.prediction}</td>
              <td className="px-4 py-3 font-mono">{r.hints}</td><td className="px-4 py-3">{r.repair}</td><td className="px-4 py-3">{r.outcome}</td></tr>))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="paper p-5"><p className="kicker">Most common misconception (sample)</p><p className="mt-2 font-display text-xl">“DISTINCT removes duplicate orders.”</p></div>
        <div className="paper p-5"><p className="kicker">Suggested intervention (sample)</p><p className="mt-2">Revisit row grain with a two-order collision example before assigning the transfer.</p></div>
      </div>
    </Page>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/SiteHeader";
import { Tilt } from "@/components/fx/Tilt";

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
  { name: "Learner A", prediction: "High-confidence wrong", hints: 1, repair: "2 attempts", outcome: "Transfer correct · assisted" },
  { name: "Learner B", prediction: "Correct", hints: 0, repair: "1 attempt", outcome: "Transfer correct · unassisted first try" },
  { name: "Learner C", prediction: "Low-confidence wrong", hints: 5, repair: "3 attempts", outcome: "In progress" },
  { name: "Learner D", prediction: "Correct", hints: 2, repair: "1 attempt", outcome: "Transfer correct · assisted" },
];
const Sample = () => <span className="rounded-full border border-warn/40 bg-warn-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warn">Sample data</span>;

function Instructor() {
  const maxH = Math.max(...SAMPLE.map((s) => s.hints));
  return (
    <Page>
      <div role="note" className="rounded-2xl border border-warn/40 bg-warn-soft p-4 text-sm">
        <strong>Sample dashboard.</strong> All rows and charts below are invented placeholders to illustrate the layout. No organization roles, authentication or real learner data is connected.
      </div>
      <p className="kicker mt-10">Cohort intelligence · Revenue Mirage</p>
      <h1 className="mt-2 text-5xl font-medium">Where learners get stuck</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Tilt className="paper rounded-2xl p-5 md:col-span-2">
          <div className="flex items-center justify-between"><p className="text-sm">Hints revealed per learner</p><Sample /></div>
          {/* Definite plot height so percentage bars resolve; labels sit outside the plot area. */}
          <div
            role="img"
            aria-label="Bar chart of hints revealed per learner: A=1, B=0, C=5, D=2"
            className="mt-6 flex h-40 items-end gap-6 border-b border-border/60 px-2"
          >
            {SAMPLE.map((s) => {
              const pct = (s.hints / maxH) * 100;
              return (
                <div key={s.name} className="flex h-full flex-1 flex-col items-center justify-end">
                  <div className="relative w-full" style={{ height: `${pct}%` }}>
                    <span className="font-mono text-xs absolute -top-5 left-1/2 -translate-x-1/2">{s.hints}</span>
                    {s.hints > 0 ? (
                      <div className="h-full w-full rounded-t-md bg-gradient-to-t from-teal/20 to-teal" />
                    ) : (
                      <span className="sr-only">No hints revealed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-6 px-2 text-center">
            {SAMPLE.map((s) => (
              <span key={s.name} className="flex-1 text-[11px] text-muted-foreground">{s.name.replace("Learner ", "")}</span>
            ))}
          </div>
        </Tilt>
        <Tilt className="paper rounded-2xl p-5">
          <div className="flex items-center justify-between"><p className="text-sm">Outcome mix</p><Sample /></div>
          <ul className="mt-6 space-y-3 text-sm">
            {[["Unassisted first try", 1, "var(--ok)"], ["Assisted", 2, "var(--teal)"], ["In progress", 1, "var(--warn)"]].map(([l, n, c]) => (
              <li key={l as string}><div className="flex justify-between"><span>{l}</span><span className="font-mono">{n}/4</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(Number(n) / 4) * 100}%`, background: c as string }} /></div></li>
            ))}
          </ul>
        </Tilt>
      </div>
      <div className="paper mt-4 overflow-x-auto rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm">Learners</p><Sample /></div>
        <table className="w-full text-sm">
          <thead><tr className="text-left font-mono text-[11px] uppercase text-muted-foreground">
            {["Learner", "Prediction", "Hints", "Repair", "Outcome"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>{SAMPLE.map((r) => (
            <tr key={r.name} className="border-t border-border"><td className="px-4 py-3">{r.name}</td><td className="px-4 py-3">{r.prediction}</td>
              <td className="px-4 py-3 font-mono">{r.hints}</td><td className="px-4 py-3">{r.repair}</td><td className="px-4 py-3">{r.outcome}</td></tr>))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Tilt className="paper rounded-2xl p-5"><div className="flex items-center justify-between"><p className="kicker">Most common misconception</p><Sample /></div><p className="mt-3 font-display text-2xl">“DISTINCT removes duplicate orders.”</p></Tilt>
        <Tilt className="paper rounded-2xl p-5"><div className="flex items-center justify-between"><p className="kicker">Suggested intervention</p><Sample /></div><p className="mt-3">Revisit row grain with a two-order collision example before assigning the transfer.</p></Tilt>
      </div>
    </Page>
  );
}

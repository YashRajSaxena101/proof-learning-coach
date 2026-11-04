import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Page } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { STEPS, outcome, type EvidenceEvent } from "@/domain/learning";
import { useProgress, progressStore } from "@/services/progress-store";
import { useSession } from "@/services/remote-sync";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Learning evidence — Proof" },
      { name: "description", content: "A timeline of predictions, hints, repairs, and transfer results from your simulation." },
      { property: "og:title", content: "Learning evidence — Proof" },
      { property: "og:description", content: "See what you demonstrated, and how much help you used." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Evidence,
});

const LABEL = { not_started: "Not started", in_progress: "In progress", transfer_correct_assisted: "Transfer correct · assisted", transfer_correct_unassisted: "Transfer correct · unassisted first try" };
const tone = (e: EvidenceEvent) => (e.correct === true ? "var(--ok)" : e.correct === false ? "var(--warn)" : e.assisted ? "var(--teal)" : "var(--muted-foreground)");

/** Constellation: one column per step, one star per recorded event. Positions are deterministic. */
function Constellation({ events }: { events: EvidenceEvent[] }) {
  const W = 800, H = 220;
  const col = (s: string) => STEPS.findIndex((x) => x.id === s);
  const counts: Record<string, number> = {};
  const pts = events.map((e) => {
    const c = col(e.step); const k = (counts[e.step] = (counts[e.step] ?? 0) + 1) - 1;
    return { e, x: 50 + c * ((W - 100) / 7) + (k % 2 ? 14 : -14) * Math.min(1, k), y: 60 + ((k * 37) % 120) };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full" role="img" aria-label={`${events.length} recorded events across the simulation steps`}>
      {STEPS.map((s, i) => <g key={s.id}><line x1={50 + i * ((W - 100) / 7)} x2={50 + i * ((W - 100) / 7)} y1="30" y2={H} stroke="var(--border)" strokeDasharray="2 5" />
        <text x={50 + i * ((W - 100) / 7)} y={H + 22} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" fontFamily="JetBrains Mono">{i + 1}</text></g>)}
      <motion.polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--teal)" strokeOpacity="0.35" strokeWidth="1"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
      {pts.map((p, i) => (
        <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.04 * i, type: "spring", stiffness: 300, damping: 18 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
          <circle cx={p.x} cy={p.y} r="10" fill={tone(p.e)} opacity="0.15" />
          <circle cx={p.x} cy={p.y} r="4" fill={tone(p.e)} />
        </motion.g>
      ))}
    </svg>
  );
}

function Evidence() {
  const p = useProgress();
  const session = useSession();
  const o = outcome(p);
  const hints = Object.values(p.hints).reduce((a, b) => a + (b ?? 0), 0);
  const source = session ? "Account record" : "Browser-only record";
  if (p.events.length === 0)
    return (
      <Page>
        <div className="paper glow-line mx-auto max-w-xl rounded-3xl p-10 text-center">
          <svg viewBox="0 0 200 60" className="mx-auto h-14 w-48" aria-hidden>{[20, 60, 100, 140, 180].map((x) => <circle key={x} cx={x} cy={30} r="4" fill="none" stroke="var(--border)" />)}</svg>
          <p className="kicker mt-4">{source}</p>
          <h1 className="mt-2 text-4xl">No evidence yet</h1>
          <p className="mt-3 text-muted-foreground">Each prediction, hint, repair and explanation becomes a point here as you work through the case.</p>
          <Button asChild variant="teal" className="mt-6"><Link to="/learn">Start the simulation</Link></Button>
        </div>
      </Page>
    );
  return (
    <Page>
      <p className="kicker">{source}</p>
      <h1 className="mt-2 text-5xl font-medium">Learning evidence</h1>
      <div className="paper mt-8 rounded-3xl p-4 md:p-6">
        <Constellation events={p.events} />
        <div className="mt-2 flex flex-wrap gap-4 font-mono text-[11px] text-muted-foreground">
          {[["var(--ok)", "correct"], ["var(--warn)", "incorrect"], ["var(--teal)", "assisted"], ["var(--muted-foreground)", "viewed"]].map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: c }} />{l}</span>)}
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Outcome", LABEL[o]], ["Prediction", p.prediction ? `${p.prediction.correct ? "Correct" : "Incorrect"} · ${p.prediction.confidence}` : "—"],
          ["Hints used", String(hints)], ["Transfer attempts", String(p.transfer.attempts.length)]].map(([k, v]) => (
          <div key={k} className="paper rounded-2xl p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-display text-2xl">{v}</p></div>
        ))}
      </div>
      <ol className="mt-10 space-y-4 border-l border-border pl-6">
        {p.events.map((e, i) => (
          <li key={i} className="relative">
            <span className={cn("absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-background")} style={{ background: tone(e) }} />
            <p className="font-mono text-xs text-muted-foreground">{new Date(e.at).toLocaleTimeString()} · {e.step} · {e.kind}{e.assisted && " · assisted"}</p>
            <p className="text-sm">{e.detail}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex gap-3">
        <Button asChild variant="teal"><Link to="/learn">Back to simulation</Link></Button>
        <Button variant="outline" onClick={() => { if (confirm(session ? "Clear all evidence for this case on your account?" : "Clear all evidence in this browser?")) progressStore.reset(); }}>Reset case</Button>
      </div>
    </Page>
  );
}

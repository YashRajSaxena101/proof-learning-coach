import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { outcome } from "@/domain/learning";
import { useProgress, progressStore } from "@/services/progress-store";
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

const LABEL = { not_started: "Not started", in_progress: "In progress", assisted_success: "Assisted success", demonstrated: "Demonstrated in this exercise" };

function Evidence() {
  const p = useProgress();
  const o = outcome(p);
  const hints = Object.values(p.hints).reduce((a, b) => a + (b ?? 0), 0);
  if (p.events.length === 0)
    return (
      <Page>
        <div className="paper mx-auto max-w-xl p-10 text-center">
          <h1 className="text-3xl">No evidence yet</h1>
          <p className="mt-3 text-muted-foreground">Evidence appears as you predict, inspect, repair, and explain inside the simulation.</p>
          <Button asChild variant="teal" className="mt-6"><Link to="/learn">Start the simulation</Link></Button>
        </div>
      </Page>
    );
  return (
    <Page>
      <p className="kicker">Browser-only record</p>
      <h1 className="mt-2 text-4xl">Learning evidence</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[["Outcome", LABEL[o]], ["Prediction", p.prediction ? `${p.prediction.correct ? "Correct" : "Incorrect"} · ${p.prediction.confidence}` : "—"],
          ["Hints used", String(hints)], ["Transfer attempts", String(p.transfer.attempts.length)]].map(([k, v]) => (
          <div key={k} className="paper p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-display text-2xl">{v}</p></div>
        ))}
      </div>
      <ol className="mt-10 border-l border-border pl-6 space-y-4">
        {p.events.map((e, i) => (
          <li key={i} className="relative">
            <span className={cn("absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-background",
              e.correct === true ? "bg-ok" : e.correct === false ? "bg-warn" : e.assisted ? "bg-teal" : "bg-muted-foreground")} />
            <p className="font-mono text-xs text-muted-foreground">{new Date(e.at).toLocaleTimeString()} · {e.step} · {e.kind}{e.assisted && " · assisted"}</p>
            <p className="text-sm">{e.detail}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex gap-3">
        <Button asChild><Link to="/learn">Back to simulation</Link></Button>
        <Button variant="outline" onClick={() => { if (confirm("Clear all evidence in this browser?")) progressStore.reset(); }}>Reset demo</Button>
      </div>
    </Page>
  );
}

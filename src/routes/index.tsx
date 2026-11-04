import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Page } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { progressStore } from "@/services/progress-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Proof — learn data reasoning by catching real-looking mistakes" },
      { name: "description", content: "Proof is an interactive learning coach. Investigate a fictional revenue spike, find the SQL join bug, and prove you can transfer the skill." },
      { property: "og:title", content: "Proof — an interactive data-reasoning coach" },
      { property: "og:description", content: "Predict, inspect, repair, teach back, transfer. Evidence over completion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <Page>
      <section className="grid gap-12 py-8 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div className="animate-rise">
          <p className="kicker">Interactive learning coach</p>
          <h1 className="mt-4 text-5xl md:text-7xl font-medium leading-[0.95]">The dashboard says +100%.<br /><em className="text-teal">Prove it.</em></h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">Proof drops you into a decision with money on the line, then makes you find — and explain — the bug behind a plausible number.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="teal" size="lg">
              <Link to="/learn" onClick={() => progressStore.set((p) => (p.events.length ? p : { ...p, current: "brief" }))}>Try the simulation <ArrowRight /></Link>
            </Button>
            <Button asChild variant="outline" size="lg"><Link to="/present">View the pitch</Link></Button>
          </div>
        </div>
        <div className="paper p-6 animate-rise [animation-delay:150ms]">
          <p className="font-mono text-xs text-muted-foreground">northstar_supply · monthly revenue (fictional)</p>
          <div className="mt-6 flex items-end gap-6">
            <div><p className="text-xs text-muted-foreground">Last month</p><p className="font-display text-4xl">$500</p></div>
            <div><p className="text-xs text-muted-foreground">Dashboard</p><p className="font-display text-6xl text-warn line-through decoration-2">$1,000</p></div>
          </div>
          <p className="mt-6 border-t pt-4 font-mono text-sm">True revenue: <strong className="text-teal">$500 · 0%</strong></p>
        </div>
      </section>
      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Predict", "Commit with confidence before seeing data."], ["Trace", "Click the inflated total to see each duplicate."], ["Repair & teach", "Pick a validated fix, then explain it."], ["Transfer", "Solve a fresh inventory case unassisted."]].map(([t, d], i) => (
          <div key={t} className="paper p-5"><p className="font-mono text-xs text-teal">0{i + 1}</p><h3 className="mt-2 text-xl">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </section>
    </Page>
  );
}

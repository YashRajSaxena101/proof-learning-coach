import { createFileRoute } from "@tanstack/react-router";
import { Check, RotateCcw } from "lucide-react";
import { Page } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { STEPS, type StepId } from "@/domain/learning";
import { progressStore, useProgress } from "@/services/progress-store";
import { BriefStep, PredictStep } from "@/components/learn/StepsIntro";
import { ExploreStep, JoinStep, TraceStep } from "@/components/learn/StepsData";
import { RepairStep, TeachStep, TransferStep } from "@/components/learn/StepsApply";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "The Revenue Mirage — Proof simulation" },
      { name: "description", content: "Interactive SQL join fan-out simulation: find why revenue looks doubled and fix it." },
      { property: "og:title", content: "The Revenue Mirage — Proof" },
      { property: "og:description", content: "Predict, inspect, trace, repair, teach back, and transfer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Learn,
});

const VIEWS: Record<StepId, () => React.ReactElement> = {
  brief: BriefStep, predict: PredictStep, explore: ExploreStep, join: JoinStep,
  trace: TraceStep, repair: RepairStep, teach: TeachStep, transfer: TransferStep,
};

function Learn() {
  const p = useProgress();
  const View = VIEWS[p.current];
  const reachable = (id: StepId) => id === p.current || p.completed.includes(id) || STEPS.findIndex((s) => s.id === id) <= p.completed.length;
  return (
    <Page>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="kicker">Progress map</p>
          <ol className="mt-3 flex gap-1 overflow-x-auto lg:flex-col">
            {STEPS.map((s, i) => {
              const done = p.completed.includes(s.id) || (s.id === "transfer" && p.transfer.solved);
              return (
                <li key={s.id}>
                  <button disabled={!reachable(s.id)} onClick={() => progressStore.set((x) => ({ ...x, current: s.id }))}
                    aria-current={p.current === s.id ? "step" : undefined}
                    className={cn("flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-left text-sm transition disabled:opacity-40",
                      p.current === s.id ? "bg-accent text-accent-foreground" : "hover:bg-muted")}>
                    <span className={cn("grid size-5 place-items-center rounded-full border font-mono text-[10px]", done && "border-ok bg-ok text-primary-foreground")}>
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>{s.title}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 rounded-md border border-border p-3 text-xs text-muted-foreground">
            Progress is saved in this browser only (localStorage). No account or server yet.
            <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => { if (confirm("Reset all simulation progress in this browser?")) progressStore.reset(); }}>
              <RotateCcw /> Reset demo
            </Button>
          </div>
        </aside>
        <div key={p.current}><View /></div>
      </div>
    </Page>
  );
}

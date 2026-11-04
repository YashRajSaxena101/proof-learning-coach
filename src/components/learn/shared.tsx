import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HINTS, STEPS, type StepId } from "@/domain/learning";
import { progressStore, useProgress } from "@/services/progress-store";
import { cn } from "@/lib/utils";

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function goTo(step: StepId, complete?: StepId) {
  progressStore.set((p) => ({
    ...p, current: step,
    completed: complete && !p.completed.includes(complete) ? [...p.completed, complete] : p.completed,
  }));
  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
}
export function nextOf(id: StepId): StepId | null {
  const i = STEPS.findIndex((s) => s.id === id);
  return STEPS[i + 1]?.id ?? null;
}

export function StepShell({ id, kicker, title, children, canContinue = true, onContinue, continueLabel }: {
  id: StepId; kicker: string; title: string; children: React.ReactNode;
  canContinue?: boolean; onContinue?: () => void; continueLabel?: string;
}) {
  const next = nextOf(id);
  return (
    <section className="animate-rise" aria-labelledby={`h-${id}`}>
      <p className="kicker">{kicker}</p>
      <h2 id={`h-${id}`} className="mt-2 text-3xl md:text-4xl font-medium">{title}</h2>
      <div className="mt-6 space-y-6">{children}</div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="teal" size="lg" disabled={!canContinue}
          onClick={() => { onContinue?.(); goTo(next ?? id, id); }}>
          {continueLabel ?? (next ? "Continue" : "Finish")}
        </Button>
        {!canContinue && <span className="text-sm text-muted-foreground">Complete this step to continue.</span>}
      </div>
      <HintPanel step={id} />
    </section>
  );
}

export function HintPanel({ step }: { step: StepId }) {
  const p = useProgress();
  const used = p.hints[step] ?? 0;
  const [open, setOpen] = useState(used > 0);
  const reveal = () => {
    if (used >= 3) return;
    progressStore.set((s) => ({ ...s, hints: { ...s.hints, [step]: used + 1 } }));
    progressStore.log({ step, kind: "hint", detail: `Hint level ${used + 1}`, assisted: true });
    setOpen(true);
  };
  return (
    <aside className="mt-8 rounded-lg border border-dashed border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Lightbulb className="size-4 text-teal" aria-hidden />
        <span className="text-sm font-medium">Hints</span>
        <span className="font-mono text-xs text-muted-foreground">{used}/3 used · recorded as assistance</span>
        <Button size="sm" variant="outline" className="ml-auto" onClick={reveal} disabled={used >= 3}>
          {used === 0 ? "Show hint" : used >= 3 ? "All hints shown" : `Show level ${used + 1}`}
        </Button>
      </div>
      {open && used > 0 && (
        <ol className="mt-3 space-y-1.5 text-sm">
          {HINTS[step].slice(0, used).map((h, i) => (
            <li key={i} className="animate-rise"><span className="font-mono text-teal mr-2">L{i + 1}</span>{h}</li>
          ))}
        </ol>
      )}
    </aside>
  );
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warn" | "ok"; title: string; children: React.ReactNode }) {
  return (
    <div role="status" className={cn("rounded-lg border p-4 animate-rise",
      tone === "warn" && "border-warn/40 bg-warn-soft",
      tone === "ok" && "border-ok/40 bg-ok-soft",
      tone === "info" && "border-teal/30 bg-teal-soft")}>
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

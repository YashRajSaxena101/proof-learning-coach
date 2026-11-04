import { useState } from "react";
import { motion } from "motion/react";
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
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }} aria-labelledby={`h-${id}`}>
      <p className="kicker">{kicker}</p>
      <h2 id={`h-${id}`} className="mt-3 text-4xl md:text-5xl font-medium leading-[1] tracking-[-0.025em]">{title}</h2>
      <div className="mt-6 space-y-6">{children}</div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="teal" size="lg" disabled={!canContinue}
          onClick={() => { onContinue?.(); goTo(next ?? id, id); }}>
          {continueLabel ?? (next ? "Continue" : "Finish")}
        </Button>
        {!canContinue && <span className="text-sm text-muted-foreground">Complete this step to continue.</span>}
      </div>
      <HintPanel step={id} />
    </motion.section>
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
    <aside className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 p-4">
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

/** Stable per-order colour so rows can be mapped across tables. */
export const ORDER_COLOR: Record<string, string> = { O101: "var(--teal)", O102: "oklch(0.78 0.12 230)", O103: "oklch(0.88 0.08 90)", O104: "oklch(0.75 0.13 300)" };
export const OrderDot = ({ id }: { id: string }) => (
  <span aria-hidden className="mr-2 inline-block size-2 rounded-full align-middle" style={{ background: ORDER_COLOR[id] ?? "var(--muted-foreground)" }} />
);

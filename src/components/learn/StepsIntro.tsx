import { useState } from "react";
import { Button } from "@/components/ui/button";
import { predictionBranch, type Confidence } from "@/domain/learning";
import { PREVIOUS_MONTH_REVENUE, ORDERS, LINE_ITEMS, joinOrders, faultyJoinedTotal } from "@/domain/fanout";
import { progressStore, useProgress } from "@/services/progress-store";
import { Callout, StepShell, money } from "./shared";
import { cn } from "@/lib/utils";

const dash = faultyJoinedTotal(joinOrders(ORDERS, LINE_ITEMS));

export function BriefStep() {
  return (
    <StepShell id="brief" kicker="Scenario · Northstar Supply (fictional)" title="The Revenue Mirage"
      onContinue={() => progressStore.log({ step: "brief", kind: "view", detail: "Read CFO brief" })}>
      <div className="paper p-6 md:p-8 max-w-3xl">
        <p className="font-mono text-xs text-muted-foreground">From: Dana Ruiz, CFO · To: Analytics · Subject: Marketing budget</p>
        <p className="mt-4 font-display text-xl leading-relaxed">
          “The dashboard says revenue jumped from {money(PREVIOUS_MONTH_REVENUE)} to {money(dash)} — <strong>+100%</strong> month over month.
          I'm ready to double next quarter's marketing spend on the strength of it. Before I sign, confirm the number is real.”
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
        {[["Last month", money(PREVIOUS_MONTH_REVENUE)], ["Dashboard this month", money(dash)], ["Reported growth", "+100%"]].map(([k, v]) => (
          <div key={k} className="paper p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-display text-3xl">{v}</p></div>
        ))}
      </div>
      <p className="font-mono text-sm text-warn">Unverified report — investigate before deciding</p>
      <p className="text-muted-foreground max-w-2xl">Your job: decide whether the CFO should trust this number. Northstar and all data here are fictional teaching material.</p>
    </StepShell>
  );
}

const CHOICES = [
  { id: "1000", label: "$1,000 (+100%)", correct: false },
  { id: "500", label: "$500 (0%)", correct: true },
  { id: "380", label: "$380 (−24%)", correct: false },
];

export function PredictStep() {
  const p = useProgress();
  const [choice, setChoice] = useState(p.prediction?.choice ?? "");
  const [conf, setConf] = useState<Confidence | "">(p.prediction?.confidence ?? "");
  const done = p.prediction;
  const submit = () => {
    if (!choice || !conf) return;
    const correct = CHOICES.find((c) => c.id === choice)!.correct;
    const branch = predictionBranch(correct, conf);
    progressStore.set((s) => ({ ...s, prediction: { choice, confidence: conf, correct, branch } }));
    progressStore.log({ step: "predict", kind: "answer", detail: `Predicted ${money(Number(choice))} (${conf} confidence)`, correct, confidence: conf },
      { activity: "predict", answer: choice, confidence: conf });
  };
  return (
    <StepShell id="predict" kicker="Commit before you look" title="What is true revenue this month?" canContinue={!!done}>
      <fieldset className="space-y-2 max-w-2xl" disabled={!!done}>
        <legend className="mb-2 text-sm text-muted-foreground">Choose one</legend>
        {CHOICES.map((c) => (
          <label key={c.id} className={cn("paper flex cursor-pointer items-center gap-3 p-4 transition", choice === c.id && "ring-2 ring-teal")}>
            <input type="radio" name="pred" value={c.id} checked={choice === c.id} onChange={() => setChoice(c.id)} className="accent-[var(--teal)]" />
            <span>{c.label}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="max-w-2xl" disabled={!!done}>
        <legend className="mb-2 text-sm text-muted-foreground">How confident are you?</legend>
        <div className="flex gap-2">
          {(["low", "medium", "high"] as const).map((c) => (
            <Button key={c} variant={conf === c ? "default" : "outline"} aria-pressed={conf === c} onClick={() => setConf(c)} className="capitalize">{c}</Button>
          ))}
        </div>
      </fieldset>
      {!done && <Button onClick={submit} disabled={!choice || !conf}>Lock in prediction</Button>}
      {done && <PredictionFeedback />}
    </StepShell>
  );
}

function PredictionFeedback() {
  const p = useProgress().prediction!;
  const [ack, setAck] = useState<string | null>(null);
  if (p.branch === "confirm")
    return <Callout tone="ok" title="Correct prediction — now prove it.">A prediction isn't evidence yet. The next steps make you show exactly where the extra {money(500)} comes from.</Callout>;
  if (p.branch === "misconception")
    return (
      <Callout tone="warn" title="Confident and incorrect — let's examine the belief.">
        <p>You were highly confident. Which assumption felt solid?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["A JOIN never changes row counts", "DISTINCT removes duplicates safely", "The dashboard is already validated"].map((m) => (
            <Button key={m} size="sm" variant={ack === m ? "default" : "outline"} onClick={() => { setAck(m); progressStore.log({ step: "predict", kind: "answer", detail: `Misconception named: ${m}` }); }}>{m}</Button>
          ))}
        </div>
        {ack && <p className="mt-3">Noted. We'll test that belief directly against the data in the next three steps.</p>}
      </Callout>
    );
  if (p.branch === "scaffold")
    return (
      <Callout tone="info" title="Prerequisite check: what does a JOIN do to row count?">
        <p>When one order has two line items, joining them produces <strong>two rows</strong> for that order — each carrying the order's full total. Keep that in mind as you inspect the tables.</p>
      </Callout>
    );
  return <Callout tone="info" title="Not quite.">Hold onto your guess and test it — the tables will show you.</Callout>;
}

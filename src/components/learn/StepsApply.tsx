import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { REPAIR_OPTIONS, evaluateRepair, collidingTotals, ORDERS, WAREHOUSES, SUPPLIER_LINKS, inventoryTrueTotal, type RepairId } from "@/domain/fanout";
import { TEACH_CRITERIA, outcome, type Confidence } from "@/domain/learning";
import { progressStore, useProgress } from "@/services/progress-store";
import { curatedFeedback, type CuratedReply } from "@/domain/curated-feedback";
import { coachMet, type CoachResponse } from "@/domain/evaluation";
import { requestCoachEvaluation } from "@/services/coach";
import { insertAttempt, useSession } from "@/services/remote-sync";
import { Callout, HintPanel, StepShell, money } from "./shared";
import { cn } from "@/lib/utils";

export function RepairStep() {
  const p = useProgress();
  const [sel, setSel] = useState<RepairId | null>(null);
  const opt = REPAIR_OPTIONS.find((o) => o.id === sel);
  const run = (id: RepairId) => {
    setSel(id);
    const o = REPAIR_OPTIONS.find((x) => x.id === id)!;
    progressStore.set((s) => ({ ...s, repairAttempts: [...s.repairAttempts, id], repairSolved: s.repairSolved || o.correct }));
    progressStore.log({ step: "repair", kind: "repair", detail: `${o.label} → ${money(evaluateRepair(id))}`, correct: o.correct }, { activity: "repair", answer: id });
  };
  const collision = collidingTotals(ORDERS)[0];
  return (
    <StepShell id="repair" kicker="Validated alternatives · no arbitrary SQL" title="Choose a repair and run it against the data" canContinue={p.repairSolved}>
      <div className="grid gap-4 md:grid-cols-2">
        {REPAIR_OPTIONS.map((o) => (
          <div key={o.id} className={cn("paper p-4", sel === o.id && (o.correct ? "ring-2 ring-ok" : "ring-2 ring-warn"))}>
            <p className="font-medium">{o.label}</p>
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 font-mono text-xs">{o.sql}</pre>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => run(o.id)}>Run against sample data</Button>
          </div>
        ))}
      </div>
      {opt && (
        <Callout tone={opt.correct ? "ok" : "warn"} title={`Result: ${money(evaluateRepair(opt.id))} — ${opt.correct ? "matches true revenue" : "incorrect"}`}>
          {opt.why}
          {opt.id === "distinct" && collision && (
            <p className="mt-2 font-mono text-xs">Distinct values: {money(120)}, {money(80)}, {money(180)} → {money(380)}. {collision.orderIds.join(" and ")} both total {money(collision.value)}, so {collision.orderIds[1]} silently disappears.</p>
          )}
        </Callout>
      )}
      {p.repairSolved && <IndustryCard />}
      {p.repairAttempts.length > 0 && <p className="font-mono text-xs text-muted-foreground">Attempts recorded: {p.repairAttempts.length}</p>}
    </StepShell>
  );
}

type AiState = { ok: true; result: CoachResponse } | { ok: false; message: string };

export function TeachStep() {
  const p = useProgress();
  const session = useSession();
  const [text, setText] = useState(p.teach?.text ?? "");
  const [conf, setConf] = useState<Confidence | "">("");
  const [curated, setCurated] = useState<CuratedReply | null>(null);
  const [ai, setAi] = useState<AiState | null>(null);
  const [loading, setLoading] = useState(false);
  const send = async () => {
    if (!conf) return;
    setLoading(true); setAi(null);
    const r = curatedFeedback(text);
    setCurated(r);
    progressStore.set((s) => ({ ...s, teach: { text, met: r.met } }));
    progressStore.log({ step: "teach", kind: "teach", detail: `Curated rubric (not AI): ${r.met.length}/4 criteria`, correct: r.passed, confidence: conf });
    if (session) {
      const a = await insertAttempt({ activity: "teach", answer: text, confidence: conf, hintsUsed: p.hints.teach ?? 0 }, "teach-back");
      if ("error" in a) setAi({ ok: false, message: `Your answer wasn't saved, so it couldn't be sent to the AI coach: ${a.error}` });
      else {
        const res = await requestCoachEvaluation(a.id);
        setAi(res.ok ? { ok: true, result: res.result } : { ok: false, message: res.reason.message });
        if (res.ok) progressStore.log({ step: "teach", kind: "teach", detail: `AI coach (${res.result.provider} ${res.result.model}) responded` });
      }
    }
    setLoading(false);
  };
  return (
    <StepShell id="teach" kicker="Explain it to a colleague" title="Teach Sam why the dashboard was wrong" canContinue={!!p.teach}>
      <div className="paper max-w-3xl p-4"><p className="text-sm"><strong>Sam (analyst):</strong> “I'd have shipped that +100% too. What went wrong, and how do we fix it?”</p></div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={4000} aria-label="Your explanation"
        placeholder="Explain the duplication, the row grain, a correct fix, and why DISTINCT isn't one…"
        className="w-full max-w-3xl rounded-lg border border-input bg-card p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">How confident are you in this explanation?</legend>
        <div className="flex gap-2">
          {(["low", "medium", "high"] as const).map((c) => (
            <Button key={c} size="sm" variant={conf === c ? "default" : "outline"} aria-pressed={conf === c} onClick={() => setConf(c)} className="capitalize">{c}</Button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={send} disabled={text.trim().length < 20 || !conf || loading}>{loading ? (session ? "Asking the AI coach…" : "Checking…") : "Send to Sam"}</Button>
        {!session && <span className="text-xs text-muted-foreground">Browser demo: curated feedback only. <Link to="/auth" className="text-teal underline">Sign in</Link> to send it to the AI coach.</span>}
      </div>
      {ai && (ai.ok ? (
        <div className="max-w-3xl space-y-3">
          <p className="kicker">Live AI · {ai.result.provider} · {ai.result.model}</p>
          <Callout tone={ai.result.passed ? "ok" : "info"} title={`Sam (AI): ${ai.result.needs_clarification ? "Can you clarify?" : ai.result.passed ? "That makes sense" : "Not there yet"}`}>
            {ai.result.feedback}
            {ai.result.evidence.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs">{ai.result.evidence.map((e, i) => <li key={i}>“{e}”</li>)}</ul>}
          </Callout>
          <CriteriaList ids={["duplication", "grain", "fix"]} met={coachMet(ai.result)} />
        </div>
      ) : <Callout tone="warn" title="AI coach unavailable — curated fallback shown below">{ai.message} The fallback is not recorded as an AI evaluation.</Callout>)}
      {curated && (
        <div className="max-w-3xl space-y-3">
          <p className="kicker">Curated feedback · keyword rubric fallback (not AI)</p>
          <Callout tone={curated.passed ? "ok" : "info"} title="Rubric check">{curated.message}</Callout>
          <CriteriaList met={curated.met} />
        </div>
      )}
    </StepShell>
  );
}

function CriteriaList({ met, ids }: { met: string[]; ids?: string[] }) {
  return (
    <ul className="grid gap-2 text-sm sm:grid-cols-2">
      {TEACH_CRITERIA.filter((c) => !ids || ids.includes(c.id)).map((c) => (
        <li key={c.id} className={cn("rounded border px-3 py-2", met.includes(c.id) ? "border-ok/40 bg-ok-soft" : "border-border text-muted-foreground")}>
          {met.includes(c.id) ? "✓" : "○"} {c.label}
        </li>
      ))}
    </ul>
  );
}

export function TransferStep() {
  const p = useProgress();
  const [val, setVal] = useState("");
  const last = p.transfer.attempts.at(-1);
  const submit = () => {
    const n = Number(val);
    if (!Number.isFinite(n) || val.trim() === "") return;
    const correct = n === inventoryTrueTotal(WAREHOUSES);
    progressStore.set((s) => ({ ...s, transfer: { attempts: [...s.transfer.attempts, n], solved: s.transfer.solved || correct } }));
    progressStore.log({ step: "transfer", kind: "transfer", detail: `Answered ${n} units`, correct, assisted: (p.hints.transfer ?? 0) > 0 || p.transfer.attempts.length > 0 },
      { activity: "transfer", answer: String(n) });
  };
  const o = outcome(p);
  return (
    <section className="animate-rise" aria-labelledby="h-transfer">
      <p className="kicker">Fresh context · no walkthrough</p>
      <h2 id="h-transfer" className="mt-2 text-3xl md:text-4xl font-medium">Inventory: how many units are on hand?</h2>
      <p className="mt-4 max-w-2xl text-muted-foreground">An ops report runs <code className="font-mono text-sm">SELECT SUM(w.quantity) FROM warehouses w JOIN warehouse_suppliers s ON s.warehouse_id = w.id</code> and reports <strong>100 units</strong>.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <table className="paper w-full text-sm font-mono"><thead><tr><th className="p-2 text-left">warehouse</th><th className="p-2 text-left">quantity</th></tr></thead>
          <tbody>{WAREHOUSES.map((w) => <tr key={w.id} className="border-t"><td className="p-2">{w.id} {w.name}</td><td className="p-2">{w.quantity}</td></tr>)}</tbody></table>
        <table className="paper w-full text-sm font-mono"><thead><tr><th className="p-2 text-left">warehouse_id</th><th className="p-2 text-left">supplier</th></tr></thead>
          <tbody>{SUPPLIER_LINKS.map((l, i) => <tr key={i} className="border-t"><td className="p-2">{l.warehouseId}</td><td className="p-2">{l.supplier}</td></tr>)}</tbody></table>
      </div>
      {!p.transfer.solved && (
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <label className="text-sm">True units on hand
            <input type="number" inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
              className="mt-1 block w-40 rounded-md border border-input bg-card px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <Button variant="teal" onClick={submit} disabled={val.trim() === ""}>Submit answer</Button>
        </div>
      )}
      <div className="mt-6 max-w-3xl space-y-4">
        {last !== undefined && !p.transfer.solved && (
          <Callout tone="warn" title={`${last} isn't right.`}>{last === 100 ? "That's the duplicated report figure. Each warehouse appears once per supplier." : "Check how many rows each warehouse produces after the join."}</Callout>
        )}
        {p.transfer.solved && (
          <Callout tone="ok" title={o === "demonstrated" ? "Demonstrated in this exercise" : "Assisted success — not yet demonstrated"}>
            {o === "demonstrated"
              ? "Correct on the first try with no hints, after a solid teach-back. That's evidence for this exercise — not a permanent mastery claim."
              : "You reached 50 units, but with hints, extra attempts, or an incomplete teach-back. Proof records this honestly as assisted success; try a fresh transfer later to demonstrate it independently."}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm"><Link to="/evidence">View learning evidence</Link></Button>
            </div>
          </Callout>
        )}
      </div>
      <HintPanel step="transfer" />
    </section>
  );
}

function IndustryCard() {
  return (
    <aside className="paper max-w-3xl border-l-4 border-l-teal p-5">
      <p className="kicker">Documented product application · not a customer incident</p>
      <h3 className="mt-2 text-xl">How Looker handles join fan-out</h3>
      <p className="mt-2 text-sm leading-relaxed">Looker's documentation describes “symmetric aggregates”: when a join repeats a row, Looker uses each row's primary key to know which facts are the same fact, so a measure like a sum counts each order once — unlike DISTINCT, which only compares values.</p>
      <a href="https://docs.cloud.google.com/looker/docs/best-practices/understanding-symmetric-aggregates" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-teal underline underline-offset-4">Read Looker's documentation ↗</a>
    </aside>
  );
}

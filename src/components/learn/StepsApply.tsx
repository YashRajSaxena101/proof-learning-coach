import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { REPAIR_OPTIONS, evaluateRepair, collidingTotals, ORDERS, WAREHOUSES, SUPPLIER_LINKS, inventoryTrueTotal, type RepairId } from "@/domain/fanout";
import { TEACH_CRITERIA, outcome } from "@/domain/learning";
import { progressStore, useProgress } from "@/services/progress-store";
import { useServerFn } from "@tanstack/react-start";
import { curatedFeedback, type CuratedReply } from "@/domain/curated-feedback";
import { metCriteria } from "@/domain/evaluation";
import { evaluateTeachBack, type EvalResult } from "@/lib/teach-eval.functions";
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

export function TeachStep() {
  const p = useProgress();
  const session = useSession();
  const evalFn = useServerFn(evaluateTeachBack);
  const [text, setText] = useState(p.teach?.text ?? "");
  const [curated, setCurated] = useState<CuratedReply | null>(null);
  const [ai, setAi] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const send = async () => {
    setLoading(true); setAi(null);
    const r = curatedFeedback(text);
    setCurated(r);
    progressStore.set((s) => ({ ...s, teach: { text, met: r.met } }));
    progressStore.log({ step: "teach", kind: "teach", detail: `Curated rubric: ${r.met.length}/4 criteria`, correct: r.passed });
    if (session) {
      const a = await insertAttempt({ activity: "teach", answer: text, hintsUsed: p.hints.teach ?? 0 });
      if ("error" in a) setAi({ ok: false, error: `Your answer wasn't saved, so it couldn't be evaluated: ${a.error}` });
      else {
        try { setAi(await evalFn({ data: { accessToken: session.access_token, attemptId: a.id, text } })); }
        catch { setAi({ ok: false, error: "The evaluation service didn't respond." }); }
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
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={send} disabled={text.trim().length < 20 || loading}>{loading ? (session ? "AI is evaluating…" : "Checking…") : "Send to Sam"}</Button>
        {!session && <span className="text-xs text-muted-foreground"><Link to="/auth" className="text-teal underline">Sign in</Link> for server-side AI evaluation. Demo mode uses curated feedback only.</span>}
      </div>
      {ai && (ai.ok ? (
        <div className="max-w-3xl space-y-3">
          <p className="kicker">AI evaluation · server-side model</p>
          <Callout tone={ai.evaluation.verdict === "pass" ? "ok" : "info"} title={`Sam (AI): ${ai.evaluation.verdict === "pass" ? "That makes sense" : "Not there yet"}`}>
            {ai.evaluation.feedback}
            <p className="mt-2 font-mono text-xs text-muted-foreground">{ai.persisted ? "Evaluation saved to your account by the server." : `Not saved: ${ai.persistNote}.`}</p>
          </Callout>
          <CriteriaList met={metCriteria(ai.evaluation)} />
        </div>
      ) : <Callout tone="warn" title="AI evaluation unavailable — showing curated fallback only">{ai.error}</Callout>)}
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

function CriteriaList({ met }: { met: string[] }) {
  return (
    <ul className="grid gap-2 text-sm sm:grid-cols-2">
      {TEACH_CRITERIA.map((c) => (
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

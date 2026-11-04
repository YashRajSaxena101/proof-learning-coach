import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { REPAIR_OPTIONS, evaluateRepair, collidingTotals, ORDERS, WAREHOUSES, SUPPLIER_LINKS, inventoryTrueTotal, type RepairId } from "@/domain/fanout";
import { TEACH_CRITERIA, outcome } from "@/domain/learning";
import { progressStore, useProgress } from "@/services/progress-store";
import { scriptedCoach, type CoachReply } from "@/services/coach";
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
    progressStore.log({ step: "repair", kind: "repair", detail: `${o.label} → ${money(evaluateRepair(id))}`, correct: o.correct });
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
      {p.repairAttempts.length > 0 && <p className="font-mono text-xs text-muted-foreground">Attempts recorded: {p.repairAttempts.length}</p>}
    </StepShell>
  );
}

export function TeachStep() {
  const p = useProgress();
  const [text, setText] = useState(p.teach?.text ?? "");
  const [reply, setReply] = useState<CoachReply | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await scriptedCoach.review(text);
      setReply(r);
      progressStore.set((s) => ({ ...s, teach: { text, met: r.met } }));
      progressStore.log({ step: "teach", kind: "teach", detail: `Teach-back met ${r.met.length}/4 criteria`, correct: r.passed });
    } catch { setErr("The colleague couldn't review that. Try again."); }
    finally { setLoading(false); }
  };
  return (
    <StepShell id="teach" kicker="Explain it to a colleague" title="Teach Sam why the dashboard was wrong" canContinue={!!p.teach}>
      <div className="rounded-md border border-border bg-muted px-3 py-2 text-xs">
        <strong>Scripted colleague:</strong> responses come from a rule-based rubric running in your browser — not a live AI model.
      </div>
      <div className="paper p-4 max-w-3xl"><p className="text-sm"><strong>Sam (analyst):</strong> “I'd have shipped that +100% too. What went wrong, and how do we fix it?”</p></div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} aria-label="Your explanation"
        placeholder="Explain the duplication, the row grain, a correct fix, and why DISTINCT isn't one…"
        className="w-full max-w-3xl rounded-lg border border-input bg-card p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      <Button onClick={send} disabled={text.trim().length < 20 || loading}>{loading ? "Sam is reading…" : "Send to Sam"}</Button>
      {err && <Callout tone="warn" title="Something went wrong">{err}</Callout>}
      {reply && (
        <div className="max-w-3xl space-y-3">
          <Callout tone={reply.passed ? "ok" : "info"} title="Sam replies">{reply.message}</Callout>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {TEACH_CRITERIA.map((c) => (
              <li key={c.id} className={cn("rounded border px-3 py-2", reply.met.includes(c.id) ? "border-ok/40 bg-ok-soft" : "border-border text-muted-foreground")}>
                {reply.met.includes(c.id) ? "✓" : "○"} {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </StepShell>
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
    progressStore.log({ step: "transfer", kind: "transfer", detail: `Answered ${n} units`, correct, assisted: (p.hints.transfer ?? 0) > 0 || p.transfer.attempts.length > 0 });
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
          <Callout tone="ok" title={o === "mastery" ? "Mastery demonstrated" : "Assisted success — not yet mastery"}>
            {o === "mastery"
              ? "Correct on the first try with no hints, after a solid teach-back. That's transferable evidence."
              : "You reached 50 units, but with hints, extra attempts, or an incomplete teach-back. Proof records this honestly as assisted success; try a new transfer later to show mastery."}
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

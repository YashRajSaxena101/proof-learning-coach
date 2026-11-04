import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ORDERS, LINE_ITEMS, joinOrders, faultyJoinedTotal, contributions, PREVIOUS_MONTH_REVENUE, growthPct } from "@/domain/fanout";
import { progressStore } from "@/services/progress-store";
import { Callout, OrderDot, StepShell, money } from "./shared";
import { cn } from "@/lib/utils";

const ROWS = joinOrders(ORDERS, LINE_ITEMS);
const th = "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground";
const td = "px-3 py-2 font-mono text-sm";

export function ExploreStep() {
  const [sel, setSel] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const pick = (id: string) => { setSel(id); setSeen((s) => new Set(s).add(id)); };
  return (
    <StepShell id="explore" kicker="Inspect the source" title="Click an order to see its line items"
      canContinue={seen.size >= 2}
      onContinue={() => progressStore.log({ step: "explore", kind: "view", detail: `Inspected ${seen.size} orders` })}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="paper overflow-x-auto">
          <p className="border-b px-4 py-2 font-mono text-xs">orders · 4 rows</p>
          <table className="w-full">
            <thead><tr><th className={th}>id</th><th className={th}>total</th></tr></thead>
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.id} className={cn("border-t transition-colors", sel === o.id && "bg-teal-soft")}>
                  <td className={td}><button className="underline decoration-dotted underline-offset-4 hover:text-teal" aria-pressed={sel === o.id} onClick={() => pick(o.id)}><OrderDot id={o.id} />{o.id}</button></td>
                  <td className={td}>{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="paper overflow-x-auto">
          <p className="border-b px-4 py-2 font-mono text-xs">line_items · 8 rows</p>
          <table className="w-full">
            <thead><tr><th className={th}>id</th><th className={th}>order_id</th><th className={th}>amount</th></tr></thead>
            <tbody>
              {LINE_ITEMS.map((l) => (
                <tr key={l.id} className={cn("border-t transition-colors", sel === l.orderId ? "bg-teal-soft" : sel && "opacity-40")}>
                  <td className={td}>{l.id}</td><td className={td}><OrderDot id={l.orderId} />{l.orderId}</td><td className={td}>{money(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {sel ? (
        <Callout title={`${sel} has 2 line items`}>
          {LINE_ITEMS.filter((l) => l.orderId === sel).map((l) => money(l.amount)).join(" + ")} = {money(ORDERS.find((o) => o.id === sel)!.total)}. The amounts reconcile to the order total.
        </Callout>
      ) : <p className="text-sm text-muted-foreground">No order selected yet. Inspect at least two orders.</p>}
    </StepShell>
  );
}

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const f = () => setR(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

export function JoinStep() {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(0);
  const [playing, setPlaying] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playing) return;
    if (n >= ROWS.length) { setPlaying(false); return; }
    const t = setTimeout(() => setN((x) => x + 1), reduced ? 0 : 650);
    return () => clearTimeout(t);
  }, [playing, n, reduced]);
  const running = useMemo(() => faultyJoinedTotal(ROWS.slice(0, n)), [n]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setN((x) => Math.min(ROWS.length, x + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setN((x) => Math.max(0, x - 1)); }
    if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
  };
  return (
    <StepShell id="join" kicker="Run the dashboard query" title="Watch rows flow through the join" canContinue={n === ROWS.length}
      onContinue={() => progressStore.log({ step: "join", kind: "view", detail: "Watched all 8 joined rows" })}>
      <pre className="paper overflow-x-auto p-4 font-mono text-sm">SELECT SUM(o.total) FROM orders o{"\n"}JOIN line_items li ON li.order_id = o.id;</pre>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Previous row" onClick={() => setN((x) => Math.max(0, x - 1))}><SkipBack /></Button>
        <Button variant="teal" onClick={() => { if (n >= ROWS.length) setN(0); setPlaying((p) => !p); }}>
          {playing ? <><Pause /> Pause</> : <><Play /> {n >= ROWS.length ? "Replay" : n ? "Resume" : "Play"}</>}
        </Button>
        <Button variant="outline" size="icon" aria-label="Next row" onClick={() => setN((x) => Math.min(ROWS.length, x + 1))}><SkipForward /></Button>
        <Button variant="ghost" onClick={() => { setPlaying(false); setN(0); }}><RotateCcw /> Reset</Button>
        <span className="font-mono text-xs text-muted-foreground">← → step · Space play/pause{reduced && " · reduced motion on"}</span>
      </div>
      <div ref={box} tabIndex={0} onKeyDown={onKey} aria-label="Joined rows output. Use arrow keys to step." className="paper overflow-x-auto focus-visible:ring-2 focus-visible:ring-ring">
        <table className="w-full">
          <thead><tr><th className={th}>#</th><th className={th}>order_id</th><th className={th}>order.total</th><th className={th}>line_id</th><th className={th}>line.amount</th></tr></thead>
          <tbody aria-live="polite">
            {ROWS.slice(0, n).map((r, i) => (
              <tr key={r.lineId} className="border-t animate-flyin">
                <td className={td}>{i + 1}</td><td className={td}><OrderDot id={r.orderId} />{r.orderId}</td>
                <td className={cn(td, "font-semibold text-warn")}>{money(r.orderTotal)}</td>
                <td className={td}>{r.lineId}</td><td className={td}>{money(r.lineAmount)}</td>
              </tr>
            ))}
            {n === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">Output is empty. Press Play or step forward.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t bg-muted px-4 py-3 font-mono text-sm">
          <span>{n}/8 rows</span><span>SUM(o.total) = <strong>{money(running)}</strong></span>
        </div>
      </div>
      {n === ROWS.length && <Callout tone="warn" title="4 orders became 8 rows.">Every order total appears once per line item, so the sum is {money(running)} — a +{growthPct(PREVIOUS_MONTH_REVENUE, running)}% “growth” created entirely by the join.</Callout>}
    </StepShell>
  );
}

export function TraceStep() {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const c = contributions(ROWS);
  return (
    <StepShell id="trace" kicker="Find the evidence" title="Where does the extra $500 come from?" canContinue={open}
      onContinue={() => progressStore.log({ step: "trace", kind: "view", detail: "Traced duplicate contributions" })}>
      <button onClick={() => setOpen(true)} aria-expanded={open}
        className="paper group block p-6 text-left transition hover:ring-2 hover:ring-teal">
        <span className="text-xs text-muted-foreground">Dashboard total — click to trace</span>
        <span className="mt-1 block font-display text-6xl text-warn group-hover:underline decoration-dotted">{money(1000)}</span>
      </button>
      {open && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {c.map((x) => (
            <button key={x.orderId} onClick={() => setFocus(x.orderId)} aria-pressed={focus === x.orderId}
              className={cn("paper p-4 text-left animate-rise transition", focus === x.orderId && "ring-2 ring-teal")}>
              <p className="font-mono text-sm"><OrderDot id={x.orderId} />{x.orderId}</p>
              <p className="mt-2 font-mono text-sm">{money(x.total)} × {x.timesCounted} = <strong>{money(x.contributed)}</strong></p>
              <p className="mt-1 text-xs text-warn">+{money(x.excess)} duplicated</p>
              {focus === x.orderId && <p className="mt-2 text-xs text-muted-foreground">Rows: {ROWS.filter((r) => r.orderId === x.orderId).map((r) => r.lineId).join(", ")}</p>}
            </button>
          ))}
        </div>
      )}
      {open && <Callout tone="warn" title="Excess = exactly one extra copy of every order.">{c.map((x) => money(x.excess)).join(" + ")} = {money(500)} of phantom revenue. True revenue: {money(500)}, growth 0%.</Callout>}
    </StepShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Page } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Tilt } from "@/components/fx/Tilt";
import { STEPS, completedSteps, earlierHints, outcome } from "@/domain/learning";
import { progressStore, useProgress } from "@/services/progress-store";
import { useAuthReady, useSession, useSyncStatus } from "@/services/remote-sync";
import { cn } from "@/lib/utils";
import { useMotionPref } from "@/lib/motion-pref";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your learning workspace — Proof" },
      { name: "description", content: "Resume The Revenue Mirage, see your step map, hints and attempts recorded so far." },
      { property: "og:title", content: "Learning workspace — Proof" },
      { property: "og:description", content: "Your current case, progress map and recorded evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const OUTCOME = { not_started: "Not started", in_progress: "In progress", transfer_correct_assisted: "Transfer correct · with help", transfer_correct_unassisted: "Transfer correct · unassisted first try" };

function Orbit({ done, current, animate }: { done: string[]; current: string; animate: boolean }) {
  const R = 120, C = 150;
  return (
    <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[320px]" role="img" aria-label={`Progress map: ${done.length} of ${STEPS.length} steps completed`}>
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--border)" strokeDasharray="2 6" />
      <motion.circle cx={C} cy={C} r={R} fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(-90 ${C} ${C})`} initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: done.length / STEPS.length }}
        transition={animate ? { type: "spring", stiffness: 60, damping: 18 } : { duration: 0 }} />
      {STEPS.map((s, i) => {
        const a = (i / STEPS.length) * Math.PI * 2 - Math.PI / 2;
        const x = C + Math.cos(a) * R, y = C + Math.sin(a) * R;
        const d = done.includes(s.id), cur = s.id === current;
        return (
          <g key={s.id}>
            {cur && <circle cx={x} cy={y} r="15" fill="var(--glow)" />}
            <circle cx={x} cy={y} r="9" fill={d ? "var(--teal)" : "var(--card)"} stroke={cur ? "var(--teal)" : "var(--border)"} strokeWidth="1.5" />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono" fill={d ? "var(--ink)" : "var(--muted-foreground)"}>{i + 1}</text>
          </g>
        );
      })}
      <text x={C} y={C - 6} textAnchor="middle" fontSize="40" fontFamily="Fraunces" fill="var(--foreground)">{done.length}<tspan fontSize="18" fill="var(--muted-foreground)">/{STEPS.length}</tspan></text>
      <text x={C} y={C + 20} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="var(--muted-foreground)">STEPS COMPLETED</text>
    </svg>
  );
}

function Dashboard() {
  const p = useProgress();
  const session = useSession();
  const ready = useAuthReady();
  const sync = useSyncStatus();
  const o = outcome(p);
  const hints = Object.values(p.hints).reduce((a, b) => a + (b ?? 0), 0);
  const attempts = p.events.filter((e) => e.kind !== "view" && e.kind !== "hint").length;
  const cur = STEPS.find((s) => s.id === p.current)!;
  const fresh = p.events.length === 0;
  const done = completedSteps(p);
  const { allowed } = useMotionPref();
  const label = session ? "Account workspace" : "Browser demo";

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">{label}{session?.user.email ? ` · ${session.user.email}` : ""}</p>
          <h1 className="mt-3 text-5xl font-medium md:text-6xl">{fresh ? "Your first case is ready." : "Welcome back to the case."}</h1>
        </div>
        {!session && ready && <Link to="/auth" className="text-sm text-teal underline-offset-4 hover:underline">Sign in to save progress to an account</Link>}
      </div>
      {sync.kind === "loading" && <p role="status" className="mt-6 rounded-xl border border-border p-3 font-mono text-xs text-muted-foreground">Loading your saved session…</p>}
      {sync.kind === "error" && <p role="alert" className="mt-6 rounded-xl border border-destructive/40 bg-warn-soft p-3 text-sm text-destructive">{sync.message}</p>}
      {!session && <p className="mt-4 text-sm text-muted-foreground">Browser demo: everything below comes from this browser only. Nothing has been sent to an account.</p>}

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Tilt className="paper glow-line rounded-3xl p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Current case · Northstar Supply (fictional)</p>
          <h2 className="mt-3 text-4xl">The Revenue Mirage</h2>
          <p className="mt-2 max-w-md text-muted-foreground">A reported jump from $500 to $1,000 — unverified. The CFO wants an answer before signing.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button asChild variant="teal" size="lg"><Link to="/learn">{fresh ? "Start the case" : `Continue · ${cur.title}`} <ArrowRight /></Link></Button>
            <span className="font-mono text-xs text-muted-foreground">Status: {OUTCOME[o]}</span>
          </div>
          <ol className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((s, i) => {
              const d = done.includes(s.id);
              return (
                <li key={s.id} className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs", s.id === p.current ? "border-teal/50 bg-teal-soft/60" : "border-border")}>
                  <span className={cn("grid size-5 place-items-center rounded-full border font-mono text-[10px]", d && "border-teal bg-teal text-ink")}>{d ? <Check className="size-3" /> : i + 1}</span>
                  <span className="truncate">{s.title}</span>
                </li>
              );
            })}
          </ol>
        </Tilt>
        <div className="paper rounded-3xl p-6"><Orbit done={done} current={p.current} animate={allowed} /></div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[["Answers & attempts recorded", attempts], ["Hints revealed", hints], ["Hints before transfer", earlierHints(p)]].map(([k, v]) => (
          <div key={k} className="paper rounded-2xl p-5"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-2 font-display text-4xl">{v}</p></div>
        ))}
      </div>

      <section className="paper mt-5 rounded-3xl p-6">
        <div className="flex items-center justify-between"><h2 className="text-2xl">Recent evidence</h2><Link to="/evidence" className="text-sm text-teal hover:underline">Full timeline</Link></div>
        {fresh ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing recorded yet. Your first prediction will appear here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {p.events.slice(-4).reverse().map((e, i) => (
              <li key={i} className="flex gap-3 py-3 text-sm">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", e.correct === true ? "bg-ok" : e.correct === false ? "bg-warn" : "bg-muted-foreground")} />
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{e.step}</span>
                <span>{e.detail}{e.assisted && <span className="ml-2 font-mono text-[10px] text-teal">assisted</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {!fresh && (
        <button className="mt-6 text-xs text-muted-foreground hover:text-foreground" onClick={() => { if (confirm(session ? "Reset this case for your account?" : "Reset demo progress in this browser?")) progressStore.reset(); }}>
          Reset case progress
        </button>
      )}
    </Page>
  );
}

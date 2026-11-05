import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase";
import { useSession, useSyncStatus } from "@/services/remote-sync";
import { useLocalPersistence } from "@/services/progress-store";
import { setMotionPaused, useMotionPref } from "@/lib/motion-pref";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/practice", label: "Practice" },
  { to: "/dashboard", label: "Progress" },
] as const;

function SyncBadge() {
  const sync = useSyncStatus();
  const local = useLocalPersistence();
  const s = sync.kind === "local" && local === "memory-only"
    ? { kind: "error" as const, message: "This browser blocked saving. Progress is kept in memory only and will be lost on reload." }
    : sync;
  const text = { local: "Browser demo", loading: "Loading account…", saving: "Saving…", saved: "Saved to account", error: sync.kind === "local" ? "Not saved · memory only" : "Save failed" }[s.kind];
  return (
    <span title={s.message} role={s.kind === "error" ? "alert" : undefined}
      className={cn("hidden rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider sm:inline-flex items-center gap-1.5",
        s.kind === "error" ? "border-destructive/50 bg-warn-soft text-destructive" : "border-border text-muted-foreground")}>
      <span className={cn("size-1.5 rounded-full", s.kind === "error" ? "bg-destructive" : s.kind === "saved" ? "bg-teal" : "bg-muted-foreground")} />
      {text}
    </span>
  );
}

function MotionToggle() {
  const { paused, reduced } = useMotionPref();
  return (
    <Button variant="ghost" size="lg" onClick={() => setMotionPaused(!paused)} disabled={reduced}
      aria-pressed={paused || reduced} aria-label={reduced ? "Motion reduced by system setting" : paused ? "Resume motion" : "Pause motion"}
      title={reduced ? "Reduced motion (system setting)" : paused ? "Resume motion" : "Pause motion"}
      className="grid size-11 place-items-center rounded-full border border-border p-0 text-muted-foreground transition hover:text-foreground disabled:opacity-50">
      {paused || reduced ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
    </Button>
  );
}

export function SiteHeader() {
  const session = useSession();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const ref = useRef<HTMLElement>(null);
  // Publish the real header height (it wraps to two rows on mobile) for sticky content below it.
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set(); const ro = new ResizeObserver(set); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <header ref={ref} className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2.5 sm:gap-x-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight" aria-label="Proof home">Proof<span className="text-teal">.</span></Link>
        <nav aria-label="Main" className="flex gap-0.5 text-sm">
          {NAV.map((n) => {
            const active = path === n.to || path.startsWith(n.to + "/");
            return (
              <Link key={n.to} to={n.to} aria-current={active ? "page" : undefined}
                preload="intent" className={cn("relative flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 transition-colors sm:px-3", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full border border-teal/30 bg-teal-soft/70"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <MotionToggle />
          {session ? (
            <Button variant="ghost" size="lg" onClick={() => void supabase.auth.signOut()} className="px-2 text-sm text-muted-foreground" title={session.user.email ?? ""}>Sign out</Button>
          ) : (
            <Button asChild variant="ghost" size="lg" className="px-2"><Link to="/auth">Sign in</Link></Button>
          )}
        </div>
      </div>
    </header>
  );
}

/** Route content wrapper. The header is persistent in the root layout. */
export function Page({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={cn("mx-auto px-5 py-8 md:py-12", wide ? "max-w-7xl" : "max-w-6xl")}>{children}</div>;
}

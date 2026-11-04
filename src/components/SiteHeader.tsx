import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase";
import { useSession, useSyncStatus } from "@/services/remote-sync";
import { useLocalPersistence } from "@/services/progress-store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/learn", label: "Simulation" },
  { to: "/evidence", label: "Evidence" },
  { to: "/instructor", label: "Instructor" },
  { to: "/present", label: "Pitch" },
] as const;

function SyncBadge() {
  const sync = useSyncStatus();
  const local = useLocalPersistence();
  const s = sync.kind === "local" && local === "memory-only"
    ? { kind: "error" as const, message: "This browser blocked saving. Progress is kept in memory only and will be lost on reload." }
    : sync;
  const text = { local: "Browser-only demo", loading: "Loading account…", saving: "Saving…", saved: "Saved to account", error: sync.kind === "local" ? "Not saved · memory only" : "Save failed" }[s.kind];
  return (
    <span title={s.message} role={s.kind === "error" ? "alert" : undefined}
      className={cn("rounded-full border px-3 py-1 font-mono text-[11px]", s.kind === "error" ? "border-destructive/50 bg-warn-soft text-destructive" : "border-border text-muted-foreground")}>
      {text}
    </span>
  );
}

export function SiteHeader() {
  const session = useSession();
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">Proof<span className="text-teal">.</span></Link>
        <nav className="order-3 -mx-2 flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:mx-0 sm:w-auto">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}>{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SyncBadge />
          {session ? (
            <button onClick={() => void supabase.auth.signOut()} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted" title={session.user.email ?? ""}>Sign out</button>
          ) : (
            <Link to="/auth" className="rounded-md px-2 py-1 text-sm font-medium text-teal hover:bg-muted">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-10">{children}</main>
    </div>
  );
}

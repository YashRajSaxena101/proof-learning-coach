import { Link } from "@tanstack/react-router";
import { backendStatus } from "@/services/backend";

const NAV = [
  { to: "/learn", label: "Simulation" },
  { to: "/evidence", label: "Evidence" },
  { to: "/instructor", label: "Instructor" },
  { to: "/present", label: "Pitch" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-background/90 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">Proof<span className="text-teal">.</span></Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}>{n.label}</Link>
          ))}
        </nav>
        <span className="ml-auto rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted-foreground">{backendStatus().label}</span>
      </div>
    </header>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}

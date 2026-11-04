import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ParticleField } from "@/components/fx/ParticleField";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase";
import { useSession } from "@/services/remote-sync";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Proof" },
      { name: "description", content: "Create a Proof account to save and resume your simulation progress." },
      { property: "og:title", content: "Sign in — Proof" },
      { property: "og:description", content: "Save simulation progress to your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const session = useSession();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
        if (error) throw error;
        if (data.session) void nav({ to: "/dashboard" }); else setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        void nav({ to: "/dashboard" });
      }
    } catch (x) { setErr(x instanceof Error ? x.message : "Something went wrong"); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[1.1fr_1fr] md:items-center md:py-14">
      <figure className="relative overflow-hidden rounded-3xl border border-border">
        <img src="/images/proof-revenue-mirage.webp" width={1600} height={900} alt="Illustration: a glowing rising chart beside tangled duplicate data streams and an amber warning."
          className="aspect-[4/3] w-full object-cover object-left md:aspect-[4/5]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <figcaption className="absolute bottom-0 p-6">
          <p className="kicker">Proof</p>
          <p className="mt-2 max-w-sm font-display text-2xl leading-tight md:text-3xl">Keep your evidence. Resume the case anywhere.</p>
        </figcaption>
      </figure>
      <div className="paper glow-line relative isolate overflow-hidden rounded-3xl p-6 md:p-8">
        <ParticleField variant="ring" density={0.25} className="pointer-events-none absolute -right-24 -top-24 -z-10 size-72 opacity-50" />
        {session ? (
          <>
            <h1 className="text-3xl">You're signed in</h1>
            <p className="mt-2 text-sm text-muted-foreground">{session.user.email} · progress syncs to your account.</p>
            <Button asChild variant="teal" className="mt-6"><Link to="/dashboard">Open your dashboard</Link></Button>
          </>
        ) : sent ? (
          <>
            <h1 className="text-3xl">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <strong>{email}</strong>. You'll be signed in after you open it. Until then, the browser-only demo still works.</p>
            <div className="mt-6 flex gap-2"><Button variant="outline" onClick={() => { setSent(false); setMode("in"); }}>Back to sign in</Button><Button asChild variant="ghost"><Link to="/dashboard">Use browser demo</Link></Button></div>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-3xl">{mode === "in" ? "Sign in" : "Create account"}</h1>
            <p className="text-sm text-muted-foreground">Optional — the demo runs instantly without an account. Signing in saves and resumes progress.</p>
            <label className="block text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/30" /></label>
            <label className="block text-sm">Password<input type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 block w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/30" /></label>
            {err && <p role="alert" className="rounded-md bg-warn-soft px-3 py-2 text-sm text-destructive">{err}</p>}
            <Button type="submit" variant="teal" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
            <button type="button" className="w-full text-sm text-teal underline-offset-4 hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); }}>
              {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
            </button>
            <div className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
              Just looking? <Link to="/learn" className="text-teal hover:underline">Continue as guest</Link> — browser-only demo, no account.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

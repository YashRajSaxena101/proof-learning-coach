import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize, StickyNote, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { SLIDES } from "@/components/present/slides";
import { SlideVisual } from "@/components/present/visuals";

export const Route = createFileRoute("/present")({
  head: () => ({
    meta: [
      { title: "Proof — pitch deck" },
      { name: "description", content: "Eight-slide keyboard-controlled pitch for Proof, with speaker notes and a 90-second demo cue." },
      { property: "og:title", content: "Proof — pitch deck" },
      { property: "og:description", content: "The problem, the learning gap, the experience, and what's built vs. roadmap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Present,
});

function Present() {
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(false);
  const [secs, setSecs] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(SLIDES.length - 1, x + d))), []);
  const startTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setSecs(90);
    timer.current = setInterval(() => setSecs((s) => (s && s > 0 ? s - 1 : 0)), 1000);
  }, []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); go(1); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) go(-1);
      else if (e.key === "n" || e.key === "N") setNotes((n) => !n);
      else if (e.key === "t" || e.key === "T") startTimer();
      else if (e.key === "f" || e.key === "F") document.documentElement.requestFullscreen?.().catch(() => {});
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(SLIDES.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, startTimer]);
  useEffect(() => { document.title = `${i + 1}/${SLIDES.length} — ${SLIDES[i]!.title}`; }, [i]);
  const s = SLIDES[i]!;
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="relative z-10 flex items-center gap-2 border-b border-border/60 px-4 py-2 text-sm backdrop-blur">
        <Link to="/" className="font-display text-lg font-semibold">Proof<span className="text-teal">.</span></Link>
        <span className="ml-3 whitespace-nowrap font-mono text-xs text-muted-foreground">{i + 1} / {SLIDES.length}</span>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant={notes ? "default" : "ghost"} onClick={() => setNotes((n) => !n)} aria-pressed={notes}><StickyNote /><span className="hidden sm:inline">Notes (N)</span></Button>
          <Button size="sm" variant="ghost" onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}><Maximize /><span className="hidden sm:inline">Full (F)</span></Button>
          <Button size="sm" variant="ghost" asChild><Link to="/"><X /> Exit</Link></Button>
        </div>
      </div>
      <p className="relative z-10 border-b border-border/40 px-4 py-1.5 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Presentation preview · does not record learning evidence</p>
      <AnimatePresence mode="wait">
      <motion.section key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 grid flex-1 items-center gap-10 px-6 py-10 md:grid-cols-[1.4fr_1fr] md:px-16 lg:px-20"
        onTouchStart={(e) => ((e.currentTarget as HTMLElement).dataset["x"] = String(e.touches[0]!.clientX))}
        onTouchEnd={(e) => { const x0 = Number((e.currentTarget as HTMLElement).dataset["x"]); const dx = e.changedTouches[0]!.clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
        <div className="min-w-0">
        <p className="kicker text-sm">{s.kicker}</p>
        <h1 className="mt-4 max-w-5xl text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.03em]">{s.title}</h1>
        <div className="mt-10">{s.body}</div>
        {s.demoCue && (
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button variant="teal" size="lg" onClick={startTimer}><Timer /> {secs === null ? "Start 90s demo cue (T)" : "Restart cue"}</Button>
            {secs !== null && <span className={`font-mono text-4xl ${secs <= 15 ? "text-warn" : "text-teal"}`} aria-live="polite">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>}
            <Button variant="outline" size="lg" asChild><Link to="/learn">Open simulation</Link></Button>
          </div>
        )}
        </div>
        <SlideVisual index={i} />
      </motion.section>
      </AnimatePresence>
      {notes && <div className="relative z-10 border-t border-border bg-ink px-8 py-4 text-ink-foreground"><p className="kicker">Speaker notes</p><p className="mt-1 max-w-4xl">{s.notes}</p></div>}
      <div className="relative z-10 flex items-center justify-between border-t border-border/60 px-4 py-2">
        <Button variant="ghost" onClick={() => go(-1)} disabled={i === 0}><ChevronLeft /> Prev</Button>
        <div className="flex gap-1.5">{SLIDES.map((_, k) => <button key={k} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === i ? "w-8 bg-teal" : "w-3 bg-border"}`} />)}</div>
        <Button variant="ghost" onClick={() => go(1)} disabled={i === SLIDES.length - 1}>Next <ChevronRight /></Button>
      </div>
    </div>
  );
}

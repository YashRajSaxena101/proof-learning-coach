import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleField } from "@/components/fx/ParticleField";
import { Springy, Tilt } from "@/components/fx/Tilt";
import { progressStore } from "@/services/progress-store";
import { useMotionPref } from "@/lib/motion-pref";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Proof — learn data reasoning by investigating a number that looks too good" },
      { name: "description", content: "Proof is an interactive AI learning coach. Investigate a fictional revenue report, predict, inspect the data, explain what you find, and transfer the skill." },
      { property: "og:title", content: "Proof — an interactive data-reasoning coach" },
      { property: "og:description", content: "Predict, investigate, explain, transfer. Evidence over completion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const enter = () => progressStore.set((p) => (p.events.length ? p : { ...p, current: "brief" }));

function Home() {
  const { allowed } = useMotionPref();
  // Paused / reduced motion: separate static components, so no scroll listeners or bound values run.
  return (
    <>
      <Hero />
      {allowed ? <NarrativeScene /> : <StaticNarrative />}
      {allowed ? <Artwork /> : <StaticArtwork />}
      <Loop />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <ParticleField className="pointer-events-none absolute inset-0 -z-10 opacity-90 md:left-[38%]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_50%,var(--background)_30%,transparent_70%)]" />
      <div className="mx-auto grid min-h-[calc(100svh-var(--header-h))] max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-[1.25fr_1fr]">
        <div>
          <motion.p className="kicker" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>AI learning coach · data reasoning</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.5 }}
            className="mt-5 text-[clamp(3rem,8vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.035em]">
            The dashboard says +100%.<br /><em className="font-normal text-teal">Prove it.</em>
          </motion.h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
            A CFO is about to double the budget on one number. Step into the case, commit to a prediction, then follow the evidence yourself.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Springy><Button asChild variant="teal" size="lg"><Link to="/learn" onClick={enter}>Try the simulation <ArrowRight /></Link></Button></Springy>
            <Springy><Button asChild variant="outline" size="lg" className="bg-transparent"><Link to="/present"><Play /> 90-second tour</Link></Button></Springy>
          </div>
          <p className="mt-4 font-mono text-[11px] text-muted-foreground">Tour = presenter slides only · it never records learning evidence.</p>
        </div>
        <Tilt className="paper glow-line ml-auto w-full max-w-sm rounded-2xl p-6 backdrop-blur">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">northstar_supply · monthly revenue · fictional</p>
          <div className="mt-6 flex items-end gap-6">
            <div><p className="text-xs text-muted-foreground">Previous month</p><p className="font-display text-4xl">$500</p></div>
            <div><p className="text-xs text-muted-foreground">Reported this month</p><p className="font-display text-6xl">$1,000</p></div>
          </div>
          <svg viewBox="0 0 200 60" className="mt-5 h-16 w-full" aria-hidden>
            <path d="M0 50 L60 46 L110 40 L150 22 L200 6" fill="none" stroke="var(--teal)" strokeWidth="2" />
            <circle cx="200" cy="6" r="3" fill="var(--teal)" />
          </svg>
          <p className="mt-3 flex items-center gap-2 border-t border-border pt-4 font-mono text-xs text-warn"><span className="size-1.5 rounded-full bg-warn" />Unverified report — investigate before deciding</p>
        </Tilt>
      </div>
    </section>
  );
}

/** Sticky scene: progress is the raw scroll position through the section (no hijacking). */
function NarrativeScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const reportOpacity = useTransform(p, [0, 0.3, 0.45], [1, 1, 0.12]);
  const reportScale = useTransform(p, [0, 0.45], [1, 0.82]);
  const reportY = useTransform(p, [0, 0.45], [0, -40]);
  const netOpacity = useTransform(p, [0.2, 0.42], [0, 1]);
  const draw = useTransform(p, [0.25, 0.7], [0, 1]);
  const finalOpacity = useTransform(p, [0.68, 0.85], [0, 1]);
  const finalY = useTransform(p, [0.68, 0.9], [40, 0]);
  const mask = useTransform(p, [0.68, 0.92], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
  const cap1 = useTransform(p, [0, 0.12, 0.25, 0.32], [0, 1, 1, 0]);
  const cap2 = useTransform(p, [0.32, 0.4, 0.6, 0.68], [0, 1, 1, 0]);
  return (
    <section ref={ref} className="relative h-[260vh]" aria-label="Story: from a polished report to the evidence">
      <div className="sticky top-[var(--header-h)] flex h-[calc(100svh-var(--header-h))] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 md:grid-cols-[1fr_1.4fr]">
          <div className="relative h-36 md:h-48">
            <Caption o={cap1} k="01 · The report" t="It looks polished. It looks finished." />
            <Caption o={cap2} k="02 · Underneath" t="Every total is a path through rows you can't see." />
            <motion.div style={{ opacity: finalOpacity, y: finalY }} className="absolute inset-0">
              <p className="kicker">03 · Your move</p>
              <motion.h2 style={{ clipPath: mask }} className="mt-3 text-5xl font-medium leading-[0.95] md:text-7xl">Follow the <em className="text-teal">evidence.</em></motion.h2>
            </motion.div>
          </div>
          <div className="relative aspect-[4/3] w-full">
            <motion.div style={{ opacity: reportOpacity, scale: reportScale, y: reportY }} className="paper glow-line absolute inset-[8%] rounded-2xl p-5">
              <p className="font-mono text-[11px] text-muted-foreground">Revenue · reported</p>
              <svg viewBox="0 0 300 140" className="mt-3 h-[70%] w-full" aria-hidden>
                {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2="300" y1={20 + i * 35} y2={20 + i * 35} stroke="var(--border)" />)}
                <rect x="60" y="85" width="50" height="35" rx="4" fill="var(--muted-foreground)" opacity="0.5" />
                <rect x="180" y="20" width="50" height="100" rx="4" fill="var(--teal)" />
                <text x="85" y="135" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">prev</text>
                <text x="205" y="135" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">this month</text>
              </svg>
              <p className="font-mono text-xs text-warn">+100% · unverified</p>
            </motion.div>
            <motion.svg style={{ opacity: netOpacity }} viewBox="0 0 400 300" className="absolute inset-0 size-full" aria-hidden>
              <Network draw={draw} />
            </motion.svg>
          </div>
        </div>
      </div>
    </section>
  );
}
const STORY = [
  ["01 · The report", "It looks polished. It looks finished."],
  ["02 · Underneath", "Every total is a path through rows you can't see."],
] as const;
function ReportCard() {
  return (
    <div className="paper glow-line rounded-2xl p-5">
      <p className="font-mono text-[11px] text-muted-foreground">Revenue · reported</p>
      <svg viewBox="0 0 300 140" className="mt-3 w-full" aria-hidden>
        {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2="300" y1={20 + i * 35} y2={20 + i * 35} stroke="var(--border)" />)}
        <rect x="60" y="85" width="50" height="35" rx="4" fill="var(--muted-foreground)" opacity="0.5" />
        <rect x="180" y="20" width="50" height="100" rx="4" fill="var(--teal)" />
      </svg>
      <p className="font-mono text-xs text-warn">+100% · unverified</p>
    </div>
  );
}
/** Static, fully readable version of the story: no sticky scroller, no scroll-bound values. */
function StaticNarrative() {
  const one = useMotionValueConst(1);
  return (
    <section className="mx-auto max-w-6xl px-5 py-16" aria-label="Story: from a polished report to the evidence">
      <div className="grid gap-6 md:grid-cols-3">
        <div><p className="kicker">{STORY[0][0]}</p><p className="mt-3 font-display text-3xl leading-tight">{STORY[0][1]}</p><div className="mt-5"><ReportCard /></div></div>
        <div><p className="kicker">{STORY[1][0]}</p><p className="mt-3 font-display text-3xl leading-tight">{STORY[1][1]}</p>
          <svg viewBox="0 0 400 300" className="mt-5 w-full" aria-hidden><Network draw={one} /></svg></div>
        <div><p className="kicker">03 · Your move</p><h2 className="mt-3 text-5xl font-medium leading-[0.95]">Follow the <em className="text-teal">evidence.</em></h2></div>
      </div>
    </section>
  );
}
function useMotionValueConst(v: number) { return useMotionValue(v); }
function StaticArtwork() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <ArtHeading />
      <img src="/images/proof-revenue-mirage.webp" width={1600} height={900} loading="lazy" decoding="async" alt={ART_ALT}
        className="aspect-[16/9] w-full rounded-3xl border border-border object-cover" />
    </section>
  );
}
const ART_ALT = "Illustration: a pleased executive admires a glowing rising chart, while on the other side tangled duplicate data streams converge on an amber warning.";
function ArtHeading() {
  return (
    <div className="mb-8 grid gap-6 md:grid-cols-2 md:items-end">
      <h2 className="text-4xl font-medium leading-[0.95] md:text-6xl">Confidence is not <em className="text-teal">evidence.</em></h2>
      <p className="max-w-md text-muted-foreground md:justify-self-end">On one side, a chart that tells a great story. On the other, the rows that produced it. Proof trains you to look at both before anyone signs a budget.</p>
    </div>
  );
}

function Caption({ o, k, t }: { o: MotionValue<number>; k: string; t: string }) {
  return (
    <motion.div style={{ opacity: o }} className="absolute inset-0">
      <p className="kicker">{k}</p>
      <p className="mt-3 font-display text-4xl leading-tight md:text-5xl">{t}</p>
    </motion.div>
  );
}
function Network({ draw }: { draw: MotionValue<number> }) {
  // Abstract: 4 parent nodes → 8 child nodes → 1 total. No values shown (no spoilers).
  const parents = [70, 130, 190, 250].map((x) => ({ x: x + 10, y: 60 }));
  const kids = Array.from({ length: 8 }, (_, i) => ({ x: 40 + i * 45, y: 170 }));
  const total = { x: 200, y: 260 };
  return (
    <g fill="none" strokeLinecap="round">
      {kids.map((k, i) => {
        const pa = parents[Math.floor(i / 2)]!;
        return <motion.path key={`a${i}`} d={`M${pa.x} ${pa.y} C ${pa.x} 120, ${k.x} 110, ${k.x} ${k.y}`} stroke="var(--teal)" strokeOpacity="0.7" strokeWidth="1.3" style={{ pathLength: draw }} />;
      })}
      {kids.map((k, i) => (
        <motion.path key={`b${i}`} d={`M${k.x} ${k.y} C ${k.x} 220, ${total.x} 210, ${total.x} ${total.y}`} stroke={i % 2 ? "var(--warn)" : "var(--teal)"} strokeOpacity="0.6" strokeWidth="1.1" style={{ pathLength: draw }} />
      ))}
      {parents.map((n, i) => <rect key={`p${i}`} x={n.x - 14} y={n.y - 10} width="28" height="20" rx="5" fill="var(--card)" stroke="var(--teal)" />)}
      {kids.map((n, i) => <circle key={`k${i}`} cx={n.x} cy={n.y} r="6" fill="var(--card)" stroke="var(--foreground)" strokeOpacity="0.5" />)}
      <circle cx={total.x} cy={total.y} r="12" fill="var(--warn-soft)" stroke="var(--warn)" />
      <text x={total.x} y={total.y + 4} textAnchor="middle" fontSize="11" fill="var(--warn)">?</text>
    </g>
  );
}

function Artwork() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(p, [0, 0.5], [1.18, 1]);
  const clip = useTransform(p, [0, 0.45], ["inset(10% 8% 10% 8% round 32px)", "inset(0% 0% 0% 0% round 24px)"]);
  const y = useTransform(p, [0, 1], [40, -40]);
  return (
    <section ref={ref} className="mx-auto max-w-7xl px-5 py-20 md:py-28">
      <ArtHeading />
      <motion.div style={{ clipPath: clip }} className="overflow-hidden rounded-3xl border border-border">
        <motion.img style={{ scale, y }} src="/images/proof-revenue-mirage.webp" width={1600} height={900} loading="lazy" decoding="async"
          alt={ART_ALT}
          className="aspect-[16/9] w-full object-cover" />
      </motion.div>
    </section>
  );
}

const STAGES = [
  ["01", "Predict", "Commit to an answer and a confidence level before you see a single row. Your confidence shapes what comes next."],
  ["02", "Investigate", "Open the tables, play the join row by row, and trace where the reported total actually comes from."],
  ["03", "Explain & transfer", "Repair the query, teach it back to a colleague, then solve a fresh case. Help you used is recorded honestly."],
] as const;
function Loop() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="kicker">The learning loop</p>
      <h2 className="mt-3 max-w-2xl text-4xl font-medium md:text-5xl">Three moves. Every one leaves evidence.</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STAGES.map(([n, t, d], i) => (
          <motion.div key={n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.08, type: "spring", stiffness: 160, damping: 22 }}>
            <Tilt className="paper h-full rounded-2xl p-6">
              <p className="font-mono text-xs text-teal">{n}</p>
              <h3 className="mt-6 text-3xl">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </Tilt>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative isolate mx-auto max-w-6xl overflow-hidden px-5 pb-24 pt-10">
      <div className="paper glow-line relative overflow-hidden rounded-3xl px-6 py-16 text-center md:py-20">
        <ParticleField variant="ring" density={0.45} className="pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <h2 className="mx-auto max-w-3xl text-4xl font-medium md:text-6xl">The CFO is waiting. <em className="text-teal">Is the number real?</em></h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">About ten minutes. No account needed — progress stays in this browser unless you sign in.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Springy><Button asChild variant="teal" size="lg"><Link to="/learn" onClick={enter}>Try the simulation <ArrowRight /></Link></Button></Springy>
          <Springy><Button asChild variant="outline" size="lg" className="bg-transparent"><Link to="/dashboard">Open dashboard</Link></Button></Springy>
        </div>
      </div>
      <p className="mt-10 text-center font-mono text-[11px] text-muted-foreground">Northstar Supply and all data are fictional teaching material.</p>
    </section>
  );
}

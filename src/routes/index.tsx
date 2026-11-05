import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Compass, MessageCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleField } from "@/components/fx/ParticleField";
import { WorkScene } from "@/components/career/WorkScene";
import { TOPICS } from "@/domain/career/contracts";
import { exampleScenario } from "@/domain/career/examples";
import { useMotionPref } from "@/lib/motion-pref";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Proof — practice the work behind the interview" },
      {
        name: "description",
        content:
          "A career learning coach for graduates. Rehearse workplace decisions, understand the tradeoffs, and explain your reasoning.",
      },
      { property: "og:title", content: "Proof — practice the work behind the interview" },
      {
        property: "og:description",
        content:
          "Start with your interests. Practice a real kind of decision. Find the words to explain it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
function Home() {
  const [topic, setTopic] = useState<string>("AI engineer");
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <ParticleField
          className="pointer-events-none absolute inset-0 -z-10 opacity-80"
          density={1.3}
        />
        <div className="hero-legibility mx-auto flex min-h-[650px] max-w-5xl flex-col items-center px-5 pb-16 pt-16 text-center md:pt-24">
          <p className="kicker">For the work you’re growing into</p>
          <h1 className="mt-6 max-w-4xl text-5xl leading-[1.08] md:text-7xl">
            Proof<span className="text-teal">.</span>
            <br />
            Practice the work
            <br />
            behind the <em className="font-normal text-teal">interview.</em>
          </h1>
          <p className="hero-reading mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Turn “I’ve learned about it” into “Here’s how I’d approach it.” Rehearse a workplace
            decision, talk it through, and try a new constraint.
          </p>
          <div className="hero-reading mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="teal">
              <Link to="/practice" search={{ new: true }}>
                Build my practice <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/practice" search={{ example: true }}>
                Try an example
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
            {TOPICS.map((t) => (
              <Button
                size="lg"
                variant={topic === t ? "secondary" : "ghost"}
                aria-pressed={topic === t}
                key={t}
                onClick={() => setTopic(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      </section>
      <Preview topic={topic} />
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <p className="kicker">A little closer to the actual work</p>
        <h2 className="mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">
          Make a choice.
          <br />
          Make your reasoning visible.
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            [
              Compass,
              "Start where you are",
              "Your role, interests and a short starting question shape the rehearsal. Self-report is not a skill score.",
            ],
            [
              MessageCircle,
              "Talk through the unfamiliar",
              "Ask a guiding question, try a simpler explanation, and revise your reasoning. Help is recorded separately.",
            ],
            [
              Layers,
              "Carry it into a new situation",
              "Explain your decision as you would in an interview. Then change a constraint and try again.",
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof Compass;
            return (
              <div className="border-t border-border pt-6" key={String(title)}>
                <I className="size-6 text-teal" />
                <h3 className="mt-5 text-2xl">{String(title)}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{String(copy)}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="border-t border-border px-5 py-16 text-center">
        <h2 className="text-4xl md:text-5xl">Your next step can be a rehearsal.</h2>
        <Button asChild size="lg" variant="teal" className="mt-7">
          <Link to="/practice" search={{ new: true }}>
            Build my practice <ArrowRight />
          </Link>
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          Start without an account. AI practice uses Ollama. Your career progress stays on this device.
        </p>
      </section>
    </>
  );
}
function Preview({ topic }: { topic: string }) {
  const { allowed } = useMotionPref();
  return allowed ? <MovingPreview key={topic} topic={topic} /> : <PreviewContent key={topic} topic={topic} />;
}
function MovingPreview({ topic }: { topic: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [25, 0, -15]);
  return (
    <div ref={ref}>
      <motion.div style={{ y }}>
        <PreviewContent topic={topic} />
      </motion.div>
    </div>
  );
}
function PreviewContent({ topic }: { topic: string }) {
  const scenario = exampleScenario(topic);
  const [choice, setChoice] = useState<number | null>(null);
  const selected = choice === null ? null : scenario.decisions[0]?.choices[choice];
  return (
    <section className="mx-auto max-w-6xl border-y border-border px-5 py-12 md:py-16">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="kicker">Workplace rehearsal · example preview</p>
          <h2 className="mt-4 text-3xl leading-tight md:text-4xl">{scenario.title}</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{scenario.request}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            A fictional team. A concrete constraint. A decision to explain.
          </p>
        </div>
        <WorkScene key={topic} scene={scenario.scene} choice={selected ?? undefined} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {scenario.decisions[0]?.choices.map((c, i) => (
          <Button
            size="lg"
            className="h-auto min-h-11 whitespace-normal py-3"
            variant={choice === i ? "secondary" : "outline"}
            key={c.id}
            onClick={() => setChoice(i)}
          >
            {c.label}
          </Button>
        ))}
      </div>
      {selected && (
        <p className="mt-5 border-l-2 border-teal pl-4 leading-relaxed text-muted-foreground">
          {selected.consequence}{" "}
          <span className="text-xs">Illustrative preview, not an assessment.</span>
        </p>
      )}
      <p className="mt-5 text-sm text-muted-foreground">
        Your real practice keeps consequences hidden until you make a choice.
      </p>
    </section>
  );
}

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowRight, Compass, MessageCircle, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOPICS, REFERENCES, type Profile } from "@/domain/career/contracts";
import { exampleScenario } from "@/domain/career/examples";
import { careerStore } from "@/services/career/store";
import { WorkScene } from "./WorkScene";

export function CareerLaunchpad() {
  const [topic, setTopic] = useState<string>(careerStore.get().profile?.topic ?? "AI engineer");
  const preview = exampleScenario(topic);
  const reference = REFERENCES[topic];
  const chooseDirection = () =>
    careerStore.set((state) => ({
      ...state,
      profile: {
        experience: "new",
        interest: "",
        goal: "interview",
        minutes: 15,
        diagnostic: "",
        ...state.profile,
        topic,
      } satisfies Profile,
    }));
  return (
    <section className="mt-10" aria-label="Explore your next practice">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="kicker">01 / Find your direction</p>
          <h2 className="mt-3 text-3xl">What work are you curious about?</h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Explore a sample below. Your own scenario starts with your interests and experience.
        </p>
      </div>
      <div className="my-5 flex flex-wrap gap-2" role="group" aria-label="Career directions">
        {TOPICS.map((t) => (
          <Button
            key={t}
            type="button"
            size="lg"
            variant={t === topic ? "secondary" : "ghost"}
            aria-pressed={t === topic}
            onClick={() => setTopic(t)}
            className="px-4"
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_0%,var(--teal-soft),transparent_65%)]"
          aria-hidden
        />
        <div className="relative grid items-center gap-2 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="kicker">Explore the work / {topic}</p>
            <h3 className="mt-5 max-w-lg text-3xl leading-tight sm:text-4xl">{preview.title}</h3>
            <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">{preview.request}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="teal" size="lg" className="whitespace-normal text-center">
                <Link to="/practice" search={{ new: true }} onClick={chooseDirection}>
                  Personalize this direction <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/practice" search={{ example: true }} onClick={chooseDirection}>
                  Try the example <ArrowUpRight aria-hidden />
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              This preview is a fixed example. You can also enter any topic during setup.
            </p>
          </div>
          <div className="min-w-0 px-3 pb-5 sm:px-6 lg:py-6">
            <WorkScene key={topic} scene={preview.scene} compact />
          </div>
        </div>
      </div>
      <div className="mt-9 grid gap-7 border-b border-border pb-9 sm:grid-cols-3">
        {[
          {
            icon: Compass,
            number: "01",
            title: "A task that fits",
            copy: "Tell the coach what you want to learn and what you already know.",
          },
          {
            icon: MessageCircle,
            number: "02",
            title: "Room to work it out",
            copy: "Make a decision. Ask for a hint when you need one, then explain your reasoning.",
          },
          {
            icon: Repeat2,
            number: "03",
            title: "A skill you can explain",
            copy: "Rehearse an interview answer and test your approach with a new constraint.",
          },
        ].map(({ icon: Icon, number, title, copy }) => (
          <div key={number} className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-teal">
              <Icon className="size-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
            </div>
          </div>
        ))}
      </div>
      {reference && (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Keep learning from the source.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore the official documentation, then bring a question into your next practice.
            </p>
          </div>
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-teal transition-colors hover:bg-accent"
          >
            {reference.label}
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>
      )}
    </section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Check, Clock } from "lucide-react";
import { useCareer, careerStore } from "@/services/career/store";
import { useEffect } from "react";
import { nextSuggestion } from "@/domain/career/contracts";
import { latestFeedback, visibleDecisionForScene } from "@/domain/career/scene";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/SiteHeader";
import { WorkScene } from "@/components/career/WorkScene";
import { SaveNotice } from "@/components/career/SaveNotice";
import { ParticleField } from "@/components/fx/ParticleField";
export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your practice progress — Proof" },
      {
        name: "description",
        content:
          "Resume your career practice, revisit your explanations and choose the next rehearsal.",
      },
      { property: "og:title", content: "Your practice progress — Proof" },
      {
        property: "og:description",
        content: "Your choices, reflections, help used and next practice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareerDashboard,
});
export function CareerDashboard() {
  const state = useCareer();
  useEffect(() => careerStore.init(), []);
  const active = state.sessions.find((s) => s.id === state.activeId);
  const feedback = latestFeedback(state.sessions);
  return (
    <Page>
      <div className="relative isolate">
        <ParticleField
          density={0.2}
          className="pointer-events-none absolute inset-0 -z-10 opacity-10"
        />
        <p className="kicker">Your progress · career practice</p>
        <h1 className="mt-4 text-4xl md:text-6xl">
          {active ? "Keep building your reasoning." : "A starting point, not a finish line."}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          {active
            ? `Your current direction: ${active.profile.topic}. Revisit what you tried, and choose one useful next step.`
            : "Pick a role or a topic you’re curious about. Your first rehearsal can start with “I’m not sure.”"}
        </p>
        <SaveNotice />
      </div>
      {active ? (
        <section className="mt-10 grid items-center gap-6 border-y border-border py-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="kicker">
              {active.source === "example"
                ? "Example scenario · not AI generated"
                : "AI-generated practice"}
            </p>
            <h2 className="mt-3 text-3xl">{active.scenario.title}</h2>
            <p className="mt-3 text-muted-foreground">
              {active.stage === "complete"
                ? "Practice recorded. Revisit the reasoning or try a new constraint."
                : `Next: ${active.stage === "decisions" ? "rehearse a decision" : active.stage === "interview" ? "explain your reasoning" : "try the transfer question"}.`}
            </p>
            <Button asChild size="lg" variant="teal" className="mt-6">
              <Link to="/practice">
                {active.stage === "complete" ? "Revisit practice" : "Resume practice"}{" "}
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <WorkScene scene={active.scenario.scene} choice={visibleDecisionForScene(active)} compact />
        </section>
      ) : (
        <section className="mt-10 border-y border-border py-10">
          <h2 className="text-3xl">What would you like to practice?</h2>
          <div className="mt-6 flex flex-wrap gap-3">
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
        </section>
      )}
      {state.sessions.length > 0 && (
        <>
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-3xl">Practice trajectory</h2>
              <Button asChild size="lg" variant="outline">
                <Link to="/practice" search={{ new: true }}>
                  <Plus /> Start new
                </Link>
              </Button>
            </div>
            <ol className="mt-6 border-l border-border pl-6">
              {state.sessions.map((s) => (
                <li className="relative border-b border-border py-5" key={s.id}>
                  <span className="absolute -left-9 top-7 grid size-6 place-items-center rounded-full bg-card text-teal">
                    {s.stage === "complete" ? (
                      <Check className="size-4" />
                    ) : (
                      <Clock className="size-4" />
                    )}
                  </span>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()} · {s.profile.topic} ·{" "}
                        {s.source === "example" ? "Example" : "AI generated"}
                      </p>
                      <h3 className="mt-2 text-xl">{s.scenario.title}</h3>
                      <p className="mt-2 text-muted-foreground">
                        {s.answers.length} attempts · {s.helpUsed} help requests ·{" "}
                        {s.stage === "complete" ? "practice recorded" : "in progress"}
                      </p>
                    </div>
                    <Button asChild size="lg" variant="ghost">
                      <Link
                        to="/practice"
                        onClick={() => careerStore.set((v) => ({ ...v, activeId: s.id }))}
                      >
                        Open <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                  {s.answers.slice(-2).map((a, i) => (
                    <details className="mt-4" key={i}>
                      <summary className="cursor-pointer py-2 text-sm text-teal">
                        {a.stage} reflection ·{" "}
                        {a.feedback ? "AI feedback available" : "not AI evaluated"} ·{" "}
                        {a.helpUsed ? "with help" : "no coach help requested"}
                      </summary>
                      <p className="mt-2 break-words leading-relaxed">{a.text}</p>
                      {a.feedback && (
                        <p className="mt-3 text-muted-foreground">{a.feedback.message}</p>
                      )}
                    </details>
                  ))}
                </li>
              ))}
            </ol>
          </section>
          <section className="mt-10 border-t border-border pt-7">
            <p className="kicker">One next step</p>
            <h2 className="mt-3 text-2xl">{nextSuggestion(feedback?.feedback.gaps ?? [])}</h2>
            <p className="mt-3 text-muted-foreground">
              {feedback
                ? "Based on your latest recorded Ollama feedback, kept on this device; not a verified skill assessment."
                : "No AI-evaluated gaps yet. This is an exploration suggestion, not a skill assessment."}
            </p>
            <Button asChild size="lg" variant="teal" className="mt-5">
              <Link to="/practice" search={{ new: true }}>
                Build the next rehearsal <ArrowRight />
              </Link>
            </Button>
          </section>
        </>
      )}
      <section className="mt-12 border-t border-border pt-6">
        <h2 className="text-xl">Original sample data case</h2>
        <p className="mt-2 text-muted-foreground">
          The Revenue Mirage and its recorded evidence are still available.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button asChild variant="ghost" size="lg">
            <Link to="/learn">
              Open sample case <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/evidence">Sample case evidence</Link>
          </Button>
        </div>
      </section>
    </Page>
  );
}

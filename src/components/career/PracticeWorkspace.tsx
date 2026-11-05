import { useRef, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Send, RefreshCw, BookOpen } from "lucide-react";
import {
  type CareerSession,
  visibleDecision,
  REFERENCES,
  nextSuggestion,
  requestSchema,
} from "@/domain/career/contracts";
import { careerStore, latestRequest } from "@/services/career/store";
import { requestCareerCoach } from "@/services/career/coach";
import { WorkScene } from "./WorkScene";
import { Button } from "@/components/ui/button";
import { SaveNotice } from "./SaveNotice";

export function PracticeWorkspace({ session: s }: { session: CareerSession }) {
  const [answer, setAnswer] = useState("");
  const [chat, setChat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [offlineNote, setOfflineNote] = useState("");
  const control = useRef<AbortController | undefined>(undefined);
  const gate = useRef(latestRequest());
  useEffect(
    () => () => {
      gate.current.cancel();
      control.current?.abort();
    },
    [],
  );
  const decision = s.scenario.decisions.find((d) => !s.choices[d.id]);
  const committed = s.scenario.decisions.flatMap((d) => {
    const c = visibleDecision(d, s.choices[d.id]);
    return c ? [c] : [];
  });
  const lastFeedback = s.answers.at(-1)?.feedback;
  const reference = REFERENCES[s.profile.topic];
  const stage = s.stage === "complete" ? "transfer" : s.stage;
  const update = (fn: (v: CareerSession) => CareerSession) => careerStore.updateSession(s.id, fn);
  async function call(
    action: "tutor" | "feedback",
    text: string,
    intent: "hint" | "simpler" | "example" | "answer",
  ) {
    if (!text.trim() || busy) return;
    if (!requestSchema.safeParse({ action, sessionId: s.id, text, intent, stage, choices: s.choices }).success) {
      setError('Use a plain-text question or answer, up to 2,000 characters.');
      return;
    }
    setError("");
    setOfflineNote("");
    if (action === "feedback")
      update((v) => ({
        ...v,
        answers: [...v.answers, { stage, text: text.slice(0, 2000), helpUsed: v.helpUsed }].slice(
          -40,
        ),
      }));
    else
      update((v) => ({
        ...v,
        helpUsed: Math.min(100, v.helpUsed + 1),
        messages: [...v.messages, { role: "user" as const, text: text.slice(0, 2000) }].slice(-40),
      }));
    if (s.source === "example") {
      const reflection = intent === 'simpler'
        ? 'Example reflection · not AI: Say what the team needs, what you must protect, and how you would check that your choice helps.'
        : intent === 'example'
          ? 'Example reflection · not AI: Imagine the deadline changes to tomorrow. Which assumption would you check first, and which boundary would stay the same?'
          : 'Example reflection · not AI: Which constraint matters most to your choice, and what evidence would change your mind?';
      if (action === 'tutor') update(v => ({ ...v, messages: [...v.messages, { role: 'coach' as const, text: reflection }].slice(-40) }));
      setOfflineNote(action === 'feedback' ? 'Your answer is recorded, but has not been evaluated by AI. Compare it with the reflection questions below.' : reflection);
      return;
    }
    setBusy(true);
    const id = gate.current.begin();
    control.current = new AbortController();
    try {
      const r = await requestCareerCoach(
        { action, sessionId: s.id, text, intent, stage, choices: s.choices },
        control.current.signal,
      );
      if (!gate.current.current(id)) return;
      if ("message" in r) {
        if (action === "feedback")
          update((v) => ({
            ...v,
            answers: v.answers.map((a, i) =>
              i === v.answers.length - 1 ? { ...a, feedback: r } : a,
            ),
          }));
        else
          update((v) => ({
            ...v,
            messages: [...v.messages, { role: "coach" as const, text: r.message }].slice(-40),
          }));
      }
    } catch (e) {
      if (gate.current.current(id))
        setError(
          e instanceof Error ? e.message : "Your coach could not respond. Your work is kept.",
        );
    } finally {
      if (gate.current.current(id)) setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="kicker">
          {s.profile.topic} · {s.profile.minutes} minutes ·{" "}
          {s.source === "example" ? "Example scenario · not AI generated" : "AI-generated practice"}
        </p>
        <Button asChild variant="ghost" size="lg">
          <Link to="/practice" search={{ new: true }}>
            New practice
          </Link>
        </Button>
      </div>
      <h1 className="mt-4 max-w-4xl text-4xl leading-tight md:text-5xl">{s.scenario.title}</h1>
      <SaveNotice />
      <ol className="mt-7 flex flex-wrap gap-3 border-b border-border pb-5 text-sm">
        {["decisions", "interview", "transfer"].map((v, i) => (
          <li key={v} className={s.stage === v ? "text-teal" : "text-muted-foreground"}>
            {i + 1}.{" "}
            {v === "decisions"
              ? "Rehearse a decision"
              : v === "interview"
                ? "Explain in an interview"
                : "Try a new constraint"}
          </li>
        ))}
      </ol>
      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section className="min-w-0">
          <p className="text-sm text-teal">{s.scenario.manager}</p>
          <p className="mt-3 text-lg leading-relaxed">{s.scenario.request}</p>
          <p className="mt-3 leading-relaxed text-muted-foreground">{s.scenario.context}</p>
          <div className="mt-6 border-l-2 border-teal pl-4">
            <p className="text-sm font-semibold">Your objective</p>
            <p className="mt-1 text-muted-foreground">{s.scenario.objective}</p>
          </div>
          <WorkScene scene={s.scenario.scene} metrics={committed.at(-1)?.metrics} />
          {committed.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tradeoff values are illustrative scenario assumptions, not measured results.
            </p>
          )}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-xl">Constraints</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
                {s.scenario.constraints.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl">Evidence desk</h2>
              {s.scenario.artifacts.map((v) => (
                <details className="mt-3 border-b border-border pb-3" key={v.label}>
                  <summary className="cursor-pointer py-2 font-medium">{v.label}</summary>
                  <p className="mt-2 text-muted-foreground">{v.detail}</p>
                </details>
              ))}
            </div>
          </div>
          {s.stage === "decisions" && (
            <div className="mt-9 border-t border-border pt-7">
              {decision ? (
                <>
                  <p className="kicker">
                    Decision {committed.length + 1} of {s.scenario.decisions.length}
                  </p>
                  <h2 className="mt-3 text-2xl">{decision.question}</h2>
                  <div className="mt-5 grid gap-3">
                    {decision.choices.map((c) => (
                      <Button
                        key={c.id}
                        size="lg"
                        variant="outline"
                        className="h-auto min-h-14 justify-between whitespace-normal rounded-lg py-4 text-left text-base"
                        onClick={() =>
                          update((v) => ({ ...v, choices: { ...v.choices, [decision.id]: c.id } }))
                        }
                      >
                        {c.label}
                        <ArrowRight className="shrink-0" />
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl">Explain the work behind your choice.</h2>
                  <p className="mt-2 text-muted-foreground">
                    Connect your decision to a constraint and an evidence check.
                  </p>
                </>
              )}
              {committed.map((c, i) => (
                <div className="mt-5 border-l border-teal pl-4" key={`${i}-${c.id}`}>
                  <p className="font-medium">You chose: {c.label}</p>
                  <p className="mt-2 text-muted-foreground">{c.consequence}</p>
                </div>
              ))}
            </div>
          )}
          {s.stage !== "complete" && (!decision || s.stage !== "decisions") && (
            <div className="mt-8">
              <h2 className="text-2xl">
                {s.stage === "interview"
                  ? "Interview rehearsal"
                  : s.stage === "transfer"
                    ? "A fresh constraint"
                    : "Your reasoning"}
              </h2>
              {s.stage !== "decisions" && (
                <p className="mt-3 leading-relaxed">
                  {s.stage === "interview" ? s.scenario.interview : s.scenario.transfer}
                </p>
              )}
              <label className="mt-4 block">
                <span className="sr-only">Your answer</span>
                <textarea
                  aria-label="Your answer"
                  maxLength={2000}
                  rows={5}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="career-input"
                  placeholder="Explain your decision in your own words…"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  variant="teal"
                  disabled={!answer.trim() || busy || s.answers.length >= 40}
                  onClick={() => void call("feedback", answer, "answer")}
                >
                  <Send /> {s.source === "example" ? "Record my reflection" : "Get coach feedback"}
                </Button>
                {s.answers.some((a) => a.stage === stage) && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      update((v) => ({
                        ...v,
                        stage:
                          v.stage === "decisions"
                            ? "interview"
                            : v.stage === "interview"
                              ? "transfer"
                              : "complete",
                      }));
                      setAnswer("");
                      setOfflineNote("");
                      setError("");
                    }}
                  >
                    Continue <ArrowRight />
                  </Button>
                )}
              </div>
            </div>
          )}
          {lastFeedback && (
            <div className="mt-7 border-t border-border pt-5">
              <p className="kicker">
                AI feedback · {lastFeedback.provider} · {lastFeedback.model}
              </p>
              <p className="mt-3">{lastFeedback.message}</p>
              <h3 className="mt-4 text-lg">Strengths</h3>
              <ul className="list-disc pl-5 text-muted-foreground">
                {lastFeedback.strengths.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <h3 className="mt-4 text-lg">Next revision</h3>
              <ul className="list-disc pl-5 text-muted-foreground">
                {lastFeedback.retrySuggestions.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <p className="mt-4 text-teal">{lastFeedback.nextQuestion}</p>
              <Button
                size="lg"
                variant="ghost"
                className="mt-3"
                onClick={() => setAnswer(s.answers.at(-1)?.text ?? "")}
              >
                <RefreshCw /> Revise my answer
              </Button>
            </div>
          )}
          {offlineNote && (
            <p role="status" className="mt-5 border-l-2 border-warn pl-4 text-warn">
              {offlineNote}
            </p>
          )}
          {s.source === "example" && (
            <details className="mt-6">
              <summary className="cursor-pointer py-3 text-teal">
                Reflection checklist · not an AI assessment
              </summary>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                {s.scenario.rubric.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </details>
          )}
          {s.stage === "complete" && (
            <div className="mt-8">
              <h2 className="text-3xl">Practice recorded.</h2>
              <p className="mt-3 text-muted-foreground">
                {s.answers.length} attempts · {s.helpUsed} coach requests.{" "}
                {s.source === "example"
                  ? "These reflections are not AI-evaluated."
                  : "Feedback is evidence from this exercise, not a job-readiness score."}
              </p>
              <p className="mt-3">{nextSuggestion(lastFeedback?.gaps ?? [])}</p>
              <Button asChild variant="teal" size="lg" className="mt-5">
                <Link to="/dashboard">
                  See my progress <ArrowRight />
                </Link>
              </Button>
            </div>
          )}
          {reference && (
            <p className="mt-9 border-t border-border pt-5 text-sm text-muted-foreground">
              <BookOpen className="mr-2 inline size-4" />
              Reference material, not news:{" "}
              <a
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="text-teal underline"
              >
                {reference.label}
              </a>
            </p>
          )}
        </section>
        <aside className="min-w-0 rounded-lg border border-border bg-card/60 p-5 lg:sticky lg:top-[calc(var(--header-h)+20px)]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-teal-soft text-teal">
              <MessageCircle />
            </span>
            <div>
              <h2 className="text-2xl">Your coach</h2>
              <p className="text-xs text-muted-foreground">
                {s.source === "example"
                  ? "Example reflections · not live AI"
                  : "Guiding questions, in context"}
              </p>
            </div>
          </div>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            You don’t need a polished answer. Start with what you know; we can work through the
            unfamiliar parts.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(
              [
                ["hint", "A guiding question"],
                ["simpler", "Explain more simply"],
                ["example", "Another example"],
              ] as const
            ).map(([intent, label]) => (
              <Button
                size="lg"
                key={intent}
                variant="outline"
                disabled={busy || s.helpUsed >= 100}
                onClick={() =>
                  void call(
                    "tutor",
                    label,
                    intent === "simpler" ? "simpler" : intent === "example" ? "example" : "hint",
                  )
                }
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="mt-6 max-h-80 space-y-4 overflow-y-auto" aria-live="polite">
            {s.messages.map((m, i) => (
              <div
                key={i}
                className={`border-l-2 pl-3 ${m.role === "coach" ? "border-teal" : "border-border"}`}
              >
                <p className="text-xs text-muted-foreground">
                  {m.role === "coach" ? "Coach" : "You"}
                </p>
                <p className="mt-1 break-words leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              void call("tutor", chat, "hint");
            }}
          >
            <label htmlFor="coach-question" className="text-sm">
              Ask your coach
            </label>
            <textarea
              id="coach-question"
              className="career-input mt-2"
              rows={3}
              maxLength={2000}
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="What does retrieval mean here?"
            />
            <Button
              size="lg"
              variant="teal"
              className="mt-3"
              disabled={busy || !chat.trim() || s.helpUsed >= 100}
            >
              <Send /> Send
            </Button>
          </form>
          {busy && (
            <div role="status" className="mt-4 text-muted-foreground">
              Your coach is thinking…{" "}
              <Button
                type="button"
                size="lg"
                variant="ghost"
                onClick={() => {
                  gate.current.cancel();
                  control.current?.abort();
                  setBusy(false);
                  setError("Request stopped. Your work is kept.");
                }}
              >
                Stop
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 text-warn">
              {error}
            </p>
          )}
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            {s.helpUsed} help requests · recorded separately from attempts.
          </p>
        </aside>
      </div>
    </div>
  );
}

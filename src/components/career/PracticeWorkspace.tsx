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
import { careerStore } from "@/services/career/store";
import { requestCareerCoach } from "@/services/career/coach";
import { WorkScene } from "./WorkScene";
import { ParticleField } from "@/components/fx/ParticleField";
import { visibleDecisionsForScene } from "@/domain/career/scene";
import { formatTutorReply } from "@/domain/career/tutor";
import { Button } from "@/components/ui/button";
import { SaveNotice } from "./SaveNotice";
import {
  answerStage,
  attemptForStage,
  canAdvance,
  feedbackRequestGate,
  reviseChoice,
  attemptMatchesChoices,
} from "@/domain/career/attempts";

export function PracticeWorkspace({ session: s }: { session: CareerSession }) {
  const stage = answerStage(s);
  const currentAttempt = attemptForStage(s);
  const answer = s.drafts?.[stage] ?? currentAttempt?.text ?? "";
  const [chat, setChat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [offlineNote, setOfflineNote] = useState("");
  const [editingDecision, setEditingDecision] = useState<string | undefined>();
  const heading = useRef<HTMLHeadingElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const control = useRef<AbortController | undefined>(undefined);
  const gate = useRef(feedbackRequestGate());
  const current = useRef(s);
  current.current = s;
  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [s.messages.length]);
  const pendingAttempt = useRef<string | undefined>(undefined);
  const update = (fn: (v: CareerSession) => CareerSession) => careerStore.updateSession(s.id, fn);
  function cancel() {
    gate.current.cancel();
    control.current?.abort();
    const id = pendingAttempt.current;
    pendingAttempt.current = undefined;
    if (id)
      careerStore.updateSession(s.id, (v) => ({
        ...v,
        answers: v.answers.map((a) =>
          a.id === id && a.status === "pending" ? { ...a, status: "failed" as const } : a,
        ),
      }));
    setBusy(false);
  }
  useEffect(() => {
    const requestGate = gate.current;
    setBusy(false);
    setError("");
    setOfflineNote("");
    setChat("");
    return () => {
      requestGate.cancel();
      control.current?.abort();
    };
  }, [s.id, s.stage]);
  useEffect(() => {
    // An interrupted request can never remain a pending success after re-entry.
    careerStore.updateSession(s.id, (v) => ({
      ...v,
      answers: v.answers.map((a) =>
        a.status === "pending" ? { ...a, status: "failed" as const } : a,
      ),
    }));
    return () => {
      const id = pendingAttempt.current;
      if (id)
        careerStore.updateSession(s.id, (v) => ({
          ...v,
          answers: v.answers.map((a) =>
            a.id === id && a.status === "pending" ? { ...a, status: "failed" as const } : a,
          ),
        }));
    };
  }, [s.id]);
  const setAnswer = (text: string) => {
    cancel();
    setError("");
    setOfflineNote("");
    update((v) => ({ ...v, drafts: { ...v.drafts, [stage]: text } }));
  };
  const decision =
    s.scenario.decisions.find((d) => d.id === editingDecision) ??
    s.scenario.decisions.find((d) => !s.choices[d.id]);
  useEffect(() => {
    heading.current?.focus();
  }, [s.id, s.stage, decision?.id]);
  const committed = s.scenario.decisions.flatMap((d) => {
    const c = visibleDecision(d, s.choices[d.id]);
    return c ? [c] : [];
  });
  const lastFeedback =
    currentAttempt?.text === answer && attemptMatchesChoices(s, currentAttempt)
      ? currentAttempt.feedback
      : undefined;
  const reference = REFERENCES[s.profile.topic];
  const advance = () => {
    cancel();
    setError("");
    setOfflineNote("");
    setEditingDecision(undefined);
    update((v) => ({
      ...v,
      stage:
        v.stage === "decisions" ? "interview" : v.stage === "interview" ? "transfer" : "complete",
    }));
  };
  const skipFeedback = () => {
    if (busy || !answer.trim()) return;
    cancel();
    setError("");
    setOfflineNote("");
    setEditingDecision(undefined);
    update((v) => ({
      ...v,
      answers: [
        ...v.answers,
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          stage,
          text: answer,
          helpUsed: v.helpUsed,
          choices: { ...v.choices },
          status: "recorded" as const,
        },
      ].slice(-40),
      stage:
        v.stage === "decisions" ? "interview" : v.stage === "interview" ? "transfer" : "complete",
    }));
  };
  async function call(
    action: "tutor" | "feedback",
    text: string,
    intent: "hint" | "simpler" | "example" | "answer",
  ) {
    if (!text.trim() || busy) return;
    const request = {
      action,
      sessionId: s.id,
      ...(s.capability ? { capability: s.capability } : {}),
      text,
      intent,
      stage,
      choices: s.choices,
    };
    if (!requestSchema.safeParse(request).success) {
      setError("Use a question or answer up to 2,000 characters. Technical snippets are welcome.");
      return;
    }
    setError("");
    setOfflineNote("");
    const attemptId = crypto.randomUUID();
    if (action === "feedback")
      update((v) => ({
        ...v,
        drafts: { ...v.drafts, [stage]: text },
        answers: [
          ...v.answers,
          {
            id: attemptId,
            createdAt: new Date().toISOString(),
            stage,
            text,
            helpUsed: v.helpUsed,
            choices: { ...v.choices },
            status: s.source === "example" ? ("recorded" as const) : ("pending" as const),
          },
        ].slice(-40),
      }));
    else
      update((v) => ({
        ...v,
        helpUsed: Math.min(100, v.helpUsed + 1),
        messages: [...v.messages, { role: "user" as const, text }].slice(-40),
      }));
    if (s.source === "example") {
      const reflection =
        intent === "simpler"
          ? "Example reflection · not AI: Say what the team needs, what you must protect, and how you would check that your choice helps."
          : intent === "example"
            ? "Example reflection · not AI: Imagine the deadline changes to tomorrow. Which assumption would you check first, and which boundary would stay the same?"
            : "Example reflection · not AI: Which constraint matters most to your choice, and what evidence would change your mind?";
      if (action === "tutor")
        update((v) => ({
          ...v,
          messages: [...v.messages, { role: "coach" as const, text: reflection }].slice(-40),
        }));
      setOfflineNote(
        action === "feedback"
          ? "Your answer is recorded, but has not been evaluated by AI. Compare it with the reflection questions below."
          : reflection,
      );
      return;
    }
    setBusy(true);
    pendingAttempt.current = action === "feedback" ? attemptId : undefined;
    const token = gate.current.begin(s.id, stage, attemptId);
    control.current = new AbortController();
    const valid = () =>
      gate.current.accepts(token, current.current.id, answerStage(current.current), attemptId);
    try {
      const r = await requestCareerCoach(request, control.current.signal);
      if (!valid()) return;
      if ("message" in r) {
        if (action === "feedback")
          update((v) => ({
            ...v,
            answers: v.answers.map((a) =>
              a.id === attemptId && a.stage === stage
                ? {
                    ...a,
                    feedback: r,
                    feedbackAt: new Date().toISOString(),
                    status: "complete" as const,
                  }
                : a,
            ),
          }));
        else {
          update((v) => ({
            ...v,
            messages: [...v.messages, { role: "coach" as const, text: formatTutorReply(r) }].slice(
              -40,
            ),
          }));
          setChat((draft) => (draft === text ? "" : draft));
        }
      }
    } catch (e) {
      if (valid()) {
        if (action === "feedback")
          update((v) => ({
            ...v,
            answers: v.answers.map((a) =>
              a.id === attemptId ? { ...a, status: "failed" as const } : a,
            ),
          }));
        setError(
          e instanceof Error ? e.message : "Your coach could not respond. Your work is kept.",
        );
      }
    } finally {
      if (valid()) {
        pendingAttempt.current = undefined;
        setBusy(false);
      }
    }
  }
  return (
    <div className="relative isolate mx-auto max-w-7xl px-5 pb-24 pt-8 md:py-12">
      <ParticleField
        density={0.18}
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-20"
      />
      <a
        href="#career-coach"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+20px)] left-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-teal/30 bg-card px-5 py-3 text-sm text-teal shadow-xl lg:hidden"
      >
        <MessageCircle className="size-4" aria-hidden /> Ask coach
      </a>
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
      <h1 className="mt-4 max-w-5xl text-3xl leading-tight md:text-4xl">{s.scenario.title}</h1>
      {s.source === "example" && (
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Fixed topic example, not personalized from your experience or starting answer.
          Custom-topic examples are general reasoning templates, not specialist guidance.
        </p>
      )}
      <SaveNotice />
      {s.stage !== "decisions" && (
        <Button
          variant="ghost"
          size="lg"
          className="mt-4"
          onClick={() => {
            cancel();
            setError("");
            setOfflineNote("");
            setEditingDecision(undefined);
            update((v) => ({
              ...v,
              stage:
                v.stage === "complete"
                  ? "transfer"
                  : v.stage === "transfer"
                    ? "interview"
                    : "decisions",
            }));
          }}
        >
          Back to previous stage
        </Button>
      )}
      <ol className="mt-7 flex flex-wrap gap-3 border-b border-border pb-5 text-sm">
        {["decisions", "interview", "transfer"].map((v, i) => (
          <li
            key={v}
            aria-current={s.stage === v ? "step" : undefined}
            className={s.stage === v ? "text-teal" : "text-muted-foreground"}
          >
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
        <section id="practice-task" className="min-w-0 scroll-mt-24">
          <p className="text-sm text-teal">{s.scenario.manager}</p>
          <p className="mt-3 text-lg leading-relaxed">{s.scenario.request}</p>
          <div className="mt-6 border-l-2 border-teal pl-4">
            <p className="text-sm font-semibold">Your objective</p>
            <p className="mt-1 text-muted-foreground">{s.scenario.objective}</p>
          </div>
          <details className="mt-6 rounded-xl border border-border bg-card/40 px-5 py-1">
            <summary className="min-h-11 cursor-pointer py-3 font-medium text-teal">
              Read the brief and evidence{" "}
              <span className="ml-2 text-xs text-muted-foreground">
                {s.scenario.artifacts.length} sources · {s.scenario.constraints.length} constraints
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted-foreground">{s.scenario.context}</p>
            <div className="my-5 grid gap-6 sm:grid-cols-2">
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
          </details>
          {s.stage === "decisions" && (
            <div className="mt-9 border-t border-border pt-7">
              {decision ? (
                <>
                  <p className="kicker">
                    Decision {committed.length + 1} of {s.scenario.decisions.length}
                  </p>
                  <h2 ref={heading} tabIndex={-1} className="mt-3 text-2xl">
                    {decision.question}
                  </h2>
                  <div className="mt-5 grid gap-3">
                    {decision.choices.map((c) => (
                      <Button
                        key={c.id}
                        size="lg"
                        variant={s.choices[decision.id] === c.id ? "secondary" : "outline"}
                        aria-pressed={s.choices[decision.id] === c.id}
                        className="h-auto min-h-14 justify-between whitespace-normal rounded-lg py-4 text-left text-base"
                        disabled={(s.choiceHistory?.length ?? 0) >= 100}
                        onClick={() => {
                          if (busy)
                            setError(
                              "Your choice changed, so the previous coach request was stopped. Ask again for guidance on this choice.",
                            );
                          cancel();
                          update((v) =>
                            reviseChoice(v, decision.id, c.id, new Date().toISOString()),
                          );
                          setEditingDecision(undefined);
                        }}
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
              {s.scenario.decisions
                .flatMap((d) => {
                  const c = visibleDecision(d, s.choices[d.id]);
                  return c ? [{ d, c }] : [];
                })
                .map(({ d, c }) => (
                  <div className="mt-5 border-l border-teal pl-4" key={d.id}>
                    <p className="font-medium">You chose: {c.label}</p>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="mt-2"
                      onClick={() => {
                        cancel();
                        setEditingDecision(d.id);
                      }}
                      aria-label={`Revisit decision: ${d.question}`}
                    >
                      <RefreshCw /> Revisit and compare
                    </Button>
                  </div>
                ))}
            </div>
          )}
          {s.stage === "decisions" ? (
            <div className="mt-8">
              <WorkScene scene={s.scenario.scene} decisions={visibleDecisionsForScene(s)} />
            </div>
          ) : (
            <details className="mt-6">
              <summary className="min-h-11 cursor-pointer py-3 text-sm text-teal">
                Review your decisions and workflow
              </summary>
              <WorkScene scene={s.scenario.scene} decisions={visibleDecisionsForScene(s)} />
            </details>
          )}
          {s.stage !== "complete" && (!decision || s.stage !== "decisions") && (
            <div className="mt-8">
              <h2 ref={heading} tabIndex={-1} className="text-2xl">
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
                {currentAttempt && (
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={!canAdvance(s, busy)}
                    onClick={advance}
                  >
                    Continue <ArrowRight />
                  </Button>
                )}
                {!busy && currentAttempt?.status === "failed" && (
                  <Button
                    variant="ghost"
                    size="lg"
                    disabled={busy || !answer.trim()}
                    onClick={skipFeedback}
                  >
                    Skip feedback and continue · not evaluated <ArrowRight />
                  </Button>
                )}
              </div>
              {currentAttempt?.status === "recorded" &&
                currentAttempt.text === answer &&
                attemptMatchesChoices(s, currentAttempt) && (
                  <p role="status" className="mt-3 text-sm text-muted-foreground">
                    Recorded without AI feedback. You can continue or ask the coach to review it.
                  </p>
                )}
              {currentAttempt && !attemptMatchesChoices(s, currentAttempt) && (
                <p role="status" className="mt-3 text-muted-foreground">
                  Your choices changed. The previous reflection is kept in history; submit your
                  reasoning again for this version.
                </p>
              )}
            </div>
          )}
          {s.stage !== "complete" && lastFeedback && (
            <div className="mt-7 border-t border-border pt-5">
              <p className="kicker">Your coach’s feedback · AI generated</p>
              <p className="mt-3">{lastFeedback.message}</p>
              {lastFeedback.strengths.length > 0 && (
                <>
                  <h3 className="mt-4 text-lg">What you explained well</h3>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {lastFeedback.strengths.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </>
              )}
              {lastFeedback.retrySuggestions.length > 0 && (
                <>
                  <h3 className="mt-4 text-lg">Try this in your next version</h3>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {lastFeedback.retrySuggestions.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="mt-4 text-teal">{lastFeedback.nextQuestion}</p>
              <Button
                size="lg"
                variant="ghost"
                className="mt-3"
                disabled={busy}
                onClick={() => setAnswer(currentAttempt?.text ?? "")}
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
              <h2 ref={heading} tabIndex={-1} className="text-3xl">
                Practice recorded.
              </h2>
              <p className="mt-3 text-muted-foreground">
                {s.answers.length} attempts · {s.helpUsed} coach requests.{" "}
                {s.source === "example"
                  ? "These reflections are not AI-evaluated."
                  : "Feedback is evidence from this exercise, not a job-readiness score."}
              </p>
              <p className="mt-3">
                {nextSuggestion(
                  currentAttempt?.feedback?.gaps ?? [],
                  currentAttempt?.feedback?.retrySuggestions,
                )}
              </p>
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
        <aside
          id="career-coach"
          tabIndex={-1}
          className="min-w-0 scroll-mt-24 rounded-2xl border border-border bg-card/60 p-5 outline-none lg:sticky lg:top-[calc(var(--header-h)+20px)] lg:max-h-[calc(100dvh-var(--header-h)-40px)] lg:overflow-y-auto"
        >
          <a
            href="#practice-task"
            className="mb-4 inline-flex min-h-11 items-center text-sm text-teal underline-offset-4 hover:underline lg:hidden"
          >
            Back to your task ↑
          </a>
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
          <div
            ref={transcript}
            className="mt-6 max-h-80 space-y-4 overflow-y-auto lg:max-h-[30dvh]"
            aria-live="polite"
          >
            {s.messages.map((m, i) => (
              <div
                key={i}
                className={`border-l-2 pl-3 ${m.role === "coach" ? "border-teal" : "border-border"}`}
              >
                <p className="text-xs text-muted-foreground">
                  {m.role === "coach" ? "Coach" : "You"}
                </p>
                <p className="mt-1 whitespace-pre-line break-words leading-relaxed">{m.text}</p>
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
              onChange={(e) => {
                if (busy) cancel();
                setChat(e.target.value);
              }}
              placeholder={`What should I check in this ${s.profile.topic} task?`}
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
                  cancel();
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

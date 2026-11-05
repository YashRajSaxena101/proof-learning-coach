import { useEffect, useRef, useState } from "react";
import { Minus, Moon, Volume2, VolumeX, X } from "lucide-react";
import { ProofAvatar } from "./ProofAvatar";
import {
  createInactivityClock,
  feedbackReaction,
  type CompanionMood,
} from "@/domain/companion/activity";
import { careerStore, useCareer } from "@/services/career/store";
import { progressStore } from "@/services/progress-store";
import { askCompanion } from "@/services/career/advisory";
import "./companion.css";

type Line = { role: "user" | "assistant"; text: string };
const feedbackEntries = () =>
  careerStore.get().sessions.flatMap((session) =>
    session.answers.flatMap((answer, index) =>
      answer.feedback
        ? [
            {
              key: `${session.id}:${answer.id ?? index}:${answer.feedbackAt ?? JSON.stringify(answer.feedback)}`,
              feedback: answer.feedback,
            },
          ]
        : [],
    ),
  );

export function ProofCompanion() {
  const career = useCareer();
  const active = career.sessions.find((session) => session.id === career.activeId);
  // The newest learner selection wins over an older still-active practice.
  const profile = career.profile ?? active?.profile;
  const contextKey = JSON.stringify([career.activeId, profile?.topic, profile?.interest]);
  const context = useRef(contextKey);
  context.current = contextKey;
  const [mood, setMood] = useState<CompanionMood>("idle");
  const sleeping = mood === "asleep";
  const [open, setOpen] = useState(false),
    [quiet, setQuiet] = useState(false),
    [hidden, setHidden] = useState(false);
  const [bubble, setBubble] = useState(""),
    [draft, setDraft] = useState("");
  const [history, setHistory] = useState<Line[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const asleep = useRef(false),
    quietRef = useRef(quiet),
    hiddenRef = useRef(hidden),
    busyRef = useRef(busy);
  quietRef.current = quiet;
  hiddenRef.current = hidden;
  busyRef.current = busy;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const clock = useRef<ReturnType<typeof createInactivityClock> | undefined>(undefined);
  const request = useRef(0),
    controller = useRef<AbortController | undefined>(undefined);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const launcher = useRef<HTMLButtonElement>(null),
    input = useRef<HTMLTextAreaElement>(null);
  const cancel = () => {
    request.current++;
    controller.current?.abort();
    setBusy(false);
    if (!asleep.current) setMood("idle");
  };
  const react = (message: string, nextMood: CompanionMood) => {
    if (
      asleep.current ||
      quietRef.current ||
      hiddenRef.current ||
      busyRef.current ||
      document.hidden
    )
      return;
    clearTimeout(reactionTimer.current);
    setBubble(message);
    setMood(nextMood);
    reactionTimer.current = setTimeout(() => {
      setBubble("");
      if (!asleep.current) setMood("idle");
    }, 10_000);
  };

  useEffect(() => {
    const requestGate = request;
    try {
      setQuiet(localStorage.getItem("proof.companion.quiet") === "1");
      setHidden(localStorage.getItem("proof.companion.hidden") === "1");
    } catch {
      /* optional preference */
    }
    careerStore.init();
    const seen = new Set(feedbackEntries().map((entry) => entry.key));
    const unsubscribeCareer = careerStore.subscribe(() => {
      const fresh = feedbackEntries().filter((entry) => !seen.has(entry.key));
      fresh.forEach((entry) => seen.add(entry.key));
      const latest = fresh.at(-1);
      if (latest) {
        const reaction = feedbackReaction(latest.feedback);
        react(reaction.message, reaction.mood);
      }
    });
    let eventCount = progressStore.get().events.length;
    const mountedAt = Date.now();
    const unsubscribeSample = progressStore.subscribe(() => {
      const events = progressStore.get().events;
      const fresh = events.slice(eventCount);
      eventCount = events.length;
      const outcome = fresh
        .filter((event) => typeof event.correct === "boolean" && Date.parse(event.at) >= mountedAt)
        .at(-1);
      if (outcome)
        react(
          outcome.correct
            ? "That step checks out in the sample. What made it work?"
            : "That sample step needs another look. Try tracing one record at a time.",
          outcome.correct ? "happy" : "sad",
        );
    });
    clock.current = createInactivityClock({
      visible: () => !document.hidden && !quietRef.current && !hiddenRef.current,
      onSleep: () => {
        asleep.current = true;
        clearTimeout(reactionTimer.current);
        setBubble("");
        setMood("asleep");
        cancel();
      },
      onNudge: () =>
        react(
          `Curious about ${profileRef.current?.topic ?? "your next role"}? What’s one question you’d like to untangle?`,
          "bored",
        ),
    });
    let lastMove = 0;
    const activity = () => clock.current?.activity();
    const move = () => {
      if (Date.now() - lastMove > 250) {
        lastMove = Date.now();
        activity();
      }
    };
    const visibility = () => {
      clock.current?.check();
      if (document.hidden) {
        clearTimeout(reactionTimer.current);
        setBubble("");
      }
    };
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("input", activity);
    window.addEventListener("scroll", activity, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clock.current?.dispose();
      clearTimeout(reactionTimer.current);
      requestGate.current++;
      controller.current?.abort();
      unsubscribeCareer();
      unsubscribeSample();
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("input", activity);
      window.removeEventListener("scroll", activity);
      document.removeEventListener("visibilitychange", visibility);
    };
    // Subscriptions deliberately read refs; historical data is seeded exactly once.
  }, []);

  useEffect(() => {
    cancel();
    setHistory([]);
    setDraft("");
    setError("");
    setBubble("");
    // The request gate cancels both network work and late results on context changes.
  }, [contextKey]);

  useEffect(() => {
    if (open && !sleeping) input.current?.focus();
  }, [open, sleeping]); // focus on opening or waking, not every expression

  function minimize() {
    cancel();
    setOpen(false);
    setBubble("");
    launcher.current?.focus();
  }
  function wakeAndOpen() {
    asleep.current = false;
    clock.current?.wake();
    setMood("idle");
    setBubble("");
    setOpen((value) => !value);
  }
  function toggleQuiet() {
    const value = !quiet;
    setQuiet(value);
    setBubble("");
    try {
      localStorage.setItem("proof.companion.quiet", value ? "1" : "0");
    } catch {
      /* optional preference */
    }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy || asleep.current) return;
    const token = ++request.current;
    const requestContext = contextKey;
    controller.current?.abort();
    controller.current = new AbortController();
    setBusy(true);
    setError("");
    setMood("talking");
    try {
      const reply = await askCompanion(
        {
          topic: profile?.topic ?? "Career exploration",
          interest: profile?.interest ?? "",
          text,
          history: history.slice(-6),
        },
        controller.current.signal,
      );
      if (token !== request.current || asleep.current || requestContext !== context.current) return;
      setHistory(
        (value) =>
          [...value, { role: "user", text }, { role: "assistant", text: reply.message }].slice(
            -6,
          ) as Line[],
      );
      setDraft("");
      setMood(document.hidden ? "idle" : "talking");
      clearTimeout(reactionTimer.current);
      reactionTimer.current = setTimeout(() => {
        if (!asleep.current) setMood("idle");
      }, 5000);
    } catch (failure) {
      if (token === request.current && !asleep.current) {
        setError(
          failure instanceof Error
            ? failure.message
            : "Proof couldn’t reply. Your question is kept; try again.",
        );
        setMood("sad");
      }
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  return (
    <div
      className="proof-companion"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          minimize();
        }
      }}
    >
      {hidden ? (
        <button
          className="proof-companion-restore"
          onClick={() => {
            setHidden(false);
            try {
              localStorage.setItem("proof.companion.hidden", "0");
            } catch {
              /* optional */
            }
          }}
        >
          Show Proof
        </button>
      ) : (
        <>
          {open && (
            <section
              className="proof-companion-panel"
              role="dialog"
              aria-label="Proof companion chat"
              aria-modal="false"
            >
              <header className="proof-companion-panel-head">
                <strong>Proof</strong>
                <span className="proof-companion-meta">Your practice companion</span>
                <div className="proof-companion-controls">
                  <button
                    className="proof-companion-icon"
                    aria-label={quiet ? "Turn off quiet mode" : "Turn on quiet mode"}
                    aria-pressed={quiet}
                    title={quiet ? "Resume local nudges" : "Quiet: no local nudges or reactions"}
                    onClick={toggleQuiet}
                  >
                    {quiet ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                  <button
                    className="proof-companion-icon"
                    aria-label="Minimize companion"
                    onClick={minimize}
                  >
                    <Minus size={17} />
                  </button>
                  <button
                    className="proof-companion-icon"
                    aria-label="Close companion"
                    onClick={() => {
                      minimize();
                      setHidden(true);
                      try {
                        localStorage.setItem("proof.companion.hidden", "1");
                      } catch {
                        /* optional */
                      }
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
              </header>
              <div className="proof-companion-conversation">
                <p className="proof-companion-meta">
                  {quiet
                    ? "Quiet mode is on. I’ll only reply when you ask."
                    : "Local nudges stay on this device. Chat is sent to the Ollama coach only when you press Send."}
                </p>
                {history.length === 0 && (
                  <p className="proof-companion-line">
                    A little practice, a little curiosity. Want to talk through{" "}
                    {profile?.topic ?? "a career question"}?
                  </p>
                )}
                <div aria-live="polite">
                  {history.map((line, index) => (
                    <div className="proof-companion-line" data-role={line.role} key={index}>
                      <small>{line.role === "user" ? "You" : "Proof · AI"}</small>
                      {line.text}
                    </div>
                  ))}
                </div>
                {busy && (
                  <p className="proof-companion-meta" role="status">
                    Proof is thinking…
                  </p>
                )}
                {sleeping && (
                  <p className="proof-companion-meta">
                    <Moon size={14} aria-hidden /> Taking a tiny rest. Tap Wake to continue.
                  </p>
                )}
              </div>
              <form className="proof-companion-form" onSubmit={send}>
                {sleeping ? (
                  <button
                    type="button"
                    onClick={() => {
                      asleep.current = false;
                      clock.current?.wake();
                      setMood("idle");
                      input.current?.focus();
                    }}
                  >
                    Wake Proof
                  </button>
                ) : (
                  <>
                    <label htmlFor="proof-companion-question">Ask Proof</label>
                    <textarea
                      ref={input}
                      id="proof-companion-question"
                      value={draft}
                      maxLength={800}
                      onChange={(event) => {
                        if (busy) cancel();
                        setDraft(event.target.value);
                      }}
                      placeholder="Help me find my next step…"
                    />
                    {error && (
                      <p className="proof-companion-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={busy || !draft.trim()}
                      aria-label="Send to Proof"
                    >
                      {busy ? "Thinking…" : "Send"}
                    </button>
                    {busy && (
                      <button
                        type="button"
                        onClick={() => {
                          cancel();
                          setMood("idle");
                        }}
                      >
                        Stop
                      </button>
                    )}
                  </>
                )}
              </form>
            </section>
          )}
          {!open && bubble && (
            <p className="proof-companion-bubble" role="status">
              {bubble}
            </p>
          )}
          <button
            ref={launcher}
            className="proof-companion-launcher"
            aria-label={
              sleeping
                ? open
                  ? "Wake Proof companion"
                  : "Wake Proof"
                : open
                  ? "Hide Proof chat"
                  : "Open Proof companion"
            }
            aria-expanded={open}
            onClick={
              sleeping
                ? () => {
                    asleep.current = false;
                    clock.current?.wake();
                    setMood("idle");
                    setOpen(true);
                  }
                : open
                  ? minimize
                  : wakeAndOpen
            }
          >
            <ProofAvatar mood={mood} />
            <span className="proof-companion-name">{sleeping ? "Tap to wake" : "Proof"}</span>
          </button>
        </>
      )}
    </div>
  );
}

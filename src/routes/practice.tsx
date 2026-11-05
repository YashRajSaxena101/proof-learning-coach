import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOPICS, profileSchema, diagnosticQuestion, type Profile } from "@/domain/career/contracts";
import { exampleScenario } from "@/domain/career/examples";
import { careerStore, useCareer, latestRequest } from "@/services/career/store";
import { requestCareerCoach } from "@/services/career/coach";
import { PracticeWorkspace } from "@/components/career/PracticeWorkspace";
import { ParticleField } from "@/components/fx/ParticleField";
import { SaveNotice } from "@/components/career/SaveNotice";
export const Route = createFileRoute("/practice")({
  validateSearch: (s: Record<string, unknown>): { new?: boolean; example?: boolean } => ({
    new: s['new'] === true || s['new'] === "true",
    example: s['example'] === true || s['example'] === "true",
  }),
  head: () => ({
    meta: [
      { title: "Build your career practice — Proof" },
      {
        name: "description",
        content:
          "Choose a target, rehearse a workplace decision, and explain your reasoning with a personalized coach.",
      },
      { property: "og:title", content: "Build your career practice — Proof" },
      {
        property: "og:description",
        content: "Practice a decision, explain your reasoning, and try a new constraint.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Practice,
});
const DEFAULT: Profile = {
  topic: "AI engineer",
  experience: "new",
  interest: "",
  goal: "interview",
  minutes: 15,
  diagnostic: "",
};
function Practice() {
  const navigate = useNavigate();
  const state = useCareer();
  const search = Route.useSearch();
  const active = state.sessions.find((v) => v.id === state.activeId);
  const [workspace, setWorkspace] = useState(!search.new && !search.example);
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(state.profile ?? DEFAULT);
  const [custom, setCustom] = useState(!TOPICS.some((t) => t === p.topic));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const gate = useRef(latestRequest());
  const abort = useRef<AbortController | undefined>(undefined);
  useEffect(() => {
    careerStore.init();
  }, []);
  useEffect(() => {
    setWorkspace(!search.new && !search.example);
  }, [search.new, search.example]);
  useEffect(
    () => () => {
      gate.current.cancel();
      abort.current?.abort();
    },
    [],
  );
  const change = (next: Partial<Profile>) => {
    const value = { ...p, ...next };
    setP(value);
    const parsed = profileSchema.safeParse(value);
    if (parsed.success) careerStore.set((s) => ({ ...s, profile: parsed.data }));
  };
  function example() {
    const parsed = profileSchema.safeParse(p);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your inputs.");
      return;
    }
    careerStore.add({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      profile: parsed.data,
      scenario: exampleScenario(p.topic),
      source: "example",
      stage: "decisions",
      choices: {},
      answers: [],
      messages: [],
      helpUsed: 0,
    });
    setWorkspace(true);
    void navigate({ to: '/practice', search: {}, replace: true });
    setError("");
  }
  async function generate() {
    const parsed = profileSchema.safeParse(p);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your inputs.");
      return;
    }
    careerStore.set((s) => ({ ...s, profile: parsed.data }));
    setBusy(true);
    setError("");
    const id = gate.current.begin();
    abort.current = new AbortController();
    try {
      const result = await requestCareerCoach(
        { action: "generate", profile: parsed.data },
        abort.current.signal,
      );
      if (!gate.current.current(id)) return;
      if ("scenario" in result) {
        careerStore.add({
          id: result.id,
          createdAt: new Date().toISOString(),
          profile: parsed.data,
          scenario: result.scenario,
          source: "live-ai",
          stage: "decisions",
          choices: {},
          answers: [],
          messages: [],
          helpUsed: 0,
        });
        setWorkspace(true);
        void navigate({ to: '/practice', search: {}, replace: true });
      }
    } catch (e) {
      if (gate.current.current(id))
        setError(e instanceof Error ? e.message : "Generation failed. Your inputs are kept.");
    } finally {
      if (gate.current.current(id)) setBusy(false);
    }
  }
  if (workspace && active) return <PracticeWorkspace key={active.id} session={active} />;
  return (
    <div className="relative isolate mx-auto min-h-[80vh] max-w-3xl px-5 py-10 md:py-16">
      <ParticleField
        density={0.25}
        className="pointer-events-none absolute inset-0 -z-10 opacity-20"
      />
      <div className="flex items-center justify-between">
        <p className="kicker">Your practice · {step + 1} of 4</p>
        {active && (
          <Button size="lg" variant="ghost" onClick={() => setWorkspace(true)}>
            Resume practice
          </Button>
        )}
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2" aria-label={`Setup step ${step + 1} of 4`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 ${i <= step ? "bg-teal" : "bg-muted"}`} />
        ))}
      </div>
      <div className="mt-10 min-h-80">
        {step === 0 && (
          <>
            <h1 className="text-4xl md:text-5xl">What work are you curious about?</h1>
            <p className="mt-4 text-muted-foreground">
              Pick a direction. You can change it for your next practice.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {TOPICS.map((t) => (
                <Button
                  size="lg"
                  variant={!custom && p.topic === t ? "secondary" : "outline"}
                  aria-pressed={!custom && p.topic === t}
                  className="h-14 rounded-lg justify-start text-base"
                  key={t}
                  onClick={() => {
                    setCustom(false);
                    change({ topic: t, diagnostic: "" });
                  }}
                >
                  {t}
                </Button>
              ))}
              <Button
                size="lg"
                variant={custom ? "secondary" : "outline"}
                aria-pressed={custom}
                className="h-14 rounded-lg justify-start text-base"
                onClick={() => {
                  setCustom(true);
                  change({ topic: "", diagnostic: "" });
                }}
              >
                My own topic
              </Button>
            </div>
            {custom && (
              <label className="mt-5 block">
                Your topic
                <input
                  className="career-input mt-2"
                  maxLength={100}
                  value={p.topic}
                  onChange={(e) => change({ topic: e.target.value })}
                  placeholder="For example, robotics or UX research"
                />
              </label>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-4xl md:text-5xl">Where would you like to begin?</h1>
            <p className="mt-4 text-muted-foreground">
              This sets the starting explanation, not a proficiency score.
            </p>
            <div className="mt-7 grid gap-3">
              {[
                ["new", "I’m new to this"],
                ["foundations", "I know some foundations"],
                ["projects", "I’ve tried some projects"],
              ].map(([value, label]) => (
                <Button
                  size="lg"
                  key={value}
                  aria-pressed={p.experience === value}
                  variant={p.experience === value ? "secondary" : "outline"}
                  className="h-14 justify-start rounded-lg text-base"
                  onClick={() =>
                    change({
                      experience:
                        value === "new"
                          ? "new"
                          : value === "foundations"
                            ? "foundations"
                            : "projects",
                    })
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            <label className="mt-6 block">
              Anything specific you want to explore?{" "}
              <span className="text-muted-foreground">(optional)</span>
              <textarea
                className="career-input mt-2"
                rows={3}
                maxLength={600}
                value={p.interest}
                onChange={(e) => change({ interest: e.target.value })}
                placeholder="Building an assistant for private team documents…"
              />
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-4xl md:text-5xl">Make room for a small rehearsal.</h1>
            <p className="mt-4 text-muted-foreground">
              One realistic decision, then an explanation in your own words.
            </p>
            <fieldset className="mt-7">
              <legend className="mb-3">Your goal</legend>
              <div className="flex flex-wrap gap-3">
                {[
                  ["interview", "Interview practice"],
                  ["workplace", "Workplace skills"],
                  ["refresh", "A refresh"],
                ].map(([v, label]) => (
                  <Button
                    size="lg"
                    key={v}
                    aria-pressed={p.goal === v}
                    variant={p.goal === v ? "secondary" : "outline"}
                    onClick={() =>
                      change({
                        goal:
                          v === "interview"
                            ? "interview"
                            : v === "workplace"
                              ? "workplace"
                              : "refresh",
                      })
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-7">
              <legend className="mb-3">Session length</legend>
              <div className="flex gap-3">
                {([10, 15, 25] as const).map((minutes) => (
                  <Button
                    size="lg"
                    key={minutes}
                    variant={p.minutes === minutes ? "secondary" : "outline"}
                    aria-pressed={p.minutes === minutes}
                    onClick={() => change({ minutes })}
                  >
                    {minutes} min
                  </Button>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {step === 3 && (
          <>
            <p className="kicker">A starting point, not a test score</p>
            <h1 className="mt-3 text-3xl md:text-4xl">{diagnosticQuestion(p.topic)}</h1>
            <p className="mt-4 text-muted-foreground">
              A sentence or two helps set the challenge. It’s okay to be unsure.
            </p>
            <textarea
              aria-label="Starting answer"
              className="career-input mt-5"
              rows={4}
              maxLength={1000}
              value={p.diagnostic}
              onChange={(e) => change({ diagnostic: e.target.value })}
              placeholder="I’d start by checking…"
            />
            <Button
              variant="ghost"
              size="lg"
              className="mt-2"
              onClick={() => change({ diagnostic: "I'm not sure" })}
            >
              I’m not sure
            </Button>
            <p className="mt-5 text-sm text-muted-foreground">
              {p.topic} ·{" "}
              {p.experience === "new"
                ? "New to this"
                : p.experience === "projects"
                  ? "Some projects"
                  : "Foundations"}{" "}
              · {p.minutes} min
            </p>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-5 rounded-lg border border-warn bg-warn-soft p-4 text-warn">
          {error}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <Button
          variant="ghost"
          size="lg"
          disabled={step === 0 || busy}
          aria-label="Previous setup step"
          onClick={() => {
            setStep((v) => v - 1);
            setError("");
          }}
        >
          <ArrowLeft /> Back
        </Button>
        {step < 3 ? (
          <Button
            variant="teal"
            size="lg"
            disabled={!p.topic.trim()}
            onClick={() => {
              const parsed = profileSchema.safeParse(p);
              if (!parsed.success) {
                setError(parsed.error.issues[0]?.message ?? "Please check your inputs");
                return;
              }
              setStep((v) => v + 1);
              setError("");
            }}
          >
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button
            variant="teal"
            size="lg"
            disabled={busy}
            onClick={() => (search.example ? example() : void generate())}
          >
            <Sparkles />
            {busy
              ? "Building your practice…"
              : search.example
                ? "Open example scenario"
                : error
                  ? "Retry my practice"
                  : "Build my practice"}
          </Button>
        )}
      </div>
      {busy && (
        <Button
          variant="ghost"
          size="lg"
          className="mt-4"
          onClick={() => {
            gate.current.cancel();
            abort.current?.abort();
            setBusy(false);
            setError("Request stopped. Your inputs are kept.");
          }}
        >
          Stop generation
        </Button>
      )}
      {step === 3 && !busy && !search.example && (
        <Button variant="link" size="lg" className="mt-4" onClick={example}>
          Try an example scenario instead · not AI generated
        </Button>
      )}
      <SaveNotice />
      <p className="mt-6 text-sm text-muted-foreground">
        Prefer a guided sample?{" "}
        <Link to="/learn" className="text-teal underline">
          Try the original data investigation.
        </Link>
      </p>
    </div>
  );
}

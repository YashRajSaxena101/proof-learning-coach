import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { analyzeResume } from "@/services/career/advisory";
import { MAX_RESUME_CHARS, resumeErrorMessage } from "@/domain/resume/extract";
import { FileText } from "lucide-react";

const SAMPLE = `Jordan Lee — early-career data analyst\nBuilt SQL reports for a student organization and checked joins for duplicate records. Used spreadsheets and Python to clean data and explain trends to teammates. Interested in practicing stakeholder communication and reliable reporting.`;
type Suggestions = { role: string; skills: string[]; focus: string; evidence: string[] };
type Props = { onApply: (role: string, interest: string) => void };

export function ResumeOnboarding({ onApply }: Props) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Suggestions>();
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const generation = useRef(0);
  const controller = useRef<AbortController | undefined>(undefined);
  const invalidate = () => {
    generation.current++;
    controller.current?.abort();
    setBusy(false);
    setResult(undefined);
    setError("");
    setApplied(false);
  };
  useEffect(
    () => () => {
      generation.current++;
      controller.current?.abort();
    },
    [],
  );
  async function open(file: File | undefined) {
    invalidate();
    setText("");
    if (!file) return;
    const id = generation.current;
    setBusy(true);
    try {
      const { extractResume } = await import("@/domain/resume/extract");
      const extracted = await extractResume(file);
      if (id === generation.current) setText(extracted);
    } catch (e) {
      if (id === generation.current) setError(resumeErrorMessage(e));
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  async function analyze() {
    if (busy || text.trim().length < 40) return;
    const id = ++generation.current;
    controller.current = new AbortController();
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      const next = await analyzeResume(text.trim(), controller.current.signal);
      if (id !== generation.current) return;
      setResult(next);
      setRole(next.role);
      setSkills(next.skills.join(", "));
      setFocus(next.focus);
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "Analysis unavailable. Your text is still here.");
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  return (
    <details className="mt-8 rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
      <summary className="flex min-h-11 cursor-pointer items-center gap-3 text-lg font-medium">
        <FileText aria-hidden="true" className="size-5 shrink-0 text-teal" />
        <span>
          Optional: start from your résumé
          <span className="mt-1 block text-sm font-normal text-muted-foreground">
            Upload or paste text to get a suggested practice direction.
          </span>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Upload a PDF, DOCX or TXT file up to 4 MB, or paste text below. Extraction happens in your
        browser. Scanned PDFs need OCR first.
      </p>
      <label className="mt-4 block text-sm">
        Choose a résumé file
        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="mt-2 block min-h-11 w-full rounded-lg border border-border bg-background p-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-teal-soft file:px-4 file:py-2 file:text-teal"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void open(file);
          }}
        />
      </label>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mt-4"
        onClick={() => {
          invalidate();
          setText(SAMPLE);
        }}
      >
        Use sample résumé
      </Button>
      <label className="mt-5 block text-sm">
        Review and edit your résumé excerpt
        <textarea
          className="career-input mt-2"
          rows={7}
          maxLength={MAX_RESUME_CHARS}
          value={text}
          onChange={(e) => {
            invalidate();
            setText(e.target.value);
          }}
          placeholder="Paste your résumé text here…"
        />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">
        {text.length} / {MAX_RESUME_CHARS} characters. Only the first 6,000 characters of a file are
        shown; additional text is omitted. At least 40 characters are needed. Remove anything you do
        not want to share. Files and résumé text are not saved by this app. Applied role and focus
        are saved with your practice profile.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        When you choose Analyze with AI, your reviewed text is sent through Supabase to Ollama for
        analysis.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="teal"
          size="lg"
          disabled={busy || text.trim().length < 40}
          onClick={() => void analyze()}
        >
          Analyze with AI
        </Button>
        {busy && (
          <Button type="button" variant="ghost" size="lg" onClick={invalidate}>
            Cancel
          </Button>
        )}
      </div>
      {busy && (
        <p role="status" className="mt-3 text-sm">
          Working…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-warn">
          {error}
        </p>
      )}
      {applied && (
        <p role="status" className="mt-3 text-sm text-teal">
          Suggestions added to your practice setup. You can edit them there.
        </p>
      )}
      {result && (
        <div className="mt-6 space-y-4 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">
            Review these AI suggestions and edit them before applying. Your starting answer and
            experience selection stay yours. Applying replaces the current role and practice
            interests; you can edit them during setup.
          </p>
          <label className="block text-sm">
            Suggested role
            <input
              className="career-input mt-2"
              maxLength={100}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Skills to practice
            <input
              className="career-input mt-2"
              maxLength={250}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Targeted help
            <textarea
              className="career-input mt-2"
              rows={3}
              maxLength={300}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </label>
          {result.evidence.length > 0 && (
            <div>
              <p className="text-sm">From your excerpt</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {result.evidence.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!role.trim()}
            onClick={() => {
              onApply(
                role.trim(),
                [skills.trim() && `Skills: ${skills.trim()}`, focus.trim()]
                  .filter(Boolean)
                  .join(". ")
                  .slice(0, 600),
              );
              setResult(undefined);
              setApplied(true);
            }}
          >
            Use these suggestions
          </Button>
        </div>
      )}
    </details>
  );
}

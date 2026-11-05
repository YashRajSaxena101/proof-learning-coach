import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Maximize,
  Pause,
  Play,
  StickyNote,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { SLIDES } from "@/components/present/slides";
import { SlideVisual } from "@/components/present/visuals";
import { ProofAvatar } from "@/components/companion/ProofAvatar";
import { useMotionPref } from "@/lib/motion-pref";
import { isPresentationShortcutTarget } from "@/lib/navigation-accessibility";
import "@/components/present/present.css";

export const Route = createFileRoute("/present")({
  head: () => ({
    meta: [
      { title: "Present Proof — a guided product tour" },
      {
        name: "description",
        content:
          "Meet Proof and explore how a graduate turns résumé experience into workplace decisions and interview practice.",
      },
    ],
  }),
  component: Present,
});

function Present() {
  const { allowed } = useMotionPref();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [notes, setNotes] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [voice, setVoice] = useState(false);
  const [notice, setNotice] = useState("");
  const slide = SLIDES[index]!;
  const last = index === SLIDES.length - 1;
  const go = useCallback((position: number) => {
    setPlaying(false);
    setIndex(Math.min(SLIDES.length - 1, Math.max(0, position)));
  }, []);
  const play = () => {
    if (!playing && last) setIndex(0);
    setPlaying(!playing);
  };
  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    const synthesis = window.speechSynthesis;
    const check = () => setVoiceAvailable(synthesis.getVoices().length > 0);
    check();
    synthesis.addEventListener("voiceschanged", check);
    return () => synthesis.removeEventListener("voiceschanged", check);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [index]);
  useEffect(() => {
    document.title = `${index + 1}/${SLIDES.length} · ${slide.chapter} — Proof`;
    if (!playing) return;
    let finished = false;
    const next = () => {
      if (finished) return;
      finished = true;
      if (last) setPlaying(false);
      else setIndex(index + 1);
    };
    let speech: SpeechSynthesisUtterance | undefined;
    if (voice && voiceAvailable) {
      speech = new SpeechSynthesisUtterance(slide.narration);
      speech.rate = 1;
      speech.lang = "en-US";
      speech.onend = next;
      speech.onerror = () => {
        if (finished) return;
        setNotice("Voice playback is unavailable. The written tour will continue.");
        setVoice(false);
      };
      window.speechSynthesis.speak(speech);
    }
    const timeout = window.setTimeout(next, (speech ? slide.seconds + 10 : slide.seconds) * 1000);
    const whenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", whenHidden);
    return () => {
      finished = true;
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", whenHidden);
      if (speech) {
        speech.onend = null;
        speech.onerror = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [playing, index, last, slide, voice, voiceAvailable]);
  const fullscreen = useCallback(() => {
    if (document.fullscreenElement)
      void document
        .exitFullscreen()
        .catch(() => setNotice("Use your browser’s fullscreen control."));
    else if (document.documentElement.requestFullscreen)
      void document.documentElement
        .requestFullscreen()
        .catch(() => setNotice("Use your browser’s fullscreen control."));
    else setNotice("Use your browser’s fullscreen control.");
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !isPresentationShortcutTarget(event.target)
      )
        return;
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        go(index + 1);
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        go(index - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        go(0);
      } else if (event.key === "End") {
        event.preventDefault();
        go(SLIDES.length - 1);
      } else if (event.key.toLowerCase() === "n") setNotes((v) => !v);
      else if (event.key.toLowerCase() === "f") fullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, fullscreen]);

  return (
    <div className="proof-tour">
      <header className="tour-header">
        <Link
          to="/"
          aria-label="Exit presentation and return home"
          className="font-display text-2xl font-semibold"
        >
          Proof<span className="text-teal">.</span>
        </Link>
        <span className="tour-header-name">Presenter view</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Toggle speaker notes"
            aria-pressed={notes}
            title="Speaker notes (N)"
            onClick={() => setNotes((v) => !v)}
          >
            <StickyNote />
          </Button>
          {voiceAvailable && (
            <Button
              size="icon"
              variant="ghost"
              aria-label={voice ? "Turn narration off" : "Turn narration on"}
              aria-pressed={voice}
              title={voice ? "Turn narration off" : "Turn narration on for playback"}
              onClick={() => {
                setNotice("");
                setVoice((v) => !v);
              }}
            >
              {voice ? <Volume2 /> : <VolumeX />}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            aria-label="Toggle fullscreen"
            className="hidden sm:inline-flex"
            title="Fullscreen (F)"
            onClick={fullscreen}
          >
            <Maximize />
          </Button>
          <Button
            variant={playing ? "secondary" : "teal"}
            className="tour-play"
            aria-pressed={playing}
            onClick={play}
          >
            {playing ? <Pause /> : <Play />}
            {playing ? "Pause tour" : last ? "Replay tour" : "Play tour"}
          </Button>
        </div>
      </header>
      {notice && (
        <p role="status" className="px-5 pt-3 text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      <motion.section
        className="tour-stage"
        key={index}
        initial={allowed ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: allowed ? 0.24 : 0 }}
      >
        <div className="tour-story">
          <p className="kicker">{slide.chapter}</p>
          <h1>{slide.title}</h1>
          <p className="tour-detail">{slide.detail}</p>
          <div className="tour-guide">
            <ProofAvatar mood={playing ? "talking" : "idle"} className="tour-guide-avatar" />
            <div>
              <p className="tour-guide-name">Proof’s guide</p>
              <p>{slide.narration}</p>
            </div>
          </div>
          {last && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="teal">
                <Link to="/practice" search={{ new: true }}>
                  Start a live practice <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/practice" search={{ example: true }}>
                  Open a fixed example
                </Link>
              </Button>
            </div>
          )}
        </div>
        <div className="tour-visual">
          <SlideVisual index={index} />
        </div>
      </motion.section>
      {notes && (
        <aside className="tour-notes">
          <strong>Speaker notes</strong>
          <p>{slide.notes}</p>
        </aside>
      )}
      <footer className="tour-footer">
        <div className="tour-progress" aria-hidden>
          {SLIDES.map((_, j) => (
            <span className={j <= index ? "is-read" : ""} key={j} />
          ))}
        </div>
        <div className="tour-controls">
          <Button
            size="lg"
            variant="ghost"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous chapter"
          >
            <ArrowLeft /> Back
          </Button>
          <span aria-live="polite" aria-atomic="true">
            {index + 1} / {SLIDES.length}{" "}
            <span className="hidden sm:inline">· {slide.chapter}</span>
          </span>
          {last ? (
            <Button asChild size="lg" variant="outline">
              <Link to="/">Finish tour</Link>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              onClick={() => go(index + 1)}
              aria-label="Next chapter"
            >
              Next <ArrowRight />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

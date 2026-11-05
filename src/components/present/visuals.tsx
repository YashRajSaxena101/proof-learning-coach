import { useState } from "react";
import { ArrowDown, Check, FileText, GitBranch, MessageCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProofAvatar } from "@/components/companion/ProofAvatar";
import { ParticleField } from "@/components/fx/ParticleField";

export function SlideVisual({ index }: { index: number }) {
  const [choice, setChoice] = useState<"check" | "retry" | null>(null);
  const [hint, setHint] = useState(false);
  if (index === 0 || index === 6)
    return (
      <div className="tour-orbit" aria-label="Proof, your study companion">
        <ParticleField
          variant="ring"
          density={0.2}
          className="pointer-events-none absolute inset-0 opacity-65"
        />
        <div className="tour-orbit-line" aria-hidden />
        <ProofAvatar mood={index === 0 ? "idle" : "happy"} className="tour-lead-avatar" />
      </div>
    );
  return (
    <div className="tour-exhibit">
      {index === 1 && (
        <>
          <div className="tour-exhibit-title">
            <MessageCircle aria-hidden /> Interview prompt
          </div>
          <blockquote>
            “The customer saw a timeout. How would you find out whether the payment went through?”
          </blockquote>
          <p className="tour-exhibit-foot">Fictional backend engineering interview</p>
        </>
      )}
      {index === 2 && (
        <>
          <div className="tour-exhibit-title">
            <FileText aria-hidden /> Sample résumé
          </div>
          <h2>Backend engineering graduate</h2>
          <p>Built a checkout API with PostgreSQL. Traced failed requests during a team project.</p>
          <div className="tour-skills">
            <span>HTTP</span>
            <span>SQL</span>
            <span>Debugging</span>
          </div>
          <ArrowDown aria-hidden className="my-4 size-5 text-teal" />
          <div className="tour-inset">
            <strong>Suggested practice focus</strong>
            <p>Explain how to recover safely after a payment timeout.</p>
          </div>
        </>
      )}
      {index === 3 && (
        <>
          <div className="tour-exhibit-title">
            <GitBranch aria-hidden /> Prepared decision
          </div>
          <h2>The gateway timed out.</h2>
          <p>There is no confirmation in the application log. The customer is still waiting.</p>
          <div className="mt-5 grid gap-2">
            <Button
              variant={choice === "check" ? "secondary" : "outline"}
              aria-pressed={choice === "check"}
              onClick={() => setChoice("check")}
            >
              Check the original payment
            </Button>
            <Button
              variant={choice === "retry" ? "secondary" : "outline"}
              aria-pressed={choice === "retry"}
              onClick={() => setChoice("retry")}
            >
              Send a new charge immediately
            </Button>
          </div>
          {choice && (
            <div className="tour-inset mt-4" role="status">
              <strong>{choice === "check" ? "Check the evidence" : "Investigate the risk"}</strong>
              <p>
                {choice === "check"
                  ? "A lookup can distinguish a completed payment from one that never reached the gateway."
                  : "The first charge may have succeeded. A new payment request could charge the customer twice."}
              </p>
            </div>
          )}
        </>
      )}
      {index === 4 && (
        <>
          <div className="tour-exhibit-title">
            <MessageCircle aria-hidden /> Prepared coaching example
          </div>
          <p className="tour-chat-line">
            “I understand transactions. Why does the timeout matter?”
          </p>
          <div className="tour-inset">
            <strong>Proof</strong>
            <p>
              A missing reply tells us what the client saw. The gateway may still have processed the
              charge.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            aria-expanded={hint}
            onClick={() => setHint(!hint)}
          >
            {hint ? "Hide guiding question" : "Show guiding question"}
          </Button>
          {hint && (
            <p className="mt-3" role="status">
              Which request ID would help you look up the first attempt?
            </p>
          )}
        </>
      )}
      {index === 5 && (
        <>
          <div className="tour-exhibit-title">
            <RotateCw aria-hidden /> A new constraint
          </div>
          <h2>A webhook arrives twice.</h2>
          <p>How would you recognize the same event and avoid fulfilling the order twice?</p>
          <div className="tour-inset mt-5">
            <strong>What the learner can revisit</strong>
            <ul className="tour-checklist">
              {[
                "The decision they made",
                "Their first explanation and revision",
                "The help they asked for",
              ].map((item) => (
                <li key={item}>
                  <Check aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

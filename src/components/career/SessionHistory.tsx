import type { CareerSession } from "@/domain/career/contracts";
import { latestAnswersByStage } from "@/domain/career/attempts";
function Reflection({ answer }: { answer: CareerSession["answers"][number] }) {
  return (
    <details className="mt-4">
      <summary className="min-h-11 cursor-pointer py-3 text-sm text-teal">
        {
          { decisions: "Decision", interview: "Interview", transfer: "New constraint" }[
            answer.stage
          ]
        }{" "}
        reflection · {answer.feedback ? "AI coach feedback available" : "not AI evaluated"} ·{" "}
        {answer.helpUsed ? "with help" : "no coach help requested"}
      </summary>
      <p className="mt-2 break-words leading-relaxed">{answer.text}</p>
      {answer.feedback && (
        <div className="mt-3 text-muted-foreground">
          <p>{answer.feedback.message}</p>
          <p className="mt-2">Next question: {answer.feedback.nextQuestion}</p>
          <ul className="mt-2 list-disc pl-5">
            {answer.feedback.retrySuggestions.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
export function SessionHistory({ session: s }: { session: CareerSession }) {
  return (
    <div>
      {latestAnswersByStage(s).map((a) => (
        <Reflection key={a.stage} answer={a} />
      ))}
      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer py-3 text-sm text-teal">
          Full attempt history ({s.answers.length})
        </summary>
        <ol>
          {s.answers.map((a, i) => (
            <li key={a.id ?? i} className="border-l border-border pl-4">
              <p className="pt-3 text-xs text-muted-foreground">
                Attempt {i + 1}
                {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleString()}` : ""}
              </p>
              <Reflection answer={a} />
            </li>
          ))}
        </ol>
      </details>
      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer py-3 text-sm text-teal">
          Tutor transcript ({s.messages.length})
        </summary>
        {s.messages.length ? (
          <ol className="space-y-4">
            {s.messages.map((m, i) => (
              <li key={i} className="border-l border-border pl-4">
                <p className="text-xs text-muted-foreground">
                  {m.role === "user"
                    ? "You"
                    : s.source === "example"
                      ? "Example reflection · not AI"
                      : "AI coach"}
                </p>
                <p className="mt-1 whitespace-pre-line break-words leading-relaxed">{m.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">No coach conversation recorded yet.</p>
        )}
      </details>
      {!!s.choiceHistory?.length && (
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer py-3 text-sm text-teal">
            Decision history ({s.choiceHistory.length})
          </summary>
          <ol className="space-y-3">
            {s.choiceHistory.map((v, i) => {
              const d = s.scenario.decisions.find((d) => d.id === v.decisionId),
                c = d?.choices.find((c) => c.id === v.choiceId);
              return (
                <li key={i} className="text-muted-foreground">
                  {i + 1}. {d?.question} — {c?.label} · {v.helpUsed} help requests at this point
                </li>
              );
            })}
          </ol>
        </details>
      )}
    </div>
  );
}

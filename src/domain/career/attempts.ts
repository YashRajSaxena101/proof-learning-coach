import type { CareerSession } from "./contracts";
export type AnswerStage = "decisions" | "interview" | "transfer";
export const answerStage = (s: CareerSession): AnswerStage => s.stage === "complete" ? "transfer" : s.stage;
export const attemptForStage = (s: CareerSession) => s.answers.filter(a => a.stage === answerStage(s)).at(-1);
export const latestAnswersByStage = (s: CareerSession) => (["decisions", "interview", "transfer"] as const).flatMap(stage => {
  const latest = s.answers.filter(a => a.stage === stage).at(-1); return latest ? [latest] : [];
});
export const attemptMatchesChoices = (s: CareerSession, attempt: CareerSession["answers"][number] | undefined) => {
  if (!attempt) return false;
  if (!attempt.choices) return true; // Legacy history remains readable; captured before a revision.
  return Object.keys({ ...s.choices, ...attempt.choices }).every(id => s.choices[id] === attempt.choices?.[id]);
};
export function reviseChoice(s: CareerSession, decisionId: string, choiceId: string, createdAt: string): CareerSession {
  if (!s.scenario.decisions.some(d => d.id === decisionId && d.choices.some(c => c.id === choiceId))) return s;
  if (s.choices[decisionId] === choiceId) return s;
  const initial = s.choiceHistory ?? Object.entries(s.choices).map(([id, choice]) => ({ decisionId: id, choiceId: choice, createdAt: s.createdAt, helpUsed: s.helpUsed }));
  return { ...s, choices: { ...s.choices, [decisionId]: choiceId },
    answers: s.answers.map(a => a.choices ? a : { ...a, choices: { ...s.choices } }),
    choiceHistory: [...initial, { decisionId, choiceId, createdAt, helpUsed: s.helpUsed }].slice(-100),
  };
}
export const canAdvance = (s: CareerSession, pending: boolean) => {
  const attempt = attemptForStage(s);
  if (pending || !attempt || !attemptMatchesChoices(s, attempt)) return false;
  const draft = s.drafts?.[answerStage(s)];
  if (draft !== undefined && draft !== attempt.text) return false;
  return s.source === "example" || (!!attempt.feedback && attempt.status !== "pending" && attempt.status !== "failed");
};
export function latestFeedback(sessions: CareerSession[]) {
  return sessions.flatMap(session => session.answers.flatMap((attempt, index) => attempt.feedback ? [{
    feedback: attempt.feedback, sessionId: session.id, stage: attempt.stage,
    time: Date.parse(attempt.feedbackAt ?? attempt.createdAt ?? session.createdAt), index,
  }] : [])).sort((a, b) => b.time - a.time || b.index - a.index)[0];
}
/** A response belongs to exactly one session, stage, attempt and request generation. */
export function feedbackRequestGate() {
  let generation = 0;
  return {
    begin(sessionId: string, stage: AnswerStage, attemptId: string) { return { generation: ++generation, sessionId, stage, attemptId }; },
    cancel() { generation++; },
    accepts(token: { generation: number; sessionId: string; stage: AnswerStage; attemptId: string }, sessionId: string, stage: AnswerStage, attemptId: string) {
      return token.generation === generation && token.sessionId === sessionId && token.stage === stage && token.attemptId === attemptId;
    },
  };
}
import type { CareerSession } from "./contracts";
export type AnswerStage = "decisions" | "interview" | "transfer";
export const answerStage = (s: CareerSession): AnswerStage => s.stage === "complete" ? "transfer" : s.stage;
export const attemptForStage = (s: CareerSession) => s.answers.filter(a => a.stage === answerStage(s)).at(-1);
export const canAdvance = (s: CareerSession, pending: boolean) => {
  const attempt = attemptForStage(s);
  if (pending || !attempt) return false;
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
export function composeTutorMessage(message, nextQuestion) {
  return message.slice(0,1598) + "\n\n" + nextQuestion;
}
export function coachingInstruction(action, intent) {
  const base = "In message, directly address the learner's actual question or reasoning with a useful, scenario-specific explanation; do not merely praise, repeat the task, or imply competence without evidence. In nextQuestion ask one short further check. Coaching is guidance, not certification.";
  if (action === "feedback") return base + " Evaluate the submitted answer against the scenario rubric, identify specific supported strengths and gaps, and suggest a concrete revision without claiming verified mastery.";
  if (intent === "simpler") return base + " Explain the requested concept in plain language, define unfamiliar terms, and use the scenario's facts without providing a complete interview answer.";
  if (intent === "example") return base + " Give a concrete alternate example that clarifies the concept without providing the complete exercise answer.";
  if (intent === "hint") return base + " Provide a specific guiding question or small actionable hint. If the learner explicitly asks how a concept works, briefly explain that concept before the guiding question, without giving a complete exercise answer.";
  return base + " Explain the relevant concept and ask a focused follow-up without giving a complete exercise answer.";
}

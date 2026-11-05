export const SLIDES = [
  {
    chapter: "Meet Proof",
    title: "Practice the work behind the interview.",
    detail: "A personalized learning coach for graduates preparing for their first role.",
    narration:
      "Hi, I’m Proof. Bring me a role you want or a résumé you’re working from. We’ll turn something you’ve learned into a decision you can explain in an interview.",
    notes:
      "Introduce the graduate audience. This guided example uses fictional résumé details. The Practice page runs live coaching.",
    seconds: 13,
  },
  {
    chapter: "The problem",
    title: "A term is easy to remember. A decision takes practice.",
    detail:
      "A graduate can define a database transaction and still struggle to explain what to do when a payment times out.",
    narration:
      "Imagine an interviewer asks what happens when checkout times out after the customer has paid. You know the vocabulary. Now you need to explain what you’d check before retrying.",
    notes:
      "Read the interviewer’s question. Ask the judges to think of one piece of evidence they would want.",
    seconds: 14,
  },
  {
    chapter: "Personalization",
    title: "Start with the work you already know.",
    detail:
      "Upload a résumé, review its text, and choose which suggested role, skills, and practice focus to use.",
    narration:
      "This learner built a checkout API and wants a backend role. I suggest practicing safe retries. They can edit that focus, tell me how experienced they are, and ask for the specific help they want.",
    notes:
      "In Practice, a user can bring a file, paste text or skip the résumé. Only reviewed text goes to the AI for analysis. The learner confirms the focus.",
    seconds: 15,
  },
  {
    chapter: "Workplace rehearsal",
    title: "Would you retry the payment?",
    detail:
      "The gateway timed out. A teammate wants to retry immediately. Pick an approach and inspect its consequence.",
    narration:
      "Here’s your team’s request. We want to recover the checkout without charging the customer twice. Choose an approach. I’ll show what your decision changes, and what remains uncertain.",
    notes:
      "Invite a judge to choose either response. These are prepared tour choices. The actual coach generates a new scenario from the profile.",
    seconds: 17,
  },
  {
    chapter: "Contextual tutoring",
    title: "Ask the question holding you back.",
    detail:
      "Proof can explain a concept, offer another example, or help you revise an answer in the context of your task.",
    narration:
      "A timeout leaves the outcome uncertain. Let’s look up the payment before sending another charge. What identifier would let you match the retry to the original purchase?",
    notes:
      "The illustrated exchange is prepared for the tour. Live tutor and companion replies use Ollama through the external Supabase function.",
    seconds: 14,
  },
  {
    chapter: "Transfer",
    title: "Change one constraint. Try the reasoning again.",
    detail:
      "Explain the decision in interview language, then test it when the same problem arrives in a different form.",
    narration:
      "Now the duplicate comes from a delayed webhook instead of a checkout retry. Which part of your approach still works? Your decisions, explanations, and help requests give you something concrete to revisit.",
    notes:
      "Evidence records what the learner did and how their reasoning evolved. Learning gains still need a learner pilot.",
    seconds: 15,
  },
  {
    chapter: "Try Proof",
    title: "Bring one question from your next interview.",
    detail:
      "Choose a role or topic, describe what you want help with, and rehearse your first decision.",
    narration:
      "Try a live practice with your own interests, or open a fixed example right away. I’ll be in the corner if you have a question. A new constraint will be waiting when you’re ready.",
    notes:
      "Open the public practice if time allows. Career practice saves in this browser. Fixed examples remain available during service limits.",
    seconds: 12,
  },
] as const;

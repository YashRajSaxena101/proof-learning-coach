# Proof Learning Coach

Proof helps college graduates practice the work behind a job interview. Learners choose a role or topic, describe their experience and interests, and answer a short starting question. The AI coach generates a fictional workplace scenario with decisions, constraints, evidence, an interview question, and a related challenge in a new context.

The aim is to turn concepts into reasoning a learner can explain: make a choice, ask for help, explain a tradeoff, receive feedback, revise, and try another constraint. Choices, attempts, revisions, and help requests remain visible. Proof does not claim to measure job readiness or guarantee employment.

- [Public Lovable application](https://proof-learning-coach.lovable.app)
- [Existing Lovable project](https://lovable.dev/projects/25cd456b-a1ba-496d-9f5b-2887b65879bd)
- [Hackathon problem statement](https://aibizclub.org/utds-biggest-no-code-problem-statement)

## Experience

Learners can start with an optional PDF, DOCX, TXT or pasted résumé. The browser extracts an editable excerpt. Explicit AI analysis sends that excerpt through Supabase to Ollama and returns role and skill suggestions with supporting quotations. Only the confirmed practice focus is added to the learning profile.

Proof, the floating comet companion, offers contextual chat, responds to practice feedback and sleeps after one minute of inactivity. The Present link opens a seven-chapter prepared tour with a sample decision, speaker notes, manual or timed playback, and optional browser narration when voices are available.

Six starting directions cover AI engineering, data analysis, software engineering, cloud/DevOps, cybersecurity, and product/business. Learners can enter their own topic. AI generation uses the complete learning profile; fixed examples use only the selected topic and are clearly labeled as non-AI exercises.

The dark interface includes centered interactive canvas particles, scroll-driven storytelling, motion-aware page transitions, an introductory practice studio, and six bounded scene compositions. Generated scenes are validated data, not executable code. Decision consequences appear after the learner commits, and every recorded decision can be inspected separately.

The original deterministic revenue investigation remains available at `/learn`, with its existing evidence, instructor sample, account integration, and data tests.

## Development

Use the committed Bun lockfile for reproducible dependencies:

```sh
bun install --frozen-lockfile
bun run dev
bun run test
bunx tsc --noEmit
bun run build
```

The frontend uses React, TypeScript, TanStack Start, Tailwind, Motion, and accessible Radix components. Source rules are in `AGENTS.md`. Push ordinary commits to the connected `main` branch to sync changes into Lovable; never rewrite published history.

## AI and persistence

The external Supabase project runs the separate `career-coach` function. It validates caller ownership, stores scenarios and bounded conversation context privately, applies atomic inference budgets, and calls the configured Ollama provider. Provider credentials stay server-side. See `supabase/VERIFICATION.md` for deployed source details, security checks, and known limits.

Career practice saves in the current browser. Signing in does not currently sync career history across devices. The original sample-case account sync is separate. Guest capabilities are private session credentials: never put them in URLs, logs, analytics, screenshots, or exports.

Generated output can be inaccurate or fail schema validation. Failures keep the learner's inputs and offer retry or an explicitly unevaluated continuation; fixed examples remain available. Software checks are not evidence of learning gains. A learner study is still future work.

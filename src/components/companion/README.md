# Proof companion

Original editable SVG character, implemented as layered React SVG and scoped CSS. No official character, university mark, or other brand asset is used.

- `ProofAvatar` accepts `mood` (`idle`, `happy`, `sad`, `bored`, `talking`, `asleep`) and optional `className`.
- `ProofCompanion` is mounted once outside keyed page content; the app hides it in presentation mode.
- Sleep has a 60,000ms wall-clock deadline. Activity resets it while awake; only explicit Wake resumes it. Background timer throttling is reconciled against the original deadline on visibility/activity, so returning to a suspended tab does not grant a fresh minute.
- One local idle prompt can appear after 35 seconds, at most once per two minutes. Quiet mode suppresses local prompts and reactions. Neither a prompt nor an assessment reaction sends a request.
- Chat sends only after explicit submission through `askCompanion`; close, context change, sleep, and unmount abort and invalidate pending responses. Latest learner-selected profile is the default context. History is cleared when role/interest/session changes.
- Historical feedback is seeded before subscriptions. New career feedback is quoted as coach evidence rather than binary correctness. Only fresh deterministic original-sample events use their boolean outcome.
- OS reduced motion and the app's pause preference stop character motion. Controls support keyboard navigation, Escape, named buttons, and focus on opening/waking.

`design/proof-character.svg` is the editable idle drawing; `design/character-preview.html` shows six animated moods; `design/character-preview.png` is the inspected rendered board.

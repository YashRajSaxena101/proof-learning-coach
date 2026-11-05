<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All scenario math and learning rules live as pure functions in `src/domain/` with unit tests; UI never computes totals inline — keeps numbers verifiable.
- The original sample case keeps its ProgressRepository and external account sync; career practice uses a separate validated versioned repository so no original records are overwritten.
- The keyword rubric (`src/domain/curated-feedback.ts`) must always be labeled as non-AI fallback.
- Use the user's external Supabase project, never Lovable Cloud.
- Supabase client uses the external project's publishable key (`src/integrations/supabase.ts`); RLS enforces ownership.
- AI teach-back evaluation runs only in the user's deployed Supabase Edge Function `proof-coach` (called via `src/services/coach.ts` after inserting a `teach-back` attempt); it alone writes `learning_evaluations`. The client validates its response and never records fallback or client results as AI evaluations.
- Visual system is dark-only via tokens in `src/styles.css`; decorative motion (canvas particles, tilt, scroll scenes) must respect `useMotionPref()` (`src/lib/motion-pref.ts`) so OS reduced-motion and the header pause toggle both stop it.
- The site header and route-transition wrapper live in `__root.tsx` (header hidden on /present); only route content is keyed per pathname so stores/auth never remount.
- Career scenario, profile, graph, request and feedback contracts live in src/domain/career; render data-only scenes and gate consequences on committed choices to preserve diagnostic integrity.
- Career AI is called only through the external career-coach service; browser-stored feedback is display history, never authoritative evaluation. No substitute inference endpoint may be opened without verified caller ownership and durable budgets.
- Career guest access uses a private device-stored capability returned by career-coach, never anonymous Auth; exclude it from all UI, URLs, exports and logging because it grants scoped access.
- Career feedback requests are scoped to a session, stage, attempt and cancellation generation; retain stage drafts separately and gate advancement on resolved feedback or explicit failure skip to prevent stale assessment displays.
- Career scene geometry and simulated choice effects are pure seeded domain functions; render six bounded domain compositions with instance-scoped SVG definitions to keep visual meaning testable and accessible.
- Career decisions retain append-only choice history and each reflection's choice snapshot; changing a choice invalidates current-feedback display without deleting prior attempts or help.
- Fixed examples skip calibration and remain topic templates; setup/stage transitions focus their heading, while presentation shortcuts never intercept interactive controls.

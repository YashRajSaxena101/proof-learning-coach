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
- Persistence goes through the `ProgressRepository` interface (`src/services/progress-store.ts`); only the browser-local implementation exists until the external Supabase project is wired — swap without touching UI.
- The keyword rubric (`src/domain/curated-feedback.ts`) must always be labeled as non-AI fallback.
- Use the user's external Supabase project, never Lovable Cloud.
- Supabase client uses the external project's publishable key (`src/integrations/supabase.ts`); RLS enforces ownership.
- AI teach-back evaluation runs only in the user's deployed Supabase Edge Function `proof-coach` (called via `src/services/coach.ts` after inserting a `teach-back` attempt); it alone writes `learning_evaluations`. The client validates its response and never records fallback or client results as AI evaluations.
- Visual system is dark-only via tokens in `src/styles.css`; decorative motion (canvas particles, tilt, scroll scenes) must respect `useMotionPref()` (`src/lib/motion-pref.ts`) so OS reduced-motion and the header pause toggle both stop it.
- The site header and route-transition wrapper live in `__root.tsx` (header hidden on /present); only route content is keyed per pathname so stores/auth never remount.

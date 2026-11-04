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
- Any live AI coach must run in a server function (`src/server/`); the browser uses the `TeachingCoach` interface and must label the scripted coach as non-AI.
- Use the user's external Supabase project, never Lovable Cloud.

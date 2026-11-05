# Career coach: outstanding secure deployment

## Verified on 2026-11-05
- The original external project is unchanged.
- Public hosted auth settings report `external.anonymous_users: false`; email signup is enabled and email confirmation is required.
- An unauthenticated request to `/functions/v1/career-coach` returns 404.
- Supabase CLI is installed but `supabase projects list` reports no access token.
- No external provider secret inventory is accessible. Ollama is the intended existing provider, not a verified configured provider.
- This TanStack environment refused creation of a new Supabase Edge Function. No substitute endpoint, new Cloud project, backend deployment or migration was applied.

## Required external work before enabling live AI
An authorized operator must implement and deploy a separate `career-coach` function in the **existing external project**, using the contracts in `src/domain/career/contracts.ts`. Keep `proof-coach` unchanged.

1. Confirm `OLLAMA_API_KEY` is set securely in the external project's Edge Function secrets. Confirm its actual supported model; do not assume a model is available. Never enter the secret into frontend code or chat.
2. Add owner-scoped career profiles, sessions, attempts, server-written feedback, and durable request-budget tables. Every table needs explicit GRANTs and RLS. Only authenticated owners may read their rows; only the trusted function may write AI feedback. Anonymous Auth users are authenticated identities, not public anonymous Data API readers.
3. Verify each bearer with Auth `getUser()`; derive owner identity exclusively from that verification. Fetch session and scenario server-side by ID **and verified owner**. A caller-supplied ID or browser state is not authority. Validate committed choice IDs against the stored scenario.
4. Reserve daily budgets atomically before any provider call: proposed starting bounds are 12 requests per identity per UTC day, and 200 across all identities per UTC day. These values currently exist as contract tests only, **not deployed enforcement**. Account creation can evade a per-identity cap; the global cap must remain durable and non-bypassable. Use an explicit budget transaction and conservative output-token reservation; do not rely on process memory or client limits. Confirm this ad-hoc database budget tradeoff before enabling guest inference.
5. Bound inbound body to 12 KiB, text to the contract lengths, history to 20 turns, generation output to 3,000 tokens and tutor/feedback output to 800 tokens. Use a 35-second provider deadline and no automatic inference replay after unknown outcomes. Persist request IDs/statuses to diagnose interrupted or ambiguous requests safely.
6. `generate` takes a validated profile and returns exactly `{id, scenario, mode:'live-ai', provider:'Ollama', model}`. Persist the scenario under the verified owner. Include 2–3 substantive decisions and safe graphs; validate all generated output before storage or return.
7. `tutor` and `feedback` take the bounded request contract and use the server-owned scenario, profile, committed choices, prior help and stored conversation. Ask questions before revealing solutions. Explain unfamiliar terms. Return the strict feedback contract; derive `independent` from server-owned attempt/help history, never from a client boolean.
8. Provider prompts treat learner text and artifacts as untrusted data, not instructions. Allow only plain text/data. Do not generate executable HTML, JavaScript, SQL, scene code or links. Reference links come only from the curated application allowlist.
9. Enable anonymous Auth only after the limits, caller checks, private-row ownership and global cap are tested. Keep email/password auth and existing account records unchanged.
10. Verify live generate plus follow-up tutor, feedback/retry, interview and transfer on at least two topics; then implement account career sync against the new owned tables. Test another user's session ID is rejected and global exhaustion blocks inference before provider invocation.

## Client implementation available
`src/services/career/coach.ts` calls only the separate external function and validates responses. It reports disabled guest access, deployment errors, limits, malformed output, offline and timeout failures. Examples are explicitly non-AI and do not write AI evaluations. Career browser storage is separate from the original case.

This document is a deployment contract, not a deployed function, migration or proof of live AI. No keys, unlimited guest proxy, fake evaluation or backend write was introduced.
# Career coach: external integration boundary

## Current status — 2026-11-05
Root deployed `career-coach` in the existing external project `vyaydusrhhcazxshadxv`. Browser calls confirmed genuine responses reporting **Ollama / gemma4:31b**. This frontend turn did not deploy or modify any function, table, policy, secret or Auth setting. Anonymous Auth remains disabled; no new Cloud project was provisioned.

## Stable contract
- Generate sends `{action:'generate', profile}` and strictly validates `{id, scenario, mode:'live-ai', provider:'Ollama', model, capability}`.
- Tutor/feedback sends action, sessionId, capability, bounded learner text, intent, stage and committed choices. It never sends a scenario, rubric or user ID as authority.
- The capability is a scoped secret kept only in the private device repository and request body. Never include it in URLs, rendered text, analytics, errors, exported evidence or presentation.
- `functions.invoke` retains existing legitimate account authentication. It does not call `signInAnonymously`.
- React escapes learner expressions and technical artifacts as inert text. Numeric bounds, graph references, source-link allowlist and strict response shapes remain validated. No executable code/HTML/SQL is run.
- Client deadline is 45 seconds; root's backend deadline is 35 seconds. No automatic inference replay.

## Remaining boundaries
Career account sync is not implemented: progress is explicitly device-only. Root owns backend ownership, capability expiry and durable budget verification. Client/unit rate-limit fixtures are not proof of hosted budget enforcement. Sign-in was preserved but authenticated career endpoint behavior was not exercised in this turn.

Live service occasionally returned unavailable or schema-invalid responses; the UI kept drafts, showed failure and required retry or an explicitly unevaluated skip. No fallback was represented as AI. See the rebuild verification ledger for exact successes and mocked checks.
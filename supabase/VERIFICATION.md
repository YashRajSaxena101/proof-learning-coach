# Career coach deployment and verification

The separate function `career-coach` is deployed to external project vyaydusrhhcazxshadxv, version 8, SHA-256 d04130d708e6ea5cf430b58c4c73b46718f0683a1bf8a1235956a97e94bb35a1. Existing `proof-coach` is unchanged. Apply the source migrations in order: `career_coach.sql`, then `career_coach_atomic_append.sql`. The first creates server-only tables and budget RPC; the second adds atomic history append and changes the per-IP cap. Deploy all five files: `index.ts`, `contracts.ts`, `normalize.mjs`, `output-safe.mjs`, and `tutor-format.mjs`.

## Wire contract

POST JSON to `/functions/v1/career-coach`. For a guest omit Authorization or send the existing publishable/anon key normally used by the client. For an authenticated user send the actual Supabase access token; it is verified with Auth. The publishable key is not a user credential.

- Generate: `{action:"generate",profile:{topic,experience,interest,goal,minutes,diagnostic}}`; returns `{id,capability,scenario,mode:"live-ai",provider:"Ollama",model}`. Retain the opaque capability privately with the corresponding session. It expires after 24 hours; do not put it in URLs, logs, analytics, or account-visible shared data.
- Follow-up: `{action:"tutor"|"feedback",sessionId,capability,text,intent,stage,choices?}`; returns the existing strict feedback schema. `intent` is hint/simpler/example/answer and `stage` decisions/interview/transfer. Choice IDs are validated against the server-owned scenario. The server atomically appends messages and merges valid choice selections. It conservatively sets `independent:false`.
- On 400, 401, 403, 413, 429, or 503 retain learner inputs; show an appropriate error and retry control. A 503 can mean configuration, timeout, provider, validation, budget, storage or client-IP failure. No provider credential is returned.

The frontend must accept/store the extra capability field and attach it to subsequent requests, remove anonymous-sign-in precheck, and allow bounded technical snippets as inert text. Model output is escaped text, never executable markup, and references remain the client allowlist. A signed-in session is bound to both verified user and capability; guest sessions require the capability. There is currently no capability recovery or cross-device account sync; server records are not directly readable by clients.

## Cost and security bounds

Reservations occur atomically before each inference: 200 global and 48 per IP per UTC day; a session allows 12 calls including generation. Input is capped at 12 KiB; learner text at 2,000 characters, history at 20 messages, model output at 3,000 tokens for generation or 800 for follow-up, with a 35-second provider deadline and 40-second request deadline. No automatic provider retry. Daily limits are request/token ceilings, not a guaranteed monetary price. IP enforcement depends on managed gateway `cf-connecting-ip` provenance. A direct forged header received HTTP 403 in this project, but an enduring platform guarantee was not independently established.

## Evidence

- Existing provider secret is configured sufficiently for live inference; no secret value was inspected. v3 generated and followed up successfully for Data analyst and Cybersecurity. v5 generated Data analyst and completed tutor/feedback; separate SQL/angle-bracket input generated and got feedback successfully. v5 Cybersecurity generation also returned `AI_INVALID_RESPONSE` once; a previous v3 Cybersecurity generation and both follow-ups worked. This is a real intermittent limitation. The exact cause is not established.
- `node --test output/backend/live.test.mjs` passed malformed request 400 and forged capability 403 on v5. The generation/tutor scripts print statuses only, not capabilities or provider credentials.
- SQL transaction checks returned false for exhausted global, per-IP, and per-session reservations; anon cannot read session records or execute reservation/append functions. Two parallel append RPCs to an isolated temporary guest record retained all four messages, two help increments, and both independent choice keys; the temporary record was removed.
- Security advisor reported only informational no-policy findings for the two intentionally service-only career tables plus the pre-existing private usage table. Do not add broad client policies.
- The function logs schema paths/error categories only. Timeout and absent-key error paths, live signed-in JWT access, UI integration, forced provider failure, and cross-device recovery were not live tested by this backend audit. The phrase guard and quote checks reduce some unsupported claims but do not establish semantic correctness or prevent all misleading feedback.

## Version 6 diagnosis and targeted checks

- Bounded logs subsequently identified two `decisions[0].id` invalid-string failures, one `artifacts[0].detail` custom text-refinement failure, and one malformed JSON failure. No raw provider output was logged. The artifact failure does not reveal the rejected text or prove a particular root cause.
- Decision and choice IDs are opaque; version 6 normalizes invalid/duplicate nonempty string IDs deterministically before running the complete unchanged scenario schema. It never invents missing/non-string IDs or alters scene node/edge references. Prompt specifies ID lengths. Model text rejects the same markup and URL patterns as the frontend at commit 9baae905; other scenario and feedback constraints match. No validation was weakened.
- Fixture tests first reproduced the ID and text-filter mismatch, then all seven fixture and malformed/forged-request tests passed. Two live generation calls returned HTTP 200 with valid IDs and appropriate Data and Cybersecurity scene domains. These limited probes do not establish a failure rate. Malformed/truncated JSON and other invalid outputs still fail closed with 503; there is no automatic retry.

## Version 7 tutoring

Tutoring instructions now require a useful response to the learner's actual question and specify distinct simpler, example, hint, and feedback behavior. The server stores `message.slice(0,1598) + "\n\n" + nextQuestion` as the coach turn so the full follow-up can be included in subsequent context. This must match the client rendering rule. Fixtures verify composition at maximum lengths and the intent instructions; all seven local format, normalization, and text-filter tests passed.

In the two-call live probe, AI engineer generation succeeded but its tutoring call returned `AI_INVALID_RESPONSE` (503). The revised coaching quality and persisted composed history were therefore not verified live; no additional provider calls were made.

## Version 8 tutoring diagnostics

The v7 failure was recorded as malformed provider JSON, before response schema validation. Its exact cause, including whether output was truncated, remains unknown. Version 8 adds only bounded parse position, output length, completion category and token-count diagnostics, plus schema paths for feedback validation; no raw provider output or credentials are logged. No validation rule was relaxed and no retry was added.

Two further live tutor calls using an isolated guest fixture both returned 200 in approximately two seconds. The first gave concrete steps for comparing an LLM judge with human labels and asked about sample coverage; the second explained agreement and differences across query types. The stored history contained four messages and two help requests, and included the composed follow-up. The isolated fixture was deleted. Nine fixture and security tests passed. This small sample does not establish reliability or factual accuracy; the first explanation overstated the certainty provided by agreement and the second's example was imprecisely worded.

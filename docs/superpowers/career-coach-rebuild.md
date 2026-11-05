# Proof career-coach rebuild

Implementation is autonomously approved. Do not publish in this turn. Preserve the external Supabase project, existing authentication, old case, and old records.

## Steps
1. Add tested, bounded profile/scenario/feedback/graph contracts and versioned guest persistence, separate from the original case.
2. Add an additive external `career-coach` Edge Function and owned tables. Validate callers independently, keep provider credentials server-only, and enforce durable user/global request budgets before inference.
3. Build short onboarding, calibration, generation, interactive rehearsal, grounded coaching, retries, interview explanation and transfer.
4. Replace primary home/dashboard/navigation with graduate-first practice; retain old URLs and sample case. Reuse semantic dark tokens and motion preference. Remove homepage/auth illustration.
5. Test domain/storage/security boundaries and browser flows on desktop/mobile, reduced motion, failure and reload paths. Record live versus simulated verification honestly.

## Secure deployment constraint
Root has now deployed the external career-coach using Ollama. This integration turn modifies only frontend/domain contracts; no backend, Auth configuration, secrets, tables or policies were changed. Guest sessions use private scoped capabilities, not anonymous Auth. Backend security and durable limits remain root-owned. Examples stay explicitly non-AI; career history stays device-only.

## Integration steps — implemented
1. Add required generation capability, optional backward-compatible session capability and bounded learner strings. Preserve strict scenario shape and inert text rendering.
2. Regression tests before fixes: custom topic lengths 73/85/100, stage/attempt/request isolation, failed feedback retry, latest timestamped feedback and capability reload.
3. Persist stage drafts and timestamped attempts. Abort/invalidate on edits, exit, session/stage change; block pending advancement and expose explicitly unevaluated failure skip.
4. Render six seeded workplace compositions, actual committed consequences, simulated tradeoff interpretation and accessible node controls. Pause removes autonomous packet loops.
5. Verify real external calls and screenshots; update truthful availability/presentation copy. Preserve badge safe area, accounts and old sample case. Do not publish.

## Integration verification ledger — 2026-11-05
- **68/68 tests pass across eight files**, including two rendered-workspace regressions. All original domain/store tests remain passing. Latest automatic harness: **build OK at 01:43:02 UTC**, includes typecheck. No manual build/typecheck was run per platform rules.
- **Live provider:** responses identify Ollama, model `gemma4:31b`. No secret values inspected or emitted. Root's deployment was used, not changed.
- **Live desktop 1280×1800:** Data analyst generation → meaningful decisions → contextual tutor → decisions feedback → interview feedback → transfer feedback → completion/dashboard. Continue disabled while each response pending, enabled only after validated feedback. Software engineer and custom Marine robotics/underwater autonomy generated different titles, constraints and software scenes. Multiple unique Data analyst generations succeeded.
- **Live mobile 390×844:** Data analyst generation, feedback, revision/retry feedback succeeded. Interview draft with C++ and `<` preserved on reload; previous-stage draft restored. Scoped capability persisted without appearing in page text. A separate fresh desktop generation/reload/tutor succeeded, confirming continued guest access after reload.
- **Live failures observed:** some AI-engineer generation calls returned service unavailable; one initial Data analyst feedback was schema-invalid; a mobile post-reload tutor failed. Errors were visible and work retained. Later desktop Data analyst feedback and reload tutor succeeded. Software artifacts initially failed an overstrict SQL/text filter; inert technical artifact validation correction allowed subsequent real Software generation. No mocked result labeled live.
- **Mocked checks:** delayed response/edit/cancel/retry and stage isolation (rendered tests); malformed response, missing capability, 404, 429, offline (unit tests). Browser 503 feedback showed disabled Continue plus explicit unevaluated skip, retained answer after reload. Browser accelerated timeout produced timeout message and kept diagnostic. Browser offline error kept inputs. These do not verify a real provider deadline or hosted budgets.
- **Visual checks:** all six topic scenes on mobile, final five updated scene compositions on desktop/mobile; no horizontal overflow. Seven-node spacing and seed differences covered by domain tests. OS reduce and pause yielded zero SVG packet loops; resume restored three loops. Hero reading island, auth/sample pages and routes inspected. Pitch reduced-motion blank state was found and corrected; Next/Prev then clicked correctly on desktop/mobile, with 56px badge area preserved.
- **Screenshots:** `/tmp/browser/career-integration/` contains generation, stage-feedback, progress, reload tutor, mobile route, hero, pitch and scene captures. Selected final screenshots were opened and inspected.
- **Not verified/not changed:** hosted budget/security/ownership tests remain root-owned; signed-in career endpoint behavior and account career sync are not verified. No backend changes or publication. Platform manages source revisions; no stateful Git command or manual commit.

## Previous rebuild ledger (historical, superseded availability status)
## Independent source review — 2026-11-05
- Decision revisit/compare preserves initial choice history, answer snapshots, attempts and help. Changing a choice requires new feedback for that version; historical feedback remains readable. Stage Back aborts pending work and restores drafts.
- Dashboard shows latest reflection for decisions/interview/transfer plus expandable complete retained attempt history, tutor transcript and decision history. The private capability is never included in these views.
- Fixed examples now enter directly after topic selection, without experience/diagnostic calibration. Setup, fallback and workspace copy explain that fixed topic examples are not personalized and custom examples are general reasoning templates. AI setup remains four views.
- Setup and stage heading focus and `aria-current="step"` verified in browser; `/progress` activates Progress. Coach placeholder is current-topic neutral.
- Pitch shortcuts ignore controls/editable targets and modifiers. Native Space on Notes toggles Notes without advancing; Space on a dot selects that slide; focused ArrowRight does not advance. All eight dot targets measured 44×44px on 1280 desktop and 390 mobile. Current dot uses aria-current, timer aria-live is off with start/end status only, interval clears at zero; 56px badge area preserved.
- **74/74 tests pass in ten files** (six added regressions since integration); latest automatic build/typecheck **OK at 01:48:36 UTC**. No manual build/typecheck or backend changes.
- Browser example flow: initial decision → reflection → interview → Back → changed decision → old Continue disabled → new reflection → interview/transfer → progress; original and revised reflections remained in four-attempt history. Full history and transcript opened. Setup/stage focus inspected. Desktop/mobile pitch screenshots opened and checked; no overflow/page errors.
- **Live Cybersecurity mobile:** generation, tutor and feedback all succeeded against deployed career-coach; current client contract preserved. Mobile progress transcript and long custom example checked without overflow. Existing integration ledger already records live Data analyst/Software/custom generation and coaching. No service-pending copy remains in home/About/pitch, and feedback.independent is not displayed as mastery or proof of unassisted success.
- Screenshots: `/tmp/browser/source-review/`. Publication intentionally excluded; account career sync and root-owned backend budget/ownership verification remain outside this task.

## Historical baseline

- Baseline: original case services, calculations, accounts and backend records unchanged. Old routes load; original 32 tests pass.
- Tests: 19 new contract/storage/coach-client tests; 51/51 total across five files.
- External: career-coach returns 404; CLI has no access token; hosted anonymous auth is disabled. Ollama secrets/configuration cannot be inspected. No provider inference, deployment or migration performed.
- Desktop 1280×1800: complete AI-topic example through two decisions, coach reflection, answer, interview, transfer, progress and reload. Different data/software scenes, custom Marine robotics example, hidden precommit tradeoffs and visible invalid-input rejection verified.
- Mobile 390×844: home, setup, decisions, progress, auth, original case, instructor and presentation screenshots inspected. No horizontal overflow. Reduced motion works; paused canvas stays unchanged after pointer/click/scroll and resumes afterwards.
- All ten content routes inspected on desktop; presentation Next/Prev click correctly. No page errors in the browser sweep.
- Actual generation failure preserves inputs. Offline, malformed output, missing function and rate-limit mapping are mocked client tests. Live tutor/feedback, provider timeout and server ownership remain unverified.
- Latest automatic harness reports build OK, including typecheck; no manual build/typecheck run per platform rules.
- Publication: intentionally excluded.
- Commits: managed by the platform; no stateful Git commands. Read-only revision observed before ledger update: `0eeb376e4b641314f527caaee15ccd12f22d2a68`.
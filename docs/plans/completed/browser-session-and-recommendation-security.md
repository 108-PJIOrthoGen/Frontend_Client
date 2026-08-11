# Execution Plan: Browser Session And Recommendation Security

Date: 2026-08-10

## Status

Completed

## Outcome

Access tokens and clinical/recommendation payloads are no longer persisted in
browser storage, switching or leaving a case cannot revive another case's AI
state, and backend recommendation reads/streams enforce the repository's
existing owner-or-admin medical-record policy before returning cached or DB
data.

## Context

- `src/apis/axios.custom.ts` currently persists the access token.
- `src/components/user/diagnose_steps/` currently persists clinical workflow
  payloads under global `pji_*` keys.
- `src/redux/features/patients/patientStorage.ts` persists the current case and
  clinic form.
- Backend `AiRecommendationServiceImpl#getRunDetail` currently reads Redis and
  DB by `runId` without applying the owner-or-admin rule already established by
  `DoctorRecommendationReviewServiceImpl#validateReviewAccess`.

## Scope

In scope:

- In-memory access-token lifecycle using the existing HttpOnly refresh cookie.
- In-memory, case-scoped diagnosis/recommendation workflow state.
- Clearing workflow/current-case state on case changes and logout.
- Authorization for recommendation detail/history/retry/stream before cache or
  data access, reusing the existing owner-or-admin policy.
- Focused frontend and backend validation.

Out of scope:

- Changing clinical recommendation algorithms or outputs.
- Persisting unfinished clinical drafts across a full page reload.
- Redesigning the global role/permission model.

## Approach

1. Measure GitNexus impact for every existing symbol that will change.
2. Add small in-memory token and diagnosis-workflow stores, then migrate all
   access-token and clinical browser-storage consumers.
3. Stop Redux patient persistence and clear session-bound state on logout/case
   transitions.
4. Apply the established owner-or-admin medical-record access rule to backend
   recommendation endpoints before Redis/DB response data is returned.
5. Add regression tests where existing test infrastructure supports them and
   run builds/tests plus GitNexus change detection.

## Risks And Recovery

- Page reload no longer restores unfinished clinical workflow payloads; users
  reopen persisted recommendation runs from the episode history.
- Auth bootstrap relies on the existing refresh-cookie interceptor. If refresh
  fails, the current protected-route logout behavior remains authoritative.
- Backend authorization may expose legacy rows without owner metadata; matching
  the existing policy preserves access when all owner fields are blank.
- Recovery is a normal revert of the focused frontend/backend commits; no data
  migration or destructive operation is involved.

## Progress

- [x] Inspect current browser-storage, auth bootstrap, and backend access paths.
- [x] Record pre-edit GitNexus impact and risk.
- [x] Implement frontend in-memory session/workflow state.
- [x] Implement backend recommendation authorization.
- [x] Add or update focused tests.
- [x] Run frontend/backend validation and GitNexus change detection.

## Decisions

- 2026-08-10: Reuse the repository's existing owner-or-admin access rule from
  doctor recommendation reviews instead of introducing a new permission policy.
- 2026-08-10: Persist only non-sensitive UI preferences such as tour completion;
  tokens, current case, clinic forms, workflow step, thought logs, and clinical
  results remain in memory.

## Validation

- Frontend `npm run build`: passed (10,880 modules transformed).
- Frontend static browser-storage scan: only legacy-key cleanup and the
  non-sensitive tour-completion preference remain.
- Backend `./mvnw clean test`: passed (31 tests, 0 failures/errors), including
  five focused owner/admin/cross-user/unauthenticated access-policy tests.
- Frontend and backend `git diff --check`: passed.
- GitNexus `detect_changes`: completed for both repositories. It reports
  critical blast radius because auth, recommendation, SSE, review, and chat
  execution flows are intentionally affected.
- Rendered browser E2E was not available: the Browser plugin is absent and the
  repository has no installed Playwright runtime. No dependency was added for
  this security change.

## Result

Access tokens now live only in module memory and are re-established through
the existing HttpOnly refresh-cookie flow. Legacy sensitive browser-storage
keys are removed during application startup, current-case/workflow data is
memory-only and explicitly scoped by patient and episode, and late async/SSE
responses are ignored after a case switch. Logout clears all session-bound
state.

Backend recommendation, stream, review, and scoped chat paths now validate the
repository's owner-or-admin access policy before returning cache or database
data. Focused authorization tests and the full backend test suite pass.

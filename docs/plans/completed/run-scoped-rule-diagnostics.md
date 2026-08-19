# Execution Plan: Run-scoped Rule Diagnostics

Date: 2026-08-16

## Status

Completed

## Outcome

Opening a historical recommendation run displays and reviews the rule-engine
diagnostic stored with that run, never a recalculation from the episode's newest
medical data. Doctor-diagnosis screens consume the separated diagnostic API
field and save decisions against the selected run.

## Context

- User request dated 2026-08-16.
- `PatientExamSelector` currently recalculates the latest episode diagnostic
  before loading a historical run.
- `doctorDiagnosisModel` currently reads diagnosis from run columns and a
  `DIAGNOSTIC_TEST` recommendation item.
- Coordinated backend plan:
  `Backend_Server/docs/plans/active/run-scoped-rule-diagnostics.md`.

## Scope

In scope:

- Store a run's separate diagnostic in diagnosis workflow state.
- Use that diagnostic when a historical run is selected.
- Update assessment and doctor-diagnosis consumers/types for the new contract.
- Remove remaining `DIAGNOSTIC_TEST` reads from doctor conclusion UI.

Out of scope:

- Changing clinical scoring rules.
- Changing the three treatment-plan item renderers.

## Approach

Update the shared run-detail type/state first, then make previous-run selection
hydrate diagnostic and treatment data from one response. Keep current episode
evaluation only for the no-run path. Finally update doctor diagnosis/conclusion
mapping and add focused model/state tests.

## Risks And Recovery

- Risk: stale in-memory workflow state could mix episodes/runs. Mitigation:
  continue enforcing patient/episode scope checks and hydrate a historical run
  atomically after verifying its episode id.
- Recovery: revert the frontend change together with the coordinated backend
  contract/migration rollback.

## Progress

- [x] Trace selection, assessment, treatment, and doctor review data flow.
- [x] Implement separated diagnostic contract and historical-run hydration.
- [x] Add focused frontend proof.
- [x] Run build/type validation and record results.

## Decisions

- 2026-08-16: Historical run selection must make no call to the episode-level
  diagnostic evaluation endpoint.
- 2026-08-16: UI wording distinguishes deterministic system diagnosis from AI
  treatment recommendations.

## Validation

- Focused proof: `npm run test:doctor-diagnosis` passed the rule-result mapping
  test file, including current snake_case payloads and INFECTED/NOT_INFECTED
  conclusion values. Existing `npm run test:pji` also passed.
- Type/build proof: `npx tsc --noEmit --ignoreDeprecations 5.0` passed and
  `npm run build` completed successfully. Vite reported only existing unresolved
  image and chunk-size warnings.
- Historical-flow source proof: the previous-run handler now fetches and
  verifies `detail.diagnostic` before activating/storing the run, and makes no
  episode-level evaluation call. Workflow state replaces its diagnostic with
  the run-scoped value whenever a run detail is stored.
- Rendered QA limitation: Browser plugin is absent, and this repository has no
  local Playwright/e2e workflow or installed Playwright binary. The authenticated
  historical-run interaction was therefore not browser-automated without adding
  an out-of-scope dependency and test data.
- Repository-required checks: `git diff --check` passed. GitNexus MCP was not
  available, so impact/change review used the repository-prescribed source and
  diff fallback.

## Result

Historical recommendation selection no longer recalculates the newest medical
record. Assessment and doctor-decision screens consume the diagnostic stored
with the selected run, while treatment UI reads only the three recommendation
categories and doctor saves use the structured decision payload.

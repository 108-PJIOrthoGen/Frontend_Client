# Connect antibiotic care-plan workspace

## Outcome

Clicking “Mở kế hoạch theo dõi” opens a split workspace: patient/episode search
on the left and a generated three-lane antibiotic care plan on the right.

## Contract

- Generation requires a signed pharmacist decision containing systemic and
  local antibiotic plans.
- The result is session-only UI state; it is never written to MedicalExamDetail
  or a clinical decision.
- The reference image is the visual authority for the timeline anatomy.

## Work and proof

- [x] Add stateless frontend API contract and search/generation state.
- [x] Build the left patient/episode rail and right timeline workspace.
- [x] Verify loading, empty, success, and responsive states in Playwright.

## Validation

- `npm run build`
- `npx playwright test qa-care-plan-workspace.spec.ts --workers=1`
  (2 passed; generation was the only non-GET request)
- `git diff --check`

## Recovery

Revert this UI/API-client change. No stored data needs recovery.

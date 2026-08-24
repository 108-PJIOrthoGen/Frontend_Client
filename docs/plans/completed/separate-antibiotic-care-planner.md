# Separate antibiotic care planner

## Outcome

The pharmacist recommendation lane finishes with two editable regimens only:
systemic and local antibiotics. `PharmacistDecisionStep` contains no care-plan
timeline or monitoring workspace and presents a lower-density decision UI.

## Contract

- New ANTIBIOTIC recommendation runs are ready after `SYSTEMIC_ANTIBIOTIC` and
  `LOCAL_ANTIBIOTIC` are present.
- Legacy run payloads may still contain `ANTIBIOTIC_CARE_PLAN` and remain
  readable, but the decision step does not copy or save it.
- The regimen editors hide monitoring, contraindication/caution, and note
  sections in decision mode while retaining the underlying JSON fields.

## Work and proof

- [x] Updated scope readiness and decision data mapping.
- [x] Redesigned AI proposal and pharmacist-owned regimen workspace.
- [x] Built the frontend and exercised the five-step presentation in Playwright.
- [x] Compared the final screenshot with the supplied reference.

## Validation

- `npm run build`
- Playwright: pharmacist decision flow, two owned plans, removed-field assertions
- `git diff --check`

## Recovery

Revert the frontend change; no client-side migration is required.

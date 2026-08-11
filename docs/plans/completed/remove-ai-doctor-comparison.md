# Execution Plan: Remove AI–Doctor Comparison Frontend

Date: 2026-08-11

## Status

Completed

## Outcome

Users no longer see or navigate to the “So sánh AI” feature, and the frontend
no longer fetches comparison statistics or computes/submits AI–doctor agreement
data. The doctor diagnosis and final-decision workflows remain available.

## Context

- `src/pages/user/CompareResult.tsx`
- `src/components/user/compare_result/`
- `src/pages/user/PatientTable.tsx`
- `src/routes/index.tsx`
- `src/apis/api.ts`
- `src/components/user/diagnose_steps/doctor_diagnosis/`
- Coordinated provider removal in `Backend_Server`.

## Scope

In scope:

- Remove the comparison menu action, route, page, and dedicated components.
- Remove comparison stats/agreement API and TypeScript contracts.
- Stop computing and submitting agreement data from doctor diagnosis flows.

Out of scope:

- Removing AI recommendations, doctor diagnoses, doctor reviews, or final
  decisions.

## Approach

Remove leaf comparison UI first, then clean the shared API/types and move the
small diagnosis-label helpers into the diagnosis model so no comparison utility
remains.

## Risks And Recovery

- Risk: shared diagnosis helpers are currently hosted in a comparison-named
  module. Mitigation: retain only the non-comparison mapping/labels inside the
  doctor diagnosis feature and build TypeScript.
- Recovery: revert this change set; no persisted data is modified.

## Progress

- [x] Map comparison symbols and callers with GitNexus and source search.
- [x] Remove frontend UI, API/types, and agreement calculation.
- [x] Run build and repository checks.

## Decisions

- 2026-08-11: Preserve the AI context shown during the doctor's diagnosis step;
  it is part of authoring a review, not the standalone comparison feature.

## Validation

- Focused proof: runtime source search finds no route, menu, component, stats
  call/type, comparison utility, or agreement submission for the removed
  feature.
- Integration or end-to-end proof: `npm run build` completed successfully and
  emitted no comparison-page chunk.
- Type proof: `npx tsc --noEmit --ignoreDeprecations 5.0` passed. The override
  is needed because the existing `tsconfig.json` requests TypeScript 6.0
  deprecation handling while the repository currently installs TypeScript 5.x.
- Repository-required checks: `git diff --check` passed; GitNexus change
  detection reported medium risk limited to the expected PatientTable render
  and action-menu processes.

## Result

Removed the standalone comparison UI and all frontend comparison data handling.
The small conclusion labels and AI probability mapping needed by the doctor
diagnosis screen now live within that feature, preserving doctor review and
final-decision workflows without retaining a comparison utility module.

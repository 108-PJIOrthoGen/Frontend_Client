# Execution Plan: Episode Medical Record Refactor

Date: 2026-07-30

## Status

Completed

## Outcome

The episode and clinical assessment UI matches the supplied Vietnamese medical
record and laboratory forms, persists the new episode fields through the API,
and no longer labels non-default tests as AI-suggested.

## Context

- `renew_episode.jpg`, `table1.jpg`, and `table2.jpg` in the workspace.
- `src/components/user/patient_table/episode/MedicalExamination.tsx`
- `src/components/user/patient_table/clinical_assessment/ClinicalExamForm.tsx`
- `src/constants/canonicalLabRegistry.ts`

## Scope

In scope:

- Episode management and diagnosis fields shown in `renew_episode.jpg`.
- Hematology defaults shown in `table1.jpg` and `table2.jpg`.
- Removal of the AI badge classification from lab rows.
- Rename the whole-body examination field to surgical disease and remove the
  index-arthroplasty-days field from the client contract.

Out of scope:

- Changes to the diagnosis/recommendation algorithm.
- Removal of legacy database data.

## Approach

Update frontend types and request/form mapping, refactor the episode form, align
clinical form hydration and pending-task entry, update the canonical lab rows,
then validate with a production build.

## Risks And Recovery

- Existing uncommitted user edits overlap the target files; preserve them and
  review the final diff.
- Backend deployment must precede or accompany the frontend deployment.
- Recovery is a revert of this change set; existing episode fields remain
  backward-compatible.

## Progress

- [x] Inspect images, existing code, and blast radius.
- [x] Implement frontend contract and forms.
- [x] Run focused searches and production build.
- [x] Review affected flows and move this plan to completed.

## Decisions

- 2026-07-30: Keep diagnosis snapshot compatibility outside the frontend
  contract; no diagnosis algorithm changes are in scope.
- 2026-07-30: Preserve existing user edits in overlapping files.

## Validation

- Focused proof: stale field/AI-label searches passed; Playwright exercised
  episode creation and adding a department-transfer row.
- Integration or end-to-end proof: `npm run build` passed; desktop Playwright
  render and interaction checks passed with mocked API data.
- Repository-required checks: GitNexus change detection completed. Its CRITICAL
  aggregate rating includes unrelated pre-existing worktree changes; the
  task-owned episode/clinical paths were separately impact-checked.

## Result

Implemented the renewed episode management and diagnosis form, request/response
mapping, clinical-field update, canonical hematology registry, and removal of
the inferred AI badge. Desktop visual QA passed. At 390 px, the form stacks to
one column, but the existing fixed sidebar and nested drawer shell still causes
horizontal overflow; that shell-level responsive redesign remains out of scope.

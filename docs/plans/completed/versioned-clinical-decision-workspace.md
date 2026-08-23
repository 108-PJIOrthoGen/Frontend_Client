# Versioned Clinical Decision Workspace

Date: 2026-08-23

## Status

Completed

## Outcome

Medical exam details show every AI run in one shared version workspace. Doctors
and pharmacists see the same selected run, can edit only their owned draft, and
save or sign through role-specific actions without changing another role's
decision or relying on the whole-episode save button.

## Context

- Design concept: `docs/plans/assets/ai-decision-workspace-concept.png`.
- `DoctorConclusionTab` currently lists reviews, so runs without a doctor review
  are absent.
- `AntibiogramAiVersionTab` owns a separate run selector and only persists
  sensitivity rows through the episode aggregate.
- The coordinated backend plan is
  `Backend_Server/docs/plans/completed/versioned-clinical-decisions.md`.

## Scope

In scope:

- Shared run selection and status rail/header.
- Doctor and pharmacist role-specific draft/sign forms.
- Read-only AI proposal and antibiogram context.
- Clear ownership, signed, final, loading, empty, conflict, and mobile states.
- Transition of `DoctorDiagnosisStep` to the same decision contract.

Out of scope:

- Rebranding or replacing Ant Design.
- Editing unrelated medical-examination fields or deleted quick-diagnosis tests.

## Approach

1. Add typed API contracts and decision helpers.
2. Build a reusable version workspace with controlled `selectedRunId`.
3. Refactor doctor and pharmacist surfaces onto role-specific endpoints.
4. Integrate the AI workflow's final doctor step.
5. Run type/build tests and authenticated browser QA where available.

## Risks And Recovery

- `MedicalExamDetail.tsx` already contains user changes; preserve its reordered
  tabs and integrate without reverting them.
- Backend permissions may not yet grant the new pharmacist capabilities in a
  live database; expose a correct read-only state instead of silently enabling.
- Recovery is reverting the coordinated UI/API commit while backend
  compatibility endpoints remain available.

## Progress

- [x] Inspect current UI and lock behavior.
- [x] Create and review the workspace concept.
- [x] Refresh GitNexus and review pre-change impact.
- [x] Add API types and shared workspace state.
- [x] Implement doctor and pharmacist decision surfaces.
- [x] Integrate and validate responsive behavior.
- [x] Complete the plan.

## Decisions

- 2026-08-23: MedicalExamDetail owns one `selectedRunId` shared by both roles.
- 2026-08-23: Role decisions use local save/sign actions; `Lưu bệnh án` remains
  responsible only for the clinical aggregate.
- 2026-08-23: Preserve the existing Ant Design visual system and implement the
  generated concept without adding new image assets to runtime UI.

## Validation

- Focused proof: decision mapping and permission tests where practical.
- Integration proof: TypeScript/Vite build and browser role/state walkthrough.
- Repository-required checks: GitNexus detect-changes and `git diff --check`.

## Result

- MedicalExamDetail now owns a shared AI-run selector and exposes independent
  doctor and pharmacist draft/sign lanes with owner and signed read-only states.
- The pharmacist surface keeps the antibiogram and AI plan read-only, requires
  an explicit copy action, and persists its own systemic/local plan and notes.
- The AI wizard's doctor step uses the same run-scoped contract; the episode
  lock now applies only to aggregate tabs and saves.
- Production build passed. Browser QA covered three versions, historical
  read-only behavior, AI copy, draft save, and sign/lock behavior at desktop
  and narrow viewport sizes.
- Repository-wide `tsc` still reports eight unrelated existing errors in
  `NotificationBell`, `PatientModal`, and `ModalRole`; no changed file remains
  in the type-check error list.

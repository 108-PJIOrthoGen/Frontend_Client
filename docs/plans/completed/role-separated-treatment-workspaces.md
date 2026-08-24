# Role-Separated Treatment Workspaces

Date: 2026-08-24

## Status

Completed

## Outcome

Doctors use `AiDiagnoseSuggestion` to generate and sign surgery recommendations;
pharmacists use `AntibioticCarePlanner` to generate and sign antibiotic
recommendations and to inspect a structured three-phase safety-monitoring plan.
Neither role sees editable controls belonging to the other discipline.

## Context

- Product authority: workspace `new_goal_v2.txt` and the 2026-08-24 user request.
- Existing wizard: `src/pages/user/AiDiagnoseSuggestion.tsx`.
- Existing placeholder: `src/pages/user/AntibioticCarePlanner.tsx`.
- Coordinated contracts:
  `Backend_Server/docs/plans/active/role-separated-treatment-contracts.md` and
  `Rag_Agentic/docs/plans/active/scoped-treatment-generation.md`.
- Concepts: `docs/plans/assets/antibiotic-care-planner-home-concept.png`,
  `antibiotic-monitoring-workspace-concept.png`, and
  `pharmacist-decision-step-concept.png`.

## Scope

In scope:

- Role-gated doctor and pharmacist routes/navigation.
- A reusable five-step workflow configured by treatment scope.
- Surgery-only doctor output and antibiotic-only pharmacist output.
- Pharmacist-owned final step with draft/sign ownership rules.
- A structured antibiotic-care timeline, monitoring schedule, renal/TDM and
  medication-safety presentation.
- Discipline-specific run histories in MedicalExamDetail.

Out of scope:

- Claiming that SMS, dispensing, administration, lab ordering, or autonomous
  dose changes occurred without a real integration.
- Reassignment of a signed professional decision.

## Approach

1. Add scope-aware frontend contracts and shared workflow configuration.
2. Keep doctor and pharmacist session/run state isolated.
3. Implement the pharmacist landing, five-step workflow, decision step and
   monitoring view using the existing Ant Design system.
4. Filter MedicalExamDetail decision lanes by run scope.
5. Validate role routing, generation/polling, ownership, responsive layout and
   production build.

## Risks And Recovery

- Legacy combined runs must remain readable; render them in both historical
  lanes but never create new combined runs.
- The monitoring workspace is decision support. It must clearly state that a
  pharmacist reviews and confirms changes.
- Recovery is reverting the frontend commit while the backend keeps legacy API
  compatibility.

## Progress

- [x] Read product notes, workflows, current implementation and prior decisions.
- [x] Generate complete visual concepts.
- [x] Implement role-separated workflows and monitoring UI.
- [x] Integrate scoped histories and role gates.
- [x] Complete browser and build validation.

## Decisions

- 2026-08-24: A run has one immutable treatment scope. `LEGACY_COMBINED` is
  read-only compatibility; new runs are `SURGERY` or `ANTIBIOTIC`.
- 2026-08-24: Antibiotic generation returns systemic, local and structured care
  plan items. The care plan does not execute external actions.
- 2026-08-24: Existing app shell and Ant Design remain the runtime visual
  system; concepts govern information architecture and hierarchy.

## Validation

- Focused proof: scope/category mapping and permission helpers.
- Integration or end-to-end proof: browser walkthrough for doctor and
  pharmacist routes plus monitoring states.
- Repository-required checks: production build, focused tests, GitNexus
  detect-changes and `git diff --check`.

## Result

Implemented separate doctor/pharmacist routes, scope-isolated workflow state,
the pharmacist five-step decision lane, three-phase monitoring presentation and
discipline-specific MedicalExamDetail histories. `npm run build` and two
Playwright role/UI checks passed; the implementation screenshot is stored next
to the concepts in `docs/plans/assets/`.

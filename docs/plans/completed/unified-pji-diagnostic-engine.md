# Execution Plan: Consume the unified PJI diagnostic engine

Date: 2026-08-26

## Status

Completed

## Outcome

The standalone PJI Diagnosis Calculator and episode assessment render the same
versioned Backend diagnostic contract. Frontend no longer owns a duplicate ICM
scoring policy, while genomic interpretation remains a clearly separated
supportive layer.

## Context

- `src/components/user/quick_diagnosis/`: current browser-only calculator.
- `src/components/user/diagnose_steps/assessment_pji/`: current Backend-backed
  episode assessment.
- Coordinated Backend plan:
  `Backend_Server/docs/plans/completed/unified-pji-diagnostic-engine.md`.
- Clinical authority and Backend ownership confirmed by the user on 2026-08-26.

## Scope

In scope:

- Replace local ICM score calculation with a typed stateless Backend request.
- Render eligibility, completeness, stage scores, criteria evidence, profile
  version, and clinical limitations from the Backend response.
- Keep question UX and genomic input, but run genomic synthesis only after the
  authoritative Backend conclusion is returned.
- Make loading, API error, incomplete, and inconclusive states explicit.
- Add contract/model/component tests for the migrated flow.

Out of scope:

- Letting genomic results change the core ICM score.
- Changing PJI Risk Calculator behavior.
- Implementing unpublished Unified PJI 2025 criteria.

## Approach

1. Add typed request/response API contracts matching the Backend stateless
   endpoint.
2. Separate the existing genomic interpretation from the local ICM calculator.
3. Submit normalized manual answers to Backend and render its result.
4. Preserve the existing episode assessment, adapting it to new additive fields.
5. Remove or deprecate duplicate ICM rule constants after all consumers migrate.
6. Validate responsive interaction, focused tests, type-check, and build.

## Risks And Recovery

- Network dependency replaces immediate local calculation. Mitigate with clear
  loading/retry behavior and no optimistic clinical conclusion.
- Contract drift can hide evidence. Mitigate with typed contracts and shared
  golden cases represented in both repositories.
- Recovery: revert the Frontend migration and coordinated Backend stateless API;
  no patient data migration is required.

## Progress

- [x] Trace current calculator and Backend-backed assessment flows.
- [x] Confirm Backend authority and clinical policy with the user.
- [x] Run pre-change GitNexus impact analysis (local calculator risk: LOW).
- [x] Add typed stateless diagnostic API client.
- [x] Migrate calculator orchestration and result rendering.
- [x] Preserve supportive genomic synthesis without duplicate ICM scoring.
- [x] Preserve unknown evidence through the episode assessment UI.
- [x] Add focused tests and run repository validation.
- [x] Complete coordinated Backend validation.

## Decisions

- 2026-08-26: Backend is the sole authority for core PJI scoring.
- 2026-08-26: The UI must not show `NOT_INFECTED` when required evidence is
  missing or unreadable.
- 2026-08-26: Genomic interpretation remains supportive and is visually and
  structurally separate from the core diagnostic result.

## Validation

- Focused proof: `npm run test:pji` passed (quick-diagnosis mapping/genomic/risk and episode presentation safeguards).
- Production proof: `npm run build` passed.
- Contract proof: the calculator submits the final selected answer atomically and maps only Backend conclusion/criteria/score metadata; browser-side ICM score calculation was removed.
- Build retained pre-existing warnings for unresolved static images and large chunks; neither was introduced by this change.

## Result

The standalone calculator and episode assessment now render the same versioned Backend result. `INCOMPLETE` and unknown criterion values retain neutral/warning presentation rather than green/negative presentation, and genomic synthesis remains separate from the core score.

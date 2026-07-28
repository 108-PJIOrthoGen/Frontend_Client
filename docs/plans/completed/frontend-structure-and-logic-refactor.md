# Execution Plan: Frontend Structure And Logic Refactor

Date: 2026-07-28

## Status

Completed

## Outcome

The frontend keeps its current product behavior and API contracts while its
high-complexity flows become easier to navigate: page components coordinate
features, domain hooks own side effects, pure utilities own transformations,
and repeated logic has one authoritative implementation.

## Context

- `docs/WORKFLOW.md` defines the repository workflow and validation standard.
- `README.md` and the current source code are the available consumer-owned
  behavior and architecture truth.
- GitNexus indexes the repository's symbols and execution flows and is used for
  pre-edit impact analysis and post-edit scope verification.
- The worktree already contains uncommitted user changes in diagnosis,
  clinical-assessment, pending-lab, Redux, and extraction-mapping files. Those
  changes must be preserved and treated as the current working baseline.
- The package currently exposes a Vite production build but no automated test
  command.

## Scope

In scope:

- Map the current application structure, major execution flows, and duplicated
  or mixed-responsibility logic.
- Refactor a coherent set of high-value hotspots without changing user-visible
  behavior, routes, API payloads, or persisted state contracts.
- Prefer feature-local hooks and pure utilities over cross-domain abstractions.
- Add focused executable proof where it can be done without inventing product
  behavior, then run the production build.
- Record remaining hotspots as explicit follow-up work instead of performing a
  risky repository-wide rewrite.

Out of scope:

- UI redesign or styling changes.
- Backend/API contract changes.
- New product rules, permissions, clinical thresholds, or configurable defaults.
- Reverting, rewriting, or silently absorbing unrelated uncommitted user work.
- Dependency/framework migrations.

## Approach

1. Establish the working baseline with Git status, build output, file/flow
   inventory, and GitNexus process queries.
2. Rank hotspots using responsibility count, repetition, file size, dependency
   blast radius, and overlap with existing user changes.
3. Before each symbol edit, run upstream GitNexus impact analysis and inspect
   callers/process participation. Warn before any HIGH or CRITICAL edit.
4. Refactor in small groups: define the extracted interface first, move pure
   logic or side effects, update the owning component, and validate immediately.
5. Run GitNexus change detection, focused checks, TypeScript/Vite build, and
   inspect the final diff for accidental behavior changes.

## Risks And Recovery

- Existing uncommitted work may overlap a hotspot. Mitigation: compare HEAD and
  worktree before editing, avoid broad formatting, and preserve current hunks.
- Moving side effects can alter ordering or React lifecycle behavior.
  Mitigation: retain dependencies and call order, and validate affected flows.
- The repository has no automated test script. Mitigation: isolate and type
  pure logic, use the production build as the repository-wide gate, and
  disclose behavior that lacks executable coverage.
- Recovery: each refactor group is isolated by file and can be reverted by
  applying the inverse patch to only the files created or changed by this plan.
  Existing user changes must never be reset.

## Progress

- [x] Read repository workflow and applicable refactoring guidance.
- [x] Refresh the GitNexus index and inspect top-level modules/processes.
- [x] Establish a passing or explicitly failing baseline build.
- [x] Complete hotspot inventory and choose non-overlapping refactor groups.
- [x] Run symbol-level impact analysis and implement the selected groups.
- [x] Validate affected flows, run change detection, and run the production build.
- [x] Record results, limitations, and remaining prioritized follow-ups.

## Decisions

- 2026-07-28: Preserve observable behavior; this refactor has no authority to
  introduce new clinical, permission, API, route, or persistence policy.
- 2026-07-28: Treat all pre-existing uncommitted files as user-owned work and
  avoid broad rewrites or formatting that could obscure it.
- 2026-07-28: Prefer feature-local extraction to a new global abstraction layer;
  reuse must be demonstrated by current call sites.
- 2026-07-28: Use route-level lazy loading for pages and layouts. This preserves
  route and authorization contracts while avoiding an eager all-pages bundle.
- 2026-07-28: Keep the TypeScript configuration outside this refactor's scope;
  the existing `ignoreDeprecations` value is incompatible with the installed
  TypeScript version. Make `SurgeryStep.timing` match the field already rendered
  by `StepCard`.

## Validation

- Focused proof: `npx tsc --noEmit` is blocked by the existing
  `tsconfig.json(21,27): TS5103: Invalid value for '--ignoreDeprecations'`.
- Integration or end-to-end proof: Playwright smoke-tested `/login` loading,
  navigation to `/forgot-password`, desktop `780x720`, and mobile `390x844`.
  Both pages rendered meaningful content with no framework overlay or console
  error. Mobile had no horizontal overflow.
- Repository-required checks: `npm run build` and `git diff --check` passed.
  GitNexus `detect_changes(scope: "all")` was run after refreshing the index.
  It reports CRITICAL aggregate risk across the already-dirty 23-file worktree;
  the pre-edit impact for this refactor's components/router was LOW, while the
  shared `SurgeryStep` interface was MEDIUM.

## Result

Completed a behavior-preserving diagnosis-feature refactor:

- `AiDiagnosisSuggestion` now composes the step UI while
  `useDiagnosisWorkflow` owns deep-link hydration, case switching, persisted
  step state, and navigation transitions.
- PJI assessment data fetching/cache state and presentation formatters moved to
  feature-local hook and utility modules.
- Doctor diagnosis loading, polling, normalization, agreement calculation,
  storage keys, and payload construction moved to one domain model module.
- Routes now lazy-load pages and layouts behind a shared Suspense fallback.
  The previous single 3.08 MB application chunk became route chunks; the
  diagnosis route is about 245 kB and the largest shared chunks are about
  772 kB and 550 kB.

Known limitations and follow-up priorities:

- The repository still has no automated test or lint script. The diagnosis
  mapping/agreement modules are now isolated enough to add unit tests without
  rendering Ant Design components.
- The TypeScript gate remains blocked by the existing `ignoreDeprecations`
  configuration and should be fixed in a dedicated tooling change.
- `src/apis/api.ts` remains a 551-line cross-domain module imported throughout
  the app. Split it by domain only with coordinated import migration and API
  contract tests.
- Multiple UI modules remain over 400 lines, notably patient, comparison, and
  treatment editors. Refactor them feature-by-feature rather than through a
  repository-wide abstraction.
- Two shared vendor chunks remain over Vite's 500 kB warning threshold, and the
  page still warns that Tailwind's CDN runtime should not be used in production.
- Three legacy image references do not resolve at build time and remain runtime
  paths.
- Authenticated diagnosis interactions that require backend and clinical data
  were not browser-tested in this environment.

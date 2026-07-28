# Execution Plan: Redux And Feature Boundaries Refactor

Date: 2026-07-28

## Status

Completed

## Outcome

Preserve current routes, UI behavior, API contracts, and persisted data while
making state ownership and feature boundaries explicit: Redux infrastructure is
small and typed, slices live with their domains, route pages compose feature
screens, and reusable UI/logic is colocated by feature instead of split across
unrelated `pages` and `components` trees.

## Context

- `docs/WORKFLOW.md` defines the repository workflow and validation standard.
- The codebase uses Redux Toolkit for account, admin lists, patients, and
  pending-lab state.
- `src/redux/slice` currently mixes unrelated domains and repeats pagination
  state/reducer logic.
- Admin CRUD screens are split between large files in `src/pages/admin` and
  tightly coupled files in `src/components/admin/manage_*`.
- Patient workflow state and table state currently share one slice; this needs a
  separate, later migration because its localStorage contract has many callers.
- `src/layouts/LayoutClient.tsx` contains a pre-existing uncommitted user change
  and must remain outside refactor commits.
- The repository has a production build command but no automated test or lint
  command.

## Scope

In scope:

- Introduce typed Redux hooks and shared pagination state utilities.
- Reorganize Redux slices into feature-oriented folders while retaining narrow
  compatibility exports for untouched consumers.
- Remove dead reducers, duplicate initial-state declarations, unsafe response
  casts, and inconsistent fulfilled-state handling.
- Colocate admin user, role, and permission screens with their feature-specific
  components and update route imports.
- Keep route URLs, permissions, API requests, component props, and persisted
  localStorage keys unchanged.
- Review large user-facing pages and record the next safe extraction groups.

Out of scope:

- UI redesign, backend contract changes, or dependency migration.
- Changing pagination semantics or visible loading behavior.
- Migrating patient workflow persistence until its consumers can be validated
  as one dedicated phase.
- Editing or committing the existing `LayoutClient.tsx` worktree change.

## Approach

1. Map Redux callers and page/component execution flows with GitNexus.
2. Add shared Redux state primitives and feature-oriented slice locations,
   preserving current exports and observable behavior.
3. Move admin CRUD screens and their private UI into feature folders; keep
   `pages` as route-level composition only.
4. Validate each group with GitNexus change detection, import checks, diff
   checks, and the production build, then commit each group independently.
5. Review the remaining patient/diagnosis pages and update this plan with
   prioritized follow-up extractions.

## Risks And Recovery

- Moving Redux exports can break imports or action type strings. Mitigation:
  preserve exported names and thunk/slice action prefixes, and use compatibility
  modules where an untouched or dirty consumer still depends on an old path.
- Generic pagination helpers can hide behavior. Mitigation: keep helpers limited
  to state creation/application; domain thunks and reducers remain explicit.
- Moving screen files can change lazy-loading boundaries. Mitigation: keep the
  same route-level dynamic imports and verify generated route chunks.
- Recovery: each phase is isolated in its own commit and can be reverted without
  touching `LayoutClient.tsx`.

## Progress

- [x] Read repository workflow and relevant refactoring guidance.
- [x] Refresh GitNexus and map current Redux/admin execution flows.
- [x] Refactor Redux infrastructure and admin feature slices.
- [x] Reorganize admin pages and components by feature.
- [x] Move patient state persistence out of reducers without changing its public
  state/action API.
- [x] Review remaining pages/components and record prioritized follow-ups.
- [x] Run final validation and move this plan to completed.

## Decisions

- 2026-07-28: Use incremental feature-oriented organization instead of a
  repository-wide rewrite. Compatibility exports are allowed only at migration
  boundaries.
- 2026-07-28: Keep Redux Toolkit rather than add a server-state dependency;
  changing data-fetching technology is outside current authority.
- 2026-07-28: Preserve existing route, API, permission, pagination, and
  localStorage contracts.
- 2026-07-28: Prefer direct feature imports over broad barrel modules to keep
  bundle and dependency boundaries visible.
- 2026-07-28: Remove the old admin slice paths after all current consumers were
  migrated; keeping compatibility shims would leave two authoritative import
  paths without a demonstrated external consumer.
- 2026-07-28: Keep `src/pages/admin` as stable route entries and colocate the
  actual screens/private components under `src/features/admin`. This preserves
  lazy-route boundaries while making feature ownership explicit.
- 2026-07-28: Share only pagination/default-sort query assembly. Feature-specific
  filter fields remain local so backend filtering rules do not disappear behind
  a generic CRUD abstraction.
- 2026-07-28: Keep the patient state key, exports, localStorage keys, and action
  payloads stable. Persistence moves to Redux listener middleware so reducers
  remain deterministic.
- 2026-07-28: Defer splitting `PatientTable` and `CompareResult` to dedicated
  phases. The safe next boundaries are a patient-table deep-link/actions hook
  and a comparison-data hook; both coordinate several backend flows and need
  authenticated interaction proof.

## Validation

- Focused proof: legacy import/reference scans and `git diff --check` passed.
- Type proof: `npx tsc --noEmit --ignoreDeprecations 5.0` passed. The CLI
  override is required because the repository's configured
  `ignoreDeprecations` value is invalid for the installed TypeScript version.
- Integration proof: the production Vite build passed after each phase and
  after final integration.
- Repository-required checks: GitNexus impact ran before symbol edits and
  `detect_changes(scope: "staged")` reported low risk before each commit.
- Known baseline warnings: three unresolved runtime image paths and shared
  chunks over 500 kB remain.

## Result

Implemented and validated:

- Admin list slices now share typed pagination state and live under explicit
  Redux feature folders.
- Admin route pages are one-line entries; screens and private components are
  colocated under `src/features/admin`.
- Admin table query assembly has one implementation while feature filters remain
  local.
- Patient slice persistence is isolated in storage and listener modules rather
  than running side effects inside reducers.

Prioritized follow-ups from the remaining page/component review:

1. Extract `PatientTable` deep-link loading, patient actions, and table query
   assembly into the patient feature while retaining the current drawer/modal
   contracts.
2. Extract the `CompareResult` episode/run/review fan-out and selection state
   into `useComparisonData`; leave presentation in the page and existing
   comparison components.
3. Extract `AdminDashboard` data loading from its 370-line presentation module.
4. Move account and pending-lab slices into feature folders after their layout
   consumers can be migrated without overlapping the existing
   `LayoutClient.tsx` worktree change.

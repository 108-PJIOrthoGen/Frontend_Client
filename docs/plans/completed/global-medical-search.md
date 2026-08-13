# Execution Plan: Global Medical Search

Date: 2026-08-13

## Status

Completed

## Outcome

Clinicians can search episodes or patients from the center of the application header, refine results with contextual filters, revisit recent selections during the browser session, and open the patient table or the selected episode drawer directly.

## Context

- `src/layouts/LayoutClient.tsx`: owns the shared client header and existing episode deep-link navigation.
- `src/pages/user/PatientTable.tsx`: owns the patient table and patient/episode deep-link handling.
- `src/components/user/patient_table/manage/ManageMedicalDrawer.tsx`: owns episode list and nested episode-detail drawer behavior.
- User-supplied Jira search screenshot is the accepted interaction reference; existing PJI header tokens remain the visual authority.

## Scope

In scope:

- Header-centered search with episode-first and patient tabs.
- Session-scoped recent selections and contextual filters.
- Patient-result navigation to a filtered patient table.
- Episode-result navigation through the existing patient drawer into episode detail.
- Display of the backend-provided short medical-record code.

Out of scope:

- Server-side persistence or cross-device synchronization of search history.
- A new search-index service or fuzzy-ranking engine.

## Approach

Create a focused global-search component using the existing paginated patient and episode APIs, reuse Spring Filter expressions, and route selections through the existing `/table-patients` deep-link contract. Remove the page-local three-field search form so the header becomes the single search entry point.

## Risks And Recovery

- Nested episode/patient filters may expose backend query limitations; prove the generated requests against executable tests/build and browser network behavior.
- Header density may regress at narrower widths; use a compact responsive variant and verify desktop/mobile layouts.
- Recovery: remove the new header component and restore ProTable search; the backend remains backward compatible.

## Progress

- [x] Locate repository authority and existing deep-link flow.
- [x] Run pre-change impact analysis.
- [x] Implement search, filters, recent selections, and navigation.
- [x] Validate build, behavior, and visual fidelity.

## Decisions

- 2026-08-13: Store recent selections in `sessionStorage`, not persistent local storage, to limit retention of patient-identifying data on shared clinical workstations.
- 2026-08-13: Reuse the existing patient-table episode deep link instead of introducing a second drawer owner.

## Validation

- Focused proof: 4/4 search-query helper tests passed; Vite production build passed.
- Integration or end-to-end proof: Playwright verified episode and patient tabs, filter activation, session recent selections, patient-table filtering, nested episode drawer navigation, and 1840×920 / 390×844 layouts with mocked API fixtures.
- Repository-required checks: GitNexus `detect_changes` reported medium frontend risk limited to the expected header, patient-table, and episode-drawer flows; reviewed Git diff. `tsc --noEmit` is blocked by the repository's existing invalid `ignoreDeprecations` value in `tsconfig.json`.

## Result

The header is now the primary search entry point. Episode selections open the patient drawer and nested episode detail; patient selections show the matching row in the patient table. Recent selections are session-scoped and the page-local ProTable search form is hidden. Visual QA was compared directly with the supplied Jira reference; no material responsive or interaction mismatch remains.

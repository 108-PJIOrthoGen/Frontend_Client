# Execution Plan: User Avatar Upload UI

Date: 2026-08-14

## Status

Completed

## Outcome

Users can select, preview, upload, and immediately see their avatar from account settings.

## Context

- `ProfileSettingsModal` owns self-service account edits.
- `LayoutClient` renders the current-user avatar.
- `src/apis/auth.ts` owns account API calls.

## Scope

In scope:

- Avatar picker/preview, client validation, upload API call, account refresh, and header/sidebar rendering.

Out of scope:

- Client-side cropping and image transformation.

## Approach

Keep the selected file local for preview, upload it from the submit event, then refresh the canonical account state and render its URL everywhere.

## Risks And Recovery

- Revoke object preview URLs when replaced or closed to avoid browser memory leaks.
- Revert the UI/API additions independently if the backend contract is rolled back.

## Progress

- [x] Implement API and profile interaction.
- [x] Render the avatar in shared account surfaces.
- [x] Validate typecheck/tests/build; record rendered-test limitation.

## Decisions

- 2026-08-14: Mirror backend validation at 5 MB and JPEG/PNG/WEBP, while keeping the backend authoritative.

## Validation

- Focused proof: existing frontend test passes and production build typechecks successfully.
- Integration or end-to-end proof: Chrome loaded the Vite page without a framework overlay, but authenticated interaction could not complete because backend account bootstrap remained unavailable; Browser plugin and Playwright were not installed.
- Repository-required checks: production build, existing test, diff check, and GitNexus change detection passed.

## Result

Added avatar selection, local preview, client validation, multipart upload, canonical account refresh, and shared header/sidebar rendering. Authenticated browser interaction remains to be exercised with the backend services running.

# Execution Plan: QR Mobile Upload Session — Frontend

Date: 2026-07-30

## Status

Completed

## Outcome

The existing “Import nhanh” action offers local file selection or a five-minute
QR session. The waiting laptop receives the uploaded OCR job in real time, and
the public mobile route captures or selects multiple images, previews them,
uploads directly to MinIO with progress, and completes the session without login.

## Context

- Product authority: workspace `new_goal.txt` and confirmed Backend policies.
- Existing flow: `QuickImportImagesModal`, `useQuickImportFlow`,
  `ClinicalAssessmentPage`, extraction polling, and `openSse`.
- Design spec: `docs/design/qr-upload-session-concept.png`.

## Scope

In scope:

- Laptop import chooser, QR rendering, countdown, SSE subscription, expiry and
  recreate states.
- Public `/m/upload/:sessionId` route without shared authenticated layout.
- Camera/library multi-select, JPEG/PNG/HEIC validation, previews, progress,
  direct presigned PUT, completion, and terminal states.
- Reuse of the existing extraction polling/review flow after the laptop receives
  the OCR job identifier.

Out of scope:

- Persisting the mobile capability in localStorage.
- Replacing the existing OCR review/apply experience.

## Approach

1. Add typed upload-session API helpers and QR rendering dependency.
2. Extend the existing quick-import hook and modal without duplicating OCR
   polling/review behavior.
3. Add the isolated mobile page and route, then wire direct uploads and completion.
4. Run TypeScript/Vite build and browser QA at desktop and mobile viewports.

## Risks And Recovery

- The token is removed from browser history immediately and kept only in the
  mounted page state; reloading intentionally requires rescanning.
- The laptop can reconnect to SSE while the Redis session exists; terminal
  events include the OCR job ID so the existing poller takes over.
- Rollback is removal of the new route/components/API helpers and restoration of
  the prior modal props.

## Progress

- [x] Existing UI and blast radius inspected.
- [x] Complete laptop/mobile concept generated.
- [x] Implement frontend flow.
- [x] Run build and rendered browser validation.

## Decisions

- 2026-07-30: Follow the existing white/slate/blue clinical design system.
- 2026-07-30: Lazy-load the QR library and mobile page to keep the main bundle lean.
- 2026-07-30: Keep OCR polling centralized in `useQuickImportFlow`.

## Validation

- `npm run build`: passed after the final UI changes. The repository has no
  `lint` script.
- Direct Playwright fallback was used because the Browser plugin was not
  available. Desktop QA at 1440x1000 verified the two-option chooser, QR,
  countdown, waiting state, authenticated SSE event, image preview, and OCR
  queued state. Mobile QA at 390x844 verified validation, URL token scrubbing,
  file selection, direct PUT, complete, and terminal success with zero console
  errors in the isolated mobile flow.
- Visual comparison against `docs/design/qr-upload-session-concept.png` checked:
  modal hierarchy, QR prominence, countdown legibility, waiting/received
  feedback, mobile touch targets, file progress, security copy, and terminal
  success. The implemented QR mode intentionally uses the full modal after a
  separate two-option chooser instead of retaining the concept's side rail.
- Above the fold at 390x844 contains capture/library actions, constraints,
  selected-file progress, primary send action, and expiry countdown; no critical
  content is clipped.
- GitNexus change detection and targeted impact/context checks were run. Its
  critical result included pre-existing changes and a stale index that omitted
  new files, so build and rendered interaction are the authoritative proof.

## Result

Implemented the laptop chooser/QR/SSE integration and isolated mobile upload
route, while reusing the existing OCR polling, review, and apply flow. Retry
reuses a valid presigned URL so interrupted uploads do not accumulate stale file
reservations.

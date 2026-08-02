# Execution Plan: QR Mobile Upload Network Environments

Date: 2026-08-01

## Status

Completed

## Outcome

The frontend remains same-origin in production while local development can be
opened through the workstation LAN address and produce mobile-reachable upload
URLs.

## Context

- `vite.config.ts`
- `src/apis/axios.custom.ts`
- `src/apis/uploadSessions.ts`
- `src/components/user/patient_table/clinical_assessment/hooks/useQuickImportFlow.ts`
- `src/components/user/patient_table/extract/QuickImportImagesModal.tsx`

## Scope

In scope:

- Resolve loopback API and QR hosts to the browser's current LAN host.
- Expose the Vite development server to the LAN.

Out of scope:

- Production DNS, TLS, and reverse-proxy configuration.

## Approach

Centralize runtime URL resolution, reuse it for HTTP and upload-session SSE,
and normalize only loopback QR payloads. Use a same-origin Vite `/api` proxy in
development; leave explicit production domains and same-origin URLs unchanged.

## Risks And Recovery

- Host rewriting could affect production; limit it to `localhost`, `127.0.0.1`,
  and `[::1]`.
- Revert the URL helper and its call sites to recover the previous behavior.

## Progress

- [x] Implement the runtime URL resolver and LAN Vite binding.
- [x] Validate representative local and production URL cases.
- [x] Run the frontend production build.

## Decisions

- 2026-08-01: Existing production Docker builds use `/`, so same-origin remains
  the production authority.
- 2026-08-01: The current page hostname is the authority for local LAN host
  substitution because it is already reachable by the browser.
- 2026-08-01: Local API traffic uses Vite's same-origin proxy so login cookies
  do not depend on LAN CORS configuration and the backend stays off the LAN.

## Validation

- Focused proof: five representative URL resolution assertions passed.
- Integration or end-to-end proof: Vite advertised
  `http://192.168.1.93:5174/` while running on a temporary validation port.
- Repository-required checks: `npm run build` passed.

## Result

Loopback API and QR hosts now follow the LAN hostname through which the user
opened Vite. Explicit production origins remain unchanged and `/` resolves to
same-origin without producing a protocol-relative `//api` request. A physical
phone scan remains an environment-level smoke test after the local stack is
started with the selected LAN IP. A follow-up changed the local API base to `/`
and added a Vite proxy to the loopback backend, removing CORS from login and
mobile public API requests.

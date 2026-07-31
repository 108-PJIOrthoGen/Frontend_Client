# QR Mobile Upload

The existing **Import nhanh** action offers two paths:

- select one or more images on the laptop; or
- create a five-minute QR code and send images from a phone.

The mobile option is unavailable until the episode has been saved and has an
`episodeId`. Selecting the locked option explains that the doctor must save the
episode first.

The QR view shows a countdown and waits on an authenticated SSE stream. When
the backend sends the terminal upload event, the modal shows temporary image
previews and starts the existing OCR polling/review flow automatically.

The public `/m/upload/:sessionId` route uses no application layout and requires
no login. It reads the capability token once, removes it from browser history,
and keeps it only in React memory. The page supports camera or library
selection, JPEG/PNG/HEIC/HEIF validation, up to ten images at 5 MiB each,
previews, per-file progress, retry, and a terminal success/expiry state.

The mobile browser uploads directly to the presigned MinIO URL and calls the
backend only for validation, signing, and completion.

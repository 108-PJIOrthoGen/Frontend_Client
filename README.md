
## 108 PJIOrthoGen - Clinical Decision Support System UI

**Prerequisites:**  Node.js

## Current operational mechanics

- The package maps `npm run dev` to `vite`.
- The Vite server-port expression checks active-mode `PORT`, then `process.env.PORT`, then falls back to `5173`.
- The Vite configuration enables `strictPort`.
- The Docker build stage runs `npm ci`.
- The Docker build stage runs `npm run build`.
- The final image exposes container port `3000`.
- Nginx defines an exact-match location for `/healthz`.
- That location returns HTTP `200` with `ok`.

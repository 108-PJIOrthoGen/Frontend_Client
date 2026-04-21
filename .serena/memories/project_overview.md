# Project Overview

**Name**: 108POG Frontend Client (orthosurg-pji-advisor)
**Purpose**: Frontend for PJI Clinical Decision Support System — a medical web app for managing patients, episodes, clinical records, lab results, and AI-powered diagnosis recommendations.

## Tech Stack
- **Framework**: React 18 + Vite 7
- **Language**: TypeScript 5.8
- **UI Library**: Ant Design 5 + @ant-design/pro-components
- **State Management**: Redux Toolkit (@reduxjs/toolkit)
- **Routing**: React Router v7
- **HTTP Client**: Axios 1.x with interceptors + token refresh
- **Charts**: Recharts 3.x
- **Styling**: SCSS (sass-embedded) + Ant Design tokens
- **Date**: dayjs + moment
- **Build**: Vite (SWC plugin)

## Server
- Dev port: 5173 (configurable via PORT env)
- Backend URL: `VITE_BACKEND_URL` env var (default http://localhost:8085)
- API prefix: `/api/v1`

## Path Aliases
- `@/*` → `./src/*`
- `components/*` → `src/components/*`
- `styles/*` → `src/styles/*`
- `apis/*` → `src/apis/*`
- `pages/*` → `src/pages/*`
- `config/*` → `src/config/*`

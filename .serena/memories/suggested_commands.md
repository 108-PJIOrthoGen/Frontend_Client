# Suggested Commands

## Development
```bash
# Start dev server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

## Type Checking
```bash
# TypeScript check (via build)
npm run build
```

## Docker
```bash
docker build -t pji-frontend .
docker run -p 5173:5173 pji-frontend
```

## Environment Variables
```bash
# .env or .env.local
VITE_BACKEND_URL=http://localhost:8085
PORT=5173
```

## Utilities (Windows with Git Bash)
```bash
git status
git log --oneline -20
git diff
ls -la
```

## Notes
- No dedicated lint/format scripts configured in package.json
- TypeScript errors are caught during `npm run build`
- Dev server has HMR via Vite + SWC

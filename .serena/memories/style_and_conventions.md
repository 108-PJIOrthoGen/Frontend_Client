# Code Style & Conventions

## Architecture
- Feature-based structure: each feature module is self-contained
- Business logic separated from UI (pure functions in utils)
- Centralized API layer in `apis/api.ts`
- Redux for global/shared state, local state for UI

## Naming
- **Pages**: PascalCase.tsx (`PatientTable.tsx`)
- **Components**: PascalCase.tsx (`PatientModal.tsx`)
- **Slices**: camelCaseSlice.ts (`patientSlice.ts`)
- **API module**: camelCase.ts (`api.ts`)
- **Types**: camelCase.d.ts (`backend.d.ts`)
- **Constants**: camelCase.ts (`permission.ts`)
- **Folders**: snake_case or kebab-case (`manage_user/`, `rag_diagnose/`)
- **API functions**: `call{Action}{Module}` (e.g. `callFetchPatient`, `callCreateEpisode`)

## Component Pattern
- `React.FC<Props>` with typed Props interface
- Hooks ordering: useState → useEffect → useAppDispatch/useAppSelector → derived state → handlers → effects
- Max ~130 lines per file
- Default export for components

## Import Order
1. React
2. Third-party libraries (antd, react-router-dom)
3. Redux hooks and actions (@/redux/...)
4. API functions (@/apis/...)
5. Components (@/components/...)
6. Types (import type {...})
7. Constants and utils

## State Management
- Redux for: auth, user info, shared data across navigation
- Local state for: UI state (modals, forms), derived state, ephemeral state
- AsyncThunks for API calls via Redux

## Must Do
- Use `@/` path aliases for imports
- Define interfaces for all props
- Use typed hooks: `useAppDispatch`, `useAppSelector`
- Handle loading and error states
- Use Ant Design components consistently
- All APIs return `ResponseData<T>` wrapper from backend

## Must NOT
- Use `any` types
- Hardcode API URLs (use env vars)
- Leave `console.log` in code
- Mutate Redux state directly
- Skip TypeScript types
- Mix business logic in UI components

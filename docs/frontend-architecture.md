# Frontend Architecture

> PJI Clinical Decision Support System — React + Vite + Ant Design

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | React 18 + Vite | Fast dev server, HMR, modern React features |
| **UI Library** | Ant Design 5 + Pro Components | Enterprise-grade UI, forms, tables, layouts |
| **State** | Redux Toolkit | Global state, async thunks, slices |
| **Routing** | React Router v7 | Nested routes, protected routes, layouts |
| **HTTP** | Axios | API calls, interceptors, token refresh |
| **Charts** | Recharts | Data visualization for lab analytics |
| **Styling** | SCSS + Ant Design tokens | Scoped styles, design system |

---

## Folder Structure

```
src/
├── apis/                    # API layer
│   ├── api.ts               # All API call functions (grouped by module)
│   └── axios.custom.ts      # Axios instance, interceptors, token refresh
│
├── components/              # Reusable components
│   ├── common/              # Shared UI components
│   │   ├── ux/              # Loading, spinners, feedback
│   │   ├── Access.tsx       # Permission-based rendering
│   │   ├── LayoutApp.tsx    # Global app wrapper
│   │   └── protected/       # Route guards
│   │       └── RouteProtected.tsx
│   │
│   ├── admin/               # Admin-specific components
│   │   ├── manage_user/     # User CRUD components
│   │   ├── manage_role/     # Role management
│   │   ├── manage_permission/
│   │   ├── HeaderAdmin.tsx
│   │   ├── SideNav.tsx
│   │   └── FooterAdmin.tsx
│   │
│   ├── user/                # User/Clinical components
│   │   ├── diagnose_steps/  # AI diagnosis wizard steps
│   │   ├── patient_table/   # Patient management UI
│   │   ├── chart_result/    # Lab analytics charts
│   │   ├── compare_result/  # Episode comparison
│   │   └── rag_diagnose/    # RAG-based treatment suggestions
│   │       ├── rag_surgery/
│   │       └── rag_antibiolocal/
│   │
│   ├── icons/               # Custom SVG icons
│   └── DataTable.tsx        # Shared data table component
│
├── pages/                   # Route pages (containers)
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── admin/
│   │   ├── AdminHome.tsx
│   │   ├── UserTable.tsx
│   │   ├── RoleTable.tsx
│   │   └── PermissionTable.tsx
│   ├── user/
│   │   ├── AiDiagnoseSuggestion.tsx  # Main diagnosis page
│   │   ├── PatientTable.tsx
│   │   ├── ChartTesting.tsx
│   │   └── CompareResult.tsx
│   └── errors/
│       ├── NotFoundPage.tsx
│       └── ForbiddenPage.tsx
│
├── layouts/                 # Layout wrappers
│   ├── LayoutAdmin.tsx      # Admin sidebar layout (ProLayout)
│   └── LayoutClient.tsx     # User/clinical layout
│
├── redux/                   # State management
│   ├── store.ts             # Store configuration
│   ├── hook.ts              # Typed useAppDispatch, useAppSelector
│   └── slice/
│       ├── accountSlice.ts  # Auth state, user info
│       ├── patientSlice.ts  # Patient data
│       ├── userSlice.ts     # Admin user management
│       ├── roleSlice.ts     # Role management
│       └── permissionSlice.ts
│
├── routes/
│   └── index.tsx            # Route definitions (createBrowserRouter)
│
├── types/                   # TypeScript definitions
│   ├── backend.d.ts         # API response types, domain models
│   ├── types.ts             # Shared types
│   └── file.d.ts            # File-related types
│
├── constants/               # App constants
│   ├── permission.ts        # Permission keys
│   └── date.ts              # Date format constants
│
├── config/
│   └── utils.ts             # Utility functions
│
├── App.tsx                  # Root component
├── index.tsx                # Entry point
└── index.css                # Global styles
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         Component                            │
│  useAppSelector() ← reads state                             │
│  useAppDispatch() → dispatches actions/thunks               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Redux Slice                             │
│  • Reducers: sync state updates                             │
│  • AsyncThunks: pending → fulfilled/rejected                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  apis/api.ts → axios instance → Backend                     │
│  Interceptors: attach token, handle 401, refresh token      │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
1. App.tsx mounts → dispatch(fetchAccount())
2. fetchAccount thunk → GET /api/v1/auth/account
3. Success → accountSlice stores user, isAuthenticated = true
4. Failure → isAuthenticated = false → redirect to /login

On 401 Response:
1. Interceptor catches 401 (not login/refresh endpoints)
2. handleRefreshToken() → GET /api/v1/auth/refresh
3. Success → retry original request with new token
4. Failure → dispatch(setRefreshTokenAction) → redirect to login
```

---

## Routing Architecture

### Public Routes
- `/login` — Login page (no layout)

### Protected Routes (User)
- `/` — AI Diagnosis Suggestion (home)
- `/table-patients` — Patient management
- `/chart-testing` — Lab analytics charts
- `/compare-result` — Episode comparison

### Protected Routes (Admin)
- `/admin` — Admin dashboard
- `/admin/table-users` — User management
- `/admin/table-role` — Role management
- `/admin/table-permission` — Permission management

### Route Guards
```tsx
<ProtectedRoute>     // Checks isAuthenticated
  <RoleCheck>        // Checks user.role for admin routes
    <Component />
  </RoleCheck>
</ProtectedRoute>
```

---

## State Slices

| Slice | Purpose | Key State |
|-------|---------|-----------|
| `account` | Auth & current user | `isAuthenticated`, `user`, `isLoading` |
| `patient` | Patient list & selection | `patients`, `selectedPatient` |
| `user` | Admin user management | `users`, `meta` |
| `role` | Role CRUD | `roles`, `selectedRole` |
| `permission` | Permission CRUD | `permissions` |

---

## API Module Structure

All API calls are centralized in `apis/api.ts`:

```ts
// Pattern: call{Action}{Module}
export const callFetchPatient = (query: string) => ...
export const callCreatePatient = (data: IPatient) => ...
export const callUpdatePatient = (data: IPatient) => ...
export const callDeletePatient = (id: string) => ...
```

### API Modules
- **Auth**: login, logout, register, account, refresh
- **User/Role/Permission**: Admin CRUD
- **Patient**: Patient management
- **Episode**: Medical episodes (admissions)
- **ClinicalRecord**: Clinical observations
- **LabResult**: Lab test results
- **CultureResult/SensitivityResult**: Microbiology
- **ImageResult**: Imaging studies
- **MedicalHistory**: Patient history
- **Surgery**: Surgical procedures
- **AiChat**: AI conversation sessions
- **AiRecommendation**: AI diagnosis runs

---

## Component Patterns

### Page Component (Container)
```tsx
// pages/user/PatientTable.tsx
const PatientTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const patients = useAppSelector(state => state.patient.patients);

  useEffect(() => {
    dispatch(fetchPatients(query));
  }, []);

  return <DataTable data={patients} columns={columns} />;
};
```

### Feature Component
```tsx
// components/user/patient_table/PatientModal.tsx
interface Props {
  open: boolean;
  patient?: IPatient;
  onClose: () => void;
  onSubmit: (data: IPatient) => void;
}
const PatientModal: React.FC<Props> = ({ open, patient, onClose, onSubmit }) => {
  // Form logic, validation
  return <Modal>...</Modal>;
};
```

### Reusable Component
```tsx
// components/common/Access.tsx
// Permission-based conditional rendering
<Access permission="USERS.CREATE">
  <Button>Create User</Button>
</Access>
```

---

## Environment Variables

```bash
VITE_BACKEND_URL=http://localhost:8080   # API base URL
```

Access via `import.meta.env.VITE_BACKEND_URL`

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `antd` | 5.x | UI components |
| `@ant-design/pro-components` | 2.x | Advanced components (ProTable, ProLayout) |
| `@reduxjs/toolkit` | 2.x | State management |
| `react-router-dom` | 7.x | Routing |
| `axios` | 1.x | HTTP client |
| `recharts` | 3.x | Charts |
| `dayjs` | 1.x | Date handling |

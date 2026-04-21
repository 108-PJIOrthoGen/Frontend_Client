# Project Structure

```
src/
├── App.tsx                  # Root component
├── index.tsx                # Entry point
├── index.css                # Global styles
├── vite-env.d.ts
│
├── apis/                    # API layer
│   ├── api.ts               # All API call functions (call{Action}{Module} pattern)
│   └── axios.custom.ts      # Axios instance, interceptors, token refresh
│
├── components/              # Reusable components
│   ├── common/              # Shared UI
│   │   ├── ux/              # Loading, spinners
│   │   ├── Access.tsx        # Permission-based rendering
│   │   ├── LayoutApp.tsx     # Global wrapper
│   │   └── protected/
│   │       └── RouteProtected.tsx
│   ├── admin/               # Admin CRUD components
│   │   ├── manage_user/
│   │   ├── manage_role/
│   │   ├── manage_permission/
│   │   ├── HeaderAdmin.tsx, SideNav.tsx, FooterAdmin.tsx
│   ├── user/                # Clinical domain components
│   │   ├── diagnose_steps/   # AI diagnosis wizard
│   │   ├── patient_table/    # Patient management
│   │   ├── chart_result/     # Lab analytics charts
│   │   ├── compare_result/   # Episode comparison
│   │   ├── pending_lab_tasks/ # Lab task tracking
│   │   └── rag_diagnose/     # RAG-based suggestions
│   │       ├── rag_surgery/
│   │       └── rag_antibiolocal/
│   ├── icons/               # Custom SVG icons
│   └── DataTable.tsx        # Shared data table
│
├── pages/                   # Route page containers
│   ├── auth/LoginPage.jsx
│   ├── admin/ (AdminHome, UserTable, RoleTable, PermissionTable)
│   ├── user/ (AiDiagnoseSuggestion, PatientTable, ChartTesting, CompareResult)
│   └── errors/ (NotFoundPage, ForbiddenPage)
│
├── layouts/
│   ├── LayoutAdmin.tsx      # Admin ProLayout
│   └── LayoutClient.tsx     # User/clinical layout
│
├── redux/
│   ├── store.ts             # Store config
│   ├── hook.ts              # useAppDispatch, useAppSelector
│   └── slice/
│       ├── accountSlice.ts  # Auth state
│       ├── patientSlice.ts
│       ├── pendingLabTaskSlice.ts
│       ├── userSlice.ts
│       ├── roleSlice.ts
│       └── permissionSlice.ts
│
├── routes/index.tsx         # Route definitions (createBrowserRouter)
│
├── types/
│   ├── backend.d.ts         # API response types, domain models
│   ├── types.ts             # Shared types
│   ├── treatmentType.ts     # Treatment-related types
│   └── file.d.ts
│
├── constants/
│   ├── permission.ts        # Permission keys
│   └── date.ts              # Date formats
│
└── config/
    └── utils.ts             # Utility functions
```

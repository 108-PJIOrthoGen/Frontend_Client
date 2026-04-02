# Frontend Project Rules

> Conventions, patterns, and workflow for consistent development.

---

## Architecture Principles

1. **Feature-based structure**: Each feature module is self-contained (components + hooks + index)
2. **Business logic separated from UI**: All logic in `lib/utils/` as pure functions
3. **Centralized constants**: No hardcoded magic numbers/strings in components
4. **Reusable components**: Shared components in `components/common/`
5. **Barrel exports**: Each module has `index.ts` for clean imports
6. **Type safety**: Strict TypeScript, enums over string literals, no `any`
7. **Max ~130 lines/file**: Easy to read, review, and split work

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page | `PascalCase.tsx` | `PatientTable.tsx` |
| Component | `PascalCase.tsx` | `PatientModal.tsx` |
| Slice | `camelCaseSlice.ts` | `patientSlice.ts` |
| API module | `camelCase.ts` | `api.ts` |
| Types | `camelCase.d.ts` | `backend.d.ts` |
| Constants | `camelCase.ts` | `permission.ts` |
| Folder | `snake_case` or `kebab-case` | `manage_user/`, `rag_diagnose/` |

---

## Component Structure

### Standard Component Template
```tsx
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
// 1. External imports first
// 2. Internal imports (@/)
// 3. Types/interfaces
// 4. Constants

interface Props {
  // Props definition
}

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. Hooks (useState, useEffect, useAppDispatch, etc.)
  // 2. Derived state / computed values
  // 3. Handlers
  // 4. Effects

  return (
    // JSX
  );
};

export default ComponentName;
```

### Component Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Pages | `pages/` | Route containers, data fetching |
| Features | `components/{domain}/` | Domain-specific UI |
| Common | `components/common/` | Reusable across features |
| Layouts | `layouts/` | Page structure wrappers |

---

## State Management Rules

### When to Use Redux
- **Global state**: Auth, user info, app-wide settings
- **Shared state**: Data needed by multiple unrelated components
- **Server cache**: Fetched data that needs to persist across navigation

### When to Use Local State
- **UI state**: Modal open/close, form inputs, loading states
- **Derived state**: Computed from props or other state
- **Ephemeral state**: Temporary, not needed elsewhere

### Slice Pattern
```ts
// redux/slice/exampleSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface IState {
  items: IItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: IState = {
  items: [],
  isLoading: false,
  error: null,
};

// Async thunk
export const fetchItems = createAsyncThunk('example/fetchItems', async (query: string) => {
  const response = await callFetchItems(query);
  return response.data;
});

export const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    clearItems: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to fetch';
        state.isLoading = false;
      });
  },
});

export const { clearItems } = exampleSlice.actions;
export default exampleSlice.reducer;
```

---

## API Layer Rules

### API Function Naming
```ts
// Pattern: call{Action}{Module}
callFetch{Module}     // GET list
callFetch{Module}ById // GET single
callCreate{Module}    // POST
callUpdate{Module}    // PUT
callDelete{Module}    // DELETE
```

### Adding New API Module
```ts
// apis/api.ts

/**
 * Module NewFeature
 */
export const callFetchNewFeature = (query: string): Promise<IBackendRes<IModelPaginate<INewFeature>>> => {
  return instance.get(`/api/v1/new-features?${query}`);
};

export const callCreateNewFeature = (data: INewFeature): Promise<IBackendRes<INewFeature>> => {
  return instance.post('/api/v1/new-features', { ...data });
};

export const callUpdateNewFeature = (id: string, data: INewFeature): Promise<IBackendRes<INewFeature>> => {
  return instance.put(`/api/v1/new-features/${id}`, { ...data });
};

export const callDeleteNewFeature = (id: string): Promise<IBackendRes<INewFeature>> => {
  return instance.delete(`/api/v1/new-features/${id}`);
};
```

---

## Adding New Features Workflow

### 1. Define Types
```ts
// types/backend.d.ts
export interface INewFeature {
  id?: string;
  name: string;
  // ... fields
  createdAt?: string;
  updatedAt?: string;
}
```

### 2. Add API Functions
```ts
// apis/api.ts — add CRUD functions following the pattern above
```

### 3. Create Redux Slice (if needed)
```ts
// redux/slice/newFeatureSlice.ts — follow the slice pattern
// Register in redux/store.ts
```

### 4. Create Components
```
components/
└── user/
    └── new_feature/
        ├── NewFeatureList.tsx    # List view
        ├── NewFeatureModal.tsx   # Create/Edit modal
        ├── NewFeatureCard.tsx    # Card display
        └── index.ts              # Barrel export
```

### 5. Create Page
```tsx
// pages/user/NewFeaturePage.tsx
```

### 6. Add Route
```tsx
// routes/index.tsx
{
  path: "new-feature",
  element: <ProtectedRoute><NewFeaturePage /></ProtectedRoute>
}
```

---

## Ant Design Usage

### Form Pattern
```tsx
const [form] = Form.useForm();

const onFinish = async (values: IFormValues) => {
  try {
    await callCreateItem(values);
    message.success('Created successfully');
    form.resetFields();
    onClose();
  } catch {
    message.error('Failed to create');
  }
};

<Form form={form} layout="vertical" onFinish={onFinish}>
  <Form.Item name="field" label="Label" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  <Button type="primary" htmlType="submit">Submit</Button>
</Form>
```

### Table Pattern
```tsx
const columns: ColumnsType<IItem> = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Status', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
  {
    title: 'Actions',
    render: (_, record) => (
      <Space>
        <Button onClick={() => handleEdit(record)}>Edit</Button>
        <Popconfirm onConfirm={() => handleDelete(record.id)}>
          <Button danger>Delete</Button>
        </Popconfirm>
      </Space>
    ),
  },
];

<Table dataSource={items} columns={columns} rowKey="id" pagination={pagination} />
```

### Modal Pattern
```tsx
<Modal
  title={isEdit ? 'Edit Item' : 'Create Item'}
  open={open}
  onCancel={onClose}
  footer={null}
  destroyOnClose
>
  <Form>...</Form>
</Modal>
```

---

## Error Handling

### API Errors
```tsx
// Handled globally in axios interceptor for 401, 403
// Component-level handling for specific errors:
try {
  const res = await callCreateItem(data);
  if (res.status === 'error') {
    message.error(res.message);
    return;
  }
  message.success('Success');
} catch (error) {
  message.error('Network error');
}
```

### Form Validation
```tsx
<Form.Item
  name="email"
  label="Email"
  rules={[
    { required: true, message: 'Required' },
    { type: 'email', message: 'Invalid email' },
  ]}
>
  <Input />
</Form.Item>
```

---

## Code Quality Checklist

### Before Committing
- [ ] No TypeScript errors (`npm run build`)
- [ ] No hardcoded strings (use constants)
- [ ] No `any` types (use proper interfaces)
- [ ] No `console.log` left in code
- [ ] Components < 130 lines
- [ ] Proper loading states for async operations
- [ ] Error handling for API calls
- [ ] Form validation rules defined

### MUST DO
- Use `@/` path aliases for imports
- Define interfaces for all props
- Use typed hooks: `useAppDispatch`, `useAppSelector`
- Handle loading and error states
- Use Ant Design components consistently
- Follow existing patterns in codebase

### MUST NOT
- Hardcode API URLs (use env vars)
- Store sensitive data in localStorage (except tokens)
- Mutate Redux state directly
- Skip TypeScript types
- Create duplicate components
- Mix business logic in UI components

---

## Import Order

```tsx
// 1. React
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { Form, Modal, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

// 3. Redux hooks and actions
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { fetchItems } from '@/redux/slice/itemSlice';

// 4. API functions
import { callCreateItem } from '@/apis/api';

// 5. Components
import ItemCard from '@/components/user/item/ItemCard';

// 6. Types
import type { IItem } from '@/types/backend';

// 7. Constants and utils
import { ITEM_STATUS } from '@/constants/item';
```

---

## Testing (Future)

### Unit Tests
- Test pure utility functions
- Test Redux reducers
- Test custom hooks

### Integration Tests
- Test component rendering with mocked Redux state
- Test form submissions
- Test API integration

### E2E Tests
- Critical user flows (login, CRUD operations)
- Protected routes
- Error scenarios

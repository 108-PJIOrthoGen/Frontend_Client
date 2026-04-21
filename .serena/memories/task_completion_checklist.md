# Task Completion Checklist

After completing a coding task, verify:

1. **No TypeScript errors**: `npm run build` passes
2. **No hardcoded strings**: use constants
3. **No `any` types**: use proper interfaces
4. **No `console.log`** left in code
5. **Components < 130 lines**: split if larger
6. **Loading states** handled for async operations
7. **Error handling** for API calls (try/catch + message feedback)
8. **Form validation rules** defined for form inputs
9. **Proper imports**: use `@/` path aliases, correct import order
10. **Type safety**: interfaces defined for props, API responses typed
11. **Ant Design patterns**: consistent use of Form, Table, Modal, message
12. **Route registered** if new page added (routes/index.tsx)

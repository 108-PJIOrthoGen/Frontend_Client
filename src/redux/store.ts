import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import roleReducer from '@/redux/features/admin/roles/roleSlice';
import accountReducer from './slice/accountSlice';
import permissionReducer from './features/admin/permissions/permissionSlice';
import userReducer from './features/admin/users/userSlice';
import patientReducer from './features/patients/patientSlice';
import { patientPersistenceMiddleware } from './features/patients/patientPersistence';
import pendingLabTaskReducer from './slice/pendingLabTaskSlice';
import aiRegimenTaskReducer from './slice/aiRegimenTaskSlice';
import { injectStore } from '../apis/axios.custom';


export const store = configureStore({
    reducer: {
        account: accountReducer,
        role: roleReducer,
        permission: permissionReducer,
        user: userReducer,
        patient: patientReducer,
        pendingLabTask: pendingLabTaskReducer,
        aiRegimenTask: aiRegimenTaskReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(patientPersistenceMiddleware.middleware),
})
injectStore(store.dispatch);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

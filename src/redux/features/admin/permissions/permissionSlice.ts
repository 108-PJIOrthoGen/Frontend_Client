import { callFetchPermission } from '@/apis/permissions';
import {
    createPaginatedListState,
    requirePaginatedData,
    type PaginatedListState,
} from '@/redux/shared/paginatedState';
import type { IPermission } from '@/types/backend';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

type PermissionState = PaginatedListState<IPermission>;

export const fetchPermission = createAsyncThunk(
    'permission/fetchPermission',
    async ({ query }: { query: string }) => {
        const response = await callFetchPermission(query);
        return requirePaginatedData(response.data, 'permission');
    },
);

const initialState: PermissionState =
    createPaginatedListState<IPermission>(0);

export const permissionSlice = createSlice({
    name: 'permission',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPermission.pending, (state) => {
                state.isFetching = true;
                state.error = null;
            })
            .addCase(fetchPermission.fulfilled, (state, action) => {
                state.isFetching = false;
                state.meta = action.payload.meta;
                state.result = action.payload.result;
            })
            .addCase(fetchPermission.rejected, (state, action) => {
                state.isFetching = false;
                state.error =
                    action.error.message ?? 'Unable to fetch permissions';
            });
    },
});

export default permissionSlice.reducer;

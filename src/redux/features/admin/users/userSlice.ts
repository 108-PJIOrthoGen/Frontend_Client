import { callFetchUser } from '@/apis/users';
import {
    createPaginatedListState,
    requirePaginatedData,
    type PaginatedListState,
} from '@/redux/shared/paginatedState';
import type { IUser } from '@/types/backend';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

type UserState = PaginatedListState<IUser>;

export const fetchUser = createAsyncThunk(
    'user/fetchUser',
    async ({ query }: { query: string }) => {
        const response = await callFetchUser(query);
        return requirePaginatedData(response.data, 'user');
    },
);

const initialState: UserState = createPaginatedListState<IUser>(1);

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUser.pending, (state) => {
                state.isFetching = true;
                state.error = null;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.isFetching = false;
                state.meta = action.payload.meta;
                state.result = action.payload.result;
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.isFetching = false;
                state.error = action.error.message ?? 'Unable to fetch users';
            });
    },
});

export default userSlice.reducer;

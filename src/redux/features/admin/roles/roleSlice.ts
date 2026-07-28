import { callFetchRole, callFetchRoleById } from '@/apis/roles';
import {
    createPaginatedListState,
    requirePaginatedData,
    type PaginatedListState,
} from '@/redux/shared/paginatedState';
import type { IRole } from '@/types/backend';
import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from '@reduxjs/toolkit';

interface RoleState extends PaginatedListState<IRole> {
    isFetchSingle: boolean;
    singleError: string | null;
    singleRole: IRole;
}

const createEmptyRole = (): IRole => ({
    id: '',
    name: '',
    description: '',
    active: false,
    permissions: [],
});

export const fetchRole = createAsyncThunk(
    'role/fetchRole',
    async ({ query }: { query: string }) => {
        const response = await callFetchRole(query);
        return requirePaginatedData(response.data, 'role');
    },
);

export const fetchRoleById = createAsyncThunk(
    'role/fetchRoleById',
    async (id: string) => {
        const response = await callFetchRoleById(id);

        if (!response.data) {
            throw new Error('Missing role data');
        }

        return response.data;
    },
);

const initialState: RoleState = {
    ...createPaginatedListState<IRole>(0),
    isFetchSingle: true,
    singleError: null,
    singleRole: createEmptyRole(),
};

export const roleSlice = createSlice({
    name: 'role',
    initialState,
    reducers: {
        resetSingleRole: (state, _action: PayloadAction<unknown>) => {
            state.singleRole = createEmptyRole();
            state.singleError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRole.pending, (state) => {
                state.isFetching = true;
                state.error = null;
            })
            .addCase(fetchRole.fulfilled, (state, action) => {
                state.isFetching = false;
                state.meta = action.payload.meta;
                state.result = action.payload.result;
            })
            .addCase(fetchRole.rejected, (state, action) => {
                state.isFetching = false;
                state.error = action.error.message ?? 'Unable to fetch roles';
            })
            .addCase(fetchRoleById.pending, (state) => {
                state.isFetchSingle = true;
                state.singleError = null;
                state.singleRole = createEmptyRole();
            })
            .addCase(fetchRoleById.fulfilled, (state, action) => {
                state.isFetchSingle = false;
                state.singleRole = action.payload;
            })
            .addCase(fetchRoleById.rejected, (state, action) => {
                state.isFetchSingle = false;
                state.singleError =
                    action.error.message ?? 'Unable to fetch role';
                state.singleRole = createEmptyRole();
            });
    },
});

export const { resetSingleRole } = roleSlice.actions;
export default roleSlice.reducer;

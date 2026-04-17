import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchMyPendingLabTasks, callFetchMyPendingLabTaskCount } from '@/apis/api';
import type { IPendingLabTask } from '@/types/backend';

interface PendingLabTaskState {
  tasks: IPendingLabTask[];
  count: number;
  isLoading: boolean;
}

const initialState: PendingLabTaskState = {
  tasks: [],
  count: 0,
  isLoading: false,
};

export const fetchMyPendingTasks = createAsyncThunk(
  'pendingLabTask/fetchMy',
  async () => {
    const res = await callFetchMyPendingLabTasks();
    return res.data ?? [];
  }
);

export const fetchMyPendingCount = createAsyncThunk(
  'pendingLabTask/fetchCount',
  async () => {
    const res = await callFetchMyPendingLabTaskCount();
    return res.data ?? 0;
  }
);

export const pendingLabTaskSlice = createSlice({
  name: 'pendingLabTask',
  initialState,
  reducers: {
    decrementCount: (state) => {
      if (state.count > 0) state.count -= 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPendingTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyPendingTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
        state.count = action.payload.length;
        state.isLoading = false;
      })
      .addCase(fetchMyPendingTasks.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchMyPendingCount.fulfilled, (state, action) => {
        state.count = action.payload;
      });
  },
});

export const { decrementCount } = pendingLabTaskSlice.actions;
export default pendingLabTaskSlice.reducer;

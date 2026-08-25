import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RecommendationScope } from '@/types/backend';

export type RegimenTaskStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface IAiRegimenTask {
  id: string; // runId
  episodeId: number;
  patientId?: number;
  patientName: string;
  patientCode?: string;
  medicalRecordCode?: string;
  recommendationScope?: RecommendationScope;
  status: RegimenTaskStatus;
  progressMessage?: string;
  stage?: string;
  startedAt: number;
  finishedAt?: number;
  errorMessage?: string;
}

interface AiRegimenTaskState {
  tasks: IAiRegimenTask[];
  maxConcurrentWarningThreshold: number;
  maxConcurrentLimit: number;
}

const STORAGE_KEY = 'pji_ai_regimen_tasks';

const loadSavedTasks = (): IAiRegimenTask[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const now = Date.now();
      return parsed.filter(
        (t) => (t.status === 'PROCESSING' || t.status === 'QUEUED') && now - (t.startedAt || 0) < 60 * 60 * 1000
      );
    }
  } catch {
    // Ignore error
  }
  return [];
};

const saveTasks = (tasks: IAiRegimenTask[]) => {
  try {
    const activeTasks = tasks.filter((t) => t.status === 'PROCESSING' || t.status === 'QUEUED');
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(activeTasks.slice(0, 10)));
  } catch {
    // Ignore error
  }
};

const initialState: AiRegimenTaskState = {
  tasks: loadSavedTasks(),
  maxConcurrentWarningThreshold: 3,
  maxConcurrentLimit: 5,
};

export const aiRegimenTaskSlice = createSlice({
  name: 'aiRegimenTask',
  initialState,
  reducers: {
    addOrUpdateTask: (state, action: PayloadAction<IAiRegimenTask>) => {
      if (action.payload.status !== 'PROCESSING' && action.payload.status !== 'QUEUED') {
        state.tasks = state.tasks.filter(
          (t) => String(t.id) !== String(action.payload.id)
        );
        saveTasks(state.tasks);
        return;
      }
      const existingIdx = state.tasks.findIndex(
        (t) => String(t.id) === String(action.payload.id)
      );
      if (existingIdx >= 0) {
        state.tasks[existingIdx] = { ...state.tasks[existingIdx], ...action.payload };
      } else {
        state.tasks.unshift(action.payload);
      }
      saveTasks(state.tasks);
    },
    updateTaskProgress: (
      state,
      action: PayloadAction<{ id?: string; episodeId?: number; progressMessage?: string; stage?: string }>
    ) => {
      const { id, episodeId, progressMessage, stage } = action.payload;
      const task = state.tasks.find((t) => id
        ? String(t.id) === String(id)
        : episodeId != null && Number(t.episodeId) === Number(episodeId));
      if (task) {
        if (progressMessage !== undefined) task.progressMessage = progressMessage;
        if (stage !== undefined) task.stage = stage;
        saveTasks(state.tasks);
      }
    },
    completeTask: (
      state,
      action: PayloadAction<{ id?: string; episodeId?: number; status?: 'SUCCESS' | 'FAILED'; errorMessage?: string }>
    ) => {
      const { id, episodeId } = action.payload;
      // When recommendation finishes, automatically remove it
      state.tasks = state.tasks.filter(
        (t) => id
          ? String(t.id) !== String(id)
          : episodeId == null || Number(t.episodeId) !== Number(episodeId)
      );
      saveTasks(state.tasks);
    },
    cancelTask: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      // When recommendation is cancelled, automatically remove it
      state.tasks = state.tasks.filter((t) => t.id !== id && String(t.id) !== String(id));
      saveTasks(state.tasks);
    },
    removeTask: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.tasks = state.tasks.filter((t) => t.id !== id && String(t.id) !== String(id));
      saveTasks(state.tasks);
    },
    clearFinishedTasks: (state) => {
      state.tasks = state.tasks.filter((t) => t.status === 'PROCESSING' || t.status === 'QUEUED');
      saveTasks(state.tasks);
    },
  },
});

export const {
  addOrUpdateTask,
  updateTaskProgress,
  completeTask,
  cancelTask,
  removeTask,
  clearFinishedTasks,
} = aiRegimenTaskSlice.actions;

export default aiRegimenTaskSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RegimenTaskStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface IAiRegimenTask {
  id: string; // runId
  episodeId: number;
  patientId?: number;
  patientName: string;
  patientCode?: string;
  medicalRecordCode?: string;
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
      return parsed.filter((t) => now - (t.startedAt || 0) < 24 * 60 * 60 * 1000);
    }
  } catch {
    // Ignore error
  }
  return [];
};

const saveTasks = (tasks: IAiRegimenTask[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, 20)));
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
      const existingIdx = state.tasks.findIndex(
        (t) => t.id === action.payload.id || (t.episodeId === action.payload.episodeId && (t.status === 'PROCESSING' || t.status === 'QUEUED'))
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
      const task = state.tasks.find((t) => (id && t.id === id) || (episodeId && t.episodeId === episodeId));
      if (task) {
        if (progressMessage !== undefined) task.progressMessage = progressMessage;
        if (stage !== undefined) task.stage = stage;
        saveTasks(state.tasks);
      }
    },
    completeTask: (
      state,
      action: PayloadAction<{ id?: string; episodeId?: number; status: 'SUCCESS' | 'FAILED'; errorMessage?: string }>
    ) => {
      const { id, episodeId, status, errorMessage } = action.payload;
      const task = state.tasks.find((t) => (id && t.id === id) || (episodeId && t.episodeId === episodeId));
      if (task) {
        task.status = status;
        task.finishedAt = Date.now();
        if (errorMessage) task.errorMessage = errorMessage;
        saveTasks(state.tasks);
      }
    },
    cancelTask: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.status = 'CANCELLED';
        task.finishedAt = Date.now();
        saveTasks(state.tasks);
      }
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
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

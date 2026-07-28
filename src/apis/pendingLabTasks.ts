import type { IBackendRes, IPendingLabTask } from '@/types/backend';
import instance from './axios.custom';

interface CreatePendingLabTasksPayload {
  patientId?: number;
  runId?: number;
  missingItems: Record<string, any>[];
}

interface QuickEntryPendingLabTaskPayload {
  value: number | string;
  unit?: string;
}

export const callFetchMyPendingLabTasks = (): Promise<IBackendRes<IPendingLabTask[]>> =>
  instance.get('/api/v1/pending-lab-tasks/my');

export const callFetchMyPendingLabTaskCount = (): Promise<IBackendRes<number>> =>
  instance.get('/api/v1/pending-lab-tasks/my/count');

export const callDismissPendingLabTask = (
  taskId: number,
): Promise<IBackendRes<void>> =>
  instance.post(`/api/v1/pending-lab-tasks/${taskId}/dismiss`);

export const callQuickEntryPendingLabTask = (
  taskId: number,
  data: QuickEntryPendingLabTaskPayload,
): Promise<IBackendRes<void>> =>
  instance.post(`/api/v1/pending-lab-tasks/${taskId}/quick-entry`, data);

export const callCreatePendingLabTasksFromCompleteness = (
  episodeId: number,
  data: CreatePendingLabTasksPayload,
): Promise<IBackendRes<void>> =>
  instance.post(
    `/api/v1/episodes/${episodeId}/pending-lab-tasks/from-completeness`,
    data,
  );

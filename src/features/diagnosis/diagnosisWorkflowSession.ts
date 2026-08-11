import type { IAiRecommendationRunDetail } from '@/types/backend';

export interface DiagnosisWorkflowScope {
  episodeId: string;
  patientId: string;
}

export interface DiagnosisThoughtLog {
  at: number;
  message: string;
  stage: string;
}

interface DiagnosisWorkflowState {
  diagnosticResult: unknown | null;
  pendingRunId: string | null;
  recommendationDetail: IAiRecommendationRunDetail | null;
  runId: string | null;
  scope: DiagnosisWorkflowScope | null;
  thoughtLogs: DiagnosisThoughtLog[];
}

const emptyState = (scope: DiagnosisWorkflowScope | null = null): DiagnosisWorkflowState => ({
  diagnosticResult: null,
  pendingRunId: null,
  recommendationDetail: null,
  runId: null,
  scope,
  thoughtLogs: [],
});

let workflowState = emptyState();

const normalizeId = (value: string | number | null | undefined): string => (
  value == null ? '' : String(value).trim()
);

export const createDiagnosisWorkflowScope = (
  patientId: string | number | null | undefined,
  episodeId: string | number | null | undefined,
): DiagnosisWorkflowScope | null => {
  const normalizedPatientId = normalizeId(patientId);
  const normalizedEpisodeId = normalizeId(episodeId);
  if (!normalizedPatientId || !normalizedEpisodeId) return null;
  return { patientId: normalizedPatientId, episodeId: normalizedEpisodeId };
};

const isSameScope = (
  left: DiagnosisWorkflowScope | null,
  right: DiagnosisWorkflowScope | null,
): boolean => Boolean(
  left
  && right
  && left.patientId === right.patientId
  && left.episodeId === right.episodeId,
);

const requireActiveScope = (scope: DiagnosisWorkflowScope): boolean => (
  isSameScope(workflowState.scope, scope)
);

export const isDiagnosisWorkflowScopeActive = (scope: DiagnosisWorkflowScope): boolean => (
  isSameScope(workflowState.scope, scope)
);

export const activateDiagnosisWorkflow = (
  scope: DiagnosisWorkflowScope,
  options: { reset?: boolean } = {},
): void => {
  if (options.reset || !isSameScope(workflowState.scope, scope)) {
    workflowState = emptyState(scope);
  }
};

export const clearDiagnosisWorkflowSession = (): void => {
  workflowState = emptyState();
};

export const getDiagnosisWorkflowSnapshot = (
  scope: DiagnosisWorkflowScope,
): Readonly<DiagnosisWorkflowState> | null => {
  if (!isSameScope(workflowState.scope, scope)) return null;
  return {
    ...workflowState,
    thoughtLogs: [...workflowState.thoughtLogs],
  };
};

export const storeDiagnosticResult = (
  scope: DiagnosisWorkflowScope,
  diagnosticResult: unknown,
): void => {
  if (!requireActiveScope(scope)) return;
  workflowState.diagnosticResult = diagnosticResult;
};

export const storeRecommendationRun = (
  scope: DiagnosisWorkflowScope,
  runId: string,
  recommendationDetail: IAiRecommendationRunDetail | null = null,
): void => {
  if (!requireActiveScope(scope)) return;
  workflowState.runId = runId;
  if (recommendationDetail) {
    workflowState.recommendationDetail = recommendationDetail;
  }
};

export const storePendingRecommendationRun = (
  scope: DiagnosisWorkflowScope,
  runId: string,
): void => {
  if (!requireActiveScope(scope)) return;
  workflowState.pendingRunId = runId;
  workflowState.runId = runId;
};

export const storeDiagnosisThoughtLogs = (
  scope: DiagnosisWorkflowScope,
  thoughtLogs: DiagnosisThoughtLog[],
): void => {
  if (!requireActiveScope(scope)) return;
  workflowState.thoughtLogs = [...thoughtLogs];
};

export const clearPendingRecommendationRun = (scope: DiagnosisWorkflowScope): void => {
  if (!isSameScope(workflowState.scope, scope)) return;
  workflowState.pendingRunId = null;
  workflowState.thoughtLogs = [];
};

export const clearRecommendationRun = (scope: DiagnosisWorkflowScope): void => {
  if (!isSameScope(workflowState.scope, scope)) return;
  workflowState.pendingRunId = null;
  workflowState.recommendationDetail = null;
  workflowState.runId = null;
  workflowState.thoughtLogs = [];
};

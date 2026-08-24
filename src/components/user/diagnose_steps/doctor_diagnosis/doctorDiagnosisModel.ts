import {
  callFetchAiRecommendationRunDetail,
  callFetchRunClinicalDecision,
} from '@/apis/api';
import type {
  IAiRecommendationRunDetail,
  IDoctorDiagnosis,
} from '@/types/backend';
import type { SurgeryPlanData } from '@/types/treatmentType';
import { parseItemJson } from '../treatment_plan/utils/itemJson';
import {
  systemDiagnosisOf,
  type SystemDiagnosisSummary,
} from './doctorDiagnosisValues';
import {
  clearDiagnosisWorkflowSession,
  clearPendingRecommendationRun,
  getDiagnosisWorkflowSnapshot,
  storeRecommendationRun,
  type DiagnosisWorkflowScope,
} from '@/features/diagnosis/diagnosisWorkflowSession';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 300;
const TREATMENT_CATEGORIES = new Set(['SURGERY_PROCEDURE']);

export interface DoctorDiagnosisModel {
  systemDiagnosis: SystemDiagnosisSummary;
  aiSurgery: SurgeryPlanData | null;
  previousDiagnosis?: IDoctorDiagnosis;
  previousSurgery?: SurgeryPlanData;
  revision: number;
  status?: 'DRAFT' | 'SIGNED';
  canEditDoctor: boolean;
  runId: string;
}

const hasTreatmentItems = (detail: IAiRecommendationRunDetail | null): boolean => {
  const categories = new Set<string | undefined>(detail?.items?.map((item) => item.category));
  return [...TREATMENT_CATEGORIES].every((category) => categories.has(category));
};

const wait = (milliseconds: number) => (
  new Promise((resolve) => setTimeout(resolve, milliseconds))
);

const fetchUntilTreatmentReady = async (runId: string): Promise<IAiRecommendationRunDetail> => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await callFetchAiRecommendationRunDetail(runId);
    const detail = response?.data ?? null;
    const status = detail?.run?.status;

    if (detail && hasTreatmentItems(detail)) return detail;
    if (status === 'FAILED' || status === 'TIMEOUT') {
      throw new Error(detail?.run?.errorMessage || 'Sinh phác đồ thất bại.');
    }
    if (status === 'CANCELLED') throw new Error('Lần sinh phác đồ đã bị huỷ.');
    if ((status === 'SUCCESS' || status === 'PARTIAL') && !hasTreatmentItems(detail)) {
      throw new Error('AI chưa trả phác đồ phẫu thuật.');
    }
    await wait(POLL_INTERVAL_MS);
  }
  throw new Error('AI tạo phác đồ quá lâu. Vui lòng quay lại sau.');
};

const loadRecommendationDetail = async (
  workflowScope: DiagnosisWorkflowScope,
): Promise<IAiRecommendationRunDetail> => {
  const snapshot = getDiagnosisWorkflowSnapshot(workflowScope);
  const runId = snapshot?.runId ?? null;
  let detail = snapshot?.recommendationDetail ?? null;

  if ((!detail || !hasTreatmentItems(detail)) && runId) {
    detail = await fetchUntilTreatmentReady(runId);
    if (String(detail.run?.episodeId ?? '') !== workflowScope.episodeId) {
      throw new Error('Kết quả AI không thuộc bệnh án đang mở.');
    }
    storeRecommendationRun(workflowScope, runId, detail);
    clearPendingRecommendationRun(workflowScope);
  }

  if (!detail || !detail.items?.length || !detail.run?.id) {
    throw new Error('Không tìm thấy dữ liệu gợi ý AI. Vui lòng quay lại bước trước.');
  }
  if (String(detail.run.episodeId ?? '') !== workflowScope.episodeId) {
    throw new Error('Kết quả AI không thuộc bệnh án đang mở.');
  }
  return detail;
};

export const loadDoctorDiagnosisModel = async (
  workflowScope: DiagnosisWorkflowScope,
): Promise<DoctorDiagnosisModel> => {
  const detail = await loadRecommendationDetail(workflowScope);
  if (!detail.diagnostic?.itemJson) {
    throw new Error('Phiên bản này không có kết quả chẩn đoán hệ thống đã lưu.');
  }
  const systemDiagnosis = systemDiagnosisOf(detail.diagnostic);
  const surgeryItem = detail.items?.find((item) => item.category === 'SURGERY_PROCEDURE');
  const aiSurgery = surgeryItem ? (parseItemJson(surgeryItem) as SurgeryPlanData) : null;

  let previousDiagnosis: IDoctorDiagnosis | undefined;
  let previousSurgery: SurgeryPlanData | undefined;

  try {
    const response = await callFetchRunClinicalDecision(String(detail.run?.id));
    const decision = response?.data?.doctorDecision;
    previousDiagnosis = decision?.diagnosisJson;
    previousSurgery = decision?.surgeryPlanJson;
    return {
      systemDiagnosis,
      aiSurgery,
      previousDiagnosis,
      previousSurgery,
      revision: decision?.revision ?? 0,
      status: decision?.status,
      canEditDoctor: response?.data?.canEditDoctor ?? false,
      runId: String(detail.run?.id),
    };
  } catch {
    // Keep the model readable if the decision workspace has not been initialized yet.
  }

  return {
    systemDiagnosis,
    aiSurgery,
    previousDiagnosis,
    previousSurgery,
    revision: 0,
    canEditDoctor: false,
    runId: String(detail.run?.id),
  };
};

export const clearDiagnosisWorkflowStorage = () => {
  clearDiagnosisWorkflowSession();
};

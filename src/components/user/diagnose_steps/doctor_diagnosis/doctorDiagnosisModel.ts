import {
  callFetchAiRecommendationRunDetail,
  callFetchDoctorReviewByRunId,
} from '@/apis/api';
import type {
  IAiRecommendationRunDetail,
  IDoctorDiagnosis,
} from '@/types/backend';
import type { SurgeryPlanData } from '@/types/treatmentType';
import { parseItemJson } from '../treatment_plan/utils/itemJson';
import {
  clearDiagnosisWorkflowSession,
  clearPendingRecommendationRun,
  getDiagnosisWorkflowSnapshot,
  storeRecommendationRun,
  type DiagnosisWorkflowScope,
} from '@/features/diagnosis/diagnosisWorkflowSession';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 300;
const TREATMENT_CATEGORIES = new Set([
  'SURGERY_PROCEDURE',
  'SYSTEMIC_ANTIBIOTIC',
  'LOCAL_ANTIBIOTIC',
]);

export const PJI_CONCLUSION_LABELS: Record<string, string> = {
  INFECTED: 'Nhiễm trùng khớp nhân tạo (PJI)',
  NOT_INFECTED: 'Không nhiễm trùng',
  INCONCLUSIVE: 'Chưa kết luận được',
};

/** Map the AI pji_probability vocabulary onto the doctor conclusion vocabulary. */
export const aiConclusionOf = (pjiProbability?: string): string => {
  switch ((pjiProbability ?? '').toUpperCase()) {
    case 'DEFINITE':
      return 'INFECTED';
    case 'UNLIKELY':
      return 'NOT_INFECTED';
    default:
      return 'INCONCLUSIVE';
  }
};

export type DoctorReviewDecision = 'ACCEPTED' | 'MODIFIED' | 'REJECTED';

export interface AiDiagnosisSummary {
  pjiProbability?: string;
  overallAssessment?: string;
  primaryDiagnosis?: string;
  infectionClassification?: string;
  identifiedOrganism?: string;
}

export interface DoctorDiagnosisModel {
  aiDiagnosis: AiDiagnosisSummary;
  aiSurgery: SurgeryPlanData | null;
  previousDiagnosis?: IDoctorDiagnosis;
  previousSurgery?: SurgeryPlanData;
  rejectionReason: string;
  reviewDecision?: DoctorReviewDecision;
  reviewNote: string;
  runId: string;
}

const hasTreatmentItems = (detail: IAiRecommendationRunDetail | null): boolean => {
  const categories = new Set(detail?.items?.map((item) => item.category));
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

    if (hasTreatmentItems(detail)) return detail;
    if (status === 'FAILED' || status === 'TIMEOUT') {
      throw new Error(detail?.run?.errorMessage || 'Sinh phác đồ thất bại.');
    }
    if (status === 'CANCELLED') throw new Error('Lần sinh phác đồ đã bị huỷ.');
    if ((status === 'SUCCESS' || status === 'PARTIAL') && !hasTreatmentItems(detail)) {
      throw new Error('AI chưa trả đủ 3 phác đồ điều trị.');
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

  if (!detail?.items?.length || !detail.run?.id) {
    throw new Error('Không tìm thấy dữ liệu gợi ý AI. Vui lòng quay lại bước trước.');
  }
  if (String(detail.run.episodeId ?? '') !== workflowScope.episodeId) {
    throw new Error('Kết quả AI không thuộc bệnh án đang mở.');
  }
  return detail;
};

const parseAssessment = (rawAssessment: unknown): Record<string, any> => {
  try {
    return typeof rawAssessment === 'string'
      ? JSON.parse(rawAssessment)
      : (rawAssessment as Record<string, any>) ?? {};
  } catch {
    return {};
  }
};

const isReviewDecision = (value: unknown): value is DoctorReviewDecision => (
  value === 'ACCEPTED' || value === 'MODIFIED' || value === 'REJECTED'
);

export const loadDoctorDiagnosisModel = async (
  workflowScope: DiagnosisWorkflowScope,
): Promise<DoctorDiagnosisModel> => {
  const detail = await loadRecommendationDetail(workflowScope);
  const assessment = parseAssessment(detail.run?.assessmentJson);
  const diagnosticItem = detail.items?.find((item) => item.category === 'DIAGNOSTIC_TEST');
  const diagnosticJson: any = diagnosticItem ? parseItemJson(diagnosticItem) : null;
  const aiReasoning = diagnosticJson?.aiReasoning ?? {};
  const aiDiagnosis: AiDiagnosisSummary = {
    pjiProbability: assessment?.pji_probability ?? assessment?.pjiProbability,
    overallAssessment: assessment?.overall_assessment ?? assessment?.overallAssessment,
    primaryDiagnosis: aiReasoning?.primaryDiagnosis,
    infectionClassification: aiReasoning?.infectionClassification,
    identifiedOrganism: aiReasoning?.identifiedOrganism?.name,
  };
  const surgeryItem = detail.items?.find((item) => item.category === 'SURGERY_PROCEDURE');
  const aiSurgery = surgeryItem ? (parseItemJson(surgeryItem) as SurgeryPlanData) : null;

  let previousDiagnosis: IDoctorDiagnosis | undefined;
  let previousSurgery: SurgeryPlanData | undefined;
  let reviewDecision: DoctorReviewDecision | undefined;
  let reviewNote = '';
  let rejectionReason = '';

  try {
    const response = await callFetchDoctorReviewByRunId(String(detail.run?.id));
    const review = response?.data;
    if (review) {
      previousDiagnosis = review.doctorFinalDecision?.diagnosisJson ?? review.doctorDiagnosisJson;
      previousSurgery = review.doctorFinalDecision?.surgeryPlanJson
        ?? (review.modificationJson?.surgery as SurgeryPlanData | undefined);
      reviewDecision = isReviewDecision(review.reviewStatus) ? review.reviewStatus : undefined;
      reviewNote = review.reviewNote ?? '';
      rejectionReason = review.rejectionReason ?? '';
    }
  } catch {
    // A missing review is the normal first-review state.
  }

  return {
    aiDiagnosis,
    aiSurgery,
    previousDiagnosis,
    previousSurgery,
    rejectionReason,
    reviewDecision,
    reviewNote,
    runId: String(detail.run?.id),
  };
};

export const buildDoctorModificationJson = (surgery: SurgeryPlanData | null) => (
  surgery ? { surgery } : undefined
);

export const clearDiagnosisWorkflowStorage = () => {
  clearDiagnosisWorkflowSession();
};

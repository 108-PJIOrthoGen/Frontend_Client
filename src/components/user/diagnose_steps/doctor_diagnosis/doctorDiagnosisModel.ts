import {
  callFetchAiRecommendationRunDetail,
  callFetchDoctorReviewByRunId,
} from '@/apis/api';
import type {
  IAiRecommendationRunDetail,
  IDoctorDiagnosis,
} from '@/types/backend';
import type { SurgeryPlanData } from '@/types/treatmentType';
import { aiConclusionOf, norm } from '@/utils/aiDoctorCompare';
import { parseItemJson } from '../treatment_plan/utils/itemJson';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 300;
const TREATMENT_CATEGORIES = new Set([
  'SURGERY_PROCEDURE',
  'SYSTEMIC_ANTIBIOTIC',
  'LOCAL_ANTIBIOTIC',
]);

const WORKFLOW_STORAGE_KEYS = {
  aiRunDetail: 'pji_aiRunDetail',
  aiRunId: 'pji_aiRunId',
  diagnosticResult: 'pji_diagnosticResult',
  pendingRunId: 'pending_pji_aiRunId',
  pendingThoughtLogs: 'pending_pji_thoughtLogs',
  selectedExamId: 'pji_selectedExamId',
  selectedPatientId: 'pji_selectedPatientId',
} as const;

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
  finalDecision: boolean;
  previousDiagnosis?: IDoctorDiagnosis;
  previousSurgery?: SurgeryPlanData;
  rejectionReason: string;
  reviewDecision?: DoctorReviewDecision;
  reviewNote: string;
  runId: string;
}

interface AgreementInput {
  aiConclusion: string;
  aiDiagnosis: AiDiagnosisSummary;
  aiSurgery: SurgeryPlanData | null;
  diagnosis: IDoctorDiagnosis;
  doctorSurgery: SurgeryPlanData | null;
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

const loadRecommendationDetail = async (): Promise<IAiRecommendationRunDetail> => {
  const cachedDetail = localStorage.getItem(WORKFLOW_STORAGE_KEYS.aiRunDetail);
  const runId = localStorage.getItem(WORKFLOW_STORAGE_KEYS.aiRunId);
  let detail: IAiRecommendationRunDetail | null = cachedDetail
    ? JSON.parse(cachedDetail)
    : null;

  if ((!detail || !hasTreatmentItems(detail)) && runId) {
    detail = await fetchUntilTreatmentReady(runId);
    localStorage.setItem(WORKFLOW_STORAGE_KEYS.aiRunDetail, JSON.stringify(detail));
    localStorage.removeItem(WORKFLOW_STORAGE_KEYS.pendingRunId);
    localStorage.removeItem(WORKFLOW_STORAGE_KEYS.pendingThoughtLogs);
  }

  if (!detail?.items?.length || !detail.run?.id) {
    throw new Error('Không tìm thấy dữ liệu gợi ý AI. Vui lòng quay lại bước trước.');
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

export const loadDoctorDiagnosisModel = async (): Promise<DoctorDiagnosisModel> => {
  const detail = await loadRecommendationDetail();
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
  let finalDecision = true;

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
      finalDecision = review.finalDecision ?? false;
    }
  } catch {
    // A missing review is the normal first-review state.
  }

  return {
    aiDiagnosis,
    aiSurgery,
    finalDecision,
    previousDiagnosis,
    previousSurgery,
    rejectionReason,
    reviewDecision,
    reviewNote,
    runId: String(detail.run?.id),
  };
};

export const calculateAgreement = ({
  aiConclusion,
  aiDiagnosis,
  aiSurgery,
  diagnosis,
  doctorSurgery,
}: AgreementInput) => {
  const checks: Record<string, boolean> = {
    diagnosis_conclusion: norm(diagnosis.pji_conclusion) === norm(aiConclusion),
  };
  if (aiDiagnosis.infectionClassification || diagnosis.infection_classification) {
    checks.infection_classification = (
      norm(diagnosis.infection_classification)
      === norm(aiDiagnosis.infectionClassification)
    );
  }
  if (aiSurgery || doctorSurgery) {
    checks.surgery_strategy = (
      norm(doctorSurgery?.surgeryStrategyType)
      === norm(aiSurgery?.surgeryStrategyType)
    );
  }
  const values = Object.values(checks);
  return {
    ...checks,
    agreement_rate: values.length
      ? Math.round((values.filter(Boolean).length / values.length) * 100)
      : 100,
  };
};

export const buildDoctorModificationJson = (surgery: SurgeryPlanData | null) => (
  surgery ? { surgery } : undefined
);

export const clearDiagnosisWorkflowStorage = () => {
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.aiRunId);
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.aiRunDetail);
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.diagnosticResult);
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.selectedPatientId);
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.selectedExamId);
};

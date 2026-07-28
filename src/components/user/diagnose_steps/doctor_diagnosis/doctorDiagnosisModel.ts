import {
  callFetchAiRecommendationRunDetail,
  callFetchDoctorReviewByRunId,
} from '@/apis/api';
import type {
  IAiRecommendationRunDetail,
  IDoctorDiagnosis,
} from '@/types/backend';
import type {
  LocalPlanData,
  SurgeryPlanData,
  SystemicPlanData,
} from '@/types/treatmentType';
import {
  aiConclusionOf,
  localAbxNames,
  norm,
  sameSet,
  systemicAbxNames,
} from '@/utils/aiDoctorCompare';
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
  aiLocal: LocalPlanData | null;
  aiSurgery: SurgeryPlanData | null;
  aiSystemic: SystemicPlanData | null;
  defaultDiagnosis: Partial<IDoctorDiagnosis>;
  doctorLocal: LocalPlanData | null;
  doctorSurgery: SurgeryPlanData | null;
  doctorSystemic: SystemicPlanData | null;
  previousDiagnosis?: IDoctorDiagnosis;
  rejectionReason: string;
  reviewDecision?: DoctorReviewDecision;
  reviewNote: string;
  runId: string;
}

interface AgreementInput {
  aiConclusion: string;
  aiDiagnosis: AiDiagnosisSummary;
  aiLocal: LocalPlanData | null;
  aiSurgery: SurgeryPlanData | null;
  aiSystemic: SystemicPlanData | null;
  diagnosis: IDoctorDiagnosis;
  doctorLocal: LocalPlanData | null;
  doctorSurgery: SurgeryPlanData | null;
  doctorSystemic: SystemicPlanData | null;
}

const hasTreatmentItems = (
  detail: IAiRecommendationRunDetail | null,
): boolean => {
  const categories = new Set(detail?.items?.map(item => item.category));
  return [...TREATMENT_CATEGORIES].every(category => categories.has(category));
};

const wait = (milliseconds: number) => (
  new Promise(resolve => setTimeout(resolve, milliseconds))
);

const fetchUntilTreatmentReady = async (
  runId: string,
): Promise<IAiRecommendationRunDetail> => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await callFetchAiRecommendationRunDetail(runId);
    const detail = response?.data ?? null;
    const status = detail?.run?.status;

    if (hasTreatmentItems(detail)) return detail;
    if (status === 'FAILED' || status === 'TIMEOUT') {
      throw new Error(detail?.run?.errorMessage || 'AI tạo phác đồ thất bại.');
    }
    if (status === 'CANCELLED') {
      throw new Error('Lần tạo phác đồ AI đã bị huỷ.');
    }
    if (
      (status === 'SUCCESS' || status === 'PARTIAL')
      && !hasTreatmentItems(detail)
    ) {
      throw new Error('AI chưa trả đủ 3 phác đồ điều trị.');
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error('AI tạo phác đồ quá lâu. Vui lòng quay lại sau.');
};

const loadRecommendationDetail = async () => {
  const cachedDetail = localStorage.getItem(WORKFLOW_STORAGE_KEYS.aiRunDetail);
  const runId = localStorage.getItem(WORKFLOW_STORAGE_KEYS.aiRunId);
  let detail: IAiRecommendationRunDetail | null = cachedDetail
    ? JSON.parse(cachedDetail)
    : null;

  if ((!detail || !hasTreatmentItems(detail)) && runId) {
    detail = await fetchUntilTreatmentReady(runId);
    localStorage.setItem(
      WORKFLOW_STORAGE_KEYS.aiRunDetail,
      JSON.stringify(detail),
    );
    localStorage.removeItem(WORKFLOW_STORAGE_KEYS.pendingRunId);
    localStorage.removeItem(WORKFLOW_STORAGE_KEYS.pendingThoughtLogs);
  }

  if (!detail?.items?.length || !detail.run?.id) {
    throw new Error(
      'Không tìm thấy dữ liệu gợi ý AI. Vui lòng quay lại bước trước.',
    );
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
  const assessment = parseAssessment(detail.run.assessmentJson);
  const diagnosticItem = detail.items.find(item => item.category === 'DIAGNOSTIC_TEST');
  const diagnosticJson: any = diagnosticItem ? parseItemJson(diagnosticItem) : null;
  const aiReasoning = diagnosticJson?.aiReasoning ?? {};

  const aiDiagnosis: AiDiagnosisSummary = {
    pjiProbability: assessment?.pji_probability ?? assessment?.pjiProbability,
    overallAssessment: assessment?.overall_assessment ?? assessment?.overallAssessment,
    primaryDiagnosis: aiReasoning?.primaryDiagnosis,
    infectionClassification: aiReasoning?.infectionClassification,
    identifiedOrganism: aiReasoning?.identifiedOrganism?.name,
  };

  const surgeryItem = detail.items.find(item => item.category === 'SURGERY_PROCEDURE');
  const systemicItem = detail.items.find(item => item.category === 'SYSTEMIC_ANTIBIOTIC');
  const localItem = detail.items.find(item => item.category === 'LOCAL_ANTIBIOTIC');
  const aiSurgery = surgeryItem
    ? (parseItemJson(surgeryItem) as SurgeryPlanData)
    : null;
  const aiSystemic = systemicItem
    ? (parseItemJson(systemicItem) as SystemicPlanData)
    : null;
  const aiLocal = localItem
    ? (parseItemJson(localItem) as LocalPlanData)
    : null;

  let previousPlan: Record<string, any> | null = null;
  let previousDiagnosis: IDoctorDiagnosis | undefined;
  let reviewDecision: DoctorReviewDecision | undefined;
  let reviewNote = '';
  let rejectionReason = '';

  try {
    const response = await callFetchDoctorReviewByRunId(String(detail.run.id));
    const review = response?.data;
    if (review) {
      previousPlan = review.modificationJson ?? null;
      previousDiagnosis = review.doctorDiagnosisJson;
      reviewDecision = isReviewDecision(review.reviewStatus)
        ? review.reviewStatus
        : undefined;
      reviewNote = review.reviewNote ?? '';
      rejectionReason = review.rejectionReason ?? '';
    }
  } catch {
    // A missing previous review is a valid first-review state.
  }

  return {
    aiDiagnosis,
    aiLocal,
    aiSurgery,
    aiSystemic,
    defaultDiagnosis: {
      pji_conclusion: aiConclusionOf(aiDiagnosis.pjiProbability),
      infection_classification: aiDiagnosis.infectionClassification,
      primary_diagnosis: aiDiagnosis.primaryDiagnosis,
      identified_organism: aiDiagnosis.identifiedOrganism,
    },
    doctorLocal: (previousPlan?.localAntibiotic as LocalPlanData) ?? aiLocal,
    doctorSurgery: (previousPlan?.surgery as SurgeryPlanData) ?? aiSurgery,
    doctorSystemic: (
      previousPlan?.systemicAntibiotic as SystemicPlanData
    ) ?? aiSystemic,
    previousDiagnosis,
    rejectionReason,
    reviewDecision,
    reviewNote,
    runId: String(detail.run.id),
  };
};

export const calculateAgreement = ({
  aiConclusion,
  aiDiagnosis,
  aiLocal,
  aiSurgery,
  aiSystemic,
  diagnosis,
  doctorLocal,
  doctorSurgery,
  doctorSystemic,
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
  if (aiSystemic || doctorSystemic) {
    checks.systemic_antibiotics = sameSet(
      systemicAbxNames(doctorSystemic),
      systemicAbxNames(aiSystemic),
    );
  }
  if (aiLocal || doctorLocal) {
    checks.local_antibiotics = sameSet(
      localAbxNames(doctorLocal),
      localAbxNames(aiLocal),
    );
  }

  const values = Object.values(checks);
  const agreedCount = values.filter(Boolean).length;
  const agreementRate = values.length > 0
    ? Math.round((agreedCount / values.length) * 100)
    : 100;

  return { ...checks, agreement_rate: agreementRate };
};

export const buildModificationJson = (
  surgery: SurgeryPlanData | null,
  systemic: SystemicPlanData | null,
  local: LocalPlanData | null,
) => ({
  ...(surgery ? { surgery } : {}),
  ...(systemic ? { systemicAntibiotic: systemic } : {}),
  ...(local ? { localAntibiotic: local } : {}),
});

export const clearDiagnosisWorkflowStorage = () => {
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.aiRunId);
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.aiRunDetail);
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.diagnosticResult);
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.selectedPatientId);
  localStorage.removeItem(WORKFLOW_STORAGE_KEYS.selectedExamId);
};

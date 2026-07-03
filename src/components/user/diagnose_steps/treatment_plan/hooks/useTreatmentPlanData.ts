import { useCallback, useEffect, useRef, useState } from 'react';
import { callFetchAiRecommendationRunDetail } from '@/apis/api';
import type {
  IAiRecommendationRunDetail,
} from '@/types/backend';
import type {
  CitationData,
  LocalPlanData,
  SurgeryPlanData,
  SystemicPlanData,
} from '@/types/treatmentType';
import { mapCitations, parseItemJson } from '../utils/itemJson';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 300;
const TREATMENT_CATEGORIES = [
  'SURGERY_PROCEDURE',
  'SYSTEMIC_ANTIBIOTIC',
  'LOCAL_ANTIBIOTIC',
];

export const hasTreatmentItems = (detail: IAiRecommendationRunDetail | null): boolean => {
  const categories = new Set(detail?.items?.map((item) => item.category));
  return TREATMENT_CATEGORIES.every((category) => categories.has(category));
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useTreatmentPlanData() {
  const [surgeryPlan, setSurgeryPlan] = useState<SurgeryPlanData | null>(null);
  const [systemicPlan, setSystemicPlan] = useState<SystemicPlanData | null>(null);
  const [localPlan, setLocalPlan] = useState<LocalPlanData | null>(null);
  const [citations, setCitations] = useState<CitationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const runIdRef = useRef<string | null>(null);

  const applyDetail = useCallback((detail: IAiRecommendationRunDetail | null) => {
    if (!detail?.items?.length) {
      return false;
    }

    if (detail.run?.id) {
      runIdRef.current = String(detail.run.id);
    }

    const items = detail.items;

    const surgeryItem = items.find((i) => i.category === 'SURGERY_PROCEDURE');
    setSurgeryPlan(surgeryItem ? parseItemJson(surgeryItem) as SurgeryPlanData : null);

    const systemicItem = items.find((i) => i.category === 'SYSTEMIC_ANTIBIOTIC');
    setSystemicPlan(systemicItem ? parseItemJson(systemicItem) as SystemicPlanData : null);

    const localItem = items.find((i) => i.category === 'LOCAL_ANTIBIOTIC');
    setLocalPlan(localItem ? parseItemJson(localItem) as LocalPlanData : null);

    setCitations(mapCitations(detail.citations));
    setLoadError(null);
    return hasTreatmentItems(detail);
  }, []);

  const resetPlan = useCallback(() => {
    setSurgeryPlan(null);
    setSystemicPlan(null);
    setLocalPlan(null);
    setCitations([]);
    runIdRef.current = null;
    setLoadError(null);
  }, []);

  const fetchUntilTreatmentReady = useCallback(async (runId: string) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const res = await callFetchAiRecommendationRunDetail(runId);
      const detail = res?.data ?? null;
      const status = detail?.run?.status;

      if (hasTreatmentItems(detail)) return detail;
      if (status === 'FAILED' || status === 'TIMEOUT') {
        throw new Error(detail?.run?.errorMessage || 'AI tạo phác đồ thất bại.');
      }
      if (status === 'CANCELLED') {
        throw new Error('Lần tạo phác đồ AI đã bị huỷ.');
      }
      if ((status === 'SUCCESS' || status === 'PARTIAL') && !hasTreatmentItems(detail)) {
        throw new Error('AI chưa trả đủ 3 phác đồ điều trị.');
      }

      await wait(POLL_INTERVAL_MS);
    }
    throw new Error('AI tạo phác đồ quá lâu. Vui lòng quay lại sau.');
  }, []);

  useEffect(() => {
    const loadRunDetail = async () => {
      setIsLoading(true);
      try {
        // Try localStorage cache first, then fetch fresh
        let detail: IAiRecommendationRunDetail | null = null;
        const cachedDetail = localStorage.getItem('pji_aiRunDetail');
        const runId = localStorage.getItem('pji_aiRunId');
        const pendingRunId = localStorage.getItem('pending_pji_aiRunId');

        if (cachedDetail) {
          detail = JSON.parse(cachedDetail);
        }

        if (pendingRunId && pendingRunId === runId && (!detail || !hasTreatmentItems(detail))) {
          setLoadError(null);
          return;
        }

        if (!detail && !runId) {
          setLoadError(null);
          return;
        }

        if ((!detail || !hasTreatmentItems(detail)) && runId) {
          detail = await fetchUntilTreatmentReady(runId);
          if (detail) {
            localStorage.setItem('pji_aiRunDetail', JSON.stringify(detail));
            localStorage.removeItem('pending_pji_aiRunId');
            localStorage.removeItem('pending_pji_thoughtLogs');
          }
        }

        if (!detail?.items?.length) {
          setLoadError('Không tìm thấy dữ liệu gợi ý. Vui lòng quay lại bước trước.');
          return;
        }

        applyDetail(detail);
      } catch (err: any) {
        setLoadError(err?.message || 'Lỗi khi tải dữ liệu phác đồ');
      } finally {
        setIsLoading(false);
      }
    };

    loadRunDetail();
  }, [applyDetail, fetchUntilTreatmentReady]);

  return {
    surgeryPlan,
    systemicPlan,
    localPlan,
    citations,
    isLoading,
    loadError,
    runIdRef,
    applyDetail,
    fetchUntilTreatmentReady,
    resetPlan,
    setLoadError,
    hasTreatmentPlan: !!surgeryPlan && !!systemicPlan && !!localPlan,
  };
}

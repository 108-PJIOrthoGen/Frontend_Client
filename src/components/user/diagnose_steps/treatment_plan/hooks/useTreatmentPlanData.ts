import { useEffect, useRef, useState } from 'react';
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

export function useTreatmentPlanData() {
  const [surgeryPlan, setSurgeryPlan] = useState<SurgeryPlanData | null>(null);
  const [systemicPlan, setSystemicPlan] = useState<SystemicPlanData | null>(null);
  const [localPlan, setLocalPlan] = useState<LocalPlanData | null>(null);
  const [citations, setCitations] = useState<CitationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const runIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadRunDetail = async () => {
      setIsLoading(true);
      try {
        // Try localStorage cache first, then fetch fresh
        let detail: IAiRecommendationRunDetail | null = null;
        const cachedDetail = localStorage.getItem('pji_aiRunDetail');
        const runId = localStorage.getItem('pji_aiRunId');

        if (cachedDetail) {
          detail = JSON.parse(cachedDetail);
        } else if (runId) {
          const res = await callFetchAiRecommendationRunDetail(runId);
          detail = res?.data ?? null;
        }

        if (!detail?.items?.length) {
          setLoadError('Không tìm thấy dữ liệu gợi ý. Vui lòng quay lại bước trước.');
          return;
        }

        if (detail.run?.id) {
          runIdRef.current = String(detail.run.id);
        }

        const items = detail.items;

        const surgeryItem = items.find((i) => i.category === 'SURGERY_PROCEDURE');
        if (surgeryItem) setSurgeryPlan(parseItemJson(surgeryItem) as SurgeryPlanData);

        const systemicItem = items.find((i) => i.category === 'SYSTEMIC_ANTIBIOTIC');
        if (systemicItem) setSystemicPlan(parseItemJson(systemicItem) as SystemicPlanData);

        const localItem = items.find((i) => i.category === 'LOCAL_ANTIBIOTIC');
        if (localItem) setLocalPlan(parseItemJson(localItem) as LocalPlanData);

        setCitations(mapCitations(detail.citations));
      } catch (err: any) {
        setLoadError(err?.message || 'Lỗi khi tải dữ liệu phác đồ');
      } finally {
        setIsLoading(false);
      }
    };

    loadRunDetail();
  }, []);

  return {
    surgeryPlan,
    systemicPlan,
    localPlan,
    citations,
    isLoading,
    loadError,
    runIdRef,
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { callEvaluatePjiDiagnostic } from '@/apis/api';
import { useAppSelector } from '@/redux/hook';
import {
  createDiagnosisWorkflowScope,
  getDiagnosisWorkflowSnapshot,
  isDiagnosisWorkflowScopeActive,
  storeDiagnosticResult,
} from '@/features/diagnosis/diagnosisWorkflowSession';
import type { RecommendationScope } from '@/types/backend';

type DiagnosticData = Record<string, any>;

export const usePjiAssessment = (recommendationScope: RecommendationScope = 'SURGERY') => {
  const currentCase = useAppSelector(state => state.patient.currentCase);
  const episodeId = currentCase?.episode?.id;
  const patientId = currentCase?.patient?.id;
  const workflowScope = useMemo(
    () => createDiagnosisWorkflowScope(patientId, episodeId, recommendationScope),
    [episodeId, patientId, recommendationScope],
  );
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyDiagnosticResult = useCallback((diagnostic: any): boolean => {
    if (!diagnostic?.itemJson) {
      return false;
    }
    setDiagnosticData({ title: diagnostic.title, ...diagnostic.itemJson });
    return true;
  }, []);

  useEffect(() => {
    setDiagnosticData(null);
    setShowResults(false);
    if (!workflowScope) return;

    const diagnostic = getDiagnosisWorkflowSnapshot(workflowScope)?.diagnosticResult;
    if (diagnostic && applyDiagnosticResult(diagnostic)) {
      setShowResults(true);
    }
  }, [applyDiagnosticResult, workflowScope]);

  const evaluateDiagnostic = useCallback(async () => {
    if (!episodeId || !workflowScope) {
      message.error('Không tìm thấy bệnh án. Vui lòng quay lại chọn bệnh nhân.');
      return;
    }

    setIsDiagnosticLoading(true);
    setErrorMsg(null);
    try {
      const response = await callEvaluatePjiDiagnostic(String(episodeId));
      const diagnostic = response?.data;
      if (!isDiagnosisWorkflowScopeActive(workflowScope)) return;
      if (!applyDiagnosticResult(diagnostic)) {
        throw new Error('Không tìm thấy dữ liệu chẩn đoán hệ thống.');
      }
      storeDiagnosticResult(workflowScope, diagnostic);
      setShowResults(true);
      message.success('Đã tính chẩn đoán theo luật hệ thống.');
    } catch (error: any) {
      const errorMessage = error?.message || 'Đã xảy ra lỗi khi tính chẩn đoán';
      setErrorMsg(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsDiagnosticLoading(false);
    }
  }, [applyDiagnosticResult, episodeId, workflowScope]);

  return {
    diagnosticData,
    errorMsg,
    evaluateDiagnostic,
    isDiagnosticLoading,
    showResults,
  };
};

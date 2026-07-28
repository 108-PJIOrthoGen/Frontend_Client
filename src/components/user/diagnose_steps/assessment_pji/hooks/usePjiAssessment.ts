import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { callEvaluatePjiDiagnostic } from '@/apis/api';
import { useAppSelector } from '@/redux/hook';

const DIAGNOSTIC_RESULT_KEY = 'pji_diagnosticResult';

type DiagnosticData = Record<string, any>;

export const usePjiAssessment = () => {
  const currentCase = useAppSelector(state => state.patient.currentCase);
  const episodeId = currentCase?.episode?.id;
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
    const cachedDiagnostic = localStorage.getItem(DIAGNOSTIC_RESULT_KEY);
    if (!cachedDiagnostic) return;

    try {
      const diagnostic = JSON.parse(cachedDiagnostic);
      if (applyDiagnosticResult(diagnostic)) {
        setShowResults(true);
      }
    } catch {
      localStorage.removeItem(DIAGNOSTIC_RESULT_KEY);
    }
  }, [applyDiagnosticResult]);

  const evaluateDiagnostic = useCallback(async () => {
    if (!episodeId) {
      message.error('Không tìm thấy bệnh án. Vui lòng quay lại chọn bệnh nhân.');
      return;
    }

    setIsDiagnosticLoading(true);
    setErrorMsg(null);
    try {
      const response = await callEvaluatePjiDiagnostic(String(episodeId));
      const diagnostic = response?.data;
      if (!applyDiagnosticResult(diagnostic)) {
        throw new Error('Không tìm thấy dữ liệu chẩn đoán hệ thống.');
      }
      localStorage.setItem(DIAGNOSTIC_RESULT_KEY, JSON.stringify(diagnostic));
      setShowResults(true);
      message.success('Đã tính chẩn đoán theo luật hệ thống.');
    } catch (error: any) {
      const errorMessage = error?.message || 'Đã xảy ra lỗi khi tính chẩn đoán';
      setErrorMsg(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsDiagnosticLoading(false);
    }
  }, [applyDiagnosticResult, episodeId]);

  return {
    diagnosticData,
    errorMsg,
    evaluateDiagnostic,
    isDiagnosticLoading,
    showResults,
  };
};

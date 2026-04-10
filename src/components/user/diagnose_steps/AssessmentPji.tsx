import React, { useState, useCallback } from 'react';
import { Button, Result, message } from 'antd';
import { useAppSelector } from '@/redux/hook';
import {
  callGenerateAiRecommendation,
  callFetchAiRecommendationRunDetail,
} from '@/apis/api';

interface ClinicalAssessmentProps {
  onNext?: () => void;
  onPrev?: () => void;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 60;

export const S5AssessmentPji = ({ onNext, onPrev }: ClinicalAssessmentProps) => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<Record<string, any> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isViewingPrevious, setIsViewingPrevious] = useState(false);

  const currentCase = useAppSelector(state => state.patient.currentCase);
  const episodeId = currentCase?.episode?.id;

  // On mount: check if a previous run was pre-loaded from PatientExamSelector
  React.useEffect(() => {
    const cachedDetail = localStorage.getItem('pji_aiRunDetail');
    const cachedRunId = localStorage.getItem('pji_aiRunId');
    if (cachedDetail && cachedRunId) {
      try {
        const detail = JSON.parse(cachedDetail);
        const diagnosticItem = detail.items?.find(
          (item: any) => item.category === 'DIAGNOSTIC_TEST'
        );
        if (diagnosticItem) {
          const itemData =
            typeof diagnosticItem.itemJson === 'string'
              ? JSON.parse(diagnosticItem.itemJson)
              : diagnosticItem.itemJson;
          setDiagnosticData({ title: diagnosticItem.title, ...itemData });
          setShowResults(true);
          setIsViewingPrevious(true);
        }
      } catch {
        // Invalid cache — fall through to normal generate flow
      }
    }
  }, []);

  const pollRunDetail = useCallback(async (runId: string) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      const res = await callFetchAiRecommendationRunDetail(runId);
      const detail = res?.data;
      if (!detail?.run) continue;

      const status = detail.run.status;
      if (status === 'SUCCESS' || status === 'PARTIAL') return detail;
      if (status === 'FAILED' || status === 'TIMEOUT') {
        throw new Error(detail.run.errorMessage || 'AI recommendation failed');
      }
    }
    throw new Error('Polling timeout — recommendation is taking too long');
  }, []);

  const handleAIPredict = async () => {
    if (!episodeId) {
      message.error('Không tìm thấy bệnh án. Vui lòng quay lại chọn bệnh nhân.');
      return;
    }

    setIsAILoading(true);
    setErrorMsg(null);

    try {
      const generateRes = await callGenerateAiRecommendation(String(episodeId));
      const runId = generateRes?.data?.run?.id;
      if (!runId) throw new Error('Không nhận được runId từ server');

      const detail = await pollRunDetail(String(runId));
      if (!detail) throw new Error('Không nhận được kết quả');

      localStorage.setItem('pji_aiRunId', String(runId));
      localStorage.setItem('pji_aiRunDetail', JSON.stringify(detail));

      const diagnosticItem = detail.items?.find(
        item => item.category === 'DIAGNOSTIC_TEST'
      );
      if (diagnosticItem) {
        const itemData =
          typeof diagnosticItem.itemJson === 'string'
            ? JSON.parse(diagnosticItem.itemJson)
            : diagnosticItem.itemJson;
        setDiagnosticData({ title: diagnosticItem.title, ...itemData });
      }

      setShowResults(true);
      message.success('Phân tích AI hoàn tất!');
    } catch (err: any) {
      const msg = err?.message || 'Đã xảy ra lỗi khi phân tích AI';
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setIsAILoading(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-50 border-red-200 text-red-800';
      case 'MEDIUM': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'LOW': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'dangerous';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'info';
    }
  };

  const scoring_system = diagnosticData?.scoring_system;
  const major_criteria = diagnosticData?.major_criteria;
  const minor_criteria_scoring = diagnosticData?.minor_criteria_scoring;
  const ai_reasoning = diagnosticData?.ai_reasoning;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-10">
      {/* Header / Action Bar */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">neurology</span>
            {diagnosticData?.title ?? 'Đánh giá nguy cơ PJI'}
            {isViewingPrevious && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                Kết quả trước đó
              </span>
            )}
          </h2>
          {scoring_system && (
            <p className="text-sm text-slate-500 mt-1">
              {scoring_system.name} - Phiên bản {scoring_system.version}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={onPrev}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-red-300 border border-slate-200 rounded-lg"
          >
            Quay lại
          </button>
          <button
            onClick={onNext}
            disabled={!showResults}
            className={`flex items-center justify-center gap-2 px-5 h-10 font-bold text-md rounded-lg shadow-md transition-all ${
              showResults
                ? 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Tiếp tục <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </header>

      {showResults && diagnosticData ? (
        <div className="flex flex-col gap-8 animate-fade-in px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto w-full pt-2">
          {/* Top Result Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status & Score Panel */}
            <div className="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${scoring_system?.interpretation === 'INFECTED' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

              <div className="text-center mb-6 w-full">
                <h3 className="font-bold text-slate-700 uppercase mb-2">Kết luận chẩn đoán</h3>
                <div className={`text-4xl font-black tracking-tight ${scoring_system?.interpretation === 'INFECTED' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {scoring_system?.interpretation}
                </div>
              </div>

              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <path
                    className={`${scoring_system?.interpretation === 'INFECTED' ? 'text-red-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                    strokeDasharray={`${((scoring_system?.total_score ?? 0) / 20) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-800">{scoring_system?.total_score}</span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Điểm</span>
                </div>
              </div>

              <div className="mt-6 bg-blue-50/50 px-4 py-3 rounded-xl border border-blue-100 w-full text-center">
                <p className="text-sm text-blue-800 font-medium flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">verified_user</span>
                  {scoring_system?.confidence_note}
                </p>
              </div>
            </div>

            {/* Primary Diagnosis & Key Reasoning Details */}
            <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
              <div className="bg-slate-700 rounded-xl p-6 shadow-sm flex flex-col justify-center h-full relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-white">
                  <span className="material-symbols-outlined text-[150px]">coronavirus</span>
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 uppercase tracking-wider">
                        {ai_reasoning?.infection_classification}
                      </span>
                      <span className="text-md text-green-400 font-medium">
                        Phân loại nhiễm trùng
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white leading-tight">
                      {ai_reasoning?.primary_diagnosis}
                    </h3>
                    <p className="text-white leading-relaxed mb-6 border-l-2 border-blue-500 pl-4 py-1">
                      {ai_reasoning?.reasoning_summary}
                    </p>
                  </div>

                  {/* Organism Callout */}
                  {ai_reasoning?.identified_organism && (
                    <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 shrink-0">
                          <span className="material-symbols-outlined text-red-400">bug_report</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-red-300 text-lg">{ai_reasoning.identified_organism.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="bg-red-500/20 text-red-200 text-[12px] font-bold px-2 py-0.5 rounded border border-red-500/30">
                              {ai_reasoning.identified_organism.resistance_profile}
                            </span>
                            {ai_reasoning.identified_organism.biofilm_forming && (
                              <span className="bg-amber-500/20 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                                BIOFILM FORMING
                              </span>
                            )}
                          </div>
                          <p className="text-md text-yellow-400 mt-2 leading-relaxed italic">{ai_reasoning.identified_organism.resistance_detail}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warnings / Alerts Strip */}
          {ai_reasoning?.warnings && ai_reasoning.warnings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ai_reasoning.warnings.map((warning: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-xl border flex items-start gap-4 shadow-sm transition-all hover:shadow-md ${getSeverityStyles(warning.severity)}`}>
                  <div className={`p-2 rounded-full shrink-0 ${warning.severity === 'HIGH' ? 'bg-red-100 text-red-600' : warning.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    <span className="material-symbols-outlined">{getSeverityIcon(warning.severity)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{warning.type.replace('_', ' ')}</h4>
                    <p className="text-xs font-medium opacity-90 leading-relaxed">{warning.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content Grid: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* Major Criteria */}
            {major_criteria && (
              <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 overflow-hidden">
                <div className="bg-blue-50/80 border-b border-blue-200 p-5">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600">fact_check</span>
                      Tiêu chí chính (Major Criteria)
                    </h3>
                    {major_criteria.major_criteria_met ? (
                      <span className="px-3 py-1 bg-green-100 text-green-400 font-bold rounded-full border border-green-200 shadow-sm">ĐÃ THỎA MÃN</span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-400 font-bold rounded-full border border-red-200 shadow-sm">CHƯA THỎA MÃN</span>
                    )}
                  </div>
                  <p className="text-xs text-blue-800/70 font-medium">{major_criteria.note}</p>
                </div>

                <ul className="divide-y divide-blue-50">
                  {major_criteria.items?.map((item: any, idx: number) => (
                    <li key={idx} className="p-5 hover:bg-blue-50/50 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-sm text-slate-800 mb-1">{item.criterion}</p>
                          <p className="text-xs text-slate-600 bg-white inline-block px-2 py-1 rounded border border-slate-200 shadow-sm">{item.result_detail}</p>
                        </div>
                        {item.result ? (
                          <div className="bg-red-50 text-red-600 p-1.5 rounded-full border border-red-100 shrink-0">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          </div>
                        ) : (
                          <div className="bg-slate-50 text-slate-400 p-1.5 rounded-full border border-slate-100 shrink-0">
                            <span className="material-symbols-outlined text-[20px]">cancel</span>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-blue-100/50 text-blue-800 text-sm font-medium border-t border-blue-200">
                  <div className="flex gap-2 items-start">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">info</span>
                    <p>{major_criteria.major_criteria_conclusion}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Minor Criteria */}
            {minor_criteria_scoring && (
              <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 overflow-hidden">
                <div className="bg-orange-50/80 border-b border-orange-200 p-5">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-orange-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600">playlist_add_check</span>
                      Tiêu chí phụ (Minor Criteria)
                    </h3>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 font-bold text-xs rounded-full border border-orange-200 shadow-sm">
                      TỔNG: {minor_criteria_scoring.total_minor_score} ĐIỂM
                    </span>
                  </div>
                  <p className="text-xs text-orange-800/70 font-medium">{minor_criteria_scoring.note}</p>
                </div>

                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <ul className="divide-y divide-orange-50">
                    {minor_criteria_scoring.items?.map((item: any, idx: number) => (
                      <li key={idx} className={`p-4 transition-colors ${item.score_awarded > 0 ? 'bg-orange-50/40' : 'hover:bg-slate-50'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm text-slate-800">{item.criterion}</p>
                              <span className="px-1.5 py-0.5 bg-white text-slate-500 rounded text-[10px] font-bold border border-slate-200 shrink-0 shadow-sm">
                                Điểm tối đa: {item.score_weight}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{item.result_detail}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center shrink-0 min-w-[3rem]">
                            <span className={`font-black text-xl ${item.score_awarded > 0 ? 'text-orange-600' : 'text-slate-300'}`}>
                              +{item.score_awarded}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-orange-100/50 text-orange-800 text-sm font-medium border-t border-orange-200">
                  <div className="flex gap-2 items-start">
                    <span className="material-symbols-outlined text-orange-600 text-[20px]">calculate</span>
                    <p>{minor_criteria_scoring.total_minor_score_note}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Result
          status={errorMsg ? 'error' : 'info'}
          title={
            errorMsg
              ? errorMsg
              : "Dữ liệu đã sẵn sàng, nhấn nút 'Phân tích AI' để nhận kết quả"
          }
          extra={
            <Button
              onClick={handleAIPredict}
              disabled={isAILoading}
              type="primary"
              loading={isAILoading}
            >
              <span className={`material-symbols-outlined ${isAILoading ? 'animate-spin' : ''}`}>
                {isAILoading ? 'autorenew' : (errorMsg ? 'refresh' : 'memory')}
              </span>
              {isAILoading ? 'Đang phân tích...' : (errorMsg ? 'Thử lại' : 'Phân tích AI')}
            </Button>
          }
        />
      )}
    </div>
  );
};

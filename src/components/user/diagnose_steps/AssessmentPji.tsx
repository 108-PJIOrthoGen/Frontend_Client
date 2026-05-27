import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Badge, Button, Card, Flex, Space, Spin, Tag, Typography, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hook';
import {
  callGenerateAiRecommendation,
  callFetchAiRecommendationRunDetail,
  callCancelAiRun,
} from '@/apis/api';
import { openSse, type SseConnection } from '@/utils/sseClient';

interface ClinicalAssessmentProps {
  onNext?: () => void;
  onPrev?: () => void;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 100;

const PENDING_RUN_ID_KEY = 'pending_pji_aiRunId';
const PENDING_THOUGHT_LOGS_KEY = 'pending_pji_thoughtLogs';
const MAX_THOUGHT_LOGS = 200;

interface ThoughtLog {
  at: number;
  stage: string;
  message: string;
}

const safeParseLogs = (raw: string | null): ThoughtLog[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((it) => it && typeof it.message === 'string')
      .slice(-MAX_THOUGHT_LOGS);
  } catch {
    return [];
  }
};

const stageTagColor = (stage: string): string => {
  switch (stage) {
    case 'start': return 'cyan';
    case 'done': return 'green';
    case 'error': return 'red';
    default: return 'geekblue';
  }
};

const formatLogTime = (ts: number): string => {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const ThoughtStreamConsole: React.FC<{ logs: ThoughtLog[] }> = ({ logs }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  const header = (
    <Flex justify="space-between" align="center" style={{ width: '100%' }}>
      <Space size={6} align="center">
        <Typography.Text
          strong
          style={{
            color: '#67e8f9',
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Luồng Suy Nghĩ
        </Typography.Text>
      </Space>
      <Badge
        status="processing"
        color="#34d399"
        text={
          <Typography.Text
            style={{
              color: '#94a3b8',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Đang xử lý
          </Typography.Text>
        }
      />
    </Flex>
  );

  return (
    <Flex justify="center" style={{ padding: '30px 16px', width: '100%' }}>
      <Card
        variant="borderless"
        title={header}
        style={{
          width: '100%',
          maxWidth: 768,
          background: 'linear-gradient(135deg, #2b2e36 0%, #3a9775 100%)',
          borderRadius: 12,
          boxShadow: '0 25px 60px -15px rgba(15,23,42,0.45)',
          overflow: 'hidden',
        }}
        styles={{
          header: {
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(148,163,184,0.2)',
            padding: '14px 22px',
            minHeight: 0,
          },
          body: {
            padding: 0,
            background: 'transparent',
            position: 'relative',
          },
        }}
      >
        <div
          ref={scrollerRef}
          className="custom-scrollbar"
          style={{
            padding: '20px 24px',
            maxHeight: '60vh',
            overflowY: 'auto',
            fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          {logs.length === 0 ? (
            <Flex align="center" gap={8}>
              <Spin size="small" />
              <Typography.Text italic style={{ color: '#64748b' }}>
                Đang khởi tạo phiên phân tích...
              </Typography.Text>
            </Flex>
          ) : (
            logs.map((log, idx) => (
              <Flex
                key={`${log.at}-${idx}`}
                gap={12}
                align="flex-start"
                style={{ marginBottom: 6 }}
                className="animate-fade-in"
              >
                <Typography.Text style={{ color: '#64748b', flexShrink: 0, fontFamily: 'inherit' }}>
                  [{formatLogTime(log.at)}]
                </Typography.Text>
                <Tag
                  color={stageTagColor(log.stage)}
                  style={{
                    marginTop: 2,
                    marginInlineEnd: 0,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    flexShrink: 0,
                  }}
                >
                  {log.stage}
                </Tag>
                <Typography.Text style={{ color: '#e2e8f0', wordBreak: 'break-word', flex: 1, fontFamily: 'inherit' }}>
                  {log.message}
                  {idx === logs.length - 1 && (
                    <span
                      className="animate-pulse"
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 16,
                        background: '#67e8f9',
                        marginLeft: 4,
                        verticalAlign: 'middle',
                      }}
                    />
                  )}
                </Typography.Text>
              </Flex>
            ))
          )}
        </div>

        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Typography.Text style={{ color: '#94a3b8', fontSize: 11 }}>
            {logs.length} bước đã ghi nhận
          </Typography.Text>
          <Typography.Text style={{ color: '#94a3b8', fontSize: 11, opacity: 0.65 }}>
            Có thể tạm rời trang — tiến trình vẫn tiếp tục
          </Typography.Text>
        </Flex>
      </Card>
    </Flex>
  );
};

export const S5AssessmentPji = ({ onNext, onPrev }: ClinicalAssessmentProps) => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<Record<string, any> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isViewingPrevious, setIsViewingPrevious] = useState(false);
  const [thoughtLogs, setThoughtLogs] = useState<ThoughtLog[]>([]);

  const sseRef = useRef<SseConnection | null>(null);
  const thoughtLogsRef = useRef<ThoughtLog[]>([]);
  const currentRunIdRef = useRef<string | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const [isCancelling, setIsCancelling] = useState(false);
  // State mirror of currentRunIdRef so the Cancel button's `disabled` reacts.
  // A ref alone never triggers a re-render, so without this the button stays
  // frozen at whatever it was when `isAILoading` flipped — which is why it
  // looked stuck disabled whenever the SSE thought-log stream wasn't firing
  // re-renders (e.g. behind a proxy that buffers SSE in deployment).
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const setCurrentRunId = useCallback((id: string | null) => {
    currentRunIdRef.current = id;
    setActiveRunId(id);
  }, []);

  const currentCase = useAppSelector(state => state.patient.currentCase);
  const episodeId = currentCase?.episode?.id;

  const apiBase = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '').replace(/\/+$/, '');

  const appendLog = useCallback((entry: ThoughtLog) => {
    setThoughtLogs((prev) => {
      const next = [...prev, entry].slice(-MAX_THOUGHT_LOGS);
      thoughtLogsRef.current = next;
      try {
        localStorage.setItem(PENDING_THOUGHT_LOGS_KEY, JSON.stringify(next));
      } catch {
        // localStorage quota — ignore.
      }
      return next;
    });
  }, []);

  const clearPending = useCallback(() => {
    localStorage.removeItem(PENDING_RUN_ID_KEY);
    localStorage.removeItem(PENDING_THOUGHT_LOGS_KEY);
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, []);

  const connectStream = useCallback((runId: string) => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (!apiBase) {
      return;
    }
    const token = typeof window !== 'undefined'
      ? window.localStorage.getItem('access_token')
      : null;
    sseRef.current = openSse({
      url: `${apiBase}/api/v1/ai-recommendations/runs/${runId}/stream`,
      token,
      onEvent: (frame) => {
        if (frame.event === 'done') return; // result poll handles final UI
        appendLog({
          at: Date.now(),
          stage: frame.event || 'step',
          message: frame.data,
        });
      },
      onError: () => {
        // Network blip — leave logs in place; the result poll still drives completion.
      },
    });
  }, [apiBase, appendLog]);

  const pollRunDetail = useCallback(async (runId: string) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      if (cancelledRef.current) {
        // The cancel handler already handled UI/state — bail out without
        // throwing so the parent flow's catch doesn't fire an error toast.
        return null;
      }
      const res = await callFetchAiRecommendationRunDetail(runId);
      const detail = res?.data;
      if (!detail?.run) continue;

      const status = detail.run.status;
      if (status === 'SUCCESS' || status === 'PARTIAL') return detail;
      if (status === 'CANCELLED') return null;
      if (status === 'FAILED' || status === 'TIMEOUT') {
        throw new Error(detail.run.errorMessage || 'AI recommendation failed');
      }
    }
    throw new Error('Polling timeout — recommendation is taking too long');
  }, []);

  const applyDetail = useCallback((detail: any) => {
    const diagnosticItem = detail?.items?.find(
      (item: any) => item.category === 'DIAGNOSTIC_TEST'
    );
    if (diagnosticItem) {
      const itemData =
        typeof diagnosticItem.itemJson === 'string'
          ? JSON.parse(diagnosticItem.itemJson)
          : diagnosticItem.itemJson;
      setDiagnosticData({ title: diagnosticItem.title, ...itemData });
    }
  }, []);

  const resumeRun = useCallback(async (runId: string) => {
    setIsAILoading(true);
    setErrorMsg(null);
    setCurrentRunId(runId);
    cancelledRef.current = false;
    connectStream(runId);
    try {
      const detail = await pollRunDetail(runId);
      if (cancelledRef.current || !detail) {
        // Cancelled while polling — the cancel handler already cleared state.
        return;
      }

      localStorage.setItem('pji_aiRunId', String(runId));
      localStorage.setItem('pji_aiRunDetail', JSON.stringify(detail));

      applyDetail(detail);
      setShowResults(true);
      message.success('Phân tích AI hoàn tất!');
    } catch (err: any) {
      if (cancelledRef.current) return;
      const msg = err?.message || 'Đã xảy ra lỗi khi phân tích AI';
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setIsAILoading(false);
      setCurrentRunId(null);
      clearPending();
    }
  }, [applyDetail, clearPending, connectStream, pollRunDetail, setCurrentRunId]);

  const location = useLocation();
  const navigate = useNavigate();

  // On mount: restore a pending run (if any), else show the history snapshot.
  useEffect(() => {
    // 1. Deep-link from a notification: `?runId=<id>` wins over any local cache,
    //    since the user explicitly clicked a notification for that run.
    const urlRunId = new URLSearchParams(location.search).get('runId');
    if (urlRunId) {
      // Strip the query param so a reload doesn't loop the resume flow.
      navigate(location.pathname, { replace: true });
      const cachedLogs = safeParseLogs(localStorage.getItem(PENDING_THOUGHT_LOGS_KEY));
      thoughtLogsRef.current = cachedLogs;
      setThoughtLogs(cachedLogs);
      void resumeRun(urlRunId);
      return;
    }

    const pendingRunId = localStorage.getItem(PENDING_RUN_ID_KEY);
    if (pendingRunId) {
      const cachedLogs = safeParseLogs(localStorage.getItem(PENDING_THOUGHT_LOGS_KEY));
      thoughtLogsRef.current = cachedLogs;
      setThoughtLogs(cachedLogs);
      void resumeRun(pendingRunId);
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always tear down the SSE connection on unmount — onMount will re-open it
  // from localStorage if a run is still pending.
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, []);

  const handleAIPredict = async () => {
    if (!episodeId) {
      message.error('Không tìm thấy bệnh án. Vui lòng quay lại chọn bệnh nhân.');
      return;
    }

    setIsAILoading(true);
    setErrorMsg(null);
    setThoughtLogs([]);
    thoughtLogsRef.current = [];
    cancelledRef.current = false;
    localStorage.removeItem(PENDING_THOUGHT_LOGS_KEY);

    try {
      const generateRes = await callGenerateAiRecommendation(String(episodeId));
      const runId = generateRes?.data?.run?.id;
      if (!runId) throw new Error('Không nhận được runId từ server');

      setCurrentRunId(String(runId));
      localStorage.setItem(PENDING_RUN_ID_KEY, String(runId));
      connectStream(String(runId));

      const detail = await pollRunDetail(String(runId));
      if (cancelledRef.current || !detail) return;

      localStorage.setItem('pji_aiRunId', String(runId));
      localStorage.setItem('pji_aiRunDetail', JSON.stringify(detail));

      applyDetail(detail);
      setShowResults(true);
      message.success('Phân tích AI hoàn tất!');
    } catch (err: any) {
      if (cancelledRef.current) return;
      const msg = err?.message || 'Đã xảy ra lỗi khi phân tích AI';
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setIsAILoading(false);
      setCurrentRunId(null);
      clearPending();
    }
  };

  const handleCancelAI = useCallback(async () => {
    const runId = currentRunIdRef.current;
    if (!runId || isCancelling) return;
    setIsCancelling(true);
    cancelledRef.current = true;
    try {
      await callCancelAiRun(runId);
      message.info('Đã huỷ phân tích AI');
    } catch (err: any) {
      // Even on API error we tear down locally — server-side guard catches late results.
      message.warning('Đã yêu cầu huỷ, nhưng máy chủ trả lỗi: ' + (err?.message || 'unknown'));
    } finally {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      localStorage.removeItem(PENDING_RUN_ID_KEY);
      localStorage.removeItem(PENDING_THOUGHT_LOGS_KEY);
      localStorage.removeItem('pji_aiRunId');
      localStorage.removeItem('pji_aiRunDetail');
      setCurrentRunId(null);
      setThoughtLogs([]);
      thoughtLogsRef.current = [];
      setIsAILoading(false);
      setShowResults(false);
      setErrorMsg(null);
      setDiagnosticData(null);
      setIsCancelling(false);
    }
  }, [isCancelling, setCurrentRunId]);

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
    <div className="flex flex-col flex-1 w-full relative bg-slate-50 min-h-full">
      {/* Premium Header / Action Bar */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b justify-between border-slate-200/60 px-6 py-4 flex items-center shadow-sm z-20 sticky top-0 w-full transition-all">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <span className="material-symbols-outlined text-white text-2xl">neurology</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {diagnosticData?.title ?? 'Đánh giá nguy cơ PJI từ AI'}
              {isViewingPrevious && (
                <span className="ml-2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 rounded-full border border-amber-200 shadow-sm">
                  Lịch sử đánh giá
                </span>
              )}
            </h2>
            {scoring_system && (
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                TIÊU CHUẨN ĐÁNH GIÁ: <span className="text-slate-700">{scoring_system.name}</span> <span className="opacity-50">|</span> PHIÊN BẢN {scoring_system.version}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all bg-white border border-slate-300 shadow-sm rounded-xl hover:shadow hover:bg-slate-50"
          >
            Quay lại
          </button>
          <button
            onClick={onNext}
            disabled={!showResults}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-sm rounded-xl shadow-md transition-all duration-300 ${showResults
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/40 transform hover:-translate-y-0.5 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
          >
            Tiếp tục <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full custom-scrollbar pb-16">
        {showResults && diagnosticData ? (
          <div className="flex flex-col gap-8 animate-fade-in px-4 md:px-8 max-w-[1600px] mx-auto w-full pt-8">

            {/* Top Result Card - Hybrid Mode (Dark Medical Insight) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* PRIMARY DIAGNOSIS (Dark Theme Glassmorphism) */}
              <div className="col-span-1 lg:col-span-8 flex flex-col gap-4 order-2 lg:order-1">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-8 shadow-xl shadow-slate-900/10 flex flex-col justify-center h-full relative overflow-hidden border border-slate-700/50">
                  {/* Decorative Background Elements */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                  <div className="absolute top-8 right-8 opacity-10 pointer-events-none text-white mix-blend-overlay">
                    <span className="material-symbols-outlined text-[180px]">coronavirus</span>
                  </div>

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <span className="px-3.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-[11px] font-black border border-blue-500/30 uppercase tracking-[0.1em] shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                          {ai_reasoning?.infection_classification}
                        </span>
                        <div className="h-4 w-[1px] bg-white/20"></div>
                        <span className="text-sm text-cyan-300/80 font-semibold tracking-wide">
                          AI DIAGNOSTIC INSIGHT
                        </span>
                      </div>

                      <h3 className="text-3xl lg:text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 leading-tight">
                        {ai_reasoning?.primary_diagnosis}
                      </h3>

                      <div className="backdrop-blur-sm bg-white/5 border-l-4 border-blue-400 rounded-r-xl p-5 mb-8">
                        <p className="text-slate-200 text-base leading-relaxed">
                          {ai_reasoning?.reasoning_summary}
                        </p>
                      </div>
                    </div>

                    {/* Organism Callout if present */}
                    {ai_reasoning?.identified_organism && (
                      <div className="bg-black/20 rounded-xl p-5 backdrop-blur-md border border-white/10 hover:bg-black/30 transition-all group">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all">
                            <span className="material-symbols-outlined text-red-400 text-[24px]">bug_report</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-slate-100 text-lg tracking-wide">{ai_reasoning.identified_organism.name}</h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="bg-red-500/20 text-red-200 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md border border-red-500/30 uppercase">
                                {ai_reasoning.identified_organism.resistance_profile}
                              </span>
                              {ai_reasoning.identified_organism.biofilm_forming && (
                                <span className="bg-amber-500/20 text-amber-200 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md border border-amber-500/30 uppercase flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">shield</span>
                                  BIOFILM FORMING
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">{ai_reasoning.identified_organism.resistance_detail}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* STATUS & SCORE (Light Glassmorphism Panel) */}
              <div className="col-span-1 lg:col-span-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden order-1 lg:order-2">
                <div className={`absolute top-0 left-0 w-full h-2 ${scoring_system?.interpretation === 'INFECTED' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}></div>

                <div className="text-center mb-8 w-full">
                  <h3 className="text-xs font-black text-slate-400 tracking-[0.15em] uppercase mb-3">Kết luận hệ thống</h3>
                  <div className={`inline-block px-6 py-2 rounded-xl text-2xl font-black tracking-tight border ${scoring_system?.interpretation === 'INFECTED'
                    ? 'bg-red-50 text-red-600 border-red-100 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    }`}>
                    {scoring_system?.interpretation}
                  </div>
                </div>

                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  {/* Glowing background behind score */}
                  <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${scoring_system?.interpretation === 'INFECTED' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                  <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 36 36">
                    <path className="text-slate-100 drop-shadow-sm" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path
                      className={`${scoring_system?.interpretation === 'INFECTED' ? 'text-red-500' : 'text-emerald-500'} transition-all duration-[1.5s] ease-out`}
                      strokeDasharray={`${((scoring_system?.total_score ?? 0) / 20) * 100}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 mt-2">
                    <span className="text-6xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{scoring_system?.total_score}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tổng điểm</span>
                  </div>
                </div>

                <div className="bg-slate-50 px-5 py-4 rounded-xl border border-slate-100 w-full text-center group hover:bg-slate-100 transition-colors">
                  <p className="text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-500 group-hover:scale-110 transition-transform">verified</span>
                    {scoring_system?.confidence_note}
                  </p>
                </div>
              </div>

            </div>

            {/* Warnings / Alerts Strip - Elevated Design */}
            {ai_reasoning?.warnings && ai_reasoning.warnings.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ai_reasoning.warnings.map((warning: any, idx: number) => (
                  <div key={idx} className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden bg-white ${warning.severity === 'HIGH' ? 'border-red-200' : warning.severity === 'MEDIUM' ? 'border-amber-200' : 'border-blue-200'}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${warning.severity === 'HIGH' ? 'bg-red-500' : warning.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                    <div className={`p-3 rounded-xl shrink-0 shadow-sm ${warning.severity === 'HIGH' ? 'bg-red-50 text-red-600' : warning.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      <span className="material-symbols-outlined text-2xl">{getSeverityIcon(warning.severity)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1.5 text-slate-800 tracking-tight">{warning.type.replace('_', ' ')}</h4>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{warning.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Evidence & Criteria Breakdown - Modern Tables/Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

              {/* MAJOR CRITERIA CARD */}
              {major_criteria && (
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden flex flex-col h-full hover:border-blue-300 transition-colors duration-300">
                  <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100 flex justify-between items-center relative">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">fact_check</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Tiêu chí chính</h3>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Major Criteria</p>
                      </div>
                    </div>
                    {major_criteria.major_criteria_met ? (
                      <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 shadow-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        ĐÃ THỎA MÃN
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 bg-slate-100 text-slate-500 font-bold text-xs rounded-full border border-slate-200 shadow-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        CHƯA THỎA
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex-1 bg-slate-50/30">
                    <p className="text-sm text-slate-600 font-medium mb-6 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">{major_criteria.note}</p>

                    <ul className="space-y-4">
                      {major_criteria.items?.map((item: any, idx: number) => (
                        <li key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow transition-all group">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-slate-800 mb-2 leading-tight">{item.criterion}</p>
                              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded border border-slate-100">
                                <span className="material-symbols-outlined text-[14px] text-slate-400">science</span>
                                <span className="text-xs font-semibold text-slate-600">{item.result_detail}</span>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center mt-1">
                              {item.result ? (
                                <div className="bg-red-50 text-red-500 p-2 rounded-full border border-red-100 shadow-inner">
                                  <span className="material-symbols-outlined text-[20px] block">check_circle</span>
                                </div>
                              ) : (
                                <div className="bg-slate-50 text-slate-400 p-2 rounded-full border border-slate-100">
                                  <span className="material-symbols-outlined text-[20px] block">remove</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100/50">
                    <div className="flex gap-3 items-start">
                      <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                      <p className="text-sm text-blue-900/80 font-medium leading-relaxed">{major_criteria.major_criteria_conclusion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* MINOR CRITERIA CARD */}
              {minor_criteria_scoring && (
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden flex flex-col h-full hover:border-amber-300 transition-colors duration-300">
                  <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">playlist_add_check</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">Tiêu chí phụ</h3>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Minor Criteria</p>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-amber-50 text-amber-700 font-bold text-sm rounded-full border border-amber-200 shadow-sm flex items-center gap-2">
                      <span className="text-amber-500 text-[10px] uppercase tracking-widest">ĐIỂM:</span>
                      <span className="text-lg">{minor_criteria_scoring.total_minor_score}</span>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-50/30">
                    <div className="p-6 pb-2">
                      <p className="text-sm text-slate-600 font-medium bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">{minor_criteria_scoring.note}</p>
                    </div>

                    <div className="px-6 pb-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                      <ul className="space-y-3">
                        {minor_criteria_scoring.items?.map((item: any, idx: number) => (
                          <li key={idx} className={`rounded-xl border transition-all ${item.score_awarded > 0 ? 'bg-amber-50/30 border-amber-200/50 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                            <div className="p-4 flex justify-between items-center gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <p className="font-semibold text-sm text-slate-700">{item.criterion}</p>
                                </div>
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="text-xs text-slate-500 font-medium">{item.result_detail}</span>
                                  <span className="px-1.5 py-0.5 bg-white text-slate-400 rounded text-[9px] font-bold border border-slate-200 shadow-sm uppercase">Max: {item.score_weight}</span>
                                </div>
                              </div>
                              <div className={`flex flex-col items-center justify-center shrink-0 w-12 h-12 rounded-full border ${item.score_awarded > 0 ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                <span className={`font-black text-lg ${item.score_awarded > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                                  +{item.score_awarded}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100/50">
                    <div className="flex gap-3 items-start">
                      <span className="material-symbols-outlined text-amber-500 mt-0.5">calculate</span>
                      <p className="text-sm text-amber-900/80 font-medium leading-relaxed">{minor_criteria_scoring.total_minor_score_note}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : isAILoading ? (
          <div className="flex flex-col items-center w-full">
            <ThoughtStreamConsole logs={thoughtLogs} />
            <div className="w-full max-w-[768px] px-4 -mt-2 mb-6">
              <Button
                danger
                onClick={handleCancelAI}
                loading={isCancelling}
                disabled={!activeRunId || isCancelling}
                className="w-full h-10 rounded-xl font-medium"
              >
                <span className="material-symbols-outlined text-[18px] align-middle mr-1">
                  stop_circle
                </span>
                {isCancelling ? 'Đang huỷ...' : 'Huỷ phân tích'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full px-4 pt-20">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10 text-center flex flex-col items-center">
              <div className="w-24 h-24 mb-6 rounded-full bg-slate-50 flex items-center justify-center border-8 border-white shadow-lg">
                <span className={`material-symbols-outlined text-[48px] ${errorMsg ? 'text-red-400' : 'text-blue-500'}`}>
                  {errorMsg ? 'error' : 'analytics'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {errorMsg ? 'Lỗi Phân Tích' : 'Sẵn Sàng Phân Tích'}
              </h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                {errorMsg ? errorMsg : "Dữ liệu ca bệnh đã được tổng hợp. Hệ thống AI đã sẵn sàng để xử lý và đưa ra đánh giá PJI."}
              </p>
              <Button
                onClick={handleAIPredict}
                disabled={isAILoading}
                type="primary"
                loading={isAILoading}
                size="large"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-lg shadow-blue-500/30 text-base font-bold flex items-center justify-center gap-2"
              >
                {!isAILoading && <span className="material-symbols-outlined text-[20px]">{errorMsg ? 'refresh' : 'memory'}</span>}
                {isAILoading ? 'Hệ thống đang xử lý...' : (errorMsg ? 'Thử lại' : 'Bắt Đầu Phân Tích')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Flex, Result, Spin, message } from 'antd';
import {
  CloseCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '@/redux/store';
import {
  callCancelAiRun,
  callGenerateAiRecommendation,
} from '@/apis/api';
import { openSse, type SseConnection } from '@/utils/sseClient';
import { useTreatmentPlanData } from './treatment_plan/hooks/useTreatmentPlanData';
import { useAiChat } from './treatment_plan/hooks/useAiChat';
import TreatmentPlanHeader from './treatment_plan/TreatmentPlanHeader';
import TreatmentDraftPanel from './treatment_plan/TreatmentDraftPanel';
import CitationsPanel from './treatment_plan/CitationsPanel';
import AiChatDrawer from './treatment_plan/AiChatDrawer';
import ThoughtStreamConsole, { type ThoughtLog } from './treatment_plan/ThoughtStreamConsole';

interface Step5Props {
  onPrev: () => void;
  onNext: () => void;
}

const PENDING_RUN_ID_KEY = 'pending_pji_aiRunId';
const PENDING_THOUGHT_LOGS_KEY = 'pending_pji_thoughtLogs';
const MAX_THOUGHT_LOGS = 200;

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

/**
 * Read-only view of the AI treatment plan + citations + AI chat.
 *
 * The doctor no longer edits the AI answer here — their own diagnosis and
 * treatment plan (and the decision on the AI recommendation) are entered in
 * the next step, "Chẩn đoán bác sĩ", which is the single writer of
 * DoctorRecommendationReview.
 */
export const TreatmentPlan: React.FC<Step5Props> = ({ onPrev, onNext }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [thoughtLogs, setThoughtLogs] = useState<ThoughtLog[]>([]);

  const sseRef = useRef<SseConnection | null>(null);
  const thoughtLogsRef = useRef<ThoughtLog[]>([]);
  const currentRunIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const episodeId = currentCase?.episode?.id;
  const apiBase = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '').replace(/\/+$/, '');
  const location = useLocation();
  const navigate = useNavigate();

  const {
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
    hasTreatmentPlan,
  } = useTreatmentPlanData();

  const setCurrentRunId = useCallback((id: string | null) => {
    currentRunIdRef.current = id;
    setActiveRunId(id);
  }, []);

  const appendLog = useCallback((entry: ThoughtLog) => {
    setThoughtLogs((prev) => {
      const next = [...prev, entry].slice(-MAX_THOUGHT_LOGS);
      thoughtLogsRef.current = next;
      try {
        localStorage.setItem(PENDING_THOUGHT_LOGS_KEY, JSON.stringify(next));
      } catch {
        // localStorage quota - ignore.
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
    if (!apiBase) return;

    const token = typeof window !== 'undefined'
      ? window.localStorage.getItem('access_token')
      : null;

    sseRef.current = openSse({
      url: `${apiBase}/api/v1/ai-recommendations/runs/${runId}/stream`,
      token,
      onEvent: (frame) => {
        if (frame.event === 'done') return;
        appendLog({
          at: Date.now(),
          stage: frame.event || 'step',
          message: frame.data,
        });
      },
      onError: () => {
        // Polling remains the source of truth for final state.
      },
    });
  }, [apiBase, appendLog]);

  const finishWithDetail = useCallback((runId: string, detail: any) => {
    localStorage.setItem('pji_aiRunId', String(runId));
    localStorage.setItem('pji_aiRunDetail', JSON.stringify(detail));
    applyDetail(detail);
    setLoadError(null);
  }, [applyDetail, setLoadError]);

  const resumeRun = useCallback(async (runId: string) => {
    setIsGenerating(true);
    setLoadError(null);
    setCurrentRunId(runId);
    cancelledRef.current = false;
    connectStream(runId);

    try {
      const detail = await fetchUntilTreatmentReady(runId);
      if (cancelledRef.current || !detail) return;
      finishWithDetail(runId, detail);
      message.success('Phác đồ AI đã sẵn sàng.');
    } catch (err: any) {
      if (!cancelledRef.current) {
        setLoadError(err?.message || 'AI tạo phác đồ thất bại.');
        message.error(err?.message || 'AI tạo phác đồ thất bại.');
      }
    } finally {
      setIsGenerating(false);
      setCurrentRunId(null);
      clearPending();
    }
  }, [clearPending, connectStream, fetchUntilTreatmentReady, finishWithDetail, setCurrentRunId, setLoadError]);

  useEffect(() => {
    const urlRunId = new URLSearchParams(location.search).get('runId');
    if (urlRunId) {
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
    }
  }, [location.pathname, location.search, navigate, resumeRun]);

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

    setIsGenerating(true);
    setLoadError(null);
    setThoughtLogs([]);
    thoughtLogsRef.current = [];
    cancelledRef.current = false;
    resetPlan();
    localStorage.removeItem(PENDING_THOUGHT_LOGS_KEY);

    try {
      const generateRes = await callGenerateAiRecommendation(String(episodeId));
      const runId = generateRes?.data?.run?.id;
      if (!runId) throw new Error('Không nhận được runId từ server');

      const runIdText = String(runId);
      setCurrentRunId(runIdText);
      localStorage.setItem(PENDING_RUN_ID_KEY, runIdText);
      localStorage.setItem('pji_aiRunId', runIdText);
      connectStream(runIdText);

      const detail = await fetchUntilTreatmentReady(runIdText);
      if (cancelledRef.current || !detail) return;

      finishWithDetail(runIdText, detail);
      message.success('Phác đồ AI đã sẵn sàng.');
    } catch (err: any) {
      if (cancelledRef.current) return;
      const msg = err?.message || 'Đã xảy ra lỗi khi tạo phác đồ AI';
      setLoadError(msg);
      message.error(msg);
    } finally {
      setIsGenerating(false);
      setCurrentRunId(null);
      clearPending();
    }
  };

  const handleCancelAI = useCallback(async () => {
    const runId = currentRunIdRef.current;
    if (!runId || isCancelling) return;

    setIsCancelling(true);
    try {
      await callCancelAiRun(runId);
      cancelledRef.current = true;
      clearPending();
      localStorage.removeItem('pji_aiRunId');
      localStorage.removeItem('pji_aiRunDetail');
      setCurrentRunId(null);
      setThoughtLogs([]);
      thoughtLogsRef.current = [];
      setIsGenerating(false);
      resetPlan();
      message.success('Đã huỷ tạo phác đồ AI');
    } catch (err: any) {
      message.error('Không thể huỷ tạo phác đồ: ' + (err?.message || 'unknown'));
    } finally {
      setIsCancelling(false);
    }
  }, [clearPending, isCancelling, resetPlan, setCurrentRunId]);

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isFetchingSessions,
    isFetchingMessages,
    messages,
    inputValue,
    setInputValue,
    isChatLoading,
    messagesEndRef,
    handleCreateNewSession,
    handleSendMessage,
  } = useAiChat({ isChatOpen, episodeId, runIdRef });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="Đang tải dữ liệu phác đồ..." />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <Flex vertical flex={1} style={{ width: '100%', minHeight: '100%', background: '#f8fafc', position: 'relative' }}>
        <TreatmentPlanHeader
          onPrev={onPrev}
          onNext={onNext}
          canContinue={false}
          nextLabel="Tiếp tục: Kiểm tra dữ liệu"
        />
        <div style={{ flex: 1, overflowY: 'auto', width: '100%', paddingBottom: 64 }}>
          <Flex vertical align="center" style={{ width: '100%' }}>
            <ThoughtStreamConsole logs={thoughtLogs} />
            <div style={{ width: '100%', maxWidth: 768, padding: '0 16px', marginTop: -2, marginBottom: 24 }}>
              <Button
                danger
                onClick={handleCancelAI}
                loading={isCancelling}
                disabled={!activeRunId || isCancelling}
                icon={<StopOutlined />}
                block
                style={{ height: 40, borderRadius: 12, fontWeight: 600 }}
              >
                {isCancelling ? 'Đang huỷ...' : 'Huỷ tạo phác đồ'}
              </Button>
            </div>
          </Flex>
        </div>
      </Flex>
    );
  }

  if (!hasTreatmentPlan) {
    return (
      <Flex vertical flex={1} style={{ width: '100%', minHeight: '100%', background: '#f8fafc', position: 'relative' }}>
        <TreatmentPlanHeader
          onPrev={onPrev}
          onNext={onNext}
          canContinue={false}
          nextLabel="Tiếp tục: Kiểm tra dữ liệu"
        />
        <Flex
          flex={1}
          align="center"
          justify="center"
          style={{
            width: '100%',
            minHeight: 'calc(100vh - 170px)',
            padding: '80px 16px 32px',
            overflowY: 'auto',
          }}
        >
          <Card
            style={{
              width: '100%',
              maxWidth: 460,
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
            }}
            styles={{ body: { padding: 10 } }}
          >
            <Result
              icon={loadError
                ? <CloseCircleOutlined style={{ color: '#f87171' }} />
                : <RobotOutlined style={{ color: '#10b981' }} />}
              title={loadError ? 'Lỗi tạo phác đồ' : 'Sẵn sàng tạo phác đồ AI'}
              subTitle={loadError
                ? loadError
                : 'Chẩn đoán PJI đã được tính bằng luật hệ thống. Tại bước này AI sẽ tạo 3 gợi ý: kháng sinh tại chỗ, kháng sinh toàn thân và phẫu thuật.'}
              extra={(
                <Button
                  onClick={handleAIPredict}
                  disabled={isGenerating}
                  type="primary"
                  loading={isGenerating}
                  size="large"
                  icon={loadError ? <ReloadOutlined /> : <RobotOutlined />}
                  block
                  style={{
                    height: 48,
                    borderRadius: 12,
                    fontWeight: 700,
                    background: '#059669',
                    borderColor: '#059669',
                  }}
                >
                  {loadError ? 'Thử lại' : 'Tạo phác đồ AI'}
                </Button>
              )}
            />
          </Card>
        </Flex>
      </Flex>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full relative bg-slate-50 min-h-full">
      <TreatmentPlanHeader
        onPrev={onPrev}
        onNext={onNext}
        canContinue={hasTreatmentPlan}
        nextLabel="Tiếp tục: Kiểm tra dữ liệu"
      />

      {/* Hybrid Container */}
      <div className="flex-1 overflow-hidden p-6 flex gap-6 text-slate-800 max-w-[1800px] mx-auto w-full">
        <TreatmentDraftPanel
          surgeryPlan={surgeryPlan}
          systemicPlan={systemicPlan}
          localPlan={localPlan}
        />
        <CitationsPanel citations={citations} />
      </div>

      {/* Glowing Floating Chat Button */}
      <div className="fixed bottom-8 right-8 z-40 group">
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300"></div>
        <button
          onClick={() => setIsChatOpen(true)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl flex items-center justify-center transition-transform hover:-translate-y-1 border border-blue-400/30"
          title="Trợ lý AI"
        >
          <span className="material-symbols-outlined text-[28px]">smart_toy</span>
        </button>
      </div>

      <AiChatDrawer
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onCreateSession={handleCreateNewSession}
        isFetchingSessions={isFetchingSessions}
        isFetchingMessages={isFetchingMessages}
        messages={messages}
        isChatLoading={isChatLoading}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={() => handleSendMessage(inputValue)}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
};

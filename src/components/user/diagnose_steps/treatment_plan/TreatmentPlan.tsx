import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Flex, Result, Spin, message } from 'antd';
import {
  CloseCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '@/redux/store';
import { getRuntimeApiBase } from '@/config/runtimeUrls';
import {
  callCancelAiRun,
  callGenerateAiRecommendation,
} from '@/apis/api';
import { openSse, type SseConnection } from '@/utils/sseClient';
import ThoughtStreamConsole, { ThoughtLog } from './components/ThoughtStreamConsole';
import { useTreatmentPlanData } from './hooks/useTreatmentPlanData';
import { useAiChat } from './hooks/useAiChat';
import TreatmentPlanHeader from './components/TreatmentPlanHeader';
import TreatmentDraftPanel from './components/TreatmentDraftPanel';
import CitationsPanel from './components/CitationsPanel';
import AiChatDrawer from './components/AiChatDrawer';
import { getAccessToken } from '@/security/accessToken';
import {
  addOrUpdateTask,
  updateTaskProgress,
  completeTask,
  cancelTask,
} from '@/redux/slice/aiRegimenTaskSlice';
import {
  clearPendingRecommendationRun,
  clearRecommendationRun,
  createDiagnosisWorkflowScope,
  getDiagnosisWorkflowSnapshot,
  isDiagnosisWorkflowScopeActive,
  storeDiagnosisThoughtLogs,
  storePendingRecommendationRun,
  storeRecommendationRun,
} from '@/features/diagnosis/diagnosisWorkflowSession';


interface Step5Props {
  onPrev: () => void;
  onNext: () => void;
}

const MAX_THOUGHT_LOGS = 200;

/**
 * Read-only view of the AI treatment plan + citations + AI chat.
 *
 * The doctor no longer edits the AI answer here — their own diagnosis and
 * treatment plan (and the decision on the AI recommendation) are entered in
 * the next step, "Chẩn đoán bác sĩ", which is the single writer of
 * DoctorRecommendationReview.
 */
export const TreatmentPlan: React.FC<Step5Props> = ({ onPrev, onNext }) => {
  const dispatch = useDispatch();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [thoughtLogs, setThoughtLogs] = useState<ThoughtLog[]>([]);
  const [stageMessage, setStageMessage] = useState<string>('Đang khởi tạo tiến trình phân tích...');
  const [currentAgent, setCurrentAgent] = useState<string>('Agent Điều Phối');
  const [reasoningText, setReasoningText] = useState<string>('');
  const [isStreamDone, setIsStreamDone] = useState<boolean>(false);

  const sseRef = useRef<SseConnection | null>(null);
  const thoughtLogsRef = useRef<ThoughtLog[]>([]);
  const reasoningTextRef = useRef<string>('');
  const currentRunIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const tasks = useSelector((state: RootState) => state.aiRegimenTask?.tasks ?? []);
  const episodeId = currentCase?.episode?.id;
  const patientId = currentCase?.patient?.id;
  const workflowScope = useMemo(
    () => createDiagnosisWorkflowScope(patientId, episodeId),
    [episodeId, patientId],
  );
  const apiBase = getRuntimeApiBase();
  const location = useLocation();
  const navigate = useNavigate();

  const setCurrentRunId = useCallback((runId: string | null) => {
    currentRunIdRef.current = runId;
    setActiveRunId(runId);
  }, []);

  const appendLog = useCallback((entry: ThoughtLog) => {
    const nextLogs = [...thoughtLogsRef.current, entry].slice(-MAX_THOUGHT_LOGS);
    thoughtLogsRef.current = nextLogs;
    setThoughtLogs(nextLogs);
    if (workflowScope) {
      storeDiagnosisThoughtLogs(workflowScope, nextLogs);
    }
  }, [workflowScope]);

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
  } = useTreatmentPlanData(workflowScope);

  const clearPending = useCallback(() => {
    if (workflowScope) {
      clearPendingRecommendationRun(workflowScope);
    }
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, [workflowScope]);

  const connectStream = useCallback((runId: string) => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    const token = getAccessToken();

    sseRef.current = openSse({
      url: `${apiBase}/api/v1/ai-recommendations/runs/${runId}/stream`,
      token,
      onEvent: (frame) => {
        if (frame.event === 'done') {
          setIsStreamDone(true);
          return;
        }

        // Check if event is structured thinking stream payload
        try {
          const payload = typeof frame.data === 'string' ? JSON.parse(frame.data) : frame.data;
          if (payload && typeof payload === 'object' && payload.type) {
            switch (payload.type) {
              case 'stage':
                if (payload.text) setStageMessage(payload.text);
                if (payload.agent) setCurrentAgent(payload.agent);
                if (episodeId && payload.text) {
                  dispatch(
                    updateTaskProgress({
                      id: runId,
                      episodeId: Number(episodeId),
                      progressMessage: payload.text,
                      stage: payload.agent || 'stage',
                    })
                  );
                }
                break;
              case 'reasoning':
                if (payload.text) {
                  reasoningTextRef.current += payload.text;
                  setReasoningText(reasoningTextRef.current);
                }
                if (payload.agent) setCurrentAgent(payload.agent);
                break;
              case 'restart':
                // MANDATORY: wipe reasoning buffer when LLM synthesis retries
                reasoningTextRef.current = '';
                setReasoningText('');
                setStageMessage('Khởi động lại lượt suy luận (retry)...');
                break;
              case 'cancelled':
                setStageMessage('Đã huỷ phân tích');
                setIsStreamDone(true);
                if (sseRef.current) {
                  sseRef.current.close();
                  sseRef.current = null;
                }
                break;
              case 'error':
                setStageMessage(`Lỗi phân tích: ${payload.text || 'Không xác định'}`);
                setIsStreamDone(true);
                if (sseRef.current) {
                  sseRef.current.close();
                  sseRef.current = null;
                }
                break;
              case 'done':
                setIsStreamDone(true);
                if (sseRef.current) {
                  sseRef.current.close();
                  sseRef.current = null;
                }
                break;
              case 'answer':
                break;
            }
            return;
          }
        } catch {
          // Legacy string data fallback
        }

        // Fallback for legacy progress strings
        const text = frame.data || '';
        const stage = frame.event || 'step';
        setStageMessage(text);
        appendLog({
          at: Date.now(),
          stage,
          message: text,
        });
        if (episodeId) {
          dispatch(
            updateTaskProgress({
              id: runId,
              episodeId: Number(episodeId),
              progressMessage: text,
              stage,
            })
          );
        }
      },
      onError: () => {
        // Polling remains the source of truth for final state.
      },
    });
  }, [apiBase, appendLog, dispatch, episodeId]);

  const finishWithDetail = useCallback((runId: string, detail: any): boolean => {
    if (!workflowScope) {
      throw new Error('Không xác định được bệnh án đang mở.');
    }
    if (!isDiagnosisWorkflowScopeActive(workflowScope)) return false;
    if (String(detail?.run?.episodeId ?? '') !== workflowScope.episodeId) {
      throw new Error('Kết quả AI không thuộc bệnh án đang mở.');
    }
    storeRecommendationRun(workflowScope, String(runId), detail);
    applyDetail(detail);
    setLoadError(null);
    return true;
  }, [applyDetail, setLoadError, workflowScope]);

  const resumeRun = useCallback(async (runId: string) => {
    setIsGenerating(true);
    setLoadError(null);
    setCurrentRunId(runId);
    cancelledRef.current = false;
    connectStream(runId);

    try {
      const detail = await fetchUntilTreatmentReady(runId);
      if (cancelledRef.current || !detail) return;
      if (!finishWithDetail(runId, detail)) return;
      message.success('Phác đồ AI đã sẵn sàng.');
      if (episodeId) {
        dispatch(
          completeTask({
            id: runId,
            episodeId: Number(episodeId),
            status: 'SUCCESS',
          })
        );
      }
    } catch (err: any) {
      if (!cancelledRef.current) {
        setLoadError(err?.message || 'AI tạo phác đồ thất bại.');
        message.error(err?.message || 'AI tạo phác đồ thất bại.');
        if (episodeId) {
          dispatch(
            completeTask({
              id: runId,
              episodeId: Number(episodeId),
              status: 'FAILED',
              errorMessage: err?.message || 'AI tạo phác đồ thất bại',
            })
          );
        }
      }
    } finally {
      setIsGenerating(false);
      setCurrentRunId(null);
      clearPending();
    }
  }, [clearPending, connectStream, dispatch, episodeId, fetchUntilTreatmentReady, finishWithDetail, setCurrentRunId, setLoadError]);

  useEffect(() => {
    if (!workflowScope) return;
    const snapshot = getDiagnosisWorkflowSnapshot(workflowScope);
    const urlRunId = new URLSearchParams(location.search).get('runId');
    if (urlRunId) {
      navigate(location.pathname, { replace: true });
      const logs = snapshot?.thoughtLogs ?? [];
      thoughtLogsRef.current = logs;
      setThoughtLogs(logs);
      void resumeRun(urlRunId);
      return;
    }

    const pendingRunId = snapshot?.pendingRunId;
    if (pendingRunId) {
      const logs = snapshot?.thoughtLogs ?? [];
      thoughtLogsRef.current = logs;
      setThoughtLogs(logs);
      void resumeRun(pendingRunId);
    }
  }, [location.pathname, location.search, navigate, resumeRun, workflowScope]);

  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, []);

  const handleAIPredict = async () => {
    if (!episodeId || !workflowScope) {
      message.error('Không tìm thấy bệnh án. Vui lòng quay lại chọn bệnh nhân.');
      return;
    }

    const activeTasksCount = tasks.filter(
      (t) => t.status === 'PROCESSING' || t.status === 'QUEUED'
    ).length;

    if (activeTasksCount >= 5) {
      message.error('Đang có 5 tác vụ AI sinh phác đồ đồng thời. Vui lòng đợi các tác vụ trước hoàn tất để tránh quá tải hệ thống.');
      return;
    }

    if (activeTasksCount >= 3) {
      message.warning('Hệ thống đang xử lý đồng thời nhiều ca bệnh. Tác vụ mới sẽ được xếp hàng qua RabbitMQ.');
    }

    setIsGenerating(true);
    setLoadError(null);
    setThoughtLogs([]);
    thoughtLogsRef.current = [];
    reasoningTextRef.current = '';
    setReasoningText('');
    setStageMessage('Đang khởi tạo tiến trình phân tích AI...');
    setCurrentAgent('Agent Điều Phối');
    setIsStreamDone(false);
    cancelledRef.current = false;
    resetPlan();
    storeDiagnosisThoughtLogs(workflowScope, []);

    try {
      const generateRes = await callGenerateAiRecommendation(String(episodeId));
      const runId = generateRes?.data?.run?.id;
      if (!runId) throw new Error('Không nhận được runId từ server');

      const runIdText = String(runId);
      setCurrentRunId(runIdText);
      storePendingRecommendationRun(workflowScope, runIdText);

      dispatch(
        addOrUpdateTask({
          id: runIdText,
          episodeId: Number(episodeId),
          patientId: patientId ? Number(patientId) : undefined,
          patientName: currentCase?.patient?.fullName || `Bệnh nhân #${patientId ?? '?'}`,
          patientCode: currentCase?.patient?.patientCode,
          medicalRecordCode: currentCase?.episode?.medicalRecordCode || `#${episodeId}`,
          status: 'PROCESSING',
          startedAt: Date.now(),
          progressMessage: 'Đang khởi tạo tiến trình phân tích AI...',
        })
      );

      connectStream(runIdText);

      const detail = await fetchUntilTreatmentReady(runIdText);
      if (cancelledRef.current || !detail) return;

      if (!finishWithDetail(runIdText, detail)) return;
      dispatch(
        completeTask({
          id: runIdText,
          episodeId: Number(episodeId),
          status: 'SUCCESS',
        })
      );
      message.success('Phác đồ AI đã sẵn sàng.');
    } catch (err: any) {
      if (cancelledRef.current) return;
      const msg = err?.message || 'Đã xảy ra lỗi khi tạo phác đồ AI';
      setLoadError(msg);
      message.error(msg);
      if (episodeId) {
        dispatch(
          completeTask({
            id: currentRunIdRef.current || 'unknown',
            episodeId: Number(episodeId),
            status: 'FAILED',
            errorMessage: msg,
          })
        );
      }
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
      if (workflowScope) clearRecommendationRun(workflowScope);
      setCurrentRunId(null);
      setThoughtLogs([]);
      thoughtLogsRef.current = [];
      reasoningTextRef.current = '';
      setReasoningText('');
      setIsGenerating(false);
      resetPlan();
      dispatch(cancelTask(runId));
      message.success('Đã huỷ tạo phác đồ AI');
    } catch (err: any) {
      message.error('Không thể huỷ tạo phác đồ: ' + (err?.message || 'unknown'));
    } finally {
      setIsCancelling(false);
    }
  }, [clearPending, dispatch, isCancelling, resetPlan, setCurrentRunId, workflowScope]);

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
          nextLabel="Tiếp tục"
        />
        <div style={{ flex: 1, overflowY: 'auto', width: '100%', paddingBottom: 64 }}>
          <Flex vertical align="center" style={{ width: '100%' }}>
            <ThoughtStreamConsole
              logs={thoughtLogs}
              stageMessage={stageMessage}
              currentAgent={currentAgent}
              reasoningText={reasoningText}
              isStreaming={isGenerating && !isStreamDone}
              isDone={isStreamDone}
            />
            <div style={{ width: '100%', maxWidth: 768, padding: '0 16px', marginTop: 12, marginBottom: 24 }}>
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
          nextLabel="Tiếp tục"
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
                : 'AI Agent sẽ sinh ra 3 khuyến nghị: kháng sinh tại chỗ, kháng sinh toàn thân và phẫu thuật.'}
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
        nextLabel="Tiếp tục"
      />

      {/* Collapsible Clinical Thinking Review Accordion */}
      {reasoningText && (
        <div className="max-w-[1800px] mx-auto w-full px-6 pt-4">
          <ThoughtStreamConsole
            stageMessage="Đã hoàn tất phân tích và tổng hợp khuyến nghị lâm sàng."
            currentAgent="SynthesisAgent"
            reasoningText={reasoningText}
            isStreaming={false}
            isDone={true}
            collapsible={true}
            defaultCollapsed={true}
          />
        </div>
      )}

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

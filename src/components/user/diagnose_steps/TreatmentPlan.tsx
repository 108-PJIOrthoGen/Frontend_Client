import React, { useState } from 'react';
import { Button, Result, Spin } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useTreatmentPlanData } from './treatment_plan/hooks/useTreatmentPlanData';
import { useAiChat } from './treatment_plan/hooks/useAiChat';
import TreatmentPlanHeader from './treatment_plan/TreatmentPlanHeader';
import TreatmentDraftPanel from './treatment_plan/TreatmentDraftPanel';
import CitationsPanel from './treatment_plan/CitationsPanel';
import AiChatDrawer from './treatment_plan/AiChatDrawer';

interface Step5Props {
  onPrev: () => void;
  onNext: () => void;
}

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

  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const episodeId = currentCase?.episode?.id;

  const {
    surgeryPlan,
    systemicPlan,
    localPlan,
    citations,
    isLoading,
    loadError,
    runIdRef,
  } = useTreatmentPlanData();

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

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Result
          status="warning"
          title={loadError}
          extra={
            <Button onClick={onPrev} type="primary">
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full relative bg-slate-50 min-h-full">
      <TreatmentPlanHeader onPrev={onPrev} onNext={onNext} />

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

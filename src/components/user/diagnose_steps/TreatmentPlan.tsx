import React, { useRef, useState } from 'react';
import { Button, Result, Spin, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { clearCurrentCase } from '@/redux/slice/patientSlice';
import { RootState } from '@/redux/store';
import { callCreateDoctorReview } from '@/apis/api';
import type { IPermission } from '@/types/backend';
import {
  TREATMENT_REVIEW_WRITE_PERMISSION,
  hasPermission,
  normalizeIdentity,
} from './treatment_plan/utils/permissions';
import { useTreatmentPlanData } from './treatment_plan/hooks/useTreatmentPlanData';
import { useAiChat } from './treatment_plan/hooks/useAiChat';
import TreatmentPlanHeader from './treatment_plan/TreatmentPlanHeader';
import TreatmentDraftPanel, {
  type TreatmentDraftPanelHandle,
} from './treatment_plan/TreatmentDraftPanel';
import CitationsPanel from './treatment_plan/CitationsPanel';
import AiChatDrawer from './treatment_plan/AiChatDrawer';
import ReviewModal from './treatment_plan/ReviewModal';
import SuccessModal from './treatment_plan/SuccessModal';

interface Step5Props {
  onPrev: () => void;
  onBackToFirstStep: () => void;
}

export const TreatmentPlan: React.FC<Step5Props> = ({ onPrev, onBackToFirstStep }) => {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch();
  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const currentUser = useSelector((state: RootState) => state.account.user);
  const episodeId = currentCase?.episode?.id;
  const permissions = currentUser.role.permissions as IPermission[] | undefined;
  const roleName = currentUser.role.name?.toUpperCase() ?? '';
  const isAdmin = roleName === 'ADMIN' || roleName === 'SUPER_ADMIN';
  const patientCreatedBy = currentCase?.patient?.createdBy;
  const ownsPatientRecord =
    !patientCreatedBy || normalizeIdentity(patientCreatedBy) === normalizeIdentity(currentUser.email);
  const hasTreatmentReviewWritePermission = hasPermission(permissions, TREATMENT_REVIEW_WRITE_PERMISSION);
  const canReviewTreatmentPlan = hasTreatmentReviewWritePermission && (ownsPatientRecord || isAdmin);

  const draftRef = useRef<TreatmentDraftPanelHandle>(null);

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

  const openReviewModal = () => {
    if (!canReviewTreatmentPlan) {
      message.warning('Bạn chỉ có quyền xem phác đồ của hồ sơ này.');
      return;
    }
    if (!episodeId || !runIdRef.current) {
      message.error('Thiếu thông tin bệnh án hoặc lần gợi ý AI.');
      return;
    }
    setReviewNote('');
    setRejectionReason('');
    setIsReviewModalOpen(true);
  };

  const handleConfirmTreatment = async () => {
    if (!canReviewTreatmentPlan) {
      message.warning('Bạn chỉ có quyền xem phác đồ của hồ sơ này.');
      return;
    }
    setIsReviewModalOpen(false);
    setIsSaving(true);
    try {
      const currentSurgery = draftRef.current?.getSurgery() ?? null;
      const currentSystemic = draftRef.current?.getSystemic() ?? null;
      const currentLocal = draftRef.current?.getLocal() ?? null;

      const hasModification =
        (currentSurgery && JSON.stringify(currentSurgery) !== JSON.stringify(surgeryPlan)) ||
        (currentSystemic && JSON.stringify(currentSystemic) !== JSON.stringify(systemicPlan)) ||
        (currentLocal && JSON.stringify(currentLocal) !== JSON.stringify(localPlan));
      const reviewStatus = rejectionReason ? 'REJECTED' : hasModification ? 'MODIFIED' : 'ACCEPTED';

      const modificationJson: Record<string, any> = {};
      if (currentSurgery) modificationJson.surgery = currentSurgery;
      if (currentSystemic) modificationJson.systemicAntibiotic = currentSystemic;
      if (currentLocal) modificationJson.localAntibiotic = currentLocal;

      await callCreateDoctorReview(String(episodeId), {
        runId: Number(runIdRef.current),
        reviewStatus,
        reviewNote: reviewNote || undefined,
        modificationJson: hasModification ? modificationJson : undefined,
        rejectionReason: rejectionReason || undefined,
      });

      setIsSuccessModalOpen(true);
    } catch {
      message.error('Lỗi khi lưu xác nhận phác đồ.');
    } finally {
      setIsSaving(false);
    }
  };

  const backToHomepage = () => {
    localStorage.removeItem('pji_aiRunId');
    localStorage.removeItem('pji_aiRunDetail');
    localStorage.removeItem('pji_selectedPatientId');
    localStorage.removeItem('pji_selectedExamId');
    dispatch(clearCurrentCase());
    onBackToFirstStep();
  };

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
      <TreatmentPlanHeader
        canReviewTreatmentPlan={canReviewTreatmentPlan}
        isSaving={isSaving}
        onPrev={onPrev}
        onOpenReview={openReviewModal}
      />

      {/* Hybrid Container */}
      <div className="flex-1 overflow-hidden p-6 flex gap-6 text-slate-800 max-w-[1800px] mx-auto w-full">
        <TreatmentDraftPanel
          ref={draftRef}
          surgeryPlan={surgeryPlan}
          systemicPlan={systemicPlan}
          localPlan={localPlan}
          canReviewTreatmentPlan={canReviewTreatmentPlan}
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

      <ReviewModal
        open={isReviewModalOpen}
        isSaving={isSaving}
        reviewNote={reviewNote}
        rejectionReason={rejectionReason}
        onChangeReviewNote={setReviewNote}
        onChangeRejectionReason={setRejectionReason}
        onCancel={() => setIsReviewModalOpen(false)}
        onConfirm={handleConfirmTreatment}
      />

      <SuccessModal open={isSuccessModalOpen} onClose={backToHomepage} />
    </div>
  );
};

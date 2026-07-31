import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { useClinicForm } from '@/redux/hook';
import {
  callCreateExtractImageJob,
  callFetchExtractImageJob,
  callCancelExtractImageJob,
} from '@/apis/api';
import { callCreateUploadSession } from '@/apis/uploadSessions';
import {
  ExtractApplyCandidate,
  ExtractedMedicalResult,
  ExtractImageJobStatus,
} from '@/types/extractImages';
import {
  UploadSessionCreateResponse,
  UploadSessionEvent,
} from '@/types/uploadSession';
import {
  applyExtractCandidatesToClinicForm,
  buildCandidatesFromExtracted,
  normalizeUpstreamExtracted,
} from '@/utils/extractImagesMapper';
import { openSse, SseConnection } from '@/utils/sseClient';

export type QuickImportStatus = ExtractImageJobStatus | 'idle' | 'uploading';

const QUICK_IMPORT_POLL_INTERVAL_MS = 2_500;
const QUICK_IMPORT_MAX_POLL_MS = 10 * 60_000;

export function useQuickImportFlow(
  episodeId?: string | number,
  patientId?: string | number,
) {
  const { form: clinicForm, setForm } = useClinicForm();

  const [quickImportOpen, setQuickImportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [quickImportStatus, setQuickImportStatus] = useState<QuickImportStatus>('idle');
  const [quickImportError, setQuickImportError] = useState<string | null>(null);
  const [extractCandidates, setExtractCandidates] = useState<ExtractApplyCandidate[]>([]);
  const [extractedRaw, setExtractedRaw] = useState<ExtractedMedicalResult | null>(null);
  const [qrSession, setQrSession] = useState<UploadSessionCreateResponse | null>(null);
  const [qrEvent, setQrEvent] = useState<UploadSessionEvent | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const pollStartRef = useRef<number>(0);
  const currentJobIdRef = useRef<string | null>(null);
  const sseRef = useRef<SseConnection | null>(null);
  const clinicFormRef = useRef(clinicForm);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    clinicFormRef.current = clinicForm;
  }, [clinicForm]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current != null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const closeQrStream = useCallback(() => {
    sseRef.current?.close();
    sseRef.current = null;
  }, []);

  useEffect(
    () => () => {
      stopPolling();
      closeQrStream();
    },
    [closeQrStream, stopPolling],
  );

  const pollExtractJob = useCallback(async (jobId: string) => {
    try {
      const res: any = await callFetchExtractImageJob(jobId);
      const job = res?.data?.data || res?.data;
      const status: ExtractImageJobStatus = job?.status;

      if (status === 'completed') {
        stopPolling();
        const normalized = normalizeUpstreamExtracted(job?.extracted);
        const candidates = buildCandidatesFromExtracted(normalized, clinicFormRef.current);
        setExtractedRaw(normalized);
        setExtractCandidates(candidates);
        setQuickImportStatus('completed');
        setQuickImportOpen(false);
        setReviewOpen(true);
        return;
      }

      if (status === 'failed') {
        stopPolling();
        setQuickImportStatus('failed');
        setQuickImportError(job?.error || 'Trích xuất thất bại');
        return;
      }

      if (status === 'cancelled') {
        stopPolling();
        setQuickImportStatus('idle');
        return;
      }

      if (status === 'processing' || status === 'queued') {
        setQuickImportStatus(status);
      }

      if (Date.now() - pollStartRef.current > QUICK_IMPORT_MAX_POLL_MS) {
        stopPolling();
        setQuickImportStatus('failed');
        setQuickImportError('Quá trình trích xuất vẫn chưa hoàn tất sau 10 phút. Vui lòng thử lại.');
      }
    } catch {
      stopPolling();
      setQuickImportStatus('failed');
      setQuickImportError('Không thể lấy kết quả trích xuất');
    }
  }, [stopPolling]);

  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    currentJobIdRef.current = jobId;
    setQuickImportStatus('queued');
    pollStartRef.current = Date.now();
    void pollExtractJob(jobId);
    pollTimerRef.current = window.setInterval(
      () => void pollExtractJob(jobId),
      QUICK_IMPORT_POLL_INTERVAL_MS,
    );
  }, [pollExtractJob, stopPolling]);

  const handleQuickImportSubmit = async (files: File[]) => {
    setQuickImportStatus('uploading');
    setQuickImportError(null);
    try {
      const res: any = await callCreateExtractImageJob(files, episodeId);
      const jobId: string | undefined = res?.data?.jobId || res?.data?.data?.jobId;
      if (!jobId) {
        throw new Error('Không nhận được jobId từ server');
      }
      startPolling(jobId);
    } catch (err: any) {
      setQuickImportStatus('failed');
      setQuickImportError(err?.message || 'Không thể tạo job trích xuất');
    }
  };

  const openQrStream = useCallback((session: UploadSessionCreateResponse) => {
    closeQrStream();
    const base = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '')
      .replace(/\/+$/, '');
    const token = window.localStorage.getItem('access_token');
    sseRef.current = openSse({
      url: `${base}/api/v1/upload-sessions/${session.sessionId}/events`,
      token,
      onEvent: (frame) => {
        if (frame.event !== 'uploaded') return;
        try {
          const event = JSON.parse(frame.data) as UploadSessionEvent;
          setQrEvent(event);
          setQrError(null);
          closeQrStream();
          startPolling(event.jobId);
        } catch {
          setQrError('Dữ liệu đồng bộ từ điện thoại không hợp lệ');
        }
      },
      onError: () => {
        if (Date.now() < new Date(session.expiresAt).getTime()) {
          setQrError('Mất kết nối đồng bộ. Hãy tạo lại mã QR nếu ảnh không xuất hiện.');
        }
      },
    });
  }, [closeQrStream, startPolling]);

  const createQrSession = useCallback(async () => {
    if (patientId == null || episodeId == null) {
      throw new Error('Cần lưu bệnh án trước khi tải ảnh từ điện thoại');
    }
    setQrError(null);
    setQrEvent(null);
    const session = await callCreateUploadSession(patientId, episodeId);
    setQrSession(session);
    openQrStream(session);
    return session;
  }, [episodeId, openQrStream, patientId]);

  const handleQuickImportClose = () => {
    if (
      quickImportStatus === 'uploading'
      || quickImportStatus === 'queued'
      || quickImportStatus === 'processing'
    ) {
      stopPolling();
    }
    closeQrStream();
    setQuickImportOpen(false);
    setQuickImportStatus('idle');
    setQuickImportError(null);
    setQrSession(null);
    setQrEvent(null);
    setQrError(null);
  };

  const handleCancelExtract = async () => {
    const jobId = currentJobIdRef.current;
    stopPolling();
    if (!jobId) {
      setQuickImportStatus('idle');
      return;
    }
    setIsCancelling(true);
    try {
      await callCancelExtractImageJob(jobId);
      message.info('Đã huỷ trích xuất');
    } catch {
      message.warning('Đã yêu cầu huỷ (máy chủ phản hồi lỗi)');
    } finally {
      currentJobIdRef.current = null;
      setIsCancelling(false);
      setQuickImportStatus('idle');
      setQuickImportError(null);
    }
  };

  const openQuickImport = () => {
    setQuickImportError(null);
    setQuickImportStatus('idle');
    setQrSession(null);
    setQrEvent(null);
    setQrError(null);
    setQuickImportOpen(true);
  };

  const handleApplyCandidates = (candidates: ExtractApplyCandidate[]) => {
    if (!extractedRaw) {
      setReviewOpen(false);
      return;
    }
    setForm((previous) => applyExtractCandidatesToClinicForm(previous, candidates, extractedRaw));
    message.success('Đã áp dụng dữ liệu trích xuất vào form');
    setReviewOpen(false);
    setExtractCandidates([]);
    setExtractedRaw(null);
  };

  const handleReviewCancel = () => {
    setReviewOpen(false);
    setExtractCandidates([]);
    setExtractedRaw(null);
  };

  return {
    quickImportOpen,
    reviewOpen,
    quickImportStatus,
    quickImportError,
    isCancelling,
    extractCandidates,
    qrSession,
    qrEvent,
    qrError,
    openQuickImport,
    handleQuickImportClose,
    handleQuickImportSubmit,
    handleCancelExtract,
    handleApplyCandidates,
    handleReviewCancel,
    createQrSession,
  };
}

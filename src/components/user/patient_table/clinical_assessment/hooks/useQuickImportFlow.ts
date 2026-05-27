import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { useClinicForm } from '@/redux/hook';
import {
  callCreateExtractImageJob,
  callFetchExtractImageJob,
  callCancelExtractImageJob,
} from '@/apis/api';
import {
  ExtractApplyCandidate,
  ExtractedMedicalResult,
  ExtractImageJobStatus,
} from '@/types/extractImages';
import {
  applyExtractCandidatesToClinicForm,
  buildCandidatesFromExtracted,
  normalizeUpstreamExtracted,
} from '@/utils/extractImagesMapper';

export type QuickImportStatus = ExtractImageJobStatus | 'idle' | 'uploading';

const QUICK_IMPORT_POLL_INTERVAL_MS = 2_500;
const QUICK_IMPORT_MAX_POLL_MS = 10 * 60_000;

export function useQuickImportFlow(episodeId?: string | number) {
  const { form: clinicForm, setForm } = useClinicForm();

  const [quickImportOpen, setQuickImportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [quickImportStatus, setQuickImportStatus] = useState<QuickImportStatus>('idle');
  const [quickImportError, setQuickImportError] = useState<string | null>(null);
  const [extractCandidates, setExtractCandidates] = useState<ExtractApplyCandidate[]>([]);
  const [extractedRaw, setExtractedRaw] = useState<ExtractedMedicalResult | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const pollStartRef = useRef<number>(0);
  const currentJobIdRef = useRef<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const stopPolling = () => {
    if (pollTimerRef.current != null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const pollExtractJob = async (jobId: string) => {
    try {
      const res: any = await callFetchExtractImageJob(jobId);
      const job = res?.data?.data || res?.data;
      const status: ExtractImageJobStatus = job?.status;

      if (status === 'completed') {
        stopPolling();
        const normalized = normalizeUpstreamExtracted(job?.extracted);
        const candidates = buildCandidatesFromExtracted(normalized, clinicForm);
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
        // Worker confirmed the cancel — stop quietly, no error toast.
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
  };

  const handleQuickImportSubmit = async (files: File[]) => {
    setQuickImportStatus('uploading');
    setQuickImportError(null);
    try {
      const res: any = await callCreateExtractImageJob(files, episodeId);
      const jobId: string | undefined = res?.data?.jobId || res?.data?.data?.jobId;
      if (!jobId) {
        throw new Error('Không nhận được jobId từ server');
      }
      currentJobIdRef.current = jobId;
      setQuickImportStatus('queued');
      pollStartRef.current = Date.now();
      pollTimerRef.current = window.setInterval(
        () => pollExtractJob(jobId),
        QUICK_IMPORT_POLL_INTERVAL_MS,
      );
    } catch (err: any) {
      setQuickImportStatus('failed');
      setQuickImportError(err?.message || 'Không thể tạo job trích xuất');
    }
  };

  const handleQuickImportClose = () => {
    if (
      quickImportStatus === 'uploading' ||
      quickImportStatus === 'queued' ||
      quickImportStatus === 'processing'
    ) {
      stopPolling();
    }
    setQuickImportOpen(false);
    setQuickImportStatus('idle');
    setQuickImportError(null);
  };

  // Cancel an in-flight job: tell the server to drop + delete it, stop polling,
  // and reset the modal back to the upload state so the user can retry.
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
      // Server-side guard still drops a late result, so reset locally regardless.
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
    setQuickImportOpen(true);
  };

  const handleApplyCandidates = (candidates: ExtractApplyCandidate[]) => {
    if (!extractedRaw) {
      setReviewOpen(false);
      return;
    }
    setForm((prev) => applyExtractCandidatesToClinicForm(prev, candidates, extractedRaw));
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
    openQuickImport,
    handleQuickImportClose,
    handleQuickImportSubmit,
    handleCancelExtract,
    handleApplyCandidates,
    handleReviewCancel,
  };
}

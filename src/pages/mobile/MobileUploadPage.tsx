import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  completePublicUploadSession,
  createPresignedUpload,
  putFileWithProgress,
  validatePublicUploadSession,
} from '@/apis/uploadSessions';
import { PresignedUpload, UploadSessionValidation } from '@/types/uploadSession';

type PageState = 'validating' | 'ready' | 'uploading' | 'success' | 'expired' | 'error';
type FileState = 'ready' | 'signing' | 'uploading' | 'complete' | 'failed';

interface SelectedFile {
  id: string;
  file: File;
  contentType: string;
  previewUrl: string;
  progress: number;
  state: FileState;
  presigned?: PresignedUpload;
  error?: string;
}

const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif']);

const normalizeContentType = (file: File) => {
  const declared = file.type.toLowerCase();
  if (ALLOWED_TYPES.has(declared)) return declared;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'heic') return 'image/heic';
  if (extension === 'heif') return 'image/heif';
  return '';
};

const createSelectedFileId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

const statusLabel = (file: SelectedFile) => {
  if (file.state === 'complete') return 'Hoàn tất';
  if (file.state === 'failed') return file.error || 'Tải lên thất bại';
  if (file.state === 'signing') return 'Đang chuẩn bị...';
  if (file.state === 'uploading') return `${file.progress}%`;
  return 'Sẵn sàng';
};

const MobileUploadPage: React.FC = () => {
  const { sessionId = '' } = useParams();
  const [token] = useState(
    () => new URLSearchParams(window.location.search).get('token') ?? '',
  );
  const [pageState, setPageState] = useState<PageState>('validating');
  const [session, setSession] = useState<UploadSessionValidation | null>(null);
  const [selected, setSelected] = useState<SelectedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<SelectedFile[]>([]);

  useEffect(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      if (!sessionId || !token) {
        setPageState('error');
        setError('Liên kết tải ảnh không hợp lệ. Vui lòng quét lại mã QR.');
        return;
      }
      try {
        const result = await validatePublicUploadSession(sessionId, token);
        if (cancelled) return;
        setSession(result);
        setPageState('ready');
      } catch (validationError: any) {
        if (cancelled) return;
        setPageState(validationError?.status === 410 ? 'expired' : 'error');
        setError(validationError?.message || 'Không thể xác thực phiên tải ảnh');
      }
    };
    void validate();
    return () => {
      cancelled = true;
    };
  }, [sessionId, token]);

  useEffect(() => {
    if (!session?.expiresAt) return undefined;
    const update = () => {
      const seconds = Math.max(
        0,
        Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(seconds);
      if (seconds === 0 && pageState !== 'success') setPageState('expired');
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [pageState, session?.expiresAt]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(
    () => () => {
      selectedRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [],
  );

  const maxFiles = session?.maxFiles ?? DEFAULT_MAX_FILES;
  const maxFileSize = session?.maxFileSizeBytes ?? DEFAULT_MAX_SIZE;
  const isBusy = pageState === 'uploading';
  const readyCount = useMemo(
    () => selected.filter((item) => item.state !== 'failed').length,
    [selected],
  );

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (incoming.length === 0) return;

    const next: SelectedFile[] = [];
    const seen = new Set(selected.map((item) =>
      `${item.file.name}:${item.file.size}:${item.file.lastModified}`));
    let firstError: string | null = null;

    for (const file of incoming) {
      if (selected.length + next.length >= maxFiles) {
        firstError = `Chỉ được chọn tối đa ${maxFiles} ảnh.`;
        break;
      }
      const contentType = normalizeContentType(file);
      if (!ALLOWED_TYPES.has(contentType)) {
        firstError = `${file.name}: chỉ hỗ trợ JPEG, PNG hoặc HEIC.`;
        continue;
      }
      if (file.size <= 0 || file.size > maxFileSize) {
        firstError = `${file.name}: ảnh phải nhỏ hơn hoặc bằng ${formatBytes(maxFileSize)}.`;
        continue;
      }
      const fingerprint = `${file.name}:${file.size}:${file.lastModified}`;
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      next.push({
        id: createSelectedFileId(),
        file,
        contentType,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        state: 'ready',
      });
    }
    if (next.length > 0) setSelected((previous) => [...previous, ...next]);
    setError(firstError);
  };

  const removeFile = (id: string) => {
    setSelected((previous) => {
      const removed = previous.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return previous.filter((item) => item.id !== id);
    });
  };

  const updateFile = (id: string, patch: Partial<SelectedFile>) => {
    setSelected((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const upload = async () => {
    if (!sessionId || !token || readyCount === 0 || isBusy) return;
    setPageState('uploading');
    setError(null);
    try {
      // A session records each file while it issues its presigned URL. Keep that
      // mutation ordered so multiple photos cannot race on the same session.
      for (const item of selected) {
        if (item.state === 'complete') continue;
        updateFile(item.id, { state: 'signing', progress: 0, error: undefined });
        try {
          const existingPresignIsValid = item.presigned
            && new Date(item.presigned.expiresAt).getTime() > Date.now() + 5_000;
          const presigned = existingPresignIsValid
            ? item.presigned!
            : await createPresignedUpload(
              sessionId,
              token,
              item.file,
              item.contentType,
            );
          updateFile(item.id, { presigned });
          updateFile(item.id, { state: 'uploading' });
          await putFileWithProgress(
            presigned,
            item.file,
            (progress) => updateFile(item.id, { state: 'uploading', progress }),
          );
          updateFile(item.id, { state: 'complete', progress: 100 });
        } catch (uploadError: any) {
          updateFile(item.id, {
            state: 'failed',
            error: uploadError?.message || 'Tải lên thất bại',
          });
          throw uploadError;
        }
      }
      await completePublicUploadSession(sessionId, token);
      setPageState('success');
    } catch (uploadError: any) {
      setPageState(uploadError?.status === 410 ? 'expired' : 'ready');
      setError(uploadError?.message || 'Không thể gửi ảnh. Vui lòng thử lại.');
    }
  };

  if (pageState === 'validating') {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <span className="material-symbols-outlined animate-spin text-4xl text-blue-600">
            progress_activity
          </span>
          <p className="mt-3 text-sm text-slate-600">Đang xác thực phiên tải ảnh…</p>
        </div>
      </main>
    );
  }

  if (pageState === 'success') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
        <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white">
            <span className="material-symbols-outlined text-4xl" aria-hidden="true">check</span>
          </span>
          <h1 className="mt-6 text-xl font-bold text-slate-900">Đã gửi ảnh thành công</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Bạn có thể đóng trang này.</p>
        </section>
      </main>
    );
  }

  if (pageState === 'expired' || pageState === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
        <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600">
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">
              {pageState === 'expired' ? 'schedule' : 'link_off'}
            </span>
          </span>
          <h1 className="mt-5 text-xl font-bold text-slate-900">
            {pageState === 'expired' ? 'Mã QR đã hết hạn' : 'Không thể mở phiên tải ảnh'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || 'Vui lòng quay lại máy tính và tạo mã QR mới.'}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
          <h1 className="text-center text-lg font-bold text-slate-900">Tải ảnh xét nghiệm</h1>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-emerald-700">
            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">lock</span>
            Kết nối bảo mật với bệnh án đang mở
          </div>
        </header>

        <div className="space-y-6 px-5 py-6">
          <section className="rounded-xl border border-dashed border-blue-400 bg-blue-50/40 p-5 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-blue-600">
              <span className="material-symbols-outlined text-3xl" aria-hidden="true">photo_camera</span>
            </span>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600" aria-hidden="true">
                  photo_camera
                </span>
                Chụp ảnh
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => libraryInputRef.current?.click()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600" aria-hidden="true">
                  photo_library
                </span>
                Chọn từ thư viện
              </button>
            </div>
            <input
              ref={cameraInputRef}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
              capture="environment"
              multiple
              onChange={addFiles}
            />
            <input
              ref={libraryInputRef}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
              multiple
              onChange={addFiles}
            />
          </section>

          <p className="text-center text-xs leading-5 text-slate-500">
            JPEG, PNG hoặc HEIC · tối đa {formatBytes(maxFileSize)}/ảnh · tối đa {maxFiles} ảnh
          </p>

          {selected.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold text-slate-900">
                Ảnh đã chọn ({selected.length}/{maxFiles})
              </h2>
              <div className="mt-3 space-y-3">
                {selected.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-800">
                            {item.file.name}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {formatBytes(item.file.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => removeFile(item.id)}
                          aria-label={`Xóa ${item.file.name}`}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
                        </button>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-[width] ${
                            item.state === 'failed' ? 'bg-red-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${item.state === 'ready' ? 0 : Math.max(4, item.progress)}%` }}
                        />
                      </div>
                      <div className={`mt-1.5 text-xs ${
                        item.state === 'failed' ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        {statusLabel(item)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            disabled={readyCount === 0 || isBusy || remainingSeconds === 0}
            onClick={() => void upload()}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isBusy ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden="true">
                  progress_activity
                </span>
                Đang gửi ảnh…
              </>
            ) : 'Gửi ảnh về máy tính'}
          </button>

          <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
            <span className="material-symbols-outlined text-[17px] text-emerald-600" aria-hidden="true">
              lock
            </span>
            Phiên tải lên tự động hết hạn sau 5 phút. Còn {formatCountdown(remainingSeconds)}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MobileUploadPage;

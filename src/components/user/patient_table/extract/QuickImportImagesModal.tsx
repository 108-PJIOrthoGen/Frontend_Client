import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Upload, Button, message, Spin, QRCode } from 'antd';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { ExtractImageJobStatus } from '@/types/extractImages';
import {
  UploadSessionCreateResponse,
  UploadSessionEvent,
} from '@/types/uploadSession';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type ImportMode = 'chooser' | 'device' | 'qr';

interface QuickImportImagesModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (files: File[]) => void;
  onCreateQr: () => Promise<UploadSessionCreateResponse>;
  canCreateQr: boolean;
  qrSession?: UploadSessionCreateResponse | null;
  qrEvent?: UploadSessionEvent | null;
  qrError?: string | null;
  onCancelJob?: () => void;
  isCancelling?: boolean;
  status: ExtractImageJobStatus | 'idle' | 'uploading';
  errorMessage?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  uploading: 'Đang tải ảnh...',
  queued: 'Đã nhận ảnh, đang xếp hàng trích xuất...',
  processing: 'Đang trích xuất dữ liệu...',
  failed: 'Trích xuất thất bại',
};

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const normalizedFileType = (file: RcFile) => {
  const declared = file.type.toLowerCase();
  if (ALLOWED_TYPES.includes(declared)) return declared;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'heic') return 'image/heic';
  if (extension === 'heif') return 'image/heif';
  return '';
};

export const QuickImportImagesModal: React.FC<QuickImportImagesModalProps> = ({
  open,
  onClose,
  onSubmit,
  onCreateQr,
  canCreateQr,
  qrSession,
  qrEvent,
  qrError,
  onCancelJob,
  isCancelling = false,
  status,
  errorMessage,
}) => {
  const [mode, setMode] = useState<ImportMode>('chooser');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [creatingQr, setCreatingQr] = useState(false);
  const [createQrError, setCreateQrError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!open) {
      setMode('chooser');
      setFileList([]);
      setCreatingQr(false);
      setCreateQrError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!qrSession?.expiresAt) {
      setRemainingSeconds(0);
      return undefined;
    }
    const update = () => {
      setRemainingSeconds(Math.max(
        0,
        Math.ceil((new Date(qrSession.expiresAt).getTime() - Date.now()) / 1000),
      ));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [qrSession?.expiresAt]);

  const isBusy = status === 'uploading' || status === 'queued' || status === 'processing';

  const beforeUpload = (file: RcFile, list: RcFile[]) => {
    if (!ALLOWED_TYPES.includes(normalizedFileType(file))) {
      message.error(`${file.name}: định dạng không được hỗ trợ`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error(`${file.name}: vượt quá 5MB`);
      return Upload.LIST_IGNORE;
    }
    if (fileList.length + list.length > MAX_FILES) {
      message.error(`Tối đa ${MAX_FILES} ảnh mỗi lần`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const onChange = ({ fileList: next }: { fileList: UploadFile[] }) => {
    setFileList(next.slice(0, MAX_FILES));
  };

  const realFiles = useMemo(
    () => fileList.map((file) => file.originFileObj as File).filter(Boolean) as File[],
    [fileList],
  );

  const handleSubmit = () => {
    if (realFiles.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 ảnh');
      return;
    }
    onSubmit(realFiles);
  };

  const createQr = async () => {
    setCreatingQr(true);
    setCreateQrError(null);
    try {
      await onCreateQr();
    } catch (error: any) {
      setCreateQrError(error?.message || 'Không thể tạo mã QR');
    } finally {
      setCreatingQr(false);
    }
  };

  const openQrMode = () => {
    if (!canCreateQr) {
      message.warning('Vui lòng lưu bệnh án trước khi tải ảnh từ điện thoại.');
      return;
    }
    setMode('qr');
    if (!qrSession) void createQr();
  };

  const statusText = STATUS_LABEL[status] || '';
  const displayedQrError = createQrError || qrError;

  const footer = isBusy
    ? (
        <Button danger loading={isCancelling} onClick={onCancelJob}>
          {isCancelling ? 'Đang huỷ...' : 'Huỷ trích xuất'}
        </Button>
      )
    : (
        <>
          {mode !== 'chooser' ? (
            <Button onClick={() => setMode('chooser')}>Quay lại</Button>
          ) : null}
          <Button onClick={onClose}>Đóng</Button>
          {mode === 'device' ? (
            <Button
              type="primary"
              onClick={handleSubmit}
              disabled={realFiles.length === 0}
            >
              Trích xuất dữ liệu
            </Button>
          ) : null}
        </>
      );

  return (
    <Modal
      title="Import nhanh"
      open={open}
      onCancel={isBusy ? undefined : onClose}
      maskClosable={!isBusy}
      closable={!isBusy}
      destroyOnHidden
      width={mode === 'chooser' ? 680 : 720}
      footer={footer}
    >
      {mode === 'chooser' ? (
        <div className="grid gap-4 py-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('device')}
            className="group flex min-h-44 flex-col items-start rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-blue-500 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined" aria-hidden="true">image</span>
            </span>
            <span className="text-base font-semibold text-slate-900">Chọn ảnh trên thiết bị</span>
            <span className="mt-2 text-sm leading-6 text-slate-500">
              Chọn một hoặc nhiều phiếu xét nghiệm đang có trên máy tính.
            </span>
          </button>
          <button
            type="button"
            onClick={openQrMode}
            aria-disabled={!canCreateQr}
            className={`group flex min-h-44 flex-col items-start rounded-xl border p-6 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              canCreateQr
                ? 'border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm'
                : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined" aria-hidden="true">smartphone</span>
            </span>
            <span className="text-base font-semibold text-slate-900">Tải ảnh từ điện thoại</span>
            <span className="mt-2 text-sm leading-6 text-slate-500">
              {canCreateQr
                ? 'Quét mã QR để chụp và gửi ảnh thẳng về bệnh án đang mở.'
                : 'Cần lưu bệnh án trước khi sử dụng tính năng này.'}
            </span>
          </button>
          <div className="sm:col-span-2 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[18px] text-emerald-600" aria-hidden="true">
              shield_lock
            </span>
            Ảnh được tải trực tiếp và không qua dịch vụ trung gian.
          </div>
        </div>
      ) : null}

      {mode === 'device' ? (
        <div className="flex flex-col gap-3 py-2">
          <div className="text-sm text-slate-600">
            Tải phiếu xét nghiệm (JPEG/PNG/HEIC, tối đa 5MB mỗi ảnh, {MAX_FILES} ảnh).
          </div>
          <Upload.Dragger
            multiple
            accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
            beforeUpload={beforeUpload}
            fileList={fileList}
            onChange={onChange}
            onRemove={(file) => {
              setFileList((previous) => previous.filter((item) => item.uid !== file.uid));
            }}
            listType="picture"
            disabled={isBusy}
          >
            <p className="ant-upload-text">Kéo thả ảnh hoặc click để chọn</p>
            <p className="ant-upload-hint">Hỗ trợ nhiều file cùng lúc</p>
          </Upload.Dragger>
          {statusText ? (
            <div className={`text-sm ${status === 'failed' ? 'text-red-600' : 'text-slate-700'}`}>
              {statusText}
              {errorMessage ? <div className="mt-1 text-red-600">{errorMessage}</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === 'qr' ? (
        <div className="py-2">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <h3 className="text-lg font-semibold text-slate-900">Quét mã bằng điện thoại</h3>
            <p className="mt-1 text-sm text-slate-500">Mã QR hết hạn sau 5 phút</p>

            <div className="mt-5 grid min-h-56 min-w-56 place-items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {creatingQr ? <Spin size="large" /> : null}
              {!creatingQr && qrSession && remainingSeconds > 0 ? (
                <QRCode
                  value={qrSession.qrPayload}
                  size={210}
                  type="svg"
                  errorLevel="M"
                  bordered={false}
                  aria-label="Mã QR tải ảnh từ điện thoại"
                />
              ) : null}
              {!creatingQr && (!qrSession || remainingSeconds === 0) ? (
                <div className="max-w-48 text-sm text-slate-500">
                  {remainingSeconds === 0 && qrSession
                    ? 'Mã QR đã hết hạn.'
                    : 'Chưa có mã QR.'}
                </div>
              ) : null}
            </div>

            {qrSession && remainingSeconds > 0 ? (
              <div className="mt-3 text-2xl font-bold tabular-nums text-blue-600">
                {formatCountdown(remainingSeconds)}
              </div>
            ) : null}

            {qrEvent ? (
              <div className="mt-4 w-full rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-left">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    check_circle
                  </span>
                  Đã nhận {qrEvent.images.length} ảnh từ điện thoại
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {qrEvent.images.map((image) => (
                    <img
                      key={image.fileId}
                      src={image.previewUrl}
                      alt={image.name}
                      className="h-16 w-16 rounded-md border border-emerald-200 bg-white object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                Đang chờ ảnh từ điện thoại…
              </div>
            )}

            {statusText ? <div className="mt-2 text-sm text-slate-600">{statusText}</div> : null}
            {displayedQrError ? (
              <div className="mt-3 text-sm text-red-600">{displayedQrError}</div>
            ) : null}
            {!isBusy ? (
              <Button className="mt-4" loading={creatingQr} onClick={() => void createQr()}>
                Tạo mã mới
              </Button>
            ) : null}

            <div className="mt-5 flex w-full items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="material-symbols-outlined text-[18px] text-emerald-600" aria-hidden="true">
                shield_lock
              </span>
              Ảnh được tải trực tiếp và không qua dịch vụ trung gian.
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default QuickImportImagesModal;

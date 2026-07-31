import instance from './axios.custom';
import {
  PresignedUpload,
  UploadSessionCreateResponse,
  UploadSessionValidation,
} from '@/types/uploadSession';

interface BackendEnvelope<T> {
  statusCode?: number;
  message?: string;
  data: T;
}

const apiBase = () =>
  ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '').replace(/\/+$/, '');

const publicRequest = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      payload?.message
        ?? (response.status === 410
          ? 'Phiên tải lên đã hết hạn'
          : 'Không thể kết nối phiên tải lên'),
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return (payload as BackendEnvelope<T>).data;
};

export const callCreateUploadSession = async (
  patientId: string | number,
  episodeId: string | number,
): Promise<UploadSessionCreateResponse> => {
  const response = await instance.post(
    `/api/v1/patients/${patientId}/upload-sessions`,
    { episodeId: Number(episodeId) },
  ) as unknown as BackendEnvelope<UploadSessionCreateResponse>;
  if (!response?.data?.sessionId || !response.data.qrPayload || !response.data.expiresAt) {
    throw new Error(response?.message || 'Không thể tạo mã QR');
  }
  return response.data;
};

export const validatePublicUploadSession = (
  sessionId: string,
  token: string,
): Promise<UploadSessionValidation> =>
  publicRequest(
    `/api/v1/upload-sessions/${sessionId}/validate?token=${encodeURIComponent(token)}`,
  );

export const createPresignedUpload = (
  sessionId: string,
  token: string,
  file: File,
  contentType: string,
): Promise<PresignedUpload> =>
  publicRequest(`/api/v1/upload-sessions/${sessionId}/presigned-url`, {
    method: 'POST',
    body: JSON.stringify({
      token,
      fileName: file.name,
      contentType,
      size: file.size,
    }),
  });

export const completePublicUploadSession = (
  sessionId: string,
  token: string,
): Promise<void> =>
  publicRequest(`/api/v1/upload-sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

export const putFileWithProgress = (
  upload: PresignedUpload,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(upload.method, upload.uploadUrl);
    request.setRequestHeader('Content-Type', upload.contentType);
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new Error(`MinIO upload failed (${request.status})`));
    };
    request.onerror = () => reject(new Error('Không thể tải ảnh lên kho lưu trữ'));
    request.onabort = () => reject(new Error('Đã huỷ tải ảnh'));
    request.send(file);
  });

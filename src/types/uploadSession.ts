export type UploadSessionStatus = 'PENDING' | 'UPLOADED' | 'EXPIRED' | 'CONSUMED';

export interface UploadSessionCreateResponse {
  sessionId: string;
  qrPayload: string;
  expiresAt: string;
}

export interface UploadSessionValidation {
  sessionId: string;
  expiresAt: string;
  maxFiles: number;
  maxFileSizeBytes: number;
  allowedContentTypes: string[];
}

export interface PresignedUpload {
  fileId: string;
  uploadUrl: string;
  method: 'PUT';
  contentType: string;
  expiresAt: string;
}

export interface UploadedSessionImage {
  fileId: string;
  name: string;
  contentType: string;
  size: number;
  previewUrl: string;
}

export interface UploadSessionEvent {
  sessionId: string;
  status: UploadSessionStatus;
  jobId: string;
  images: UploadedSessionImage[];
}

import type { IBackendRes, IRole, IUser } from '@/types/backend';
import instance from './axios.custom';

interface UpdateOwnProfilePayload {
  fullName: string;
  phone?: string;
  department?: string;
  avatar?: string;
}

interface ChangeOwnPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const registerAPI = (
  username: string,
  email: string,
  password: string,
  roleId: IRole,
) =>
  instance.post('/api/v1/auth/register', {
    username,
    email,
    password,
    role: { id: roleId },
  });

export const loginAPI = (username: string, password: string) =>
  instance.post('/api/v1/auth/login', { username, password });

export const forgotPasswordAPI = (email: string, captchaToken?: string) =>
  instance.post('/api/v1/auth/forgot-password', { email, captchaToken });

export const resetPasswordAPI = (
  email: string,
  otp: string,
  newPassword: string,
) =>
  instance.post('/api/v1/auth/reset-password', { email, otp, newPassword });

export const callFetchAccountAPI = () =>
  instance.get('/api/v1/auth/account');

export const LogoutAPI = () =>
  instance.post('/api/v1/auth/logout');

export const callVerifyDeviceAPI = (
  email: string,
  challengeId: string,
  otp: string,
) =>
  instance.post('/api/v1/auth/verify-device', { email, challengeId, otp });

export const callUpdateOwnProfile = (
  payload: UpdateOwnProfilePayload,
): Promise<IBackendRes<IUser>> =>
  instance.put('/api/v1/auth/account', payload);

export const callUpdateOwnProfileWithAvatar = (
  payload: UpdateOwnProfilePayload,
  avatar: File,
): Promise<IBackendRes<IUser>> => {
  const formData = new FormData();
  formData.append(
    'profile',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  );
  formData.append('avatar', avatar);
  return instance.put('/api/v1/auth/account', formData);
};

/**
 * The backend revokes every session after a successful password change.
 */
export const callChangeOwnPassword = (
  payload: ChangeOwnPasswordPayload,
): Promise<IBackendRes<void>> =>
  instance.post('/api/v1/auth/change-password', payload);

import type { IBackendRes } from '@/types/backend';
import type { INotification } from '@/types/notification';
import instance from './axios.custom';

export interface INotificationPage {
  content: INotification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface NotificationQuery {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

export const callFetchNotifications = (
  params: NotificationQuery = {},
): Promise<IBackendRes<INotificationPage>> =>
  instance.get('/api/v1/notifications', { params });

export const callFetchUnreadNotificationCount = (): Promise<
  IBackendRes<{ unreadCount: number }>
> =>
  instance.get('/api/v1/notifications/unread-count');

export const callMarkNotificationRead = (
  id: number,
): Promise<IBackendRes<{ updated: boolean }>> =>
  instance.patch(`/api/v1/notifications/${id}/read`);

export const callMarkAllNotificationsRead = (): Promise<
  IBackendRes<{ updated: number }>
> =>
  instance.post('/api/v1/notifications/mark-all-read');

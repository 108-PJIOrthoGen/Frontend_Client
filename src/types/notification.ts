export type NotificationType =
  | 'AI_RECOMMENDATION_DONE'
  | 'AI_RECOMMENDATION_FAILED';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'ERROR';

export interface INotification {
  id: number;
  type: NotificationType;
  title: string;
  message?: string | null;
  referenceId?: string | null;
  linkUrl?: string | null;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: string; // ISO Instant
  readAt?: string | null;
}

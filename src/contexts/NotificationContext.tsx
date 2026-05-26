import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { notification as antdNotification } from 'antd';
import {
  callFetchNotifications,
  callFetchUnreadNotificationCount,
  callMarkAllNotificationsRead,
  callMarkNotificationRead,
} from '@/apis/api';
import { openSse, type SseConnection } from '@/utils/sseClient';
import type { INotification } from '@/types/notification';

interface NotificationContextValue {
  notifications: INotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const RECENT_PAGE_SIZE = 20;
const RECONNECT_INITIAL_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

interface ProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider = ({ children }: ProviderProps) => {
  // Treat any truthy account state as "logged in". The exact shape varies
  // across slices (accountSlice stores user object once login succeeds), so
  // we use it only as a gate to know when to connect — not to read identity.
  const isAuthed = useSelector((state: any) => Boolean(state?.account?.user));

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const sseRef = useRef<SseConnection | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef<number>(RECONNECT_INITIAL_MS);
  const isMountedRef = useRef<boolean>(true);

  // Pull the latest page + unread count from the server. Used on initial mount,
  // on auth changes, and as a fallback when SSE drops.
  const refresh = useCallback(async () => {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        callFetchNotifications({ page: 0, size: RECENT_PAGE_SIZE }),
        callFetchUnreadNotificationCount(),
      ]);
      const list: any = listRes?.data;
      const items: INotification[] = list?.content ?? list?.data?.content ?? [];
      setNotifications(items);
      const cnt = countRes?.data?.unreadCount
        ?? (countRes as any)?.data?.data?.unreadCount
        ?? 0;
      setUnreadCount(Number(cnt) || 0);
    } catch (err) {
      // Silent fail — the user can manually reopen the bell to retry.
      // eslint-disable-next-line no-console
      console.warn('Failed to refresh notifications', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthed]);

  const markRead = useCallback(async (id: number) => {
    // Optimistic update first; reconcile on error.
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.isRead
        ? { ...n, isRead: true, readAt: new Date().toISOString() }
        : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await callMarkNotificationRead(id);
    } catch (err) {
      await refresh(); // Reconcile with server truth.
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    const previouslyUnread = unreadCount;
    setNotifications((prev) => prev.map((n) => (n.isRead
      ? n
      : { ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await callMarkAllNotificationsRead();
    } catch (err) {
      setUnreadCount(previouslyUnread);
      await refresh();
    }
  }, [unreadCount, refresh]);

  // Prepend a single notification that arrived via SSE.
  const handleIncoming = useCallback((incoming: INotification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === incoming.id)) return prev;
      return [incoming, ...prev].slice(0, RECENT_PAGE_SIZE);
    });
    if (!incoming.isRead) {
      setUnreadCount((c) => c + 1);
    }
    // Surface a transient toast so the user notices even without opening the bell.
    const showToast = incoming.severity === 'ERROR'
      ? antdNotification.error
      : antdNotification.success;
    showToast({
      message: incoming.title,
      description: incoming.message ?? undefined,
      placement: 'topRight',
      duration: 6,
    });
  }, []);

  // (Re)open the SSE stream. Caller is responsible for clearing any previous connection.
  const openConnection = useCallback(() => {
    if (!isAuthed) return;
    const apiBase = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '').replace(/\/+$/, '');
    const token = window.localStorage.getItem('access_token');
    sseRef.current = openSse({
      url: `${apiBase}/api/v1/notifications/stream`,
      token,
      onOpen: () => {
        // Reset backoff after a successful handshake.
        reconnectDelayRef.current = RECONNECT_INITIAL_MS;
      },
      onEvent: (frame) => {
        if (frame.event !== 'notification') return;
        try {
          const dto: INotification = JSON.parse(frame.data);
          handleIncoming(dto);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to parse notification SSE frame', err);
        }
      },
      onError: () => {
        if (!isMountedRef.current) return;
        // Schedule reconnect with exponential backoff (capped).
        if (reconnectTimerRef.current != null) return;
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, RECONNECT_MAX_MS);
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          sseRef.current?.close();
          sseRef.current = null;
          // Pull fresh data in case we missed a push while disconnected.
          void refresh();
          openConnection();
        }, delay);
      },
    });
  }, [isAuthed, handleIncoming, refresh]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!isAuthed) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    void refresh();
    openConnection();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      sseRef.current?.close();
      sseRef.current = null;
    };
    // openConnection identity changes when isAuthed flips — that's the only
    // case we want to react to. refresh is stable per isAuthed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
  }), [notifications, unreadCount, loading, refresh, markRead, markAllRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationProvider>');
  }
  return ctx;
};

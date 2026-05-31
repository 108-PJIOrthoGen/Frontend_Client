import { useCallback, useEffect, useRef, useState } from 'react';
import {
    callAcquireEpisodeLock,
    callHeartbeatEpisodeLock,
    callReleaseEpisodeLock,
    isEpisodeLockBusy,
    IEpisodeLockResult,
} from '@/apis/api';

const HEARTBEAT_INTERVAL_MS = 90_000; // half of the 3-minute server TTL
const COUNTDOWN_TICK_MS = 1_000;

export type LockStatus = 'idle' | 'acquiring' | 'held' | 'busy' | 'error';

export interface UseEpisodeLockResult {
    status: LockStatus;
    /** User id currently holding the lock (only meaningful in 'busy' state). */
    heldBy: number | null;
    /** Remaining seconds; counts down locally for both 'held' and 'busy'. */
    ttlSeconds: number;
    /** Human-friendly message from the backend when busy/error. */
    message: string | null;
    /** Explicitly release the lock — call after a successful save. */
    release: () => Promise<void>;
    /** Retry the acquire (e.g. after a busy banner). */
    retry: () => Promise<void>;
}

const extractTtl = (r: IEpisodeLockResult): number => {
    if (isEpisodeLockBusy(r)) return r.ttlSeconds ?? 0;
    return r?.data?.ttlSeconds ?? 0;
};

/**
 * Hook that manages the Redis soft-lock lifecycle for an episode edit drawer.
 *
 * - On open with a non-null episodeId, attempts to acquire the lock.
 * - While held, sends a heartbeat every 90s to extend the TTL.
 * - Tracks remaining seconds locally so the UI can show a live countdown.
 * - Releases the lock on close. For new episodes (no id) it is a no-op.
 */
export const useEpisodeLock = (episodeId: string | number | null | undefined, enabled: boolean): UseEpisodeLockResult => {
    const [status, setStatus] = useState<LockStatus>('idle');
    const [heldBy, setHeldBy] = useState<number | null>(null);
    const [ttlSeconds, setTtlSeconds] = useState(0);
    const [message, setMessage] = useState<string | null>(null);

    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const releasedRef = useRef(false);

    const clearTimers = useCallback(() => {
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
    }, []);

    const startCountdown = useCallback(() => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = setInterval(() => {
            setTtlSeconds((s) => (s > 0 ? s - 1 : 0));
        }, COUNTDOWN_TICK_MS);
    }, []);

    const acquire = useCallback(async (id: string) => {
        setStatus('acquiring');
        setMessage(null);
        try {
            const res = await callAcquireEpisodeLock(id);
            if (isEpisodeLockBusy(res)) {
                setStatus('busy');
                setHeldBy(res.heldBy);
                setTtlSeconds(extractTtl(res));
                setMessage(res.message);
                startCountdown();
                return;
            }
            if (res?.data) {
                setStatus('held');
                setHeldBy(res.data.heldBy);
                setTtlSeconds(res.data.ttlSeconds);
                setMessage(null);
                startCountdown();
                releasedRef.current = false;
            } else {
                setStatus('error');
                setMessage('Không thể lấy khóa chỉnh sửa');
            }
        } catch {
            setStatus('error');
            setMessage('Lỗi kết nối khi lấy khóa chỉnh sửa');
        }
    }, [startCountdown]);

    const heartbeat = useCallback(async (id: string) => {
        try {
            const res = await callHeartbeatEpisodeLock(id);
            if (isEpisodeLockBusy(res)) {
                // Lost the lock (TTL expired and someone else picked it up).
                clearTimers();
                setStatus('busy');
                setHeldBy(res.heldBy);
                setTtlSeconds(res.ttlSeconds);
                setMessage(res.message);
                startCountdown();
                return;
            }
            if (res?.data) {
                setTtlSeconds(res.data.ttlSeconds);
            }
        } catch {
            // Network blip — let the next tick try again.
        }
    }, [clearTimers, startCountdown]);

    const release = useCallback(async () => {
        const id = episodeId != null ? String(episodeId) : null;
        clearTimers();
        if (!id || releasedRef.current || status !== 'held') {
            setStatus('idle');
            setHeldBy(null);
            setTtlSeconds(0);
            return;
        }
        releasedRef.current = true;
        try {
            await callReleaseEpisodeLock(id);
        } catch {
            // Best-effort — server-side TTL still cleans up.
        }
        setStatus('idle');
        setHeldBy(null);
        setTtlSeconds(0);
    }, [episodeId, clearTimers, status]);

    const retry = useCallback(async () => {
        const id = episodeId != null ? String(episodeId) : null;
        if (!id) return;
        clearTimers();
        await acquire(id);
    }, [episodeId, acquire, clearTimers]);

    // Acquire on open / id change; release on close / unmount.
    useEffect(() => {
        const id = episodeId != null ? String(episodeId) : null;
        if (!enabled || !id) {
            clearTimers();
            setStatus('idle');
            setHeldBy(null);
            setTtlSeconds(0);
            setMessage(null);
            return;
        }
        releasedRef.current = false;
        acquire(id);
        return () => {
            clearTimers();
            // Fire-and-forget release on unmount/close.
            if (!releasedRef.current) {
                releasedRef.current = true;
                callReleaseEpisodeLock(id).catch(() => undefined);
            }
        };
        // acquire is stable via useCallback over startCountdown which has no deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [episodeId, enabled]);

    // Heartbeat ticker — only while we hold the lock.
    useEffect(() => {
        const id = episodeId != null ? String(episodeId) : null;
        if (status !== 'held' || !id) return;
        heartbeatTimerRef.current = setInterval(() => {
            heartbeat(id);
        }, HEARTBEAT_INTERVAL_MS);
        return () => {
            if (heartbeatTimerRef.current) {
                clearInterval(heartbeatTimerRef.current);
                heartbeatTimerRef.current = null;
            }
        };
    }, [status, episodeId, heartbeat]);

    return { status, heldBy, ttlSeconds, message, release, retry };
};

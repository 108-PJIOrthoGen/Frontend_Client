/**
 * Minimal SSE client built on fetch + ReadableStream so we can send the
 * Authorization header (the native EventSource API can't).
 *
 * Parses the standard event stream format (`event:`, `data:`, blank line
 * terminator) into { event, data } and forwards each frame to `onEvent`.
 */

export interface SseConnection {
    close: () => void;
}

export interface SseFrame {
    event: string;
    data: string;
}

export interface OpenSseOptions {
    url: string;
    token?: string | null;
    onEvent: (frame: SseFrame) => void;
    onError?: (err: unknown) => void;
    onOpen?: () => void;
}

export const openSse = ({
    url,
    token,
    onEvent,
    onError,
    onOpen,
}: OpenSseOptions): SseConnection => {
    const controller = new AbortController();

    const run = async () => {
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'text/event-stream',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: 'include',
                signal: controller.signal,
            });

            if (!res.ok || !res.body) {
                throw new Error(`SSE handshake failed (status=${res.status})`);
            }

            onOpen?.();

            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // SSE frames are separated by a blank line.
                let sepIdx;
                while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
                    const frame = buffer.slice(0, sepIdx);
                    buffer = buffer.slice(sepIdx + 2);
                    const parsed = parseFrame(frame);
                    if (parsed) onEvent(parsed);
                }
            }
        } catch (err) {
            if ((err as any)?.name === 'AbortError') return;
            onError?.(err);
        }
    };

    void run();

    return {
        close: () => controller.abort(),
    };
};

const parseFrame = (raw: string): SseFrame | null => {
    let event = 'message';
    const dataLines: string[] = [];

    for (const line of raw.split('\n')) {
        if (!line || line.startsWith(':')) continue; // blank or comment
        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');

        if (field === 'event') event = value;
        else if (field === 'data') dataLines.push(value);
    }

    if (dataLines.length === 0) return null;
    return { event, data: dataLines.join('\n') };
};

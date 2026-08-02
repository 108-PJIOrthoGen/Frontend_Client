const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

interface BrowserLocation {
  hostname: string;
  origin: string;
}

const isLoopbackHost = (hostname: string) =>
  LOOPBACK_HOSTS.has(hostname.toLowerCase());

const currentLocation = (): BrowserLocation | undefined =>
  typeof window === 'undefined' ? undefined : window.location;

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, '');

/**
 * Keep explicit production/same-origin configuration unchanged, but make the
 * usual local `http://localhost:<port>` setting reachable when the app itself
 * was opened through the workstation's LAN address.
 */
export const resolveRuntimeApiBase = (
  configuredBase: string | undefined,
  location: BrowserLocation | undefined = currentLocation(),
): string => {
  const base = configuredBase?.trim() ?? '';
  if (!base || base === '/') return '';
  if (!location || !/^[a-z][a-z\d+\-.]*:\/\//i.test(base)) {
    return withoutTrailingSlash(base);
  }

  try {
    const url = new URL(base);
    if (isLoopbackHost(url.hostname) && !isLoopbackHost(location.hostname)) {
      url.hostname = location.hostname;
    }
    return withoutTrailingSlash(url.toString());
  } catch {
    return withoutTrailingSlash(base);
  }
};

export const getRuntimeApiBase = () =>
  resolveRuntimeApiBase(import.meta.env.VITE_BACKEND_URL as string | undefined);

/**
 * The backend dev profile intentionally emits a localhost frontend URL. When
 * the desktop opens Vite through a LAN IP, render that same QR route on the
 * already-reachable LAN host. Public production domains are never rewritten.
 */
export const resolveBrowserReachableUrl = (
  value: string,
  location: BrowserLocation | undefined = currentLocation(),
): string => {
  if (!location) return value;

  try {
    const url = new URL(value, location.origin);
    if (isLoopbackHost(url.hostname) && !isLoopbackHost(location.hostname)) {
      url.hostname = location.hostname;
    }
    return url.toString();
  } catch {
    return value;
  }
};

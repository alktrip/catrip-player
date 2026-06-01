import type { App, Session } from 'electron';

/** UA activo para peticiones (p. ej. iframes del reproductor Prime). */
let activeUserAgent = '';

const ELECTRON_UA_PATTERN = /\s+Electron\/[\d.]+\s*/gi;
const APP_TOKEN_PATTERN = /\s+CatripPlayer\/[\d.]+\s*/gi;

function chromeVersion(): string {
  return process.versions.chrome || '132.0.0.0';
}

/** User-Agent de Chrome sin tokens Electron / nombre de la app. */
export function buildChromeUserAgent(): string {
  const chrome = chromeVersion();
  switch (process.platform) {
    case 'darwin':
      return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome} Safari/537.36`;
    case 'win32':
      return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome} Safari/537.36`;
    default:
      return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome} Safari/537.36`;
  }
}

export function sanitizeUserAgent(ua: string): string {
  let out = ua.replace(ELECTRON_UA_PATTERN, ' ').replace(APP_TOKEN_PATTERN, ' ');
  const appName = process.env.ELECTRON_APP_NAME;
  if (appName) {
    const esc = appName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`\\s+${esc}/[\\d.]+\\s*`, 'gi'), ' ');
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

export function getStreamingUserAgent(): string {
  return activeUserAgent || buildChromeUserAgent();
}

export function setActiveUserAgent(ua: string | undefined): string {
  const base = buildChromeUserAgent();
  activeUserAgent = ua ? sanitizeUserAgent(ua) || base : base;
  return activeUserAgent;
}

/** Debe llamarse antes de `app.whenReady()` (p. ej. al cargar main). */
export function configureStreamingUserAgent(app: App): void {
  activeUserAgent = buildChromeUserAgent();
  app.userAgentFallback = activeUserAgent;
}

function clientHintsFromUa(ua: string): Record<string, string> {
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const major = chromeMatch?.[1] ?? '132';
  const platform =
    process.platform === 'darwin' ? '"macOS"' : process.platform === 'win32' ? '"Windows"' : '"Linux"';
  return {
    'Sec-CH-UA': `"Chromium";v="${major}", "Google Chrome";v="${major}", "Not_A Brand";v="24"`,
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': platform,
  };
}

export function setupSessionUserAgent(session: Session): void {
  const ua = getStreamingUserAgent();
  session.setUserAgent(ua);
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    const uaNow = getStreamingUserAgent();
    headers['User-Agent'] = uaNow;
    Object.assign(headers, clientHintsFromUa(uaNow));
    callback({ requestHeaders: headers });
  });
}

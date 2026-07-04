import { useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = 'turnstile-api-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileCaptchaProps = {
  siteKey: string;
  resetKey: number;
  onVerify: (token: string) => void;
  onExpire: () => void;
};

const TurnstileCaptcha = ({ siteKey, resetKey, onVerify, onExpire }: TurnstileCaptchaProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [scriptReady, setScriptReady] = useState(Boolean(window.turnstile));

  useEffect(() => {
    if (window.turnstile) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    const handleLoad = () => setScriptReady(true);
    const handleError = () => setScriptFailed(true);
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !window.turnstile || !containerRef.current) {
      return;
    }

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
    containerRef.current.innerHTML = '';
    onExpire();

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'light',
      callback: onVerify,
      'expired-callback': onExpire,
      'error-callback': onExpire,
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey, resetKey, onVerify, onExpire]);

  if (scriptFailed) {
    return <Alert type="error" showIcon message="Không tải được CAPTCHA. Vui lòng tải lại trang." />;
  }

  return (
    <div style={{ minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!scriptReady && <Spin />}
      <div ref={containerRef} />
    </div>
  );
};

export default TurnstileCaptcha;

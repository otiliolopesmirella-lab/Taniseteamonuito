import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Ensure older mobile WebViews / Safari versions without native ctx.roundRect never crash on canvas draws
if (
  typeof window !== 'undefined' &&
  typeof CanvasRenderingContext2D !== 'undefined' &&
  !CanvasRenderingContext2D.prototype.roundRect
) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | DOMPointInit | (number | DOMPointInit)[]
  ) {
    const rRaw = Array.isArray(radii) ? radii[0] : radii;
    const rNum = typeof rRaw === 'number' ? rRaw : 0;
    const r = Math.max(0, Math.min(rNum, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
  };
}

async function registerPwaServiceWorkerSafely() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  if (import.meta.env.DEV && !import.meta.hot) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    } catch {
      // Ignore cleanup errors in restricted preview iframes
    }
    return;
  }

  const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
  try {
    const res = await fetch(swUrl, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'manual',
      credentials: 'same-origin',
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (
      res.type === 'opaqueredirect' ||
      res.redirected ||
      res.status !== 200 ||
      !/javascript/i.test(contentType)
    ) {
      return;
    }

    const { registerSW } = await import('virtual:pwa-register');
    registerSW({
      immediate: true,
      onRegisterError: () => {
        // Ignore transient SW registration failures in restricted preview iframes
      },
    });
  } catch {
    // Skip SW registration when proxy/network blocks direct script fetch
  }
}

void registerPwaServiceWorkerSafely();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

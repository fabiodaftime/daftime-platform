// Écoute la CONFIRMATION de réservation cal.com (gratuit, sans redirection payante) et déclenche
// la conversion Meta « Schedule ». L'embed cal.com (iframe ?embed=true) envoie un message
// `bookingSuccessful` à la page parente ; on le capte de DEUX façons pour la fiabilité :
//   1) l'API officielle Cal("on", { action: "bookingSuccessful" }) via le script embed.js ;
//   2) un écouteur postMessage brut (filet de sécurité) sur les messages venant de cal.com.
// À appeler une fois au montage d'une page contenant un embed cal.com.
import { trackSchedule } from './tracking';

declare global {
  interface Window {
    Cal?: ((...args: unknown[]) => void) & { loaded?: boolean; ns?: Record<string, unknown>; q?: unknown[] };
  }
}

let initialized = false;
let lastFiredAt = 0; // dédoublonnage (évite de compter 2× la même conversion)

function onBookingSuccess(): void {
  const now = Date.now();
  if (now - lastFiredAt < 5000) return;
  lastFiredAt = now;
  trackSchedule({ source: 'cal.com' });
}

export function initCalTracking(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // 1) Chargement de l'embed cal.com (expose window.Cal) + écoute de l'événement de réservation.
  (function (C: Window, A: string, L: string) {
    const p = function (a: { q: unknown[] }, ar: unknown) { a.q.push(ar); };
    const d = C.document;
    C.Cal = C.Cal || function (...ar: unknown[]) {
      const cal = C.Cal as NonNullable<Window['Cal']>;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        const api = function (...a: unknown[]) { p(api as unknown as { q: unknown[] }, a); } as unknown as { q: unknown[] };
        api.q = api.q || [];
        p(cal as unknown as { q: unknown[] }, ar);
        return;
      }
      p(cal as unknown as { q: unknown[] }, ar);
    } as NonNullable<Window['Cal']>;
  })(window, 'https://app.cal.com/embed/embed.js', 'init');

  try {
    window.Cal?.('init', { origin: 'https://cal.com' });
    window.Cal?.('on', { action: 'bookingSuccessful', callback: () => onBookingSuccess() });
  } catch { /* noop */ }

  // 2) Filet de sécurité : message brut émis par l'iframe cal.com.
  try {
    window.addEventListener('message', (ev: MessageEvent) => {
      const origin = (ev.origin || '').toLowerCase();
      if (!origin.endsWith('cal.com')) return;
      const data = ev.data;
      const asText = typeof data === 'string'
        ? data
        : (data && typeof data === 'object' ? JSON.stringify(data) : '');
      if (asText.includes('bookingSuccessful')) onBookingSuccess();
    });
  } catch { /* noop */ }
}

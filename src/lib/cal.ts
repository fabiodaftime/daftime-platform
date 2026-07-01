// Intégration cal.com — écoute la CONFIRMATION de réservation (bookingSuccessful) émise par
// l'embed cal.com, et déclenche la conversion Meta/GA ("Schedule" / appointment_booked).
//
// Fonctionnement : l'embed cal.com (URL en ?embed=true) communique avec la page parente par
// postMessage. On charge le petit script officiel cal.com qui expose l'API globale `Cal(...)`,
// puis on enregistre un handler `Cal("on", { action: "bookingSuccessful" })`. Ce handler se
// déclenche pour toute réservation confirmée dans un iframe cal.com de la page.
//
// À appeler UNE fois au montage d'une page qui contient un embed cal.com (ex. la landing).

import { trackSchedule } from './tracking';

declare global {
  interface Window {
    Cal?: ((...args: unknown[]) => void) & { loaded?: boolean; ns?: Record<string, unknown>; q?: unknown[] };
  }
}

let initialized = false;
// Dédup : évite de compter deux fois la même conversion (double message / re-render).
let lastFiredAt = 0;

function onBookingSuccess(detail?: unknown): void {
  const now = Date.now();
  if (now - lastFiredAt < 4000) return; // fenêtre anti-doublon
  lastFiredAt = now;
  trackSchedule({ source: 'cal.com', ...(detail && typeof detail === 'object' ? { eventType: (detail as Record<string, unknown>).eventType } : {}) });
}

/** Charge l'embed cal.com (si absent) et enregistre l'écoute de la confirmation de RDV. Idempotent. */
export function initCalTracking(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Snippet de chargement officiel cal.com (expose window.Cal).
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
    // Événement clé : réservation confirmée.
    window.Cal?.('on', {
      action: 'bookingSuccessful',
      callback: (e: { detail?: { data?: unknown } }) => onBookingSuccess(e?.detail?.data),
    });
  } catch { /* noop */ }

  // Filet de sécurité : si l'API `on` ne remonte pas l'événement, on capte le postMessage brut
  // émis par l'iframe cal.com (origine cal.com) contenant l'action bookingSuccessful.
  try {
    window.addEventListener('message', (ev: MessageEvent) => {
      const origin = (ev.origin || '').toLowerCase();
      if (!origin.endsWith('cal.com')) return;
      const data = ev.data;
      const type = typeof data === 'string' ? data : (data && typeof data === 'object' ? String((data as Record<string, unknown>).type ?? '') : '');
      if (type.includes('bookingSuccessful')) onBookingSuccess(data);
    });
  } catch { /* noop */ }
}

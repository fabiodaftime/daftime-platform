// Écoute la CONFIRMATION de réservation cal.com (gratuit, sans redirection payante) et déclenche
// la conversion Meta « Schedule ». L'embed cal.com (iframe ?embed=true) envoie un message
// `bookingSuccessful` à la page parente ; on le capte de DEUX façons pour la fiabilité :
//   1) l'API officielle Cal("on", { action: "bookingSuccessful" }) via le script embed.js ;
//   2) un écouteur postMessage brut (filet de sécurité) sur les messages venant de cal.com.
// À appeler une fois au montage d'une page contenant un embed cal.com.
import { trackSchedule } from './tracking';
import { BOOKING_SCHEDULE_CALLINK } from './config';

declare global {
  interface Window {
    Cal?: ((...args: unknown[]) => void) & { loaded?: boolean; ns?: Record<string, unknown>; q?: unknown[] };
  }
}

let initialized = false;
// Verrou permanent : au plus UNE conversion "Schedule" par chargement de page.
// cal.com émet `bookingSuccessful` plusieurs fois (API + postMessage, puis ré-émission à l'écran
// de confirmation, parfois au-delà de quelques secondes) → une simple fenêtre temporelle laisse
// passer un doublon. Un visiteur ne réserve jamais 2 RDV distincts dans la même session, donc on
// ne compte qu'une fois, quel que soit le nombre de messages reçus.
let scheduleFired = false;

function onBookingSuccess(): void {
  if (scheduleFired) return;
  scheduleFired = true;
  trackSchedule({ source: 'cal.com' });
}

export function initCalTracking(callink: string = BOOKING_SCHEDULE_CALLINK): void {
  if (typeof window === 'undefined') return;
  // Déjà initialisé (ex. navigation SPA vers une autre landing) : on précharge juste l'event ciblé.
  if (initialized) { try { window.Cal?.('preload', { calLink: callink }); } catch { /* noop */ } return; }
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
    // Préchargement : réchauffe la page de résa en arrière-plan dès le montage → ouverture quasi
    // instantanée au clic (les assets cal.com sont déjà en cache), sans perdre le tracking.
    window.Cal?.('preload', { calLink: callink });
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

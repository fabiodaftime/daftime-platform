// Capte la CONFIRMATION de réservation cal.com (postMessage brut émis par l'iframe de booking) et
// déclenche la conversion Meta « Schedule » (gratuit, sans redirection payante).
//
// IMPORTANT — pourquoi on N'UTILISE PAS l'embed officiel cal.com (embed.js) :
//   L'embed installe un listener postMessage GLOBAL. Notre modale de RDV affiche une iframe cal.com
//   BRUTE (non créée via l'API Cal). L'embed reçoit alors les messages de cette iframe qu'il ne
//   « connaît » pas → il jette « Uncaught Error: Unhandled Action » en boucle à chaque interaction.
//   Or on n'a besoin de l'embed NI pour capter la réservation (le postMessage brut suffit) NI pour la
//   vitesse (on préchauffe nous-mêmes). On s'en passe donc → console propre.
import { trackSchedule } from './tracking';
import { BOOKING_SCHEDULE_URL } from './config';

let initialized = false;
let scheduleFired = false; // au plus UNE conversion Schedule par chargement de page (anti double-comptage)
let warmFrame: HTMLIFrameElement | null = null;

function onBookingSuccess(): void {
  if (scheduleFired) return;
  scheduleFired = true;
  trackSchedule({ source: 'cal.com' });
}

// Préchauffe les assets cal.com dans une iframe cachée 0×0 → ouverture quasi instantanée au clic,
// SANS charger embed.js. Re-ciblée sur l'event voulu (par advisor) si l'URL change.
function warm(url: string): void {
  if (typeof document === 'undefined' || !url) return;
  if (!warmFrame) {
    warmFrame = document.createElement('iframe');
    warmFrame.tabIndex = -1;
    warmFrame.setAttribute('aria-hidden', 'true');
    warmFrame.setAttribute('title', '');
    warmFrame.style.cssText = 'position:absolute;left:-9999px;top:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(warmFrame);
  }
  if (warmFrame.getAttribute('src') !== url) warmFrame.setAttribute('src', url);
}

// À appeler au montage d'une landing. `prefetchUrl` = URL embed de l'event ciblé (par advisor).
export function initCalTracking(prefetchUrl: string = BOOKING_SCHEDULE_URL): void {
  if (typeof window === 'undefined') return;
  try { warm(prefetchUrl); } catch { /* noop */ }
  if (initialized) return;
  initialized = true;

  // Filet unique : message brut émis par l'iframe cal.com à la confirmation de réservation.
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

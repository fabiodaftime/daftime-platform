// Conversion Meta « Schedule » = RDV réellement confirmé. Deux chemins possibles,
// un seul envoi :
//
//  1. Navigateur classique : l'iframe cal.com émet un postMessage
//     `bookingSuccessful` → CalEmbed appelle fireSchedule().
//  2. Webview Instagram / Facebook (l'essentiel du trafic Meta mobile) : la
//     réservation se fait souvent en PLEIN ONGLET sur cal.com (repli), donc
//     aucun postMessage ne revient. cal.com redirige alors vers notre page
//     /merci (« Redirect on booking » + « Forward parameters ») → la page
//     /merci appelle fireSchedule(). C'est ce chemin qui manque à l'ancienne LP.
//
// Si cal.com redirige À L'INTÉRIEUR de l'iframe, la page /merci ne tire rien :
// elle prévient la page parente (postMessage même origine), qui dédoublonne.
//
// Dédoublonnage : uid de réservation cal.com (localStorage) + un marqueur
// « réservation récente » pour le cas où le premier chemin n'a pas d'uid.
// Meta reçoit aussi l'uid en eventID, ce qui dédoublonne de son côté.
import { trackSchedule } from '@/lib/tracking';
import { FORWARDED_PARAMS } from './config';

export const PAGE_KEY = 'consultation-ecommerce';
/** Message posté par /merci (dans l'iframe) vers la page parente. */
export const THANKS_MESSAGE = 'dft:consultation-booked';

const RECENT_KEY = 'dft_consult_schedule_at';
const RECENT_MS = 30 * 60 * 1000;
let firedThisPage = false;

const store = {
  get: (k: string) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* noop */ } },
};

/** utm_* et fbclid de l'URL courante (pour le tracking et l'URL cal.com). */
export function currentForwardParams(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const sp = new URLSearchParams(window.location.search);
    for (const k of FORWARDED_PARAMS) {
      const v = sp.get(k);
      if (v) out[k] = v.slice(0, 200);
    }
  } catch { /* noop */ }
  return out;
}

/** Ajoute les utm_* / fbclid de la page à une URL cal.com. */
export function withForwardParams(url: string): string {
  const params = currentForwardParams();
  if (!Object.keys(params).length) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

/** uid de réservation dans un message cal.com (formats bookingSuccessful / V2). */
export function bookingUidFrom(data: unknown): string | undefined {
  const d = (data && typeof data === 'object' ? (data as Record<string, any>).data : undefined) ?? {};
  const uid = d.uid ?? d.booking?.uid ?? d.bookingUid;
  return typeof uid === 'string' && uid ? uid : undefined;
}

/** Envoie « Schedule » une seule fois par réservation. Renvoie true si envoyé. */
export function fireSchedule(source: 'cal.com' | 'merci', uid?: string): boolean {
  if (firedThisPage) return false;
  if (uid && store.get(`dft_schedule_${uid}`)) return false;
  // Le premier chemin n'a pas toujours l'uid : toute conversion envoyée depuis ce
  // navigateur il y a moins de 30 min couvre la même réservation.
  const at = Number(store.get(RECENT_KEY) || 0);
  if (at && Date.now() - at < RECENT_MS) return false;
  firedThisPage = true;
  if (uid) store.set(`dft_schedule_${uid}`, '1');
  store.set(RECENT_KEY, String(Date.now()));
  trackSchedule({ source, page: PAGE_KEY, ...currentForwardParams() }, uid);
  return true;
}

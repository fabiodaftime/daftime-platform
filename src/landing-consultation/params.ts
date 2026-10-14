// Paramètres de campagne transmis à cal.com (iframe ET repli plein onglet) :
// cal.com enregistre les utm_* sur la réservation, on retrouve la campagne dans
// le détail du RDV (et le scénario Make peut s'en servir).
//
// SUIVI META : cette page n'envoie que PageView (snippet du <head>). La
// conversion « Schedule » est envoyée CÔTÉ SERVEUR par un scénario Make (API
// Conversions Meta), filtré sur l'event cal.com consultation-ecommerce-20min.
// Ne pas ajouter de Schedule navigateur ici : il doublonnerait celui de Make.
import { FORWARDED_PARAMS } from './config';

export function withForwardParams(url: string): string {
  try {
    const sp = new URLSearchParams(window.location.search);
    const u = new URL(url);
    for (const k of FORWARDED_PARAMS) {
      const v = sp.get(k);
      if (v) u.searchParams.set(k, v.slice(0, 200));
    }
    return u.toString();
  } catch {
    return url;
  }
}

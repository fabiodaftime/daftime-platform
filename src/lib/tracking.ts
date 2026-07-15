// Tracking de conversion pour les landing pages publicitaires.
// Pousse les événements vers Meta Pixel (fbq), Google Ads / GA4 (gtag) et GTM (dataLayer)
// s'ils sont présents — sinon no-op silencieux. Aucun ID ici : les snippets se posent dans index.html.
//
// ⚙️  POUR ACTIVER LE TRACKING (à faire avant de lancer les ads) :
//   1. Le snippet Meta Pixel est déjà posé dans index.html (<head>) → fbq('init', <ID>) + PageView.
//      (Ajouter le snippet Google Ads/gtag de la même manière si besoin.)
//   2. DEUX niveaux d'événements côté Meta :
//        • "Lead"     → se déclenche au CLIC sur un CTA (intention de RDV). Bon proxy d'optimisation.
//        • "Schedule" → se déclenche quand le RDV est RÉELLEMENT confirmé dans cal.com
//                       (via l'événement bookingSuccessful de l'embed cal.com — voir src/lib/cal.ts).
//      → Configure "Schedule" comme conversion principale (le vrai RDV pris), "Lead" en secondaire.
//   3. Côté Google Ads : action de conversion sur l'événement "book_appointment" (clic) et/ou
//      "appointment_booked" (RDV confirmé).
//   NB : cal.com (relié à Google Calendar) EXPOSE la confirmation via postMessage → on capte le vrai
//        RDV pris. Un iframe Google Calendar « nu » ne le permettrait pas (on serait limité à l'intention).

type Params = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Événement générique → relayé vers GTM / Meta / GA4 si dispo. */
export function track(event: string, params: Params = {}): void {
  try { (window.dataLayer ||= []).push({ event, ...params }); } catch { /* noop */ }
  try { window.gtag?.('event', event, params); } catch { /* noop */ }
  try { window.fbq?.('trackCustom', event, params); } catch { /* noop */ }
  if (import.meta.env.DEV) console.debug('[track]', event, params);
}

/** Lead capturé (formulaire « dashboard gratuit » soumis avec succès) → conversion Meta "Lead". */
export function trackLead(source: string): void {
  try { window.fbq?.('track', 'Lead', { source }); } catch { /* noop */ }
  track('lead', { source });
}

/** RDV réellement confirmé dans cal.com → conversion (Meta "Schedule" + event générique). */
export function trackSchedule(params: Params = {}): void {
  try { window.fbq?.('track', 'Schedule', params); } catch { /* noop */ }
  track('appointment_booked', params);
}

/** Intérêt marqué (ex. scroll 50 % de la landing) → Meta "ViewContent". Une seule fois par session. */
let viewContentFired = false;
export function trackViewContent(params: Params = {}): void {
  if (viewContentFired) return;
  viewContentFired = true;
  try { window.fbq?.('track', 'ViewContent', params); } catch { /* noop */ }
  track('view_content', params);
}

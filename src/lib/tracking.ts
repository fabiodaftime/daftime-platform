// Tracking de conversion pour les landing pages publicitaires.
// Pousse les événements vers Meta Pixel (fbq), Google Ads / GA4 (gtag) et GTM (dataLayer)
// s'ils sont présents — sinon no-op silencieux. Aucun ID ici : les snippets se posent dans index.html.
//
// ⚙️  POUR ACTIVER LE TRACKING (à faire avant de lancer les ads) :
//   1. Coller le snippet Meta Pixel et/ou Google Ads (gtag) dans index.html (<head>).
//   2. Côté Meta : l'événement "Lead" se déclenche au clic CTA ; configure-le comme conversion.
//   3. Côté Google Ads : crée une action de conversion et déclenche-la sur l'événement "book_appointment".
//   NB : la prise de RDV se fait dans un iframe Google Calendar → on ne peut pas détecter la
//        confirmation finale. On optimise donc sur l'INTENTION (ouverture du planning), qui est
//        un très bon proxy. Pour une conversion "RDV confirmé" exacte, ajoute une page de
//        confirmation (redirect après réservation) et déclenche l'event dessus.

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

/** Clic sur un CTA de prise de RDV → intention de lead (Meta "Lead" + event générique). */
export function trackLead(source: string): void {
  try { window.fbq?.('track', 'Lead', { source }); } catch { /* noop */ }
  track('book_appointment', { source });
}

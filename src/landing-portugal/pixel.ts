// Chargement du Meta Pixel pour la landing Portugal — CONDITIONNÉ AU CONSENTEMENT.
//
// Différence avec le reste de la plateforme : dans index.html, le pixel est posé
// en dur et part au chargement. Ici non. Le trafic de cette page est 100 %
// européen (ads Meta ciblant des Français au Portugal), donc aucun traceur ne
// peut être déposé avant un consentement explicite.
//
// Ce module ne fait QUE poser le pixel. Les événements passent par le module
// partagé src/lib/tracking.ts (trackLead / trackSchedule), qui est un no-op
// silencieux tant que `window.fbq` n'existe pas — c'est-à-dire tant que le
// visiteur n'a pas accepté.

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

type PixelWindow = Window & { fbq?: Fbq; _fbq?: Fbq };

let injected = false;

/** Injecte fbevents.js, initialise le pixel et envoie le PageView. Idempotent. */
export function loadPixel(pixelId: string): void {
  if (injected || !pixelId || typeof window === 'undefined') return;
  injected = true;

  const win = window as unknown as PixelWindow;

  // Snippet officiel Meta, transcrit en TypeScript.
  if (!win.fbq) {
    const n: Fbq = function (this: unknown, ...args: unknown[]) {
      if (n.callMethod) n.callMethod.apply(this, args);
      else (n.queue ||= []).push(args);
    } as Fbq;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    win.fbq = n;
    win._fbq = n;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  win.fbq?.('init', pixelId);
  win.fbq?.('track', 'PageView');
}

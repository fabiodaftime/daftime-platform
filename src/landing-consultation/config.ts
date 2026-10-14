// ═══════════════════════════════════════════════════════════════════════════
//  CONSULTATION E-COMMERCE (20 min offertes) — landing publicitaire Meta Ads
//  ⚙️  TOUT CE QU'IL Y A À RENSEIGNER AVANT LA MISE EN LIGNE EST DANS CE FICHIER.
//      Les textes sont dans ./content.ts ; les composants ne contiennent aucune valeur.
// ═══════════════════════════════════════════════════════════════════════════

/** Adresse publique de la page (canonical et Open Graph — voir consultation-ecommerce/index.html). */
export const SITE_URL = 'https://www.daftime-advisory-platform.com';
export const PAGE_PATH = '/consultation-ecommerce';
/** Page de confirmation : cible du « Redirect on booking » de l'event cal.com. */
export const THANKS_PATH = `${PAGE_PATH}/merci`;

// ───────────────────────────────────────────────────────────────── Cal.com ──
// [LIEN CAL.COM] — slug de l'event type à créer côté cal.com (20 min).
// Si le slug choisi est différent, ne changer QUE la ligne CAL_EVENT.
const CAL_USER = 'fabio-vieira-daftime-advisory';
const CAL_EVENT = 'consultation-ecommerce-20min';

export const CAL = {
  /** URL de l'iframe (thème clair, sans en-tête cal.com). */
  url: `https://cal.com/${CAL_USER}/${CAL_EVENT}?embed=true&theme=light`,
  /** Repli plein onglet (webviews Instagram / Facebook). */
  fullUrl: `https://cal.com/${CAL_USER}/${CAL_EVENT}`,
} as const;

/**
 * Paramètres d'URL transmis à cal.com, puis renvoyés par cal.com sur la page
 * /merci (option « Forward parameters »). cal.com enregistre aussi les utm_*
 * sur la réservation : on retrouve la campagne dans le détail du RDV.
 */
export const FORWARDED_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid',
] as const;

// ────────────────────────────────────────────────────────────── Meta Pixel ──
// Le snippet (PageView) est posé en dur dans consultation-ecommerce/index.html,
// même ID que les autres LP. « Schedule » part depuis CalEmbed (postMessage
// cal.com) OU depuis la page /merci (redirection cal.com) — dédoublonné.

// ─────────────────────────────────────────────────────────── Qui est derrière ──
export const ADVISOR = {
  name: 'Fabio Vieira',
  /** [PHOTO] — remplacer le fichier public/consultation/fabio.webp (carré, 320 px suffit). */
  photo: '/consultation/fabio.webp',
  /**
   * [TEXTE BIO] — 2 à 3 phrases, à la 1re personne ou non, sans chiffre invérifiable.
   * Tant que c'est vide, la page n'affiche pas de bio (rien d'inventé en ligne) ;
   * en local, un repère « [TEXTE BIO] » rappelle qu'il manque.
   */
  bio: '',
} as const;

export const FLAGS = {
  /** Barre CTA collante en bas d'écran mobile (masquée quand le calendrier est à l'écran). */
  stickyMobileCta: true,
} as const;

/** Éditeur de la page — mêmes mentions que /mentions-legales de l'application. */
export const LEGAL = {
  name: 'Daftime Advisory - FZCO',
  address: 'Jumeirah Terrace Building, Office 411, Dubaï, Émirats arabes unis',
  email: 'fabio@daftime.ae',
} as const;

export const LINKS = {
  mainSite: 'https://www.daftime.ae',
  legal: '/mentions-legales',
  privacy: '/confidentialite',
} as const;

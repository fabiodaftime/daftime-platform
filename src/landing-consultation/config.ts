// ═══════════════════════════════════════════════════════════════════════════
//  CONSULTATION E-COMMERCE (20 min offertes) — landing publicitaire Meta Ads
//  ⚙️  TOUT CE QU'IL Y A À RENSEIGNER AVANT LA MISE EN LIGNE EST DANS CE FICHIER.
//      Les textes sont dans ./content.ts ; les composants ne contiennent aucune valeur.
// ═══════════════════════════════════════════════════════════════════════════

/** Adresse publique de la page (canonical et Open Graph — voir consultation-ecommerce/index.html). */
export const SITE_URL = 'https://www.daftime-advisory-platform.com';
export const PAGE_PATH = '/consultation-ecommerce';
/** Page de confirmation (sans suivi de conversion — la redirection cal.com n'est pas activée). */
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

/** Paramètres d'URL de la page transmis à cal.com (voir ./params.ts). */
export const FORWARDED_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid',
] as const;

// ────────────────────────────────────────────────────────────── Meta Pixel ──
// Navigateur : PageView UNIQUEMENT (snippet dans consultation-ecommerce/index.html).
// « Schedule » : côté serveur, scénario Make → API Conversions Meta, filtré sur
// l'event cal.com ci-dessus. Aucun autre événement Meta n'est envoyé par la page.

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
  bio:
    'J’accompagne des e-commerçants (Shopify, marketplaces, marques) sur leur structure, leur compta '
    + 'et le pilotage de leur marge. Mon parti pris : on part de ce que tu gagnes vraiment, pas de ton CA. '
    + 'Et je te dis les choses simplement : ce qui va, ce qui coince, et par quoi commencer.',
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

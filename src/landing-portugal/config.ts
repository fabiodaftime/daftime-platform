// ═══════════════════════════════════════════════════════════════════════════
//  DAFTIME PORTUGAL — landing publicitaire (Meta Ads)
//  ⚙️  TOUT CE QU'IL Y A À RENSEIGNER AVANT LA MISE EN LIGNE EST DANS CE FICHIER.
//      Rien à chercher ailleurs : les composants ne contiennent aucune valeur.
// ═══════════════════════════════════════════════════════════════════════════

/** Adresse publique de la page (canonical et Open Graph — voir portugal/index.html). */
export const SITE_URL = 'https://www.daftime-advisory-platform.com';
export const PAGE_PATH = '/portugal';

// ───────────────────────────────────────────────────────────────── Cal.com ──
const CAL_USER = 'fabio-vieira-daftime-advisory';
/** Slug de l'event type — « Intro Call - Daftime Portugal (20min) ». */
const CAL_EVENT = 'intro-call-daftime-portugal-20min';

// Même forme que BOOKINGS dans src/lib/config.ts : une URL embed thémée pour
// l'iframe, une URL plein onglet en repli (webviews Instagram/Facebook).
export const CAL = {
  url: `https://cal.com/${CAL_USER}/${CAL_EVENT}?embed=true&theme=light`,
  fullUrl: `https://cal.com/${CAL_USER}/${CAL_EVENT}`,
  // Pas de question personnalisée dans le formulaire : on garde les champs
  // par défaut de Cal (nom, e-mail) pour ne pas ajouter de friction.
} as const;

// ────────────────────────────────────────────────────────────── Meta Pixel ──
/**
 * ID du pixel Meta — le même que celui de l'application (index.html).
 * Différence importante : ici le pixel N'EST PAS posé dans le HTML. Il est
 * injecté par JS uniquement après acceptation du bandeau de consentement.
 * Mettre '' désactive tout le tracking de cette page (utile en recette).
 */
export const META_PIXEL_ID = '2166358790810988';

// ───────────────────────────────────────────────────────────────── Tarifs ──
/**
 * Un seul prix d'appel, pas de grille : aucun seuil de volume n'est publié.
 * `from` est repris automatiquement par le hero de la pub « prix » (?a=3),
 * par la section Tarifs et par la FAQ — un seul endroit à modifier.
 */
export const PRICING = {
  from: 150,
  currency: '€',
  period: '/ mois',
  footnote:
    'Montant hors IVA. Le forfait exact dépend du volume d’activité de ta société ; ' +
    'il t’est annoncé dans la proposition, à l’issue de l’appel.',
  /** Ce qui est compris dans le forfait, quel qu'il soit. */
  included: [
    'Comptabilité courante et tenue des livres (SNC)',
    'Déclarations d’IVA périodiques',
    'Déclarations annuelles comprises : Modelo 22 (IRC) et IES',
    'Contabilista certificada portugaise inscrite à l’OCC',
    'Échanges en français, en portugais ou en anglais',
  ],
} as const;

// ────────────────────────────────────────────────────────── Interrupteurs ──
export const FLAGS = {
  /**
   * Barre CTA collante en bas d'écran mobile, à partir de 60 % de hauteur
   * de viewport scrollée. Même libellé et même action que les boutons en
   * ligne — ce n'est pas un second CTA, c'est le même rendu atteignable.
   * Convention des deux LP e-commerce du repo. Passer à `false` pour la retirer.
   */
  stickyMobileCta: true,
} as const;

// ─────────────────────────────────────────────────────────────── Mentions ──
/** L'associée du cabinet — c'est elle qui signe les déclarations. */
export const ACCOUNTANT = {
  name: 'Patrícia Ferreira',
  /** Rôle dans le cabinet — c'est ce qui est mis en avant côté commercial. */
  role: 'Associée et manager comptable',
  /**
   * Qualité professionnelle. Toujours affichée à côté du rôle, jamais à sa
   * place : c'est le titre légal qui autorise la signature des déclarations
   * au Portugal, et la cédula est vérifiable auprès de l'OCC. C'est la
   * crédibilité la plus forte de la page — et ce qui rend vraie la phrase
   * « c'est elle qui signe tes déclarations ».
   */
  title: 'Contabilista Certificada',
  licence: 'Cédula profissional n.º 100171',
} as const;

/**
 * Éditeur de la page et responsable du traitement des données.
 *
 * ⚠️ TRANSITION EN COURS — aujourd'hui Patrícia Ferreira en nom propre ;
 *    Daftime Portugal, Lda est en cours de formation. Le jour de son
 *    immatriculation, il suffit de remplacer `name` et `qualifier`
 *    ci-dessous : le pied de page ET la politique de confidentialité
 *    (public/portugal/confidentialite.html, section 1) doivent être alignés.
 */
export const LEGAL = {
  name: ACCOUNTANT.name,
  // Mentions légales : le rôle dans le cabinet ne remplace pas la qualité
  // professionnelle, c'est elle qui identifie la personne responsable.
  qualifier: `${ACCOUNTANT.role} · ${ACCOUNTANT.title} — ${ACCOUNTANT.licence}`,
  address: 'R. Braamcamp 52, 1250-051 Lisboa',
  country: 'Portugal',
  email: 'fabio@daftime.ae',
} as const;

/** Hébergeur — mention obligatoire, identique à /mentions-legales. */
export const HOST = 'Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis';

export const LINKS = {
  /** Bouton « Découvrir Daftime » du footer. */
  mainSite: 'https://www.daftime.ae',
  /**
   * Politique de confidentialité propre à cette page. Distincte de
   * /confidentialite (application) : le responsable du traitement n'est pas le
   * même — Patrícia Ferreira ici, Daftime Advisory FZCO là.
   * Fichier : public/portugal/confidentialite.html
   */
  privacy: '/portugal/confidentialite',
} as const;

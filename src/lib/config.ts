// Configuration partagée (front).

// Lien de prise de rendez-vous (Cal.com, relié au Google Calendar), mode embed thémé.
export const BOOKING_SCHEDULE_URL =
  'https://cal.com/fabio-vieira-daftime-advisory/rendez-vous-decouverte-daftime-advisory-30min?embed=true&theme=light';

// Conseiller affiché dans l'espace client (à personnaliser).
export const ADVISOR = {
  name: 'Votre équipe Daftime',
  role: 'Daftime Advisory',
};

// Documents à fournir, par type d'activité (slug d'activity_types). À affiner avec toi.
export const DOC_TEMPLATES: Record<string, string[]> = {
  ecommerce: ['Relevé bancaire du mois', 'Export des ventes (Shopify, Stripe…)', 'Factures fournisseurs', 'Justificatifs de frais'],
  coach: ['Relevé bancaire du mois', 'Factures émises', 'Justificatifs de dépenses'],
  restaurant: ['Relevé bancaire du mois', 'Z de caisse', 'Factures fournisseurs', 'Bulletins de paie'],
  holding: ['Relevés bancaires', 'Tableaux de remontées des filiales', 'Conventions / contrats'],
  services: ['Relevé bancaire du mois', 'Factures émises', 'Justificatifs de dépenses'],
};
export const DEFAULT_DOCS = ['Relevé bancaire du mois', 'Factures émises', 'Justificatifs de dépenses'];

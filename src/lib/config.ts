// Configuration partagée (front).

// Lien de prise de rendez-vous (Cal.com, relié au Google Calendar), mode embed thémé.
// - SCHEDULE : RDV découverte (prospects, landing page).
// - ADVISOR : RDV avec le conseiller (clients existants, espace client).
export const BOOKING_SCHEDULE_URL =
  'https://cal.com/fabio-vieira-daftime-advisory/rendez-vous-decouverte-daftime-advisory-30min?embed=true&theme=light';
export const BOOKING_ADVISOR_URL =
  'https://cal.com/fabio-vieira-daftime-advisory/rendez-vous-clientele-daftime-advisory?embed=true&theme=light';

// Conseiller affiché dans l'espace client (à personnaliser).
export const ADVISOR = {
  name: 'Votre équipe Daftime',
  role: 'Daftime Advisory',
};

// Liste par défaut (repli) si l'activité du client n'a pas de documents définis dans sa config.
// Les listes par activité vivent désormais dans activity_types.config.documents (éditables).
export const DEFAULT_DOCS = ['Relevé bancaire du mois', 'Factures émises', 'Justificatifs de dépenses'];

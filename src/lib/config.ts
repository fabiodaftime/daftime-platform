// Configuration partagée (front).

// Lien de prise de rendez-vous (Cal.com, relié au Google Calendar), mode embed thémé.
// - SCHEDULE : RDV découverte (prospects, landing page).
// - ADVISOR : RDV avec le conseiller (clients existants, espace client).
// Prises de RDV par « advisor » (canal d'acquisition) : chaque source route vers SON event cal.com,
// ce qui permet d'attribuer/rémunérer les bookings (ex. commission de Fred → event suffixé « -f »).
export type Booking = { url: string; fullUrl: string; callink: string };
const CAL_USER = 'fabio-vieira-daftime-advisory';
const mkBooking = (event: string): Booking => ({
  url: `https://cal.com/${CAL_USER}/${event}?embed=true&theme=light`, // iframe embed thémé
  fullUrl: `https://cal.com/${CAL_USER}/${event}`,                    // repli plein onglet (navigateurs in-app)
  callink: `${CAL_USER}/${event}`,                                    // pour Cal("preload")
});
export const BOOKINGS: Record<string, Booking> = {
  default: mkBooking('rendez-vous-decouverte-daftime-advisory-30min'),
  fred: mkBooking('rendez-vous-decouverte-daftime-advisory-30min-f'), // ads gérées par Fred (commission)
};
// Résout la config de RDV selon l'advisor (retombe sur « default » si inconnu/absent).
export const resolveBooking = (advisor?: string | null): Booking => BOOKINGS[(advisor ?? '').toLowerCase()] ?? BOOKINGS.default;

// Rétro-compat : exports historiques = event par défaut.
export const BOOKING_SCHEDULE_URL = BOOKINGS.default.url;
export const BOOKING_SCHEDULE_FULL_URL = BOOKINGS.default.fullUrl;
export const BOOKING_SCHEDULE_CALLINK = BOOKINGS.default.callink;
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

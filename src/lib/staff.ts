// Helpers de la plateforme staff (localisations + routage des dashboards legacy).

export const LOCATIONS = [
  { key: 'dubai', label: 'Dubaï', flag: '🇦🇪' },
  { key: 'france', label: 'France', flag: '🇫🇷' },
  { key: 'portugal', label: 'Portugal', flag: '🇵🇹' },
] as const;

export type LocationKey = (typeof LOCATIONS)[number]['key'];

export const locationLabel = (key?: string | null) =>
  LOCATIONS.find((l) => l.key === key)?.label ?? 'Dubaï';

// Mapping layout_type (legacy) → préfixe de route du dashboard sur-mesure.
const LEGACY_ROUTES: Record<string, string> = {
  bocuse: '/dashboard-bocuse',
  labarile: '/dashboard-labarile',
  richissime: '/dashboard-richissime',
  cwp_pl_2025: '/dashboard-cwp-pl-2025',
  nowmade: '/dashboard-nowmade',
  prime_circle: '/dashboard-prime-circle',
  prime_circle_agency: '/dashboard-prime-circle-agency',
  digit: '/dashboard-digit',
  prime_circle_group: '/dashboard-pc-group',
  nexus_test: '/dashboard-nexus',
  hotel_x: '/dashboard-hotel-x',
  skalis: '/dashboard-skalis',
  ampfora: '/dashboard-ampfora',
};

export function legacyDashboardRoute(layoutType: string | null | undefined, companyId: string): string {
  return `${LEGACY_ROUTES[layoutType ?? ''] ?? '/dashboard'}/${companyId}`;
}

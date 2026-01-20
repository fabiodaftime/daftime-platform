// Richissime Dashboard Data

export const DATA = {
  historical: {
    months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep'],
    revenue: [42.3, 48.7, 56.2, 61.4, 72.8, 78.5, 65.2, 58.9, 84.6],
    forecast: [40, 45, 52, 58, 65, 72, 60, 55, 75]
  },
  q4: {
    months: ['Oct', 'Nov', 'Déc'],
    revenue: [97.3, 112.8, 89.4],
    forecast: [90, 105, 95],
    margins: [40, 45.9, 25.1],
    marginsForecast: [40, 45, 45]
  }
};

export const COSTS = {
  oct: { actual: [14595, 17514, 4865, 3892, 9730, 2919], forecast: [12162, 14595, 4865, 3892, 8757, 1946] },
  nov: { actual: [16920, 19176, 5640, 4512, 10152, 3384], forecast: [14100, 16920, 5640, 4512, 9450, 2256] },
  dec: { actual: [17880, 26820, 5364, 3576, 8940, 4470], forecast: [11175, 13410, 4470, 3576, 8046, 1788] }
};

export interface RichissimeScenario {
  forecast2026: number[];
  total2026: number;
  margins: { gross: number; operating: number };
  growth: string;
}

export const SCENARIOS: Record<string, RichissimeScenario> = {
  prudent: {
    forecast2026: [85, 92, 105, 115, 125, 135, 120, 110, 140, 155, 170, 145],
    total2026: 1497,
    margins: { gross: 62, operating: 28 },
    growth: '+50%'
  },
  base: {
    forecast2026: [95, 108, 125, 140, 155, 168, 150, 138, 175, 195, 215, 185],
    total2026: 1849,
    margins: { gross: 65, operating: 32 },
    growth: '+85%'
  },
  optimiste: {
    forecast2026: [110, 128, 150, 172, 195, 215, 190, 175, 225, 255, 285, 245],
    total2026: 2345,
    margins: { gross: 68, operating: 38 },
    growth: '+135%'
  }
};

export const Q4_TABLE_DATA = [
  { month: 'Oct 2025', caReal: '97.3 k€', caPrev: '90.0 k€', ecart: '+8.1%', ecartPositive: true, ebitda: '38.9 k€', margin: '40.0%', status: 'Excellent', statusType: 'success' as const },
  { month: 'Nov 2025', caReal: '112.8 k€', caPrev: '105.0 k€', ecart: '+7.4%', ecartPositive: true, ebitda: '51.8 k€', margin: '45.9%', marginHighlight: true, status: 'Record', statusType: 'success' as const },
  { month: 'Déc 2025', caReal: '89.4 k€', caPrev: '95.0 k€', ecart: '-5.9%', ecartPositive: false, ebitda: '22.4 k€', margin: '25.1%', marginWarning: true, status: 'Sous-perf.', statusType: 'warning' as const },
];

export const PRODUCTS_TABLE_DATA = [
  { name: 'Liberty Cashflow', ca: '134.8 k€', mix: '45%', marge: '72%', margeSuccess: true, clients: '187', ticket: '720 €', trend: '+12%', trendType: 'success' as const },
  { name: 'Masterclasses', ca: '65.9 k€', mix: '22%', marge: '85%', margeSuccess: true, clients: '412', ticket: '160 €', trend: '+28%', trendType: 'success' as const },
  { name: 'Coaching 1-to-1', ca: '53.9 k€', mix: '18%', marge: '45%', margeSuccess: false, clients: '36', ticket: '1,497 €', trend: 'Stable', trendType: 'warning' as const },
  { name: 'Podcast Sponsoring', ca: '24.0 k€', mix: '8%', marge: '92%', margeSuccess: true, clients: '4', ticket: '6,000 €', trend: '-15%', trendType: 'danger' as const },
  { name: 'Affiliation', ca: '20.9 k€', mix: '7%', marge: '95%', margeSuccess: true, clients: '-', ticket: '-', trend: '+8%', trendType: 'success' as const },
];

export const KPI_TABLE_DATA = [
  { kpi: 'Marge EBITDA', q4: '37.8%', objectif: '40.0%', ecart: '-2.2 pts', ecartPositive: false, benchmark: '30-35%', status: 'Au-dessus', statusType: 'success' as const },
  { kpi: 'Ratio LTV/CAC', q4: '4.8x', objectif: '4.0x', ecart: '+0.8x', ecartPositive: true, benchmark: '3.0x', status: 'Excellent', statusType: 'success' as const },
  { kpi: 'Taux Conversion', q4: '4.2%', objectif: '4.0%', ecart: '+0.2 pts', ecartPositive: true, benchmark: '2-3%', status: 'Excellent', statusType: 'success' as const },
  { kpi: 'Churn Mensuel', q4: '2.8%', objectif: '3.0%', ecart: '-0.2 pts', ecartPositive: true, benchmark: '5%', status: 'Excellent', statusType: 'success' as const },
  { kpi: 'NPS', q4: '72', objectif: '65', ecart: '+7 pts', ecartPositive: true, benchmark: '50+', status: 'Excellent', statusType: 'success' as const },
  { kpi: 'Coût Marketing/CA', q4: '21.2%', objectif: '15.0%', ecart: '+6.2 pts', ecartPositive: false, benchmark: '15-20%', status: 'À surveiller', statusType: 'warning' as const },
];

export const ALERTS = [
  { type: 'critical', title: '🔴 Marketing Décembre: ROI Insuffisant', description: 'Budget 26.8 k€ (30% CA) avec ROI de 1.2x seulement. Impact: -13.4 k€ vs budget.' },
  { type: 'critical', title: '🔴 Baisse Conversions Décembre: -35%', description: 'Taux passé de 4.8% à 3.1%. Audience saturée post-Black Friday.' },
  { type: 'warning', title: '⚠️ Coûts Formateurs en Hausse', description: '16.5% du CA (vs 12.5% prévu). Bonus et experts invités. À budgéter pour 2026.' },
  { type: 'warning', title: '⚠️ Dépendance Liberty Cashflow', description: '45% du CA sur un seul produit. Objectif 2026: réduire à 50% max.' },
  { type: 'success', title: '✅ NPS Excellent: 72', description: '94% des clients recommanderaient Richissime. Atout majeur pour 2026.' },
];

export const ACTIONS = [
  { priority: 'critical', title: '📉 Revoir Stratégie Marketing', description: 'Action: Réduire budget -50% pendant fêtes/août. Impact: Économie ~15 k€/an.' },
  { priority: 'haute', title: '💎 Lancer le Podcast Premium', description: 'Action: Offre à 5€/mois. Objectif: 500 abonnés = 30 k€/an. Deadline: Mars 2026' },
  { priority: 'haute', title: '👥 Programme de Parrainage', description: 'Action: 50€ réduction parrain/filleul. Impact: -30% CAC.' },
  { priority: 'moyenne', title: '📊 Automatisation Reporting', description: 'Action: Dashboard connecté Stripe. Deadline: Mars 2026' },
];

export const OBJECTIVES = [
  { icon: '📈', title: 'Croissance CA: +85%', description: 'Atteindre 1.85M € via expansion Liberty Cashflow et nouvelles masterclasses.' },
  { icon: '💰', title: 'Marge EBITDA: 32%', description: 'Réduire marketing à 16% et automatiser le delivery des masterclasses.' },
  { icon: '👥', title: 'Base Clients: 3,500 actifs', description: 'Doubler la base tout en maintenant NPS >70 et churn <3%.' },
];

export const VARIANCE_DATA = {
  october: {
    title: '🟢 Octobre',
    badge: '+8.1%',
    badgeType: 'success' as const,
    rows: [
      { label: 'CA', actual: '97.3 k€', forecast: '90.0 k€', delta: '+7.3 k€', positive: true },
      { label: 'Marketing', actual: '17.5 k€', forecast: '14.6 k€', delta: '+2.9 k€', positive: false },
      { label: 'EBITDA', actual: '38.9 k€', forecast: '36.0 k€', delta: '+2.9 k€', positive: true },
    ]
  },
  november: {
    title: '🟢 Novembre',
    badge: '+7.4%',
    badgeType: 'success' as const,
    rows: [
      { label: 'CA', actual: '112.8 k€', forecast: '105.0 k€', delta: '+7.8 k€', positive: true },
      { label: 'Marketing', actual: '19.2 k€', forecast: '16.9 k€', delta: '+2.3 k€', positive: false },
      { label: 'EBITDA', actual: '51.8 k€', forecast: '47.3 k€', delta: '+4.5 k€', positive: true },
    ]
  },
  december: {
    title: '🟠 Décembre',
    badge: '-5.9%',
    badgeType: 'warning' as const,
    rows: [
      { label: 'CA', actual: '89.4 k€', forecast: '95.0 k€', delta: '-5.6 k€', positive: false },
      { label: 'Marketing', actual: '26.8 k€', forecast: '13.4 k€', delta: '+13.4 k€', positive: false },
      { label: 'EBITDA', actual: '22.4 k€', forecast: '42.8 k€', delta: '-20.4 k€', positive: false },
    ]
  }
};

export const INSIGHTS: Array<{ type: 'success' | 'warning' | 'info'; icon: string; title: string; description: string }> = [
  { type: 'success', icon: '📈', title: 'Surperformance Oct-Nov', description: 'Masterclass "Investir en 2025" a généré +15.1 k€ non prévus.' },
  { type: 'warning', icon: '⚠️', title: 'Marketing Décembre', description: 'Budget doublé (30% vs 15%) avec ROI de 1.2x seulement.' },
  { type: 'info', icon: '🎯', title: 'Précision Prévisions', description: 'Écart moyen +4.2% sur le CA. Prévisions conservatrices.' },
];

export const NAV_ITEMS = [
  { id: 'overview', label: "Vue d'Ensemble", icon: '📊' },
  { id: 'forecast', label: 'Prévu vs Réel', icon: '🎯' },
  { id: 'evolution', label: 'Évolution CA', icon: '📈' },
  { id: 'products', label: 'CA par Produits', icon: '💎' },
  { id: 'costs', label: 'Charges & Coûts', icon: '💰' },
  { id: 'margins', label: 'Marges & KPIs', icon: '💹' },
  { id: 'objectives', label: 'Objectifs 2026', icon: '🏆' },
  { id: 'alerts', label: 'Alertes & Actions', icon: '⚠️' },
];

export const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Vue d'Ensemble Financière", subtitle: "Q4 2025 • Mise à jour: 20 Janvier 2026" },
  forecast: { title: "Prévu vs Réel", subtitle: "Analyse des écarts de performance" },
  evolution: { title: "Évolution CA", subtitle: "Projections 2026 par scénario" },
  products: { title: "CA par Produits", subtitle: "Répartition et performance produits" },
  costs: { title: "Charges & Coûts", subtitle: "Structure des coûts Q4 2025" },
  margins: { title: "Marges & KPIs", subtitle: "Performance et indicateurs clés" },
  objectives: { title: "Objectifs 2026", subtitle: "Plan stratégique et roadmap" },
  alerts: { title: "Alertes & Actions", subtitle: "Points d'attention prioritaires" },
};

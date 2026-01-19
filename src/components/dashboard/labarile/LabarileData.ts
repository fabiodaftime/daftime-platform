// DATA CONFIGURATION - Labarile Dashboard

export const ACTUALS = {
  months: ['Oct 25', 'Nov 25', 'Dec 25'],
  revenue: [491.3, 438.4, 322.5],
  ebitda: [235.4, 295.9, -61.4],
  margin: [47.9, 67.5, -19.1]
};

export interface Scenario {
  name: string;
  forecast2026: number[];
  total2026: number;
  margins: { gross: number; operating: number };
  growth: string;
  servicesMix: { individual: number; collective: number; elearning: number };
  costs: { coaches: number; marketing: number; stripe: number; tools: number; admin: number };
}

export const SCENARIOS: Record<string, Scenario> = {
  prudent: {
    name: 'Prudent',
    forecast2026: [340, 355, 370, 380, 395, 405, 390, 400, 415, 430, 445, 460],
    total2026: 4785,
    margins: { gross: 45, operating: 30 },
    growth: '+283%',
    servicesMix: { individual: 42, collective: 33, elearning: 25 },
    costs: { coaches: 38, marketing: 10, stripe: 4.5, tools: 3, admin: 13.5 }
  },
  base: {
    name: 'Base',
    forecast2026: [370, 390, 415, 425, 445, 460, 440, 455, 475, 495, 515, 535],
    total2026: 5420,
    margins: { gross: 50, operating: 35.5 },
    growth: '+333%',
    servicesMix: { individual: 40, collective: 35, elearning: 25 },
    costs: { coaches: 35, marketing: 12, stripe: 4.5, tools: 3, admin: 10 }
  },
  optimiste: {
    name: 'Optimiste',
    forecast2026: [410, 445, 480, 500, 530, 560, 540, 560, 590, 620, 650, 680],
    total2026: 6565,
    margins: { gross: 55, operating: 42 },
    growth: '+425%',
    servicesMix: { individual: 38, collective: 37, elearning: 25 },
    costs: { coaches: 30, marketing: 13, stripe: 4.5, tools: 2.5, admin: 8 }
  }
};

export const MONTHS_2026 = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export const Q4_DATA = [
  { month: 'Oct 2025', ca: 491.3, ebitda: 235.4, margin: 47.9, status: 'Bon' },
  { month: 'Nov 2025', ca: 438.4, ebitda: 295.9, margin: 67.5, status: 'Excellent' },
  { month: 'Dec 2025', ca: 322.5, ebitda: -61.4, margin: -19.1, status: 'Ajusté' },
];

export const ALERTS = [
  {
    type: 'warning',
    title: 'Transactions Non Comptabilisées: 216.4 kAED',
    description: 'Revenus manquants: 64.0 kAED | Charges manquantes: 152.4 kAED (principalement coaches EUR). Impact EBITDA: -88.4 kAED. ACTION: Réconcilier immédiatement toutes les transactions EUR/AED avec Zoho.'
  },
  {
    type: 'critical',
    title: 'Décembre 2025: Perte Opérationnelle',
    description: 'EBITDA négatif de -61.4 kAED (marge -19.1%). Coûts coaches explosent à 60.9% du CA vs target 35%. ACTION: Analyser la structure de rémunération et optimiser le modèle.'
  },
  {
    type: 'warning',
    title: 'Paiement TVA Anormal: 150 kAED',
    description: 'Paiement TVA de 150 kAED en décembre (vs ~48 kAED estimé pour Q4). Suggère régularisation périodes antérieures. ACTION: Clarifier avec comptable l\'origine de ce paiement.'
  }
];

export const ACTIONS = [
  {
    priority: 'critical',
    icon: '🎯',
    title: 'Réconciliation Comptable Urgente',
    description: 'Intégrer les 216.4 kAED de transactions non comptabilisées dans Zoho. Mettre en place réconciliation hebdomadaire EUR/AED pour éviter récurrence.'
  },
  {
    priority: 'haute',
    icon: '💰',
    title: 'Optimiser Coûts Coaches',
    description: 'Réduire de 60.9% à 35% via: (1) Revoir modèle rémunération, (2) Augmenter coaching collectif (meilleure marge), (3) Automatiser delivery e-learning.'
  },
  {
    priority: 'haute',
    icon: '📊',
    title: 'Réduire Marketing à 12% CA',
    description: 'Actuellement 16% vs target 12%. Analyser ROI par canal, éliminer canaux peu performants, optimiser CAC. Économie potentielle: ~50 kAED/trimestre.'
  },
  {
    priority: 'moyenne',
    icon: '💵',
    title: 'Structurer Cash Management',
    description: 'Cash disponible après provisions: seulement 4.9 kAED. Provisionner systématiquement 25% du CA pour taxes. Viser runway 6 mois minimum = ~470 kAED.'
  }
];

export const OBJECTIVES = [
  {
    title: 'Croissance CA: +333% vs 2025',
    description: 'Atteindre 5.4M AED en 2026 avec une croissance soutenue sur les 4 trimestres'
  },
  {
    title: 'Optimisation Marge: 35.5%',
    description: 'Maintenir rentabilité via: réduction coaches à 35%, marketing à 12%, automatisation delivery'
  },
  {
    title: 'Scaling Coaching Collectif: 35%',
    description: 'Meilleure scalabilité, marges supérieures, moins dépendant des coaches individuels'
  }
];

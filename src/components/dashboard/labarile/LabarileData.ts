// DATA CONFIGURATION - Labarile Dashboard V2

export const ACTUALS = {
  months: ['Oct 25', 'Nov 25', 'Dec 25'],
  revenue: [491.3, 438.4, 375.5]
};

// Actuals Jan-Apr 2026 (source: P&L Zoho LLE Educational Services FZCO, AED — révision Anissa post-call 18/05/2026)
export const ACTUALS_2026 = {
  months: ['Jan 26', 'Fév 26', 'Mar 26', 'Avr 26'],
  revenue: [703.3, 877.9, 1025.0, 1038.4],
};

// Bande cible de marge EBITDA après retraitement des écritures (doublons + TVA d'Anissa)
// Référence validée lors du call du 18/05/2026 avec Luc, Simon et Fabio.
export const MARGIN_TARGET_BAND = { min: 40, max: 45 };


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
    forecast2026: [510, 510, 570, 638, 688, 740, 765, 765, 765, 850, 850, 849],
    total2026: 8500,
    margins: { gross: 50, operating: 35.5 },
    growth: '+63%',
    servicesMix: { individual: 42, collective: 33, elearning: 25 },
    costs: { coaches: 10, marketing: 12, stripe: 4.5, tools: 3, admin: 10 }
  },
  base: {
    name: 'Base',
    forecast2026: [600, 600, 670, 750, 810, 870, 900, 900, 900, 1000, 1000, 1000],
    total2026: 10000,
    margins: { gross: 50, operating: 35.5 },
    growth: '+92%',
    servicesMix: { individual: 40, collective: 35, elearning: 25 },
    costs: { coaches: 10, marketing: 12, stripe: 4.5, tools: 3, admin: 10 }
  },
  optimiste: {
    name: 'Optimiste',
    forecast2026: [690, 690, 770, 862, 931, 1000, 1035, 1035, 1035, 1150, 1150, 1152],
    total2026: 11500,
    margins: { gross: 50, operating: 35.5 },
    growth: '+120%',
    servicesMix: { individual: 38, collective: 37, elearning: 25 },
    costs: { coaches: 10, marketing: 12, stripe: 4.5, tools: 3, admin: 10 }
  }
};

export const MONTHS_2026 = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export const Q4_DATA = [
  { month: 'Oct 2025', ca: 491.3, ebitda: 255.9, margin: 52.1, status: 'Excellent' },
  { month: 'Nov 2025', ca: 438.4, ebitda: 265.5, margin: 60.6, status: 'Excellent' },
  { month: 'Dec 2025', ca: 375.5, ebitda: 181.4, margin: 48.3, status: 'Bon' },
];

// Breakdown Ventes Data
export const BREAKDOWN_KPI = {
  totalVentes: 132,
  panierMoyen: '8,121 AED',
  panierMoyenEur: '1,889 EUR',
  topCloser: 'Yazid',
  topCloserShare: '63.3%',
  programPrincipal: 'Coaching 2k',
  programShare: '88.9%',
  totalContracted: '249k EUR'
};

export const CLOSERS_DATA = [
  { name: 'Yazid', ventes: 71, ca: '678,325', share: 63.3, panierMoyen: '9,554' },
  { name: 'David', ventes: 35, ca: '294,937', share: 27.5, panierMoyen: '8,427' },
  { name: 'Manon', ventes: 8, ca: '58,824', share: 5.5, panierMoyen: '7,353' },
  { name: 'Simon', ventes: 15, ca: '21,874', share: 2.0, panierMoyen: '1,458' },
  { name: 'Luc', ventes: 2, ca: '17,200', share: 1.6, panierMoyen: '8,600' },
];

export const PROGRAMS_MIX = [
  { name: 'Coaching 2k', value: 88.9, color: '#7CC9CC' },
  { name: 'Avancé 5-7k', value: 8.8, color: '#4EB79F' },
  { name: 'Premium 3k', value: 1.2, color: '#9DD8DA' },
  { name: 'E-Learning', value: 0.9, color: '#C9EDEF' },
  { name: 'Acomptes', value: 0.1, color: '#E4F5F7' },
];

export const BASKET_EVOLUTION = [
  { month: 'Octobre', value: 9049 },
  { month: 'Novembre', value: 7815 },
  { month: 'Décembre', value: 7493 },
];

// Costs Monthly Detailed Data
export const COSTS_Q4_SUMMARY = {
  totalCharges: '604 kAED',
  totalChargesPct: '46.3%',
  coachesQ4: '134 kAED',
  coachesPct: '10.3%',
  marketingQ4: '141 kAED',
  marketingPct: '10.8%',
  stripeQ4: '73 kAED',
  stripePct: '5.6%',
};

export interface MonthlyCostData {
  month: string;
  revenue: number;
  actual: { coaches: number; marketing: number; it: number; stripe: number; admin: number; autres: number };
  commentType: 'warning' | 'success' | 'critical';
  commentTitle: string;
  comments: string[];
}

export const MONTHLY_COSTS: MonthlyCostData[] = [
  {
    month: 'OCTOBRE 2025',
    revenue: 491300,
    actual: { coaches: 0, marketing: 30000, it: 3100, stripe: 18000, admin: 184800, autres: 0 },
    commentType: 'warning',
    commentTitle: '💬 Commentaires Octobre:',
    comments: [
      '📍 Contexte: DÉBUT D\'ACTIVITÉ UAE suite transfert activité depuis Suisse → Données biaisées par setup initial',
      '⚠️ Admin (36.4% vs 10% prévu): CHARGES SETUP - OSS Local Trader 148k (agent UAE) + Legal fees 23k (setup/compliance) = 171k ponctuels non récurrents liés au transfert',
      '✅ IT & Stripe: Conformes aux prévisions',
      '📌 Conclusion: Mois de transition Suisse→UAE, biaisé par charges setup. Hors exceptionnels: ~16% charges (excellent). Ne pas utiliser comme référence 2026.',
    ]
  },
  {
    month: 'NOVEMBRE 2025',
    revenue: 438400,
    actual: { coaches: 72500, marketing: 68400, it: 8900, stripe: 21000, admin: 2100, autres: 0 },
    commentType: 'success',
    commentTitle: '💬 Commentaires Novembre:',
    comments: [
      '⚠️ Coaches (16.5% vs 10% prévu): 72.5k — au-dessus du prévu, à suivre sur les prochains mois.',
      '⚠️ Marketing (15.6% vs 12% prévu): 68.4k incluant closing tools (NoCRM, Iclosed). Légèrement au-dessus prévu.',
      '✅ IT & Tools (2.0% vs 3% prévu): 8.9k — dont iClosed 12k/an lissé à 1k/mois. Sous le prévu, bonne optimisation.',
      '✅ Admin (0.5% vs 10% prévu): Seulement Accounting & Audit 2.1k — excellente optimisation',
      '✅ Stripe (4.8%): Conforme',
      '📌 Conclusion: Meilleur mois du Q4 en termes de marge. Charges totales 39.4% — marge EBITDA 60.6%.',
    ]
  },
  {
    month: 'DÉCEMBRE 2025',
    revenue: 375477,
    actual: { coaches: 61800, marketing: 42700, it: 7122, stripe: 27600, admin: 45000, autres: 9900 },
    commentType: 'critical',
    commentTitle: '💬 Commentaires Décembre:',
    comments: [
      '📈 CA ajusté (375.5k): 322.5k Zoho + 52.9k revenus non comptabilisés (BONHIVERS 37.5k + DAYTIME 15.5k). ⚠️ Luc Labarile 14.7k EXCLU = apport compte courant associé (pas du CA).',
      '✅ Coaches (16.5%): 61.8k - structure normale après ajustements',
      '✅ Marketing (11.4%): 42.7k - conforme aux attentes',
      '✅ IT (2.8% vs 3% prévu): Conforme - 9.5k Zoho + 1k non comptabilisés',
      '⚠️ Stripe (7.3% vs 4.5% prévu): 27.6k - élevé mais cohérent avec ajustements revenus et volumes transactions',
      '✅ Admin (12% vs 10% prévu): 45k salaires démarrent (permanent). Léger dépassement normal pour démarrage.',
      '💡 Autres charges (2.6%): 9.9k payment fees non comptabilisés (PayPal 9.2k, Ziina, Swift)',
      '📌 Conclusion: Structure de coûts normalisée. Marge EBITDA saine à 53.7% Q4.',
    ]
  },
];

// Actuals mensuels Jan-Avr 2026 (source: P&L Zoho LLE FZCO, AED)
// Mapping comptes → catégories:
//  Coaches = Coach + Coach-Consultant + Closer Sales commission + Consultant Expense
//  Marketing = Advertising + Media Buying + Video Editing + Podcast + Event venue
//  IT = IT & Internet + Online tools & Software + Telephone
//  Stripe = Stripe fees + Paypal Fees + Bank Fees
//  Admin = Accounting & Audit + Salaries + Office Supplies + Travel + Meals + Automobile
//  Autres = Bad Debt
export const MONTHLY_COSTS_2026: MonthlyCostData[] = [
  {
    month: 'JANVIER 2026',
    revenue: 703339,
    actual: { coaches: 82348, marketing: 178383, it: 16923, stripe: 35448, admin: 43618, autres: 0 },
    commentType: 'success',
    commentTitle: '💬 Commentaires Janvier:',
    comments: [
      '✅ Marge EBITDA ~49% — au-dessus de la bande cible 40-45%.',
    ],
  },
  {
    month: 'FÉVRIER 2026',
    revenue: 877940,
    actual: { coaches: 224652, marketing: 212407, it: 17517, stripe: 49370, admin: 47031, autres: 0 },
    commentType: 'warning',
    commentTitle: '💬 Commentaires Février:',
    comments: [
      '⚠️ Hausse charges expliquée : événement Paris + immersion villa + paiements intervenants.',
      '⚠️ Cycle annuel des outils IT facturé sur février (impact ponctuel).',
      '⚠️ Paiement 15k AED à Yazid initialement différé, comptabilisé en février.',
      '📌 Marge EBITDA ~37% — sous la bande cible 40-45% (mois exceptionnel).',
    ],
  },
  {
    month: 'MARS 2026',
    revenue: 1024972,
    actual: { coaches: 179880, marketing: 263372, it: 14238, stripe: 62063, admin: 118769, autres: 139433 },
    commentType: 'critical',
    commentTitle: '💬 Commentaires Mars:',
    comments: [
      '🔄 CA régularisé par Anissa : les 10 premiers jours (avant sync Stripe↔Zoho du 11/03) sont désormais intégrés (~+358k AED vs version précédente).',
      '⚠️ Bad Debt 139.4k AED comptabilisé ce mois — créance irrécouvrable, à investiguer.',
      "➕ Provision Yazid (closer) +15k AED : Yazid a demandé de ne pas être payé mars+avril (création de sa structure), payé 30k en mai. Charge réattribuée au mois d'origine (cf. call 18/05/2026).",
      '⚠️ Marge EBITDA ~24% — pénalisée par le Bad Debt, la masse salariale et la provision closer différée.',
    ],
  },
  {
    month: 'AVRIL 2026',
    revenue: 1038364,
    actual: { coaches: 150926, marketing: 232280, it: 7858, stripe: 46861, admin: 64167, autres: 0 },
    commentType: 'success',
    commentTitle: '💬 Commentaires Avril:',
    comments: [
      '✅ Meilleur mois 2026 : CA 1 038 k AED, marge EBITDA ~52% après réintégration provision closer.',
      "➕ Provision Yazid (closer) +15k AED : différé payé en mai, réattribué au mois d'origine (cf. call 18/05/2026).",
    ],
  },
];

// Synthèse YTD 2026 (Jan-Avr) calculée depuis MONTHLY_COSTS_2026
// Rev = 703 339 + 877 940 + 1 024 972 + 1 038 364 = 3 644 615 AED
// EBITDA = 346 619 + 326 963 + 247 217 + 536 272 = 1 457 071 AED (après provisions Yazid Mars+Avril)
export const YTD_2026 = {
  months: 4,
  caTotal: 703339 + 877940 + 1024972 + 1038364,
  netProfit: 346619 + 326963 + 247217 + 536272,
};



export const COSTS_Q4_DETAIL = [
  { category: 'Coaches', amount: '134.3k', pct: '10.3%' },
  { category: 'Marketing', amount: '141.1k', pct: '10.8%' },
  { category: 'IT & Tools', amount: '21.5k', pct: '1.6%', note: 'iClosed lissé 1k/mois inclus' },
  { category: 'Stripe/Fees', amount: '72.7k', pct: '5.6%' },
  { category: 'Admin', amount: '220.1k', pct: '16.9%', note: 'dont 171k charges setup Oct' },
  { category: 'Autres', amount: '14.1k', pct: '1.1%' },
];

export const COSTS_Q4_INSIGHTS = [
  { type: 'warning' as const, text: '⚠️ Octobre = Setup UAE — Charges exceptionnelles 171k (OSS + Legal) liées transfert Suisse→UAE' },
  { type: 'success' as const, text: '✅ Structure de coûts saine — Marge EBITDA Q4: 53.7%. IT lissé (iClosed 1k/mois). Novembre meilleur mois : 60.6%' },
  { type: 'info' as const, text: '💡 Performance solide — CA 1.3M + marge >53% = base excellente pour scaling 2026' },
];

// Treasury Data
export const TREASURY_KPI = {
  tresorerieBanque: '501 kAED',
  stripeEnAttente: '42 kAED',
  tresorerieDisponible: '393 kAED',
  totalDettes: '187 kAED',
};

export const TREASURY_DETAIL = [
  { section: 'ACTIFS', items: [
    { poste: 'Compte Courant AED (Wio)', montant: 342210, notes: 'IBAN ...9154' },
    { poste: 'Compte Courant EUR (Wio)', montant: 8349, notes: '1,942 EUR × 4.3' },
    { poste: 'Compte Savings "Taxes" (Wio)', montant: 150000, notes: 'Créé 02/12/2025' },
    { poste: 'Trésorerie Totale', montant: 500559, notes: 'Relevé 31/12/2025', bold: true },
  ]},
  { section: 'PROVISION', items: [
    { poste: '- Provision TVA EU', montant: -150000, notes: 'Bloquée - Ne pas toucher', warning: true },
    { poste: 'Tréso Disponible RÉELLE', montant: 350559, notes: '🔴 Trésorerie utilisable', bold: true, danger: true },
  ]},
  { section: 'CRÉANCES', items: [
    { poste: 'Stripe - En attente payout', montant: 42000, notes: 'Disponible sous 2-3 jours' },
  ]},
  { section: 'PASSIFS', items: [
    { poste: 'Dettes Fournisseurs', montant: 33609, notes: 'Factures en attente' },
    { poste: 'TVA UAE à payer', montant: 3717, notes: 'Output VAT' },
    { poste: 'Provision TVA EU', montant: 150000, notes: 'À payer Q1' },
    { poste: 'Total Dettes CT', montant: 187326, notes: '', bold: true },
  ]},
];

export const TREASURY_RATIOS = [
  { label: 'Ratio de Liquidité', value: '10.4x', sub: 'Cash / Dettes fournisseurs', color: 'warning' as const },
  { label: 'Burn Rate Mensuel', value: '230k AED', sub: 'Moyenne Q4 2025', color: 'danger' as const },
  { label: 'Net Cash Position', value: '314k AED', sub: 'Tréso totale - Dettes', color: 'success' as const },
];

export const TVA_EU_Q4 = {
  total: 148266,
  provision: 150000,
  ecart: 1734,
  months: [
    { month: 'Octobre', caTtc: '333,796', caHt: '278,075', tva: '55,722' },
    { month: 'Novembre', caTtc: '341,328', caHt: '285,873', tva: '55,455' },
    { month: 'Décembre', caTtc: '239,740', caHt: '202,650', tva: '37,090' },
  ],
};

// Taxes Data
export const TAXES_KPI = {
  totalTaxesQ4: '174 kAED',
  tvaEuQ4: '148 kAED',
  provisionMensuelle2026: '122 kAED/mois',
  besoinTotalQ1: '352k AED/mois',
};

export const TAXES_Q4_DETAIL = [
  { type: 'Corporate Tax UAE', montant: '22,095 AED', pct: '12.7%', details: '9% sur profit Q4 après abattement' },
  { type: 'TVA UAE (Output)', montant: '3,717 AED', pct: '2.1%', details: '5% sur ventes domestiques UAE' },
  { type: 'TVA EU', montant: '148,266 AED', pct: '85.2%', details: '128 ventes France (20%) + 1 Belgique (21%)' },
];

export const CT_BY_SCENARIO = [
  { scenario: 'Prudent', ebitda: '4,973k', profit: '4,598k', ct: '414k', mensuel: '35k/mois' },
  { scenario: 'Base', ebitda: '5,850k', profit: '5,475k', ct: '493k', mensuel: '41k/mois', highlight: true },
  { scenario: 'Optimiste', ebitda: '6,728k', profit: '6,353k', ct: '572k', mensuel: '48k/mois' },
];

// Evolution Quarter Comparison
export const QUARTER_COMPARISON_BASE = [
  { period: 'Q1 2026', caPrev: '1,870 kAED', q4Ref: '1,305 kAED', ecart: '+565k (+43%)' },
  { period: 'Q2 2026', caPrev: '2,430 kAED', q4Ref: '1,305 kAED', ecart: '+1,125k (+86%)' },
  { period: 'Q3 2026', caPrev: '2,700 kAED', q4Ref: '1,305 kAED', ecart: '+1,395k (+107%)' },
  { period: 'Q4 2026', caPrev: '3,000 kAED', q4Ref: '1,305 kAED', ecart: '+1,695k (+130%)' },
];

// Objectives updated
export const OBJECTIVES_COMPARISON = [
  { metrique: 'CA Annuel', q4x4: '5,221 kAED', objectif2026: '10,000 kAED', ecart: '+4,779k (+92%)' },
  { metrique: 'EBITDA', q4x4: '2,805 kAED (53.7%)', objectif2026: '5,000 kAED (50%)', ecart: '+2,271k' },
  { metrique: 'CA Mensuel Moyen', q4x4: '435 kAED', objectif2026: '833 kAED', ecart: '+398k/mois' },
  { metrique: 'Marge EBITDA', q4x4: '53.7%', objectif2026: '50%', ecart: 'Maintien' },
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
    title: 'Croissance CA: +92% vs Q4×4',
    description: 'Atteindre 10M AED en 2026 avec une croissance progressive sur les 4 trimestres. Passer de 435k/mois à 833k/mois en moyenne.'
  },
  {
    title: 'Maintenir Marge EBITDA: 50%',
    description: 'Conserver la structure de coûts excellente (53.7% en Q4 2025) tout en scalant le CA. Objectif conservateur à 50%.'
  }
];

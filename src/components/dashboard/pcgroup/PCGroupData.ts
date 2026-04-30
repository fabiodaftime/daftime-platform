// Prime Circle Group - Consolidated Dashboard Data - Multi-Month

export type MonthId = 'jan-2026' | 'feb-2026' | 'mar-2026';

export const AVAILABLE_MONTHS = [
  { id: 'jan-2026' as MonthId, label: 'Janvier 2026' },
  { id: 'feb-2026' as MonthId, label: 'Février 2026' },
  { id: 'mar-2026' as MonthId, label: 'Mars 2026' },
];

export type PCGroupEntityKey = 'agency' | 'structuring' | 'digit';

export type PCGroupEntityRoutes = Record<PCGroupEntityKey, string | null>;

export const EMPTY_ENTITY_ROUTES: PCGroupEntityRoutes = {
  agency: null,
  structuring: null,
  digit: null,
};

// ============ COMPARISON ROW TYPES (normalized) ============
// All period fields are optional. Renderers must fall back to '—' when missing.
export type PCGVarType = 'positive' | 'negative' | 'neutral';

export interface PCGComparisonRow {
  indicator: string;
  jan?: string;
  feb?: string;
  mar?: string;
  ytd?: string;
  variation?: string;
  varType?: PCGVarType;
}

export interface PCGOverviewComparisonRow {
  entity: string;
  jan?: string;
  feb?: string;
  mar?: string;
  ytd?: string;
  variation?: string;
  varType?: PCGVarType;
}

// Helper used by tab components to safely read a period cell.
export const cell = (v?: string): string => (v && v.trim() !== '' ? v : '—');

// ============ INTERCOS DATA (shared YTD - cumulative situation) ============
const INTERCOS_DATA = {
  kpis: [
    { label: 'Remontées Attendues', value: '$152,845', detail: 'Jan + Fév (exigibles)', color: 'navy' as const },
    { label: 'Réellement Reçu', value: '$38,173', detail: 'Encaissé à date', color: 'danger' as const },
    { label: 'Solde Dû', value: '$114,672', detail: 'Écart à régulariser', color: 'warning' as const },
    { label: 'Mars (Exigible Avril)', value: '$95,565', detail: 'Non encore exigible', color: 'success' as const },
  ],
  alert: {
    title: 'Retard de remontée significatif',
    body: 'Sur les $152,845 exigibles (Jan+Fév), seulement $38,173 ont été remontés à la Holding, soit 25.0% du montant attendu.',
    rate: '25.0%',
    balance: '$114,672',
  },
  table: {
    rows: [
      { entity: 'Agency (PCA 50%)', jan: '$2,020', feb: '$11,013', exigible: '$13,033', mars: '$13,451', ytd: '$26,484' },
      { entity: 'Structuring', jan: '$37,234', feb: '$18,932', exigible: '$56,166', mars: '$26,645', ytd: '$82,812' },
      { entity: 'Digit Solution', jan: '$36,178', feb: '$38,924', exigible: '$75,102', mars: '$51,712', ytd: '$126,815' },
      { entity: 'SPY', jan: '$2,936', feb: '$3,203', exigible: '$6,139', mars: '$3,123', ytd: '$9,262' },
      { entity: 'Comment/Trust', jan: '$2,278', feb: '$126', exigible: '$2,404', mars: '$633', ytd: '$3,037' },
    ],
    total: { entity: 'TOTAL ATTENDU', jan: '$80,646', feb: '$72,199', exigible: '$152,845', mars: '$95,565', ytd: '$248,409' },
  },
  scenarios: {
    base: {
      title: 'Scénario Base',
      lines: [
        { label: 'Remontées exigibles (Jan+Fév)', value: '$152,845', type: 'neutral' as const },
        { label: 'Montants reçus à date', value: '-$38,173', type: 'negative' as const },
      ],
      total: { label: 'SOLDE DÛ À LA HOLDING', value: '$114,672' },
      rateLabel: 'Taux de recouvrement',
      rate: '25.0%',
    },
    apport: {
      title: 'Scénario avec Apport Max',
      lines: [
        { label: 'Remontées exigibles (Jan+Fév)', value: '$152,845', type: 'neutral' as const },
        { label: 'Montants reçus à date', value: '-$38,173', type: 'negative' as const },
        { label: '+ Apport Maxence', value: '-$54,458', type: 'positive' as const },
      ],
      total: { label: 'SOLDE DÛ RÉVISÉ', value: '$60,214' },
      rateLabel: 'Taux de recouvrement ajusté',
      rate: '60.6%',
    },
  },
  calendar: [
    { month: 'Janvier 2026', amount: '$80,646', status: '⚠️ Exigible Fév', tag: 'EN RETARD', level: 'danger' as const },
    { month: 'Février 2026', amount: '$72,199', status: '⚠️ Exigible Mars', tag: 'EN RETARD', level: 'danger' as const },
    { month: 'Mars 2026', amount: '$95,565', status: '🕐 Exigible Avril', tag: 'NON EXIGIBLE', level: 'warning' as const },
    { month: 'Total YTD', amount: '$248,409', status: 'Remontées attendues', tag: 'Q1 2026', level: 'navy' as const },
  ],
  recap: [
    { label: 'Total exigible (Jan + Fév)', s1: '$152,845', s2: '$152,845' },
    { label: 'Encaissements reçus', s1: '$38,173', s2: '$38,173' },
    { label: 'Apport Maxence', s1: '—', s2: '+$54,458', s2Color: 'success' as const },
    { label: 'Total fonds disponibles', s1: '$38,173', s2: '$92,631' },
    { label: 'Solde dû', s1: '$114,672', s2: '$60,214', s1Color: 'danger' as const, s2Color: 'warning' as const, bold: true, highlight: true },
    { label: 'Taux de recouvrement', s1: '25.0%', s2: '50.0%', s1Color: 'danger' as const, s2Color: 'success' as const },
  ],
  marsNote: '$95,565 → exigible en Avril',
};


const JAN_2026 = {
  monthLabel: 'Janvier 2026',
  footerLabel: 'Janvier 2026',

  // OVERVIEW
  overviewHero: [
    { label: "CA Groupe", value: "$198,900", detail: "5 entités consolidées", color: "navy", variance: null as string | null, varType: null as string | null },
    { label: "Marge Brute Groupe", value: "$89,607", detail: "45.0% du CA", color: "success", variance: null, varType: null },
    { label: "Résultat Net Holding", value: "$73,586", detail: "Après frais holding", color: "gold", variance: null, varType: null },
    { label: "Réserves Filiales", value: "$8,961", detail: "10% marge brute", color: "primary", variance: null, varType: null },
  ],
  overviewComparison: null as PCGOverviewComparisonRow[] | null,
  overviewComparisonTotal: null as PCGOverviewComparisonRow | null,
  entityCards: [
    { id: 'agency', name: 'Agency', badge: 'Media', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', cssClass: 'agency',
      metrics: [{ label: 'CA', value: '$10,726' }, { label: 'Marge Nette', value: '$2,245', colorClass: 'success' }], margin: 20.9, marginLevel: 'medium' as const },
    { id: 'structuring', name: 'Structuring', badge: 'Banking', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', cssClass: 'structuring',
      metrics: [{ label: 'CA', value: '$53,962' }, { label: 'Marge Nette', value: '$41,371', colorClass: 'success' }], margin: 76.7, marginLevel: 'high' as const },
    { id: 'digit', name: 'Digit Solution', badge: 'Ad Accounts', gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)', cssClass: 'digit',
      metrics: [{ label: 'CA', value: '$114,649' }, { label: 'Marge Nette', value: '$40,198', colorClass: 'success' }], margin: 35.1, marginLevel: 'medium' as const },
    { id: 'spy', name: 'SPY', badge: 'Tools', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', cssClass: 'spy',
      metrics: [{ label: 'CA', value: '$16,750' }, { label: 'Marge Nette', value: '$3,262', colorClass: 'success' }], margin: 19.5, marginLevel: 'low' as const },
    { id: 'comment', name: 'Comment', badge: 'Trust', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', cssClass: 'comment',
      metrics: [{ label: 'CA', value: '$2,813' }, { label: 'Marge Nette', value: '$2,531', colorClass: 'success' }], margin: 90.0, marginLevel: 'high' as const },
  ],
  consolidatedPL: [
    { label: 'Marge Nette Agency (après 50% Blink)', value: '$2,245', type: 'positive' },
    { label: 'Marge Nette Structuring', value: '$41,371', type: 'positive' },
    { label: 'Marge Nette Digit Solution', value: '$40,198', type: 'positive' },
    { label: 'Marge Nette SPY', value: '$3,262', type: 'positive' },
    { label: 'Marge Nette Comment/Trustpilot', value: '$2,531', type: 'positive' },
    { label: 'MARGE BRUTE GROUPE', value: '$89,607', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Réserves Filiales (10%)', value: '-$8,961', type: 'negative' },
    { label: 'REMONTÉE HOLDING (90%)', value: '$80,646', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Compta + CFO Groupe', value: '-$3,430', type: 'negative' },
    { label: 'Salaire Assistante', value: '-$1,630', type: 'negative' },
    { label: 'Salaires Fixes Sales', value: '-$2,000', type: 'negative' },
    { label: 'RÉSULTAT NET HOLDING', value: '$73,586', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Maxence (37.5%)', value: '-$27,595', type: 'negative' },
    { label: 'Thibault (37.5%)', value: '-$27,595', type: 'negative' },
    { label: '↳ dont Will', value: '$10,000', type: 'indent-muted' },
    { label: 'Florian (25%)', value: '-$18,396', type: 'negative' },
    { label: 'SALAIRES MANAGEMENT (100%)', value: '-$73,586', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'SOLDE HOLDING', value: '$0', type: 'highlight' },
  ],
  pieData: [
    { name: 'Agency ($2.2K)', value: 2245, color: '#F59E0B' },
    { name: 'Structuring ($41.4K)', value: 41371, color: '#1E3A5F' },
    { name: 'Digit Sol. ($40.2K)', value: 40198, color: '#4F5BD5' },
    { name: 'SPY ($3.3K)', value: 3262, color: '#10B981' },
    { name: 'Comment ($2.5K)', value: 2531, color: '#D946A8' },
  ],

  // AGENCY TAB
  agencyKPIs: [
    { label: 'CA Brut', value: '$10,726', detail: 'Abo + Setup', color: 'navy' },
    { label: 'Marge Nette', value: '$4,489', detail: '41.8% du CA', color: 'green' },
    { label: 'Part PCA (50%)', value: '$2,245', detail: 'Après split Blink', color: 'gold' },
    { label: 'Total Charges', value: '$6,237', detail: '58.2% du CA', color: 'pink' },
  ],
  agencyComparison: null as PCGComparisonRow[] | null,
  agencyWaterfall: [
    { label: 'CA Brut', value: '$10,726', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Coûts Setup (agents)', value: '-$1,300', type: 'negative' },
    { label: 'Salaires', value: '-$1,200', type: 'negative' },
    { label: 'Publicité', value: '-$1,038', type: 'negative' },
    { label: 'Com. Chris (10%)', value: '-$2,633', type: 'negative' },
    { label: 'Com. Master (5%)', value: '-$66', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$6,237', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE (100%)', value: '$4,489', type: 'highlight' },
    { label: 'Part Blink (50%)', value: '-$2,245', type: 'negative' },
    { label: 'PART PCA (50%)', value: '$2,245', type: 'total-positive' },
  ],
  agencyRisks: [
    { label: 'Concentration Hugo', value: '60.8%', detail: 'du media dépensé', severity: 'danger' },
    { label: 'CL Exposure', value: '$21.0K', detail: 'media avancé', severity: 'danger' },
    { label: 'Marge Nette', value: '41.8%', detail: 'vs 54.8% en Dec', severity: 'warning' },
  ],

  // STRUCTURING TAB
  structuringKPIs: [
    { label: 'CA', value: '$53,962', detail: 'Moy. $1,384/client', color: 'navy' },
    { label: 'Marge Nette', value: '$41,371', detail: '76.7% du CA', color: 'green' },
    { label: 'Clients', value: '39', detail: 'Handled by Nathan', color: 'gold' },
    { label: 'Total Charges', value: '$12,591', detail: '23.3% du CA', color: 'pink' },
  ],
  structuringComparison: null as PCGComparisonRow[] | null,
  structuringWaterfall: [
    { label: 'CA', value: '$53,962', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Publicité (ADS)', value: '-$2,690', type: 'negative' },
    { label: 'Com. Sales Nathan', value: '-$4,213', type: 'negative' },
    { label: 'Com. Referral', value: '-$350', type: 'negative' },
    { label: 'Events', value: '-$1,000', type: 'negative' },
    { label: 'Coûts Fournisseurs', value: '-$4,338', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$12,591', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$41,371', type: 'highlight' },
  ],
  structuringServices: [
    { name: 'LLC Services', value: 19400, pct: '36%', status: 'Top' },
    { name: 'Physical Address US', value: 17700, pct: '33%', status: 'Top' },
    { name: 'AMEX', value: 8000, pct: '15%', status: 'Croissance' },
    { name: 'Autres Banking', value: 4848, pct: '9%', status: 'Stable' },
    { name: 'Revolut Business', value: 4014, pct: '7%', status: 'Stable' },
  ],

  // DIGIT TAB
  digitKPIs: [
    { label: 'CA', value: '$114,649', detail: 'Setup + Ad Account', color: 'navy' },
    { label: 'Marge Nette', value: '$40,198', detail: '35.1% du CA', color: 'green' },
    { label: 'Deals', value: '267', detail: '233 Setup + 34 Ad Account', color: 'gold' },
    { label: 'Total Charges', value: '$74,451', detail: '64.9% du CA', color: 'pink' },
  ],
  digitComparison: null as PCGComparisonRow[] | null,
  digitWaterfall: [
    { label: 'CA', value: '$114,649', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Coûts Fournisseurs', value: '-$29,708', type: 'negative' },
    { label: 'Com. Blink', value: '-$12,922', type: 'negative' },
    { label: 'Com. Sales', value: '-$3,190', type: 'negative' },
    { label: 'Salaires', value: '-$25,366', type: 'negative' },
    { label: 'Autres (Tools, Fees, Remb...)', value: '-$3,265', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$74,451', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$40,198', type: 'highlight' },
  ],
  digitRevenueBreakdown: [
    { name: 'Set-up', value: 77409, deals: '233', ticket: '$332' },
    { name: 'Ad Account', value: 27305, deals: '34', ticket: '$803' },
    { name: 'BM', value: 5651, deals: '—', ticket: '—' },
    { name: 'Page', value: 2770, deals: '—', ticket: '—' },
    { name: 'Autres', value: 1514, deals: '—', ticket: '—' },
  ],

  // SPY TAB
  spyKPIs: [
    { label: 'CA', value: '$16,750', detail: "Outils d'analyse", color: 'navy' },
    { label: 'Marge Nette', value: '$3,262', detail: '19.5% du CA', color: 'green' },
    { label: 'Deals', value: '5', detail: 'Licences SPY', color: 'gold' },
    { label: 'Total Charges', value: '$13,488', detail: '80.5% du CA', color: 'pink' },
  ],
  spyWaterfall: [
    { label: 'CA', value: '$16,750', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Coûts Produit/Licences', value: '-$11,250', type: 'negative' },
    { label: 'Com. Blink', value: '-$1,812', type: 'negative' },
    { label: 'Com. Sales', value: '-$425', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$13,488', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$3,262', type: 'highlight' },
  ],

  // COMMENT TAB
  commentKPIs: [
    { label: 'CA', value: '$2,813', detail: '16 Comment + 4 Trustpilot', color: 'navy' },
    { label: 'Marge Nette', value: '$2,531', detail: '90.0% du CA', color: 'green' },
    { label: 'Deals', value: '20', detail: '16 Comment + 4 Trustpilot', color: 'gold' },
    { label: 'Com. Sales', value: '$281', detail: '10.0% du CA', color: 'pink' },
  ],
  commentWaterfall: [
    { label: 'CA', value: '$2,813', type: 'positive' },
    { label: 'Coûts Produit', value: '$0', type: 'muted' },
    { label: 'Com. Sales (10%)', value: '-$281', type: 'negative' },
    { label: 'MARGE NETTE', value: '$2,531', type: 'highlight' },
  ],
  commentWarning: '',

  // HOLDING TAB
  holdingKPIs: [
    { label: 'Remontée Holding (90%)', value: '$80,646', detail: 'Bénéfices filiales', color: 'navy' },
    { label: 'Résultat Net Holding', value: '$73,586', detail: '100% distribué', color: 'gold' },
    { label: 'Réserves Filiales (10%)', value: '$8,961', detail: 'Trésorerie entités', color: 'green' },
    { label: 'Frais Holding', value: '$7,060', detail: 'Compta + Assist. + Sales', color: 'pink' },
  ],
  holdingComparison: null as PCGComparisonRow[] | null,
  holdingManagementFees: [
    { label: 'Prime Circle Agency', value: '$2,245', type: 'positive' },
    { label: 'Prime Circle Structuring', value: '$41,371', type: 'positive' },
    { label: 'Digit Solution', value: '$40,198', type: 'positive' },
    { label: 'SPY', value: '$3,262', type: 'positive' },
    { label: 'Comment/Trustpilot', value: '$2,531', type: 'positive' },
    { label: 'MARGE BRUTE GROUPE', value: '$89,607', type: 'total-positive' },
  ],
  holdingSynthese: [
    { label: 'MARGE BRUTE GROUPE', value: '$89,607', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Réserves Filiales (10%)', value: '-$8,961', type: 'negative', indent: true },
    { label: 'REMONTÉE HOLDING (90%)', value: '$80,646', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Compta + CFO', value: '-$3,430', type: 'negative', indent: true },
    { label: 'Salaire Assistante', value: '-$1,630', type: 'negative', indent: true },
    { label: 'Salaires Fixes Sales', value: '-$2,000', type: 'negative', indent: true },
    { label: 'RÉSULTAT NET HOLDING', value: '$73,586', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Salaires management (100%)', value: '-$73,586', type: 'negative', indent: true },
    { label: '↳ dont Will (via Thibault)', value: '$10,000', type: 'indent-muted', indent: true },
    { label: '', value: '', type: 'spacer' },
    { label: 'SOLDE HOLDING', value: '$0', type: 'highlight' },
  ],
  holdingPieData: [
    { name: 'Maxence ($27.6K)', value: 27595, color: '#1E3A5F' },
    { name: 'Thibault ($27.6K)', value: 27595, color: '#2D4A6F' },
    { name: 'Florian ($18.4K)', value: 18396, color: '#4F5BD5' },
    { name: 'Réserves Fil. ($9.0K)', value: 8961, color: '#C9A227' },
  ],
  directors: [
    { name: 'Maxence', pct: '37.5%', amount: '$27,595', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: '' },
    { name: 'Thibault', pct: '37.5%', amount: '$27,595', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: 'dont $10K Will' },
    { name: 'Florian', pct: '25%', amount: '$18,396', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', subtitle: '' },
  ],
  holdingNetResult: '$73,586',

  // YTD TAB (January only)
  ytdHero: [
    { label: "CA YTD", value: "$198,900", detail: "Janvier 2026", color: "navy" },
    { label: "Marge Brute YTD", value: "$89,607", detail: "45.0% du CA", color: "success" },
    { label: "Résultat Net YTD", value: "$73,586", detail: "Holding cumulé", color: "gold" },
    { label: "Réserves Cumulées", value: "$8,961", detail: "Toutes filiales", color: "primary" },
  ],
  ytdMonthlyTable: [
    { month: 'Janvier 2026', ca: '$198,900', margin: '$89,607', taux: '45.0%', net: '$73,586' },
  ],
  ytdMonthlyTotal: { month: 'YTD TOTAL', ca: '$198,900', margin: '$89,607', taux: '45.0%', net: '$73,586' },
  ytdEntityTable: [
    { entity: 'Agency (Part PCA)', jan: '$2,245', feb: '', mar: '', ytd: '$2,245', pct: '2.5%' },
    { entity: 'Structuring', jan: '$41,371', feb: '', mar: '', ytd: '$41,371', pct: '46.2%' },
    { entity: 'Digit Solution', jan: '$40,198', feb: '', mar: '', ytd: '$40,198', pct: '44.9%' },
    { entity: 'SPY', jan: '$3,262', feb: '', mar: '', ytd: '$3,262', pct: '3.6%' },
    { entity: 'Comment/Trustpilot', jan: '$2,531', feb: '', mar: '', ytd: '$2,531', pct: '2.8%' },
  ],
  ytdEntityTotal: { entity: 'TOTAL GROUPE', jan: '$89,607', feb: '', mar: '', ytd: '$89,607', pct: '100%' },
  ytdTrendData: [{ month: 'Janvier', ca: 198900, margin: 89607, net: 73586 }],
  ytdPLHoldingFees: null as { label: string; jan: string; feb: string; mar?: string; ytd: string }[] | null,
  ytdPLHoldingFeesTotal: null as { label: string; jan: string; feb: string; mar?: string; ytd: string } | null,
  ytdPLNetResult: null as { label: string; jan: string; feb: string; mar?: string; ytd: string } | null,
  ytdPLDistribution: null as { label: string; jan: string; feb: string; mar?: string; ytd: string; style?: string }[] | null,

  // RESERVES TAB
  reservesHero: [
    { label: "Réserves Janvier", value: "$8,961", detail: "10% marge brute Jan", color: "navy" },
    { label: "Réserves YTD", value: "$8,961", detail: "Cumul 2026", color: "gold" },
  ],
  reservesEntityTable: [
    { entity: 'Agency (Part PCA)', jan: '$225', feb: '', mar: '', ytd: '$225' },
    { entity: 'Structuring', jan: '$4,137', feb: '', mar: '', ytd: '$4,137' },
    { entity: 'Digit Solution', jan: '$4,020', feb: '', mar: '', ytd: '$4,020' },
    { entity: 'SPY', jan: '$326', feb: '', mar: '', ytd: '$326' },
    { entity: 'Comment/Trustpilot', jan: '$253', feb: '', mar: '', ytd: '$253' },
  ],
  reservesEntityTotal: { entity: 'TOTAL RÉSERVES', jan: '$8,961', feb: '', mar: '', ytd: '$8,961' },
  reservesCards: [
    { name: 'Agency (Part PCA)', amount: '$225', pct: '2.5%' },
    { name: 'Structuring', amount: '$4,137', pct: '46.2%' },
    { name: 'Digit Solution', amount: '$4,020', pct: '44.9%' },
    { name: 'SPY', amount: '$326', pct: '3.6%' },
    { name: 'Comment/Trustpilot', amount: '$253', pct: '2.8%' },
  ],

  intercos: INTERCOS_DATA,
};

// ============ FEBRUARY 2026 ============
const FEB_2026 = {
  monthLabel: 'Février 2026',
  footerLabel: 'Février 2026',

  overviewHero: [
    { label: "CA Groupe", value: "$258,543", detail: "6 entités consolidées", color: "navy", variance: "+30.0% vs Jan" as string | null, varType: "positive" as string | null },
    { label: "Marge Brute Groupe", value: "$80,221", detail: "31.0% du CA", color: "success", variance: "-10.5% vs Jan", varType: "negative" },
    { label: "Résultat Net Holding", value: "$61,309", detail: "Après frais holding", color: "gold", variance: "-16.7% vs Jan", varType: "negative" },
    { label: "Réserves Filiales", value: "$8,022", detail: "10% marge brute", color: "primary", variance: "-10.5% vs Jan", varType: "negative" },
  ],
  overviewComparison: [
    { entity: 'Agency (Part PCA 50%)', jan: '$2,244', feb: '$12,237', variation: '+445.5%', varType: 'positive', ytd: '$14,481' },
    { entity: 'Structuring', jan: '$41,371', feb: '$21,036', variation: '-49.2%', varType: 'negative', ytd: '$62,407' },
    { entity: 'Digit Solution', jan: '$40,198', feb: '$43,249', variation: '+7.6%', varType: 'positive', ytd: '$83,447' },
    { entity: 'SPY', jan: '$3,262', feb: '$3,559', variation: '+9.1%', varType: 'positive', ytd: '$6,821' },
    { entity: 'Comment/Trustpilot', jan: '$2,531', feb: '$140', variation: '-94.5%', varType: 'negative', ytd: '$2,671' },
  ] as any[] | null,
  overviewComparisonTotal: { entity: 'MARGE BRUTE GROUPE', jan: '$89,607', feb: '$80,221', variation: '-10.5%', varType: 'negative', ytd: '$169,828' },
  entityCards: [
    { id: 'agency', name: 'Agency', badge: 'Media', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', cssClass: 'agency',
      metrics: [{ label: 'CA', value: '$35,080' }, { label: 'Marge Nette', value: '$12,237', colorClass: 'success' }], margin: 34.9, marginLevel: 'medium' as const },
    { id: 'structuring', name: 'Structuring', badge: 'Banking', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', cssClass: 'structuring',
      metrics: [{ label: 'CA', value: '$73,500' }, { label: 'Marge Nette', value: '$21,036', colorClass: 'success' }], margin: 28.6, marginLevel: 'low' as const },
    { id: 'digit', name: 'Digit Solution', badge: 'Ad Accounts', gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)', cssClass: 'digit',
      metrics: [{ label: 'CA', value: '$122,330' }, { label: 'Marge Nette', value: '$43,249', colorClass: 'success' }], margin: 35.4, marginLevel: 'medium' as const },
    { id: 'spy', name: 'SPY', badge: 'Tools', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', cssClass: 'spy',
      metrics: [{ label: 'CA', value: '$27,300' }, { label: 'Marge Nette', value: '$3,559', colorClass: 'success' }], margin: 13.0, marginLevel: 'low' as const },
    { id: 'comment', name: 'Comment', badge: 'Trust', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', cssClass: 'comment',
      metrics: [{ label: 'CA', value: '$333' }, { label: 'Marge Nette', value: '$140', colorClass: 'success' }], margin: 42.0, marginLevel: 'medium' as const },
  ],
  consolidatedPL: [
    { label: 'Marge Nette Agency (après 50% Blink)', value: '$12,237', type: 'positive' },
    { label: 'Marge Nette Structuring', value: '$21,036', type: 'positive' },
    { label: '↳ incl. AWD Event -$28,399', value: '(non-récurrent)', type: 'indent-muted' },
    { label: 'Marge Nette Digit Solution', value: '$43,249', type: 'positive' },
    { label: 'Marge Nette SPY', value: '$3,559', type: 'positive' },
    { label: 'Marge Nette Comment/Trustpilot', value: '$140', type: 'positive' },
    { label: 'MARGE BRUTE GROUPE', value: '$80,221', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Réserves Filiales (10%)', value: '-$8,022', type: 'negative' },
    { label: 'REMONTÉE HOLDING (90%)', value: '$72,199', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Compta + CFO Groupe', value: '-$3,430', type: 'negative' },
    { label: 'Salaire Assistante', value: '-$1,630', type: 'negative' },
    { label: 'Salaires Fixes Sales', value: '-$2,000', type: 'negative' },
    { label: 'Travel Expenses', value: '-$3,781', type: 'negative' },
    { label: 'Bank Fees', value: '-$50', type: 'negative' },
    { label: 'RÉSULTAT NET HOLDING', value: '$61,309', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Maxence (37.5%)', value: '-$22,991', type: 'negative' },
    { label: 'Thibault (37.5%)', value: '-$22,991', type: 'negative' },
    { label: '↳ dont Will', value: '$10,000', type: 'indent-muted' },
    { label: 'Florian (25%)', value: '-$15,327', type: 'negative' },
    { label: 'SALAIRES MANAGEMENT (100%)', value: '-$61,309', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'SOLDE HOLDING', value: '$0', type: 'highlight' },
  ],
  pieData: [
    { name: 'Agency ($12.2K)', value: 12237, color: '#F59E0B' },
    { name: 'Structuring ($21.0K)', value: 21036, color: '#1E3A5F' },
    { name: 'Digit Sol. ($43.2K)', value: 43249, color: '#4F5BD5' },
    { name: 'SPY ($3.6K)', value: 3559, color: '#10B981' },
    { name: 'Comment ($140)', value: 140, color: '#D946A8' },
  ],

  agencyKPIs: [
    { label: 'CA Brut', value: '$35,080', detail: '+227% vs Jan ($10,726)', color: 'navy' },
    { label: 'Marge Nette', value: '$24,473', detail: '69.8% du CA', color: 'green' },
    { label: 'Part PCA (50%)', value: '$12,237', detail: 'Après split Blink', color: 'gold' },
    { label: 'Total Charges', value: '$10,606', detail: '30.2% du CA', color: 'pink' },
  ],
  agencyComparison: [
    { indicator: 'CA Brut', jan: '$10,726', feb: '$35,080', variation: '+227.0%', varType: 'positive' },
    { indicator: 'Marge Nette', jan: '$4,489', feb: '$24,473', variation: '+445.2%', varType: 'positive' },
    { indicator: 'Part PCA (50%)', jan: '$2,244', feb: '$12,237', variation: '+445.4%', varType: 'positive' },
    { indicator: 'Media Géré', jan: '$279,691', feb: '$515,952', variation: '+84.5%', varType: 'positive' },
    { indicator: 'Transactions', jan: '62', feb: '148', variation: '+138.7%', varType: 'positive' },
  ] as any[] | null,
  agencyWaterfall: [
    { label: 'CA Brut', value: '$35,080', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Publicité (Ads)', value: '-$6,666', type: 'negative' },
    { label: 'Coûts Setup', value: '-$2,500', type: 'negative' },
    { label: 'Salaires', value: '-$1,200', type: 'negative' },
    { label: 'Com. Master Referral', value: '-$211', type: 'negative' },
    { label: 'Com. No Limit Referral', value: '-$30', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$10,606', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE (100%)', value: '$24,473', type: 'highlight' },
    { label: 'Part Blink (50%)', value: '-$12,237', type: 'negative' },
    { label: 'PART PCA (50%)', value: '$12,237', type: 'total-positive' },
  ],
  agencyRisks: [
    { label: 'Concentration Salmech', value: '25.6%', detail: 'du media dépensé', severity: 'warning' },
    { label: 'CL Exposure', value: '$211K', detail: 'x10 vs Jan', severity: 'danger' },
    { label: 'Marge Nette', value: '69.8%', detail: 'vs 41.8% en Jan', severity: 'success' },
  ],

  structuringKPIs: [
    { label: 'CA', value: '$73,500', detail: '+38.4% vs Jan', color: 'navy' },
    { label: 'Marge Nette', value: '$21,036', detail: '28.6% du CA', color: 'green' },
    { label: 'Clients', value: '53', detail: '+35.9% vs Jan (39)', color: 'gold' },
    { label: 'Total Charges', value: '$52,464', detail: '71.4% du CA', color: 'pink' },
  ],
  structuringComparison: [
    { indicator: 'CA', jan: '$53,962', feb: '$73,500', variation: '+36.2%', varType: 'positive' },
    { indicator: 'Marge Nette', jan: '$40,521', feb: '$21,036', variation: '-48.1%', varType: 'negative' },
    { indicator: 'Taux de Marge', jan: '76.3%', feb: '28.6%', variation: '-47.7pts', varType: 'negative' },
    { indicator: 'Clients', jan: '39', feb: '53', variation: '+35.9%', varType: 'positive' },
    { indicator: 'Ticket Moyen', jan: '$1,384', feb: '$1,387', variation: '+0.2%', varType: 'positive' },
  ] as any[] | null,
  structuringWaterfall: [
    { label: 'CA', value: '$73,500', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: '🎪 AWD Event (Booth A18)', value: '-$28,399', type: 'negative' },
    { label: 'Product & Provider Costs', value: '-$18,939', type: 'negative' },
    { label: 'Publicité (ADS)', value: '-$4,309', type: 'negative' },
    { label: 'Marketing', value: '-$436', type: 'negative' },
    { label: 'Alibaba Purchases', value: '-$331', type: 'negative' },
    { label: 'Frais Bancaires', value: '-$50', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$52,464', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$21,036', type: 'highlight' },
    { label: 'Hors AWD (récurrent)', value: '$49,435', type: 'indent-muted' },
  ],
  structuringServices: [
    { name: 'LLC Services', value: 22610, pct: '31%', status: 'Top' },
    { name: 'Physical Address US', value: 20690, pct: '28%', status: 'Top' },
    { name: 'LLC + Bundle', value: 15800, pct: '21%', status: 'Croissance' },
    { name: 'AMEX', value: 5500, pct: '7%', status: 'Stable' },
    { name: 'Slash', value: 2700, pct: '4%', status: 'Stable' },
    { name: 'Other', value: 6200, pct: '8%', status: 'Stable' },
  ],

  digitKPIs: [
    { label: 'CA', value: '$122,330', detail: '+6.7% vs Jan ($114,649)', color: 'navy' },
    { label: 'Marge Nette', value: '$43,249', detail: '35.4% du CA', color: 'green' },
    { label: 'Deals', value: '213', detail: '170 Setup + 43 Ad Account', color: 'gold' },
    { label: 'Total Charges', value: '$79,081', detail: '64.6% du CA', color: 'pink' },
  ],
  digitComparison: [
    { indicator: 'CA', jan: '$114,649', feb: '$122,330', variation: '+6.7%', varType: 'positive' },
    { indicator: 'Marge Nette', jan: '$40,198', feb: '$43,249', variation: '+7.6%', varType: 'positive' },
    { indicator: 'Taux de Marge', jan: '35.1%', feb: '35.4%', variation: '+0.3pts', varType: 'positive' },
    { indicator: 'Deals', jan: '225', feb: '213', variation: '-5.3%', varType: 'negative' },
    { indicator: 'Ticket Moyen', jan: '$509', feb: '$574', variation: '+12.7%', varType: 'positive' },
  ] as any[] | null,
  digitWaterfall: [
    { label: 'CA', value: '$122,330', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Coûts Fournisseurs', value: '-$33,906', type: 'negative' },
    { label: 'Com. Blink', value: '-$12,912', type: 'negative' },
    { label: 'Com. Sales', value: '-$2,656', type: 'negative' },
    { label: 'Salaires', value: '-$21,971', type: 'negative' },
    { label: 'Autres (Tools, Fees, Refunds, BizExp)', value: '-$7,636', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$79,081', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$43,249', type: 'highlight' },
  ],
  digitRevenueBreakdown: [
    { name: 'Set-up', value: 79141, deals: '170', ticket: '$465' },
    { name: 'Ad Account', value: 25309, deals: '43', ticket: '$588' },
    { name: 'BM', value: 8100, deals: '—', ticket: '—' },
    { name: 'Page', value: 5080, deals: '—', ticket: '—' },
    { name: 'Autres', value: 4700, deals: '—', ticket: '—' },
  ],

  spyKPIs: [
    { label: 'CA', value: '$27,300', detail: '+63.0% vs Jan ($16,750)', color: 'navy' },
    { label: 'Marge Nette', value: '$3,559', detail: '13.0% du CA', color: 'green' },
    { label: 'Deals', value: '5', detail: 'Licences SPY', color: 'gold' },
    { label: 'Total Charges', value: '$23,741', detail: '87.0% du CA', color: 'pink' },
  ],
  spyWaterfall: [
    { label: 'CA', value: '$27,300', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Total Charges', value: '-$23,741', type: 'negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$3,559', type: 'highlight' },
  ],

  commentKPIs: [
    { label: 'CA', value: '$333', detail: '-88.2% vs Jan ($2,813)', color: 'navy' },
    { label: 'Marge Nette', value: '$140', detail: '42.0% du CA', color: 'green' },
    { label: 'Deals', value: '20', detail: '16 Comment + 4 Trustpilot', color: 'gold' },
    { label: 'Total Charges', value: '$193', detail: '58.0% du CA', color: 'pink' },
  ],
  commentWaterfall: [
    { label: 'CA', value: '$333', type: 'positive' },
    { label: 'Coûts Produit', value: '$0', type: 'muted' },
    { label: 'Total Charges', value: '-$193', type: 'negative' },
    { label: 'MARGE NETTE', value: '$140', type: 'highlight' },
  ],
  commentWarning: "Activité en forte baisse ce mois. CA divisé par ~8 vs janvier.",

  holdingKPIs: [
    { label: 'Remontée Holding (90%)', value: '$72,199', detail: 'Bénéfices filiales', color: 'navy' },
    { label: 'Résultat Net Holding', value: '$61,309', detail: '100% distribué', color: 'gold' },
    { label: 'Réserves Filiales (10%)', value: '$8,022', detail: 'Trésorerie entités', color: 'green' },
    { label: 'Frais Holding', value: '$10,890', detail: 'Compta + Assist. + Sales + Travel + Fees', color: 'pink' },
  ],
  holdingComparison: [
    { indicator: 'Marge Brute Groupe', jan: '$89,607', feb: '$80,221', variation: '-10.5%', varType: 'negative' },
    { indicator: 'Réserves Filiales (10%)', jan: '$8,961', feb: '$8,022', variation: '-10.5%', varType: 'negative' },
    { indicator: 'Remontée Holding (90%)', jan: '$80,646', feb: '$72,199', variation: '-10.5%', varType: 'negative' },
    { indicator: 'Frais Holding', jan: '$7,060', feb: '$10,890', variation: '+54.3%', varType: 'negative' },
    { indicator: 'Résultat Net Holding', jan: '$73,586', feb: '$61,309', variation: '-16.7%', varType: 'negative' },
  ] as any[] | null,
  holdingManagementFees: [
    { label: 'Prime Circle Agency', value: '$12,237', type: 'positive' },
    { label: 'Prime Circle Structuring', value: '$21,036', type: 'positive' },
    { label: 'Digit Solution', value: '$43,249', type: 'positive' },
    { label: 'SPY', value: '$3,559', type: 'positive' },
    { label: 'Comment/Trustpilot', value: '$140', type: 'positive' },
    { label: 'MARGE BRUTE GROUPE', value: '$80,221', type: 'total-positive' },
  ],
  holdingSynthese: [
    { label: 'MARGE BRUTE GROUPE', value: '$80,221', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Réserves Filiales (10%)', value: '-$8,022', type: 'negative', indent: true },
    { label: 'REMONTÉE HOLDING (90%)', value: '$72,199', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Compta + CFO', value: '-$3,430', type: 'negative', indent: true },
    { label: 'Salaire Assistante', value: '-$1,630', type: 'negative', indent: true },
    { label: 'Salaires Fixes Sales', value: '-$2,000', type: 'negative', indent: true },
    { label: 'Travel Expenses', value: '-$3,781', type: 'negative', indent: true },
    { label: 'Bank Fees', value: '-$50', type: 'negative', indent: true },
    { label: 'RÉSULTAT NET HOLDING', value: '$61,309', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Salaires management (100%)', value: '-$61,309', type: 'negative', indent: true },
    { label: '↳ dont Will (via Thibault)', value: '$10,000', type: 'indent-muted', indent: true },
    { label: '', value: '', type: 'spacer' },
    { label: 'SOLDE HOLDING', value: '$0', type: 'highlight' },
  ],
  holdingPieData: [
    { name: 'Maxence ($23.0K)', value: 22991, color: '#1E3A5F' },
    { name: 'Thibault ($23.0K)', value: 22991, color: '#2D4A6F' },
    { name: 'Florian ($15.3K)', value: 15327, color: '#4F5BD5' },
    { name: 'Réserves Fil. ($8.0K)', value: 8022, color: '#C9A227' },
  ],
  directors: [
    { name: 'Maxence', pct: '37.5%', amount: '$22,991', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: 'vs $27,595 Jan (-16.7%)' },
    { name: 'Thibault', pct: '37.5%', amount: '$22,991', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: 'dont $10K Will' },
    { name: 'Florian', pct: '25%', amount: '$15,327', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', subtitle: 'vs $18,396 Jan (-16.7%)' },
  ],
  holdingNetResult: '$61,309',

  ytdHero: [
    { label: "CA YTD", value: "$457,443", detail: "Jan + Fév 2026", color: "navy" },
    { label: "Marge Brute YTD", value: "$169,828", detail: "37.1% du CA", color: "success" },
    { label: "Résultat Net YTD", value: "$134,895", detail: "Holding cumulé", color: "gold" },
    { label: "Réserves Cumulées", value: "$16,983", detail: "Toutes filiales", color: "primary" },
  ],
  ytdMonthlyTable: [
    { month: 'Janvier 2026', ca: '$198,900', margin: '$89,607', taux: '45.1%', net: '$73,586' },
    { month: 'Février 2026', ca: '$258,543', margin: '$80,221', taux: '31.0%', net: '$61,309' },
  ],
  ytdMonthlyTotal: { month: 'YTD TOTAL', ca: '$457,443', margin: '$169,828', taux: '37.1%', net: '$134,895' },
  ytdEntityTable: [
    { entity: 'Agency (Part PCA)', jan: '$2,245', feb: '$12,237', mar: '', ytd: '$14,482', pct: '7.2%' },
    { entity: 'Structuring', jan: '$41,371', feb: '$21,036', mar: '', ytd: '$62,407', pct: '36.7%' },
    { entity: 'Digit Solution', jan: '$40,198', feb: '$43,249', mar: '', ytd: '$83,447', pct: '41.3%' },
    { entity: 'SPY', jan: '$3,262', feb: '$3,559', mar: '', ytd: '$6,821', pct: '3.4%' },
    { entity: 'Comment/Trustpilot', jan: '$2,531', feb: '$140', mar: '', ytd: '$2,671', pct: '1.3%' },
  ],
  ytdEntityTotal: { entity: 'TOTAL GROUPE', jan: '$89,607', feb: '$80,221', mar: '', ytd: '$169,828', pct: '100%' },
  ytdTrendData: [
    { month: 'Janvier', ca: 198900, margin: 89607, net: 73586 },
    { month: 'Février', ca: 258543, margin: 80221, net: 61309 },
  ],
  ytdPLHoldingFees: [
    { label: 'Compta + CFO Groupe', jan: '-$3,430', feb: '-$3,430', mar: '', ytd: '-$6,860' },
    { label: 'Salaire Assistante', jan: '-$1,630', feb: '-$1,630', mar: '', ytd: '-$3,260' },
    { label: 'Salaires Fixes Sales', jan: '-$2,000', feb: '-$2,000', mar: '', ytd: '-$4,000' },
    { label: 'Travel Expenses', jan: '—', feb: '-$3,781', mar: '', ytd: '-$3,781' },
    { label: 'Bank Fees', jan: '—', feb: '-$50', mar: '', ytd: '-$50' },
  ] as { label: string; jan: string; feb: string; mar?: string; ytd: string }[] | null,
  ytdPLHoldingFeesTotal: { label: 'Total Frais Holding', jan: '-$7,060', feb: '-$10,890', mar: '', ytd: '-$17,950' } as { label: string; jan: string; feb: string; mar?: string; ytd: string } | null,
  ytdPLNetResult: { label: 'RÉSULTAT NET HOLDING', jan: '$73,586', feb: '$61,309', mar: '', ytd: '$134,895' } as { label: string; jan: string; feb: string; mar?: string; ytd: string } | null,
  ytdPLDistribution: [
    { label: 'Maxence (37.5%)', jan: '$27,595', feb: '$22,991', mar: '', ytd: '$50,586' },
    { label: 'Thibault (37.5%)', jan: '$27,595', feb: '$22,991', mar: '', ytd: '$50,586' },
    { label: '↳ dont Will', jan: '$10,000', feb: '$10,000', mar: '', ytd: '$20,000', style: 'muted' },
    { label: 'Florian (25%)', jan: '$18,396', feb: '$15,327', mar: '', ytd: '$33,723' },
  ] as { label: string; jan: string; feb: string; mar?: string; ytd: string; style?: string }[] | null,

  reservesHero: [
    { label: "Réserves Janvier", value: "$8,961", detail: "10% marge brute Jan", color: "navy" },
    { label: "Réserves Février", value: "$8,022", detail: "10% marge brute Fév", color: "success" },
    { label: "Réserves YTD", value: "$16,983", detail: "Cumul 2026", color: "gold" },
    { label: "Croissance", value: "-10.5%", detail: "Fév vs Jan", color: "primary" },
  ],
  reservesEntityTable: [
    { entity: 'Agency (Part PCA)', jan: '$224', feb: '$1,224', mar: '', ytd: '$1,448' },
    { entity: 'Structuring', jan: '$4,137', feb: '$2,104', mar: '', ytd: '$6,241' },
    { entity: 'Digit Solution', jan: '$4,020', feb: '$4,325', mar: '', ytd: '$8,345' },
    { entity: 'SPY', jan: '$326', feb: '$356', mar: '', ytd: '$682' },
    { entity: 'Comment/Trustpilot', jan: '$253', feb: '$14', mar: '', ytd: '$267' },
  ],
  reservesEntityTotal: { entity: 'TOTAL RÉSERVES', jan: '$8,961', feb: '$8,022', mar: '', ytd: '$16,983' },
  reservesCards: [
    { name: 'Digit Solution', amount: '$8,345', pct: '49.1%' },
    { name: 'Structuring', amount: '$6,241', pct: '36.7%' },
    { name: 'Agency (Part PCA)', amount: '$1,448', pct: '8.5%' },
    { name: 'SPY + Comment', amount: '$949', pct: '5.6%' },
  ],

  intercos: INTERCOS_DATA,
};

// ============ MARCH 2026 ============
const MAR_2026 = {
  monthLabel: 'Mars 2026',
  footerLabel: 'Mars 2026',

  overviewHero: [
    { label: "CA Groupe", value: "$260,071", detail: "6 entités consolidées", color: "navy", variance: "+0.6% vs Fév" as string | null, varType: "positive" as string | null },
    { label: "Marge Brute Groupe", value: "$106,183", detail: "40.8% du CA", color: "success", variance: "+32.4% vs Fév", varType: "positive" },
    { label: "Résultat Net Holding", value: "$87,187", detail: "Après frais holding", color: "gold", variance: "+42.2% vs Fév", varType: "positive" },
    { label: "Réserves Filiales", value: "$10,618", detail: "10% marge brute", color: "primary", variance: "+32.4% vs Fév", varType: "positive" },
  ],
  overviewComparison: [
    { entity: 'Agency (Part PCA 50%)', jan: '$2,244', feb: '$12,237', mar: '$14,946', variation: '+22.1%', varType: 'positive', ytd: '$29,427' },
    { entity: 'Structuring', jan: '$41,371', feb: '$21,036', mar: '$29,606', variation: '+40.7%', varType: 'positive', ytd: '$92,013' },
    { entity: 'Digit Solution', jan: '$40,198', feb: '$43,249', mar: '$57,458', variation: '+32.9%', varType: 'positive', ytd: '$140,905' },
    { entity: 'SPY', jan: '$3,262', feb: '$3,559', mar: '$3,470', variation: '-2.5%', varType: 'negative', ytd: '$10,291' },
    { entity: 'Comment/Trustpilot', jan: '$2,531', feb: '$140', mar: '$703', variation: '+402.1%', varType: 'positive', ytd: '$3,374' },
  ] as any[] | null,
  overviewComparisonTotal: { entity: 'MARGE BRUTE GROUPE', jan: '$89,607', feb: '$80,221', mar: '$106,183', variation: '+32.4%', varType: 'positive', ytd: '$276,010' },
  entityCards: [
    { id: 'agency', name: 'Agency', badge: 'Media', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', cssClass: 'agency',
      metrics: [{ label: 'CA Brut', value: '$46,402' }, { label: 'Part PCA', value: '$14,946', colorClass: 'success' }], margin: 64.4, marginLevel: 'high' as const },
    { id: 'structuring', name: 'Structuring', badge: 'Banking', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', cssClass: 'structuring',
      metrics: [{ label: 'CA', value: '$55,000' }, { label: 'Marge Nette', value: '$29,606', colorClass: 'success' }], margin: 53.8, marginLevel: 'high' as const },
    { id: 'digit', name: 'Digit Solution', badge: 'Ad Accounts', gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)', cssClass: 'digit',
      metrics: [{ label: 'CA', value: '$120,458' }, { label: 'Marge Nette', value: '$57,458', colorClass: 'success' }], margin: 47.7, marginLevel: 'medium' as const },
    { id: 'spy', name: 'SPY', badge: 'Tools', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', cssClass: 'spy',
      metrics: [{ label: 'CA', value: '$37,350' }, { label: 'Marge Nette', value: '$3,470', colorClass: 'success' }], margin: 9.3, marginLevel: 'low' as const },
    { id: 'comment', name: 'Comment', badge: 'Trust', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', cssClass: 'comment',
      metrics: [{ label: 'CA', value: '$861' }, { label: 'Marge Nette', value: '$703', colorClass: 'success' }], margin: 81.6, marginLevel: 'high' as const },
  ],
  consolidatedPL: [
    { label: 'Marge Nette Agency (après 50% Blink)', value: '$14,946', type: 'positive' },
    { label: 'Marge Nette Structuring', value: '$29,606', type: 'positive' },
    { label: 'Marge Nette Digit Solution', value: '$57,458', type: 'positive' },
    { label: 'Marge Nette SPY', value: '$3,470', type: 'positive' },
    { label: 'Marge Nette Comment/Trustpilot', value: '$703', type: 'positive' },
    { label: 'MARGE BRUTE GROUPE', value: '$106,183', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Réserves Filiales (10%)', value: '-$10,618', type: 'negative' },
    { label: 'REMONTÉE HOLDING (90%)', value: '$95,565', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'CFO + Compta Groupe', value: '-$3,430', type: 'negative' },
    { label: 'AI Agent', value: '-$2,000', type: 'negative' },
    { label: 'Salaire Fixe Sales', value: '-$2,000', type: 'negative' },
    { label: 'Tools', value: '-$780', type: 'negative' },
    { label: 'Frais Bancaires', value: '-$88', type: 'negative' },
    { label: 'Frais Paddel (non remboursés)', value: '-$80', type: 'negative' },
    { label: 'TOTAL FRAIS HOLDING', value: '-$8,378', type: 'total-negative' },
    { label: 'RÉSULTAT NET HOLDING', value: '$87,187', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Maxence (37.5%)', value: '-$32,695', type: 'negative' },
    { label: 'Thibault (37.5%)', value: '-$32,695', type: 'negative' },
    { label: '↳ dont Will', value: '$10,000', type: 'indent-muted' },
    { label: 'Florian (25%)', value: '-$21,797', type: 'negative' },
    { label: 'SALAIRES MANAGEMENT (100%)', value: '-$87,187', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'SOLDE HOLDING', value: '$0', type: 'highlight' },
  ],
  pieData: [
    { name: 'Agency ($14.9K)', value: 14946, color: '#F59E0B' },
    { name: 'Structuring ($29.6K)', value: 29606, color: '#1E3A5F' },
    { name: 'Digit Sol. ($57.5K)', value: 57458, color: '#4F5BD5' },
    { name: 'SPY ($3.5K)', value: 3470, color: '#10B981' },
    { name: 'Comment ($703)', value: 703, color: '#D946A8' },
  ],

  agencyKPIs: [
    { label: 'CA Brut', value: '$46,402', detail: '+32.3% vs Fév ($35,080)', color: 'navy' },
    { label: 'Marge Nette', value: '$29,892', detail: '64.4% du CA', color: 'green' },
    { label: 'Part PCA (50%)', value: '$14,946', detail: 'Après split Blink', color: 'gold' },
    { label: 'Total Charges', value: '$16,555', detail: '35.7% du CA', color: 'pink' },
  ],
  agencyComparison: [
    { indicator: 'CA Brut', jan: '$10,726', feb: '$35,080', mar: '$46,402', variation: '+32.3%', varType: 'positive', ytd: '$92,208' },
    { indicator: 'Charges', jan: '$6,237', feb: '$10,606', mar: '$16,555', variation: '+56.1%', varType: 'negative', ytd: '$33,398' },
    { indicator: 'Marge Nette', jan: '$4,489', feb: '$24,473', mar: '$29,892', variation: '+22.1%', varType: 'positive', ytd: '$58,854' },
    { indicator: 'Part PCA (50%)', jan: '$2,245', feb: '$12,237', mar: '$14,946', variation: '+22.1%', varType: 'positive', ytd: '$29,428' },
  ] as any[] | null,
  agencyWaterfall: [
    { label: 'CA Brut', value: '$46,402', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Publicité (Ads)', value: '-$11,163', type: 'negative' },
    { label: 'Coûts Setup', value: '-$3,500', type: 'negative' },
    { label: 'Salaires', value: '-$1,400', type: 'negative' },
    { label: 'Referrals (Master + No Limit)', value: '-$447', type: 'negative' },
    { label: 'Transaction Fees', value: '-$45', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$16,555', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE (100%)', value: '$29,892', type: 'highlight' },
    { label: 'Part Blink (50%)', value: '-$14,946', type: 'negative' },
    { label: 'PART PCA (50%)', value: '$14,946', type: 'total-positive' },
  ],
  agencyRisks: [
    { label: 'Marge Nette', value: '64.4%', detail: 'vs 69.8% Fév', severity: 'success' },
    { label: 'Cumul dû à Blink', value: '$112,789', detail: 'Benefit + Media', severity: 'warning' },
    { label: 'Solde Media dû', value: '$93,920', detail: 'cumulé', severity: 'warning' },
  ],

  structuringKPIs: [
    { label: 'CA (Turnover)', value: '$55,000', detail: '-25.2% vs Fév ($73,500)', color: 'navy' },
    { label: 'Marge Nette', value: '$29,606', detail: '53.8% du CA', color: 'green' },
    { label: 'Clients', value: '51', detail: 'Nathan uniquement', color: 'gold' },
    { label: 'Total Charges', value: '$25,394', detail: 'COGS + OPEX', color: 'pink' },
  ],
  structuringComparison: [
    { indicator: 'CA (Turnover)', jan: '$53,962', feb: '$73,500', mar: '$55,000', variation: '-25.2%', varType: 'negative', ytd: '$182,462' },
    { indicator: 'Marge Brute', jan: '—', feb: '$49,435', mar: '$44,981', variation: '-9.0%', varType: 'negative', ytd: '$94,416' },
    { indicator: 'Marge Nette', jan: '$41,371', feb: '$21,036', mar: '$29,606', variation: '+40.7%', varType: 'positive', ytd: '$92,013' },
    { indicator: 'Taux Marge Nette', jan: '76.7%', feb: '28.6%', mar: '53.8%', variation: '+25.2pts', varType: 'positive', ytd: '50.4%' },
    { indicator: 'Clients', jan: '39', feb: '53', mar: '51', variation: '-3.8%', varType: 'negative', ytd: '143' },
    { indicator: 'Ticket Moyen', jan: '$1,384', feb: '$1,387', mar: '$1,078', variation: '-22.3%', varType: 'negative', ytd: '$1,276' },
  ] as any[] | null,
  structuringWaterfall: [
    { label: 'CA (Turnover)', value: '$55,000', type: 'positive' },
    { label: 'COGS (Coût produit)', value: '-$10,019', type: 'negative' },
    { label: 'MARGE BRUTE', value: '$44,981', type: 'highlight' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Publicité (ADS)', value: '-$9,828', type: 'negative' },
    { label: 'Commission Nathan (15% + bonus)', value: '-$4,698', type: 'negative' },
    { label: 'Autres (Alibaba, Fees...)', value: '-$849', type: 'negative' },
    { label: 'TOTAL CHARGES OPEX', value: '-$15,375', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$29,606', type: 'highlight' },
  ],
  structuringServices: [
    { name: 'LLC Services', value: 0, pct: '—', status: '—' },
    { name: 'Physical Address US', value: 0, pct: '—', status: '—' },
  ],

  digitKPIs: [
    { label: 'CA', value: '$120,458', detail: '-1.5% vs Fév ($122,330)', color: 'navy' },
    { label: 'Marge Nette', value: '$57,458', detail: '47.7% du CA', color: 'green' },
    { label: 'Deals', value: '288', detail: '239 Setup + 49 Ad Account', color: 'gold' },
    { label: 'Total Charges', value: '$63,000', detail: '52.3% du CA', color: 'pink' },
  ],
  digitComparison: [
    { indicator: 'CA', jan: '$114,649', feb: '$122,330', mar: '$120,458', variation: '-1.5%', varType: 'negative', ytd: '$357,437' },
    { indicator: 'Marge Nette', jan: '$40,198', feb: '$43,249', mar: '$57,458', variation: '+32.9%', varType: 'positive', ytd: '$140,905' },
    { indicator: 'Taux de Marge', jan: '35.1%', feb: '35.4%', mar: '47.7%', variation: '+12.3pts', varType: 'positive', ytd: '39.4%' },
    { indicator: 'Deals', jan: '267', feb: '213', mar: '288', variation: '+35.2%', varType: 'positive', ytd: '768' },
    { indicator: 'Ticket Moyen', jan: '$429', feb: '$574', mar: '$418', variation: '-27.2%', varType: 'negative', ytd: '$465' },
  ] as any[] | null,
  digitWaterfall: [
    { label: 'CA', value: '$120,458', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Provider Cost', value: '-$23,591', type: 'negative' },
    { label: 'Cost Salary', value: '-$22,455', type: 'negative' },
    { label: 'To Blink (COM)', value: '-$8,752', type: 'negative' },
    { label: 'Business Expenses', value: '-$2,431', type: 'negative' },
    { label: 'Sales Salary', value: '-$2,259', type: 'negative' },
    { label: 'Tools', value: '-$1,299', type: 'negative' },
    { label: 'Fees (Bank/Crypto)', value: '-$503', type: 'negative' },
    { label: 'Refunds', value: '-$91', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$63,000', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$57,458', type: 'highlight' },
  ],
  digitRevenueBreakdown: [
    { name: 'Setup', value: 93426, deals: '239', ticket: '$391' },
    { name: 'Ad Account', value: 16469, deals: '49', ticket: '$336' },
    { name: 'BM', value: 6403, deals: '—', ticket: '—' },
    { name: 'Page', value: 2310, deals: '—', ticket: '—' },
    { name: 'Gas Fees', value: 1201, deals: '—', ticket: '—' },
    { name: 'Gmail/Proxy', value: 550, deals: '—', ticket: '—' },
    { name: 'Profils FB', value: 100, deals: '—', ticket: '—' },
  ],

  spyKPIs: [
    { label: 'CA', value: '$37,350', detail: '+36.8% vs Fév ($27,300)', color: 'navy' },
    { label: 'Marge Nette', value: '$3,470', detail: '9.3% du CA', color: 'green' },
    { label: 'Cost Product', value: '$28,520', detail: '76.4% du CA', color: 'gold' },
    { label: 'Total Charges', value: '$33,880', detail: '90.7% du CA', color: 'pink' },
  ],
  spyWaterfall: [
    { label: 'CA', value: '$37,350', type: 'positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Cost Product', value: '-$28,520', type: 'negative' },
    { label: 'COM Blink', value: '-$3,745', type: 'negative' },
    { label: 'COM Sales', value: '-$1,615', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$33,880', type: 'total-negative' },
    { label: '', value: '', type: 'spacer' },
    { label: 'MARGE NETTE', value: '$3,470', type: 'highlight' },
  ],

  commentKPIs: [
    { label: 'CA', value: '$861', detail: '+158.6% vs Fév ($333)', color: 'navy' },
    { label: 'Marge Nette', value: '$703', detail: '81.6% du CA', color: 'green' },
    { label: 'Cost Product', value: '$120', detail: '13.9% du CA', color: 'gold' },
    { label: 'Total Charges', value: '$158', detail: '18.4% du CA', color: 'pink' },
  ],
  commentWaterfall: [
    { label: 'CA', value: '$861', type: 'positive' },
    { label: 'Cost Product', value: '-$120', type: 'negative' },
    { label: 'COM Blink', value: '$0', type: 'muted' },
    { label: 'COM Sales', value: '-$37', type: 'negative' },
    { label: 'TOTAL CHARGES', value: '-$158', type: 'total-negative' },
    { label: 'MARGE NETTE', value: '$703', type: 'highlight' },
  ],
  commentWarning: 'Rebond significatif vs Février. Marge nette excellente à 81.6%.',

  holdingKPIs: [
    { label: 'Remontée Holding (90%)', value: '$95,565', detail: 'Bénéfices filiales', color: 'navy' },
    { label: 'Résultat Net Holding', value: '$87,187', detail: '+42.2% vs Fév', color: 'gold' },
    { label: 'Réserves Filiales (10%)', value: '$10,618', detail: 'Trésorerie entités', color: 'green' },
    { label: 'Frais Holding', value: '$8,378', detail: '-23.1% vs Fév ($10,890)', color: 'pink' },
  ],
  holdingComparison: [
    { indicator: 'Marge Brute Groupe', jan: '$89,607', feb: '$80,221', mar: '$106,183', variation: '+32.4%', varType: 'positive', ytd: '$276,011' },
    { indicator: 'Réserves Filiales (10%)', jan: '$8,961', feb: '$8,022', mar: '$10,618', variation: '+32.4%', varType: 'positive', ytd: '$27,601' },
    { indicator: 'Remontée Holding (90%)', jan: '$80,646', feb: '$72,199', mar: '$95,565', variation: '+32.4%', varType: 'positive', ytd: '$248,410' },
    { indicator: 'Frais Holding', jan: '$7,060', feb: '$10,890', mar: '$8,378', variation: '-23.1%', varType: 'positive', ytd: '$26,328' },
    { indicator: 'Résultat Net Holding', jan: '$73,586', feb: '$61,309', mar: '$87,187', variation: '+42.2%', varType: 'positive', ytd: '$222,082' },
  ] as any[] | null,
  holdingManagementFees: [
    { label: 'Prime Circle Agency', value: '$14,946', type: 'positive' },
    { label: 'Prime Circle Structuring', value: '$29,606', type: 'positive' },
    { label: 'Digit Solution', value: '$57,458', type: 'positive' },
    { label: 'SPY', value: '$3,470', type: 'positive' },
    { label: 'Comment/Trustpilot', value: '$703', type: 'positive' },
    { label: 'MARGE BRUTE GROUPE', value: '$106,183', type: 'total-positive' },
  ],
  holdingSynthese: [
    { label: 'MARGE BRUTE GROUPE', value: '$106,183', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Réserves Filiales (10%)', value: '-$10,618', type: 'negative', indent: true },
    { label: 'REMONTÉE HOLDING (90%)', value: '$95,565', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'CFO + Compta Groupe', value: '-$3,430', type: 'negative', indent: true },
    { label: 'AI Agent', value: '-$2,000', type: 'negative', indent: true },
    { label: 'Salaire Fixe Sales', value: '-$2,000', type: 'negative', indent: true },
    { label: 'Tools', value: '-$780', type: 'negative', indent: true },
    { label: 'Frais Bancaires', value: '-$88', type: 'negative', indent: true },
    { label: 'Frais Paddel (non remboursés)', value: '-$80', type: 'negative', indent: true },
    { label: 'RÉSULTAT NET HOLDING', value: '$87,187', type: 'total-positive' },
    { label: '', value: '', type: 'spacer' },
    { label: 'Salaires management (100%)', value: '-$87,187', type: 'negative', indent: true },
    { label: '↳ dont Will (via Thibault)', value: '$10,000', type: 'indent-muted', indent: true },
    { label: '', value: '', type: 'spacer' },
    { label: 'SOLDE HOLDING', value: '$0', type: 'highlight' },
  ],
  holdingPieData: [
    { name: 'Maxence ($32.7K)', value: 32695, color: '#1E3A5F' },
    { name: 'Thibault ($32.7K)', value: 32695, color: '#2D4A6F' },
    { name: 'Florian ($21.8K)', value: 21797, color: '#4F5BD5' },
    { name: 'Réserves Fil. ($10.6K)', value: 10618, color: '#C9A227' },
  ],
  directors: [
    { name: 'Maxence', pct: '37.5%', amount: '$32,695', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: '+42.2% vs Fév' },
    { name: 'Thibault', pct: '37.5%', amount: '$32,695', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: 'dont $10K Will' },
    { name: 'Florian', pct: '25%', amount: '$21,797', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', subtitle: '+42.2% vs Fév' },
  ],
  holdingNetResult: '$87,187',

  ytdHero: [
    { label: "CA YTD", value: "$717,514", detail: "Jan + Fév + Mars 2026", color: "navy" },
    { label: "Marge Brute YTD", value: "$276,010", detail: "38.5% du CA", color: "success" },
    { label: "Résultat Net YTD", value: "$222,082", detail: "Holding cumulé Q1", color: "gold" },
    { label: "Réserves Cumulées", value: "$27,601", detail: "Toutes filiales", color: "primary" },
  ],
  ytdMonthlyTable: [
    { month: 'Janvier 2026', ca: '$198,900', margin: '$89,607', taux: '45.1%', net: '$73,586' },
    { month: 'Février 2026', ca: '$258,543', margin: '$80,221', taux: '31.0%', net: '$61,309' },
    { month: 'Mars 2026', ca: '$260,071', margin: '$106,183', taux: '40.8%', net: '$87,187' },
  ],
  ytdMonthlyTotal: { month: 'YTD TOTAL Q1', ca: '$717,514', margin: '$276,010', taux: '38.5%', net: '$222,082' },
  ytdEntityTable: [
    { entity: 'Agency (Part PCA)', jan: '$2,244', feb: '$12,237', mar: '$14,946', ytd: '$29,427', pct: '10.7%' },
    { entity: 'Structuring', jan: '$41,371', feb: '$21,036', mar: '$29,606', ytd: '$92,013', pct: '33.3%' },
    { entity: 'Digit Solution', jan: '$40,198', feb: '$43,249', mar: '$57,458', ytd: '$140,905', pct: '51.1%' },
    { entity: 'SPY', jan: '$3,262', feb: '$3,559', mar: '$3,470', ytd: '$10,291', pct: '3.7%' },
    { entity: 'Comment/Trustpilot', jan: '$2,531', feb: '$140', mar: '$703', ytd: '$3,374', pct: '1.2%' },
  ],
  ytdEntityTotal: { entity: 'TOTAL GROUPE', jan: '$89,607', feb: '$80,221', mar: '$106,183', ytd: '$276,010', pct: '100%' },
  ytdTrendData: [
    { month: 'Janvier', ca: 198900, margin: 89607, net: 73586 },
    { month: 'Février', ca: 258543, margin: 80221, net: 61309 },
    { month: 'Mars', ca: 260071, margin: 106183, net: 87187 },
  ],
  ytdPLHoldingFees: [
    { label: 'Compta + CFO Groupe', jan: '-$3,430', feb: '-$3,430', mar: '-$3,430', ytd: '-$10,290' },
    { label: 'Salaire Assistante / AI Agent', jan: '-$1,630', feb: '-$1,630', mar: '-$2,000', ytd: '-$5,260' },
    { label: 'Salaires Fixes Sales', jan: '-$2,000', feb: '-$2,000', mar: '-$2,000', ytd: '-$6,000' },
    { label: 'Travel Expenses', jan: '—', feb: '-$3,781', mar: '—', ytd: '-$3,781' },
    { label: 'Tools', jan: '—', feb: '—', mar: '-$780', ytd: '-$780' },
    { label: 'Bank Fees + Paddel', jan: '—', feb: '-$50', mar: '-$168', ytd: '-$218' },
  ] as { label: string; jan: string; feb: string; mar?: string; ytd: string }[] | null,
  ytdPLHoldingFeesTotal: { label: 'Total Frais Holding', jan: '-$7,060', feb: '-$10,890', mar: '-$8,378', ytd: '-$26,328' } as { label: string; jan: string; feb: string; mar?: string; ytd: string } | null,
  ytdPLNetResult: { label: 'RÉSULTAT NET HOLDING', jan: '$73,586', feb: '$61,309', mar: '$87,187', ytd: '$222,082' } as { label: string; jan: string; feb: string; mar?: string; ytd: string } | null,
  ytdPLDistribution: [
    { label: 'Maxence (37.5%)', jan: '$27,595', feb: '$22,991', mar: '$32,695', ytd: '$83,281' },
    { label: 'Thibault (37.5%)', jan: '$27,595', feb: '$22,991', mar: '$32,695', ytd: '$83,281' },
    { label: '↳ dont Will', jan: '$10,000', feb: '$10,000', mar: '$10,000', ytd: '$30,000', style: 'muted' },
    { label: 'Florian (25%)', jan: '$18,396', feb: '$15,327', mar: '$21,797', ytd: '$55,520' },
  ] as { label: string; jan: string; feb: string; mar?: string; ytd: string; style?: string }[] | null,

  reservesHero: [
    { label: "Réserves Janvier", value: "$8,961", detail: "10% marge brute Jan", color: "navy" },
    { label: "Réserves Février", value: "$8,022", detail: "10% marge brute Fév", color: "success" },
    { label: "Réserves Mars", value: "$10,618", detail: "10% marge brute Mars", color: "primary" },
    { label: "Réserves YTD Q1", value: "$27,601", detail: "Cumul 2026", color: "gold" },
  ],
  reservesEntityTable: [
    { entity: 'Agency (Part PCA)', jan: '$224', feb: '$1,224', mar: '$1,495', ytd: '$2,943' },
    { entity: 'Structuring', jan: '$4,137', feb: '$2,104', mar: '$2,961', ytd: '$9,201' },
    { entity: 'Digit Solution', jan: '$4,020', feb: '$4,325', mar: '$5,746', ytd: '$14,091' },
    { entity: 'SPY', jan: '$326', feb: '$356', mar: '$347', ytd: '$1,029' },
    { entity: 'Comment/Trustpilot', jan: '$253', feb: '$14', mar: '$70', ytd: '$337' },
  ],
  reservesEntityTotal: { entity: 'TOTAL RÉSERVES', jan: '$8,961', feb: '$8,022', mar: '$10,618', ytd: '$27,601' },
  reservesCards: [
    { name: 'Digit Solution', amount: '$14,091', pct: '51.1%' },
    { name: 'Structuring', amount: '$9,201', pct: '33.3%' },
    { name: 'Agency (Part PCA)', amount: '$2,943', pct: '10.7%' },
    { name: 'SPY + Comment', amount: '$1,366', pct: '4.9%' },
  ],

  intercos: INTERCOS_DATA,
};

export type PCGroupMonthData = typeof FEB_2026;

export function getMonthData(month: MonthId): PCGroupMonthData {
  if (month === 'jan-2026') return JAN_2026 as PCGroupMonthData;
  if (month === 'mar-2026') return MAR_2026 as PCGroupMonthData;
  return FEB_2026;
}

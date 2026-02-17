// Prime Circle Group - Consolidated Dashboard Data

export const ENTITY_ROUTES = {
  agency: '/dashboard-prime-circle-agency/856d4617-0956-45f9-860e-baa0662e78e5',
  structuring: '/dashboard-prime-circle/84c179cf-20d2-4d56-b9b0-c6273cd3dd8b',
  digit: '/dashboard-digit/edb0ce96-ad6f-45bf-842a-8f237976ac4f',
};

export const overviewHero = [
  { label: "Chiffre d'Affaires Groupe", value: "$198,900", detail: "5 entités consolidées", color: "navy" },
  { label: "Marge Brute Groupe", value: "$90,257", detail: "45.4% du CA", color: "success" },
  { label: "Résultat Net Groupe", value: "$85,197", detail: "Après frais holding", color: "gold" },
  { label: "Transactions", value: "365", detail: "Toutes entités", color: "primary" },
];

export const entityCards = [
  {
    id: 'agency',
    name: 'Agency',
    badge: 'Media',
    gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)',
    cssClass: 'agency',
    metrics: [
      { label: 'Revenue', value: '$10,726' },
      { label: 'Marge Nette', value: '$2,245', colorClass: 'success' },
    ],
    margin: 20.9,
    marginLevel: 'medium' as const,
  },
  {
    id: 'structuring',
    name: 'Structuring',
    badge: 'Banking',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)',
    cssClass: 'structuring',
    metrics: [
      { label: 'Turnover', value: '$53,962' },
      { label: 'Net Profit', value: '$41,371', colorClass: 'success' },
    ],
    margin: 76.7,
    marginLevel: 'high' as const,
  },
  {
    id: 'digit',
    name: 'Digit Solution',
    badge: 'Ad Accounts',
    gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)',
    cssClass: 'digit',
    metrics: [
      { label: 'CA', value: '$114,649' },
      { label: 'Margin', value: '$40,848', colorClass: 'success' },
    ],
    margin: 35.6,
    marginLevel: 'medium' as const,
  },
  {
    id: 'spy',
    name: 'SPY',
    badge: 'Tools',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    cssClass: 'spy',
    metrics: [
      { label: 'CA', value: '$16,750' },
      { label: 'Margin', value: '$3,262', colorClass: 'success' },
    ],
    margin: 19.5,
    marginLevel: 'low' as const,
  },
  {
    id: 'comment',
    name: 'Comment',
    badge: 'Trust',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    cssClass: 'comment',
    metrics: [
      { label: 'CA', value: '$2,813' },
      { label: 'Margin', value: '$2,531', colorClass: 'success' },
    ],
    margin: 90.0,
    marginLevel: 'high' as const,
  },
];

export const consolidatedPL = [
  { label: 'CA Prime Circle Agency', value: '$10,726', type: 'positive' },
  { label: 'CA Prime Circle Structuring', value: '$53,962', type: 'positive' },
  { label: 'CA Digit Solution', value: '$114,649', type: 'positive' },
  { label: 'CA SPY', value: '$16,750', type: 'positive' },
  { label: 'CA Comment/Trustpilot', value: '$2,813', type: 'positive' },
  { label: 'CHIFFRE D\'AFFAIRES GROUPE', value: '$198,900', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Marge Nette Agency (après 50% Blink)', value: '$2,245', type: 'positive' },
  { label: 'Marge Nette Structuring', value: '$41,371', type: 'positive' },
  { label: 'Marge Nette Digit Solution', value: '$40,848', type: 'positive' },
  { label: 'Marge Nette SPY', value: '$3,262', type: 'positive' },
  { label: 'Marge Nette Comment/Trustpilot', value: '$2,531', type: 'positive' },
  { label: 'MARGE BRUTE GROUPE', value: '$90,257', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Compta + CFO Groupe', value: '-$3,430', type: 'negative' },
  { label: 'Salaire Assistante', value: '-$1,630', type: 'negative' },
  { label: 'RÉSULTAT NET GROUPE', value: '$85,197', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Maxence (37.5%)', value: '-$28,754', type: 'negative' },
  { label: 'Thibault (37.5%)', value: '-$28,754', type: 'negative' },
  { label: '↳ dont Will', value: '$10,000', type: 'indent-muted' },
  { label: 'Florian (25%)', value: '-$19,169', type: 'negative' },
  { label: 'SALAIRES MANAGEMENT (90%)', value: '-$76,677', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'RÉSERVES HOLDING (10%)', value: '$8,520', type: 'highlight' },
];

export const pieData = [
  { name: 'Agency ($2.2K)', value: 2245, color: '#4F5BD5' },
  { name: 'Structuring ($41.4K)', value: 41371, color: '#1E3A5F' },
  { name: 'Digit Sol. ($40.8K)', value: 40848, color: '#D946A8' },
  { name: 'SPY ($3.3K)', value: 3262, color: '#F59E0B' },
  { name: 'Comment ($2.5K)', value: 2531, color: '#10B981' },
];

// Agency Tab
export const agencyKPIs = [
  { label: 'CA Brut', value: '$10,726', detail: 'Abo + Setup', color: 'blue' },
  { label: 'Total Charges', value: '$6,237', detail: '58.2% du CA', color: 'orange' },
  { label: 'Marge Nette', value: '$4,489', detail: '41.8% du CA', color: 'green' },
  { label: 'Part PCA (50%)', value: '$2,245', detail: 'Après partage Blink', color: 'pink' },
  { label: 'Transactions', value: '59', detail: '21 Nouveaux - 20 Essai', color: 'blue' },
  { label: 'Clients Actifs', value: '47', detail: '12 Arrêtés', color: 'green' },
  { label: 'Total Encaissé', value: '$28,975', detail: 'Incl. media CL', color: 'navy' },
  { label: 'Media Géré', value: '$279.7K', detail: '33 ad accounts', color: 'gold' },
];

export const agencyWaterfall = [
  { label: 'Subscriptions', value: '$8,074', type: 'positive' },
  { label: 'Setup Fees', value: '$2,787', type: 'positive' },
  { label: 'Discounts', value: '-$135', type: 'negative' },
  { label: 'GROSS REVENUE', value: '$10,726', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Setup Cost (agents)', value: '-$1,300', type: 'negative' },
  { label: 'Salary', value: '-$1,200', type: 'negative' },
  { label: 'Advertising', value: '-$1,038', type: 'negative' },
  { label: 'Chris Referral (10%)', value: '-$2,633', type: 'negative' },
  { label: 'Master Referral (5%)', value: '-$66', type: 'negative' },
  { label: 'TOTAL EXPENSES', value: '-$6,237', type: 'total-negative' },
  { label: 'NET REVENUE', value: '$4,489', type: 'highlight' },
];

export const agencyExpensesPie = [
  { name: 'Chris Referral', value: 2633, color: '#EF4444' },
  { name: 'Setup Cost', value: 1300, color: '#F59E0B' },
  { name: 'Salary', value: 1200, color: '#4F5BD5' },
  { name: 'Ads', value: 1038, color: '#D946A8' },
  { name: 'Master Referral', value: 66, color: '#94A3B8' },
];

export const agencyRisks = [
  { label: 'Concentration Hugo', value: '60.8%', detail: 'du media spend', severity: 'danger' },
  { label: 'CL Exposure', value: '$21.0K', detail: 'media avancé', severity: 'danger' },
  { label: 'Marge Nette', value: '41.8%', detail: 'vs 54.8% en Dec', severity: 'warning' },
  { label: 'Clients Stopped', value: '14', detail: '23% des tx', severity: 'warning' },
];

// Structuring Tab
export const structuringKPIs = [
  { label: 'Total Customers', value: '39', detail: 'Handled by Nathan', color: 'navy' },
  { label: 'Total Turnover', value: '$53,962', detail: 'Avg. $1,384/customer', color: 'green' },
  { label: 'Total Margin', value: '$41,371', detail: '76.7% margin rate', color: 'gold' },
  { label: 'Completed', value: '26', detail: '13 in progress', color: 'blue' },
];

export const structuringWaterfall = [
  { label: 'Turnover', value: '$53,962', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: '📢 Advertising (ADS)', value: '-$2,690', type: 'negative' },
  { label: '💼 Sales Commission (Nathan)', value: '-$4,213', type: 'negative' },
  { label: '🤝 Referral Commission', value: '-$350', type: 'negative' },
  { label: '🎪 Events', value: '-$1,000', type: 'negative' },
  { label: '🏢 Service/Provider Costs', value: '-$4,338', type: 'negative' },
  { label: 'TOTAL COSTS', value: '-$12,591', type: 'total-negative' },
  { label: 'NET PROFIT', value: '$41,371', type: 'highlight' },
];

export const structuringServices = [
  { name: 'LLC Services', value: 19400, pct: '36%', status: 'Top' },
  { name: 'Physical Address US', value: 17700, pct: '33%', status: 'Top' },
  { name: 'AMEX', value: 8000, pct: '15%', status: 'Growing' },
  { name: 'Other Banking', value: 4848, pct: '9%', status: 'Stable' },
  { name: 'Revolut Business', value: 4014, pct: '7%', status: 'Stable' },
];

export const structuringServicesChart = [
  { name: 'LLC Services', value: 19400, color: '#1E3A5F' },
  { name: 'Physical Addr.', value: 17700, color: '#10B981' },
  { name: 'AMEX', value: 8000, color: '#C9A227' },
  { name: 'Other Banking', value: 4848, color: '#F59E0B' },
  { name: 'Revolut Biz', value: 4014, color: '#4F5BD5' },
];

// Digit Tab
export const digitKPIs = [
  { label: 'Marge Nette', value: '$40,848', detail: '35.6% du CA', color: 'pink' },
  { label: 'CA', value: '$114,649', detail: 'Setup + Ad Account', color: 'green' },
  { label: 'Taux de Marge', value: '35.6%', detail: 'Marge / CA', color: 'blue' },
  { label: 'Transactions', value: '267', detail: '233 Setup + 34 Ad Account', color: 'gold' },
];

export const digitWaterfall = [
  { label: 'CA Total', value: '$114,649', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Provider Cost', value: '-$29,708', type: 'negative' },
  { label: 'Blink Commission', value: '-$12,922', type: 'negative' },
  { label: 'Sales Commission', value: '-$3,190', type: 'negative' },
  { label: 'Cost Salary (Fixe)', value: '-$25,366', type: 'negative' },
  { label: 'Tools + Business Exp + Refunds', value: '-$2,615', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$73,801', type: 'total-negative' },
  { label: 'COMPANY MARGIN', value: '$40,848', type: 'highlight' },
];

export const digitRevenueBreakdown = [
  { name: 'Set-up', value: 77409, deals: '233', ticket: '$332' },
  { name: 'Ad Account', value: 27305, deals: '34', ticket: '$803' },
  { name: 'BM', value: 5651, deals: '—', ticket: '—' },
  { name: 'Page', value: 2770, deals: '—', ticket: '—' },
  { name: 'Autres', value: 1514, deals: '—', ticket: '—' },
];

export const digitRevenueChart = [
  { name: 'Set-up', value: 77409, color: '#D946A8' },
  { name: 'Ad Account', value: 27305, color: '#D946A8' },
  { name: 'BM', value: 5651, color: '#D946A8' },
  { name: 'Page', value: 2770, color: '#D946A8' },
  { name: 'Autres', value: 1514, color: '#D946A8' },
];

// SPY Tab
export const spyKPIs = [
  { label: 'CA', value: '$16,750', detail: "Outils d'analyse", color: 'orange' },
  { label: 'Marge Nette', value: '$3,262', detail: '19.5% du CA', color: 'green' },
  { label: 'Coûts Produit', value: '$11,250', detail: '67.2% du CA', color: 'pink' },
  { label: 'Total Com.', value: '$2,238', detail: 'Blink + Sales', color: 'blue' },
];

export const spyWaterfall = [
  { label: 'CA SPY', value: '$16,750', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Cost Product (Licences)', value: '-$11,250', type: 'negative' },
  { label: 'Blink Commission', value: '-$1,813', type: 'negative' },
  { label: 'Sales Commission', value: '-$425', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$13,488', type: 'total-negative' },
  { label: 'MARGIN SPY', value: '$3,262', type: 'highlight' },
];

export const spyCostsPie = [
  { name: 'Margin ($3.3K)', value: 3262, color: '#10B981' },
  { name: 'Cost Product ($11.3K)', value: 11250, color: '#F59E0B' },
  { name: 'Blink ($1.8K)', value: 1813, color: '#D946A8' },
  { name: 'Sales ($0.4K)', value: 425, color: '#4F5BD5' },
];

export const spyAnalysis = [
  { label: 'Coût Produit', value: '67.2%', detail: 'Part importante des licences', severity: 'warning' },
  { label: 'Commissions', value: '13.4%', detail: 'Blink 10.8% + Sales 2.5%', severity: 'primary' },
  { label: 'Marge Nette', value: '19.5%', detail: 'Marge la plus faible', severity: 'success' },
];

// Comment/Trustpilot Tab
export const commentKPIs = [
  { label: 'CA', value: '$2,813', detail: "Services d'engagement", color: 'green' },
  { label: 'Marge Nette', value: '$2,531', detail: '90.0% du CA', color: 'green' },
  { label: 'Coûts Produit', value: '$0', detail: 'Aucun coût', color: 'blue' },
  { label: 'Com. Sales', value: '$281', detail: '10.0% du CA', color: 'pink' },
];

export const commentWaterfall = [
  { label: 'CA Comment/Trustpilot', value: '$2,813', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Cost Product', value: '$0', type: 'muted' },
  { label: 'Sales Commission (10%)', value: '-$281', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$281', type: 'total-negative' },
  { label: 'MARGIN COMMENT', value: '$2,531', type: 'highlight' },
];

export const commentComparison = [
  { name: 'Comment/Trustpilot', ca: '$2,813', margin: '$2,531', taux: '90.0%', highlight: true, badgeType: 'success' as const },
  { name: 'Digit Solution', ca: '$114,649', margin: '$40,848', taux: '35.6%', highlight: false, badgeType: 'warning' as const },
  { name: 'SPY', ca: '$16,750', margin: '$3,262', taux: '19.5%', highlight: false, badgeType: 'danger' as const },
];

// Holding Tab
export const holdingKPIs = [
  { label: 'Résultat Net Groupe', value: '$85,197', detail: 'Après frais holding', color: 'navy' },
  { label: 'Distribuable (90%)', value: '$76,677', detail: 'Salaires management', color: 'gold' },
  { label: 'Réserves (10%)', value: '$8,520', detail: 'Trésorerie holding', color: 'green' },
  { label: 'Frais Holding', value: '$5,060', detail: 'Compta + Assistante', color: 'pink' },
];

export const holdingManagementFees = [
  { label: 'Prime Circle Agency', value: '$2,245', type: 'positive' },
  { label: 'Prime Circle Structuring', value: '$41,371', type: 'positive' },
  { label: 'Digit Solution', value: '$40,848', type: 'positive' },
  { label: 'SPY', value: '$3,262', type: 'positive' },
  { label: 'Comment/Trustpilot', value: '$2,531', type: 'positive' },
  { label: 'TOTAL BÉNÉFICE', value: '$90,257', type: 'total-positive' },
];

export const holdingRefacturation = [
  { label: 'PCA (66%)', value: '$2,264', type: 'positive' },
  { label: 'Structuring (34%)', value: '$1,166', type: 'positive' },
  { label: 'Digit (hors scope)', value: '$0', type: 'muted' },
  { label: 'TOTAL REFACTURATION', value: '$3,430', type: 'total-positive' },
];

export const holdingCharges = [
  { label: 'Compta + CFO Groupe', value: '-$3,430', type: 'negative' },
  { label: 'Salaire Assistante', value: '-$1,630', type: 'negative' },
  { label: 'TOTAL FRAIS HOLDING', value: '-$5,060', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Maxence (37.5%)', value: '-$28,754', type: 'negative' },
  { label: 'Thibault (37.5%)', value: '-$28,754', type: 'negative' },
  { label: '↳ dont Will', value: '$10,000', type: 'indent-muted' },
  { label: 'Florian (25%)', value: '-$19,169', type: 'negative' },
  { label: 'TOTAL SALAIRES', value: '-$76,677', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'RÉSERVES HOLDING (10%)', value: '$8,520', type: 'highlight' },
];

export const holdingSynthese = [
  { label: 'ENTRÉES', value: '$93,687', type: 'total-positive' },
  { label: 'Management fees (marge brute)', value: '$90,257', type: 'positive', indent: true },
  { label: 'Refacturation compta', value: '$3,430', type: 'positive', indent: true },
  { label: '', value: '', type: 'spacer' },
  { label: 'SORTIES', value: '-$85,167', type: 'total-negative' },
  { label: 'Compta + CFO', value: '-$3,430', type: 'negative', indent: true },
  { label: 'Salaire Assistante', value: '-$1,630', type: 'negative', indent: true },
  { label: 'Salaires management (90%)', value: '-$76,677', type: 'negative', indent: true },
  { label: '↳ dont Will (via Thibault)', value: '$10,000', type: 'indent-muted', indent: true },
  { label: '', value: '', type: 'spacer' },
  { label: 'SOLDE HOLDING (10%)', value: '$8,520', type: 'highlight' },
];

export const holdingPieData = [
  { name: 'Maxence ($28.8K)', value: 28754, color: '#1E3A5F' },
  { name: 'Thibault ($28.8K)', value: 28754, color: '#2D4A6F' },
  { name: 'Florian ($19.2K)', value: 19169, color: '#4F5BD5' },
  { name: 'Réserves ($8.5K)', value: 8520, color: '#C9A227' },
];

export const directors = [
  { name: 'Maxence', pct: '37.5%', amount: '$28,754', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: '' },
  { name: 'Thibault', pct: '37.5%', amount: '$28,754', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: 'dont $10K Will' },
  { name: 'Florian', pct: '25%', amount: '$19,169', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', subtitle: '' },
];

// Prime Circle Group - Consolidated Dashboard Data

export const ENTITY_ROUTES = {
  agency: '/dashboard-prime-circle-agency/856d4617-0956-45f9-860e-baa0662e78e5',
  structuring: '/dashboard-prime-circle/84c179cf-20d2-4d56-b9b0-c6273cd3dd8b',
  digit: '/dashboard-digit/edb0ce96-ad6f-45bf-842a-8f237976ac4f',
};

export const overviewHero = [
  { label: "Chiffre d'Affaires Groupe", value: "$198,900", detail: "3 entités consolidées", color: "navy" },
  { label: "Marge Brute Groupe", value: "$90,257", detail: "45.4% du CA", color: "success" },
  { label: "Résultat Net Groupe", value: "$86,827", detail: "Après frais holding", color: "gold" },
  { label: "Transactions", value: "365", detail: "59 + 39 + 267", color: "primary" },
];

export const entityCards = [
  {
    id: 'agency',
    name: 'Prime Circle Agency',
    badge: 'Media Buying',
    gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)',
    metrics: [
      { label: 'Revenue', value: '$10,726' },
      { label: 'Net Revenue', value: '$4,489', colorClass: 'success' },
      { label: 'Media Géré', value: '$279.7K', colorClass: 'primary' },
      { label: 'Clients Actifs', value: '47' },
    ],
    margin: 41.8,
    marginLevel: 'medium' as const,
  },
  {
    id: 'structuring',
    name: 'Prime Circle Structuring',
    badge: 'US Banking',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)',
    metrics: [
      { label: 'Turnover', value: '$53,962' },
      { label: 'Net Profit', value: '$41,371', colorClass: 'success' },
      { label: 'Services', value: '39' },
      { label: 'Completed', value: '26' },
    ],
    margin: 76.7,
    marginLevel: 'high' as const,
  },
  {
    id: 'digit',
    name: 'Digit',
    badge: 'Ad Accounts',
    gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)',
    metrics: [
      { label: 'CA Total', value: '$134,212' },
      { label: 'Company Margin', value: '$46,641', colorClass: 'success' },
      { label: 'Deals', value: '267' },
      { label: 'Ticket Moyen', value: '$503' },
    ],
    margin: 34.8,
    marginLevel: 'medium' as const,
  },
];

export const consolidatedPL = [
  { label: 'CA Prime Circle Agency', value: '$10,726', type: 'positive' },
  { label: 'CA Prime Circle Structuring', value: '$53,962', type: 'positive' },
  { label: 'CA Digit', value: '$134,212', type: 'positive' },
  { label: 'CHIFFRE D\'AFFAIRES GROUPE', value: '$198,900', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Marge Nette Agency (après 50% Blink)', value: '$2,245', type: 'positive' },
  { label: 'Marge Nette Structuring', value: '$41,371', type: 'positive' },
  { label: 'Company Margin Digit', value: '$46,641', type: 'positive' },
  { label: 'MARGE BRUTE GROUPE', value: '$90,257', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Compta + CFO Groupe', value: '-$3,430', type: 'negative' },
  { label: 'RÉSULTAT NET GROUPE', value: '$86,827', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Maxence (37.5%)', value: '-$29,304', type: 'negative' },
  { label: 'Thibault (37.5%)', value: '-$29,304', type: 'negative' },
  { label: 'Florian (25%)', value: '-$19,536', type: 'negative' },
  { label: 'SALAIRES MANAGEMENT (90%)', value: '-$78,144', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'RÉSERVES HOLDING (10%)', value: '$8,683', type: 'highlight' },
];

export const pieData = [
  { name: 'Agency ($2.2K)', value: 2245, color: '#4F5BD5' },
  { name: 'Structuring ($41.4K)', value: 41371, color: '#1E3A5F' },
  { name: 'Digit ($46.6K)', value: 46641, color: '#D946A8' },
];

// Agency Tab
export const agencyKPIs = [
  { label: 'Gross Revenue', value: '$10,726', detail: 'Sub + Setup', color: 'blue' },
  { label: 'Total Dépenses', value: '$6,237', detail: '58.2% du revenue', color: 'orange' },
  { label: 'Net Revenue', value: '$4,489', detail: 'Marge 41.8%', color: 'green' },
  { label: 'PCA Share (50%)', value: '$2,245', detail: 'Dû à Blink', color: 'pink' },
  { label: 'Transactions', value: '59', detail: '21 New - 20 Trial', color: 'blue' },
  { label: 'Clients Actifs', value: '47', detail: '12 Stopped', color: 'green' },
  { label: 'Total Encaissé', value: '$28,975', detail: 'Incl. CL media', color: 'navy' },
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
  { label: 'Company Margin', value: '$46,641', detail: 'KPI Principal', color: 'pink' },
  { label: "Chiffre d'Affaires", value: '$134,212', detail: 'Total facturé', color: 'green' },
  { label: 'Taux de Marge', value: '34.8%', detail: 'Margin / CA', color: 'blue' },
  { label: 'Nombre de Deals', value: '267', detail: 'Transactions', color: 'gold' },
];

export const digitWaterfall = [
  { label: 'CA Total', value: '$134,212', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Provider Cost', value: '-$29,708', type: 'negative' },
  { label: 'Blink Commission', value: '-$14,735', type: 'negative' },
  { label: 'Sales Commission', value: '-$3,896', type: 'negative' },
  { label: 'Spy Product Cost', value: '-$11,250', type: 'negative' },
  { label: 'Cost Salary (Fixe)', value: '-$25,366', type: 'negative' },
  { label: 'Autres Charges', value: '-$2,616', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$87,571', type: 'total-negative' },
  { label: 'COMPANY MARGIN', value: '$46,641', type: 'highlight' },
];

export const digitRevenueBreakdown = [
  { name: 'Set-up', value: 77409, pct: '58%', type: 'One-time' },
  { name: 'Ad Account', value: 27305, pct: '20%', type: 'Recurring' },
  { name: 'Spy', value: 16750, pct: '12%', type: 'Recurring' },
  { name: 'BM', value: 5651, pct: '4%', type: 'One-time' },
  { name: 'Autres (Page, Trust, Comm)', value: 7097, pct: '6%', type: 'Mix' },
];

export const digitRevenueChart = [
  { name: 'Set-up', value: 77409, color: '#D946A8' },
  { name: 'Ad Account', value: 27305, color: '#D946A8' },
  { name: 'Spy', value: 16750, color: '#D946A8' },
  { name: 'BM', value: 5651, color: '#D946A8' },
  { name: 'Page', value: 2770, color: '#D946A8' },
  { name: 'Trust', value: 1560, color: '#D946A8' },
  { name: 'Comm', value: 1253, color: '#D946A8' },
];

// Holding Tab
export const holdingKPIs = [
  { label: 'Résultat Net Groupe', value: '$86,827', detail: 'Après frais holding', color: 'navy' },
  { label: 'Distribuable (90%)', value: '$78,144', detail: 'Salaires management', color: 'gold' },
  { label: 'Réserves (10%)', value: '$8,683', detail: 'Trésorerie holding', color: 'green' },
  { label: 'Frais Compta/CFO', value: '$3,430', detail: 'Refacturés aux entités', color: 'pink' },
];

export const holdingManagementFees = [
  { label: 'Prime Circle Agency', value: '$2,245', type: 'positive' },
  { label: 'Prime Circle Structuring', value: '$41,371', type: 'positive' },
  { label: 'Digit', value: '$46,641', type: 'positive' },
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
  { label: '', value: '', type: 'spacer' },
  { label: 'Maxence (37.5%)', value: '-$29,304', type: 'negative' },
  { label: 'Thibault (37.5%)', value: '-$29,304', type: 'negative' },
  { label: 'Florian (25%)', value: '-$19,536', type: 'negative' },
  { label: 'TOTAL SALAIRES', value: '-$78,144', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'RÉSERVES HOLDING (10%)', value: '$8,683', type: 'highlight' },
];

export const holdingSynthese = [
  { label: 'ENTRÉES', value: '$93,687', type: 'total-positive' },
  { label: 'Management fees (marge brute)', value: '$90,257', type: 'positive', indent: true },
  { label: 'Refacturation compta', value: '$3,430', type: 'positive', indent: true },
  { label: '', value: '', type: 'spacer' },
  { label: 'SORTIES', value: '-$85,004', type: 'total-negative' },
  { label: 'Compta + CFO', value: '-$3,430', type: 'negative', indent: true },
  { label: 'Résultat Net Groupe', value: '$86,827', type: 'neutral', indent: true },
  { label: 'Salaires management (90%)', value: '-$78,144', type: 'negative', indent: true },
  { label: '', value: '', type: 'spacer' },
  { label: 'SOLDE HOLDING (10%)', value: '$8,683', type: 'highlight' },
];

export const holdingPieData = [
  { name: 'Maxence ($29.3K)', value: 29304, color: '#1E3A5F' },
  { name: 'Thibault ($29.3K)', value: 29304, color: '#2D4A6F' },
  { name: 'Florian ($19.5K)', value: 19536, color: '#4F5BD5' },
  { name: 'Réserves ($8.7K)', value: 8683, color: '#C9A227' },
];

export const directors = [
  { name: 'Maxence', pct: '37.5%', amount: '$29,304', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)' },
  { name: 'Thibault', pct: '37.5%', amount: '$29,304', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)' },
  { name: 'Florian', pct: '25%', amount: '$19,536', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)' },
];

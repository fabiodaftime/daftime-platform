// Nexus Ventures Group - Consolidated Dashboard Data (Test Fictif)

export const ENTITY_ROUTES: Record<string, string> = {};

export const overviewHero = [
  { label: "Chiffre d'Affaires Groupe", value: "$212,450", detail: "5 entités consolidées", color: "navy" },
  { label: "Marge Brute Groupe", value: "$93,700", detail: "44.1% du CA", color: "success" },
  { label: "Résultat Net Groupe", value: "$87,850", detail: "Après frais holding", color: "gold" },
  { label: "Transactions", value: "412", detail: "Toutes entités", color: "primary" },
];

export const entityCards = [
  {
    id: 'agency',
    name: 'Media Agency',
    badge: 'Media',
    gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)',
    cssClass: 'agency',
    metrics: [
      { label: 'CA', value: '$12,840' },
      { label: 'Marge Nette', value: '$3,110', colorClass: 'success' },
    ],
    margin: 24.2,
    marginLevel: 'medium' as const,
  },
  {
    id: 'structuring',
    name: 'Finance Corp',
    badge: 'Banking',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)',
    cssClass: 'structuring',
    metrics: [
      { label: 'CA', value: '$49,800' },
      { label: 'Marge Nette', value: '$38,210', colorClass: 'success' },
    ],
    margin: 76.7,
    marginLevel: 'high' as const,
  },
  {
    id: 'digit',
    name: 'Tech Solutions',
    badge: 'SaaS',
    gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)',
    cssClass: 'digit',
    metrics: [
      { label: 'CA', value: '$127,300' },
      { label: 'Marge Nette', value: '$44,680', colorClass: 'success' },
    ],
    margin: 35.1,
    marginLevel: 'medium' as const,
  },
  {
    id: 'spy',
    name: 'DataTools',
    badge: 'Tools',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    cssClass: 'spy',
    metrics: [
      { label: 'CA', value: '$19,350' },
      { label: 'Marge Nette', value: '$4,790', colorClass: 'success' },
    ],
    margin: 24.8,
    marginLevel: 'low' as const,
  },
  {
    id: 'comment',
    name: 'ReviewBoost',
    badge: 'Trust',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    cssClass: 'comment',
    metrics: [
      { label: 'CA', value: '$3,160' },
      { label: 'Marge Nette', value: '$2,910', colorClass: 'success' },
    ],
    margin: 92.1,
    marginLevel: 'high' as const,
  },
];

export const consolidatedPL = [
  { label: 'CA Media Agency', value: '$12,840', type: 'positive' },
  { label: 'CA Finance Corp', value: '$49,800', type: 'positive' },
  { label: 'CA Tech Solutions', value: '$127,300', type: 'positive' },
  { label: 'CA DataTools', value: '$19,350', type: 'positive' },
  { label: 'CA ReviewBoost', value: '$3,160', type: 'positive' },
  { label: 'CHIFFRE D\'AFFAIRES GROUPE', value: '$212,450', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Marge Nette Media Agency', value: '$3,110', type: 'positive' },
  { label: 'Marge Nette Finance Corp', value: '$38,210', type: 'positive' },
  { label: 'Marge Nette Tech Solutions', value: '$44,680', type: 'positive' },
  { label: 'Marge Nette DataTools', value: '$4,790', type: 'positive' },
  { label: 'Marge Nette ReviewBoost', value: '$2,910', type: 'positive' },
  { label: 'MARGE BRUTE GROUPE', value: '$93,700', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Compta + CFO Groupe', value: '-$3,850', type: 'negative' },
  { label: 'Salaire Assistante', value: '-$2,000', type: 'negative' },
  { label: 'RÉSULTAT NET GROUPE', value: '$87,850', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Alexandre (37.5%)', value: '-$29,644', type: 'negative' },
  { label: 'Sébastien (37.5%)', value: '-$29,644', type: 'negative' },
  { label: 'Camille (25%)', value: '-$19,763', type: 'negative' },
  { label: 'SALAIRES MANAGEMENT (90%)', value: '-$79,051', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'RÉSERVES HOLDING (10%)', value: '$8,785', type: 'highlight' },
];

export const pieData = [
  { name: 'Media Agency ($3.1K)', value: 3110, color: '#4F5BD5' },
  { name: 'Finance Corp ($38.2K)', value: 38210, color: '#1E3A5F' },
  { name: 'Tech Solutions ($44.7K)', value: 44680, color: '#D946A8' },
  { name: 'DataTools ($4.8K)', value: 4790, color: '#F59E0B' },
  { name: 'ReviewBoost ($2.9K)', value: 2910, color: '#10B981' },
];

// Agency Tab
export const agencyKPIs = [
  { label: 'CA Brut', value: '$12,840', detail: 'Abo + Setup', color: 'blue' },
  { label: 'Total Charges', value: '$9,730', detail: '75.8% du CA', color: 'orange' },
  { label: 'Marge Nette', value: '$3,110', detail: '24.2% du CA', color: 'green' },
  { label: 'Part Groupe (50%)', value: '$1,555', detail: 'Après partage réseau', color: 'pink' },
  { label: 'Transactions', value: '74', detail: '28 Nouveaux - 18 Essai', color: 'blue' },
  { label: 'Clients Actifs', value: '52', detail: '10 Arrêtés', color: 'green' },
  { label: 'Total Encaissé', value: '$34,200', detail: 'Incl. media géré', color: 'navy' },
  { label: 'Media Géré', value: '$312.5K', detail: '38 ad accounts', color: 'gold' },
];

export const agencyWaterfall = [
  { label: 'Subscriptions', value: '$9,450', type: 'positive' },
  { label: 'Frais Setup', value: '$3,550', type: 'positive' },
  { label: 'Discounts', value: '-$160', type: 'negative' },
  { label: 'CA BRUT', value: '$12,840', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Coûts Setup (agents)', value: '-$1,500', type: 'negative' },
  { label: 'Salaires', value: '-$1,400', type: 'negative' },
  { label: 'Publicité', value: '-$1,230', type: 'negative' },
  { label: 'Com. Apporteur (10%)', value: '-$3,150', type: 'negative' },
  { label: 'Com. Master (5%)', value: '-$84', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$7,364', type: 'total-negative' },
  { label: 'MARGE NETTE', value: '$5,476', type: 'highlight' },
];

export const agencyExpensesPie = [
  { name: 'Com. Apporteur', value: 3150, color: '#EF4444' },
  { name: 'Coûts Setup', value: 1500, color: '#F59E0B' },
  { name: 'Salaires', value: 1400, color: '#4F5BD5' },
  { name: 'Publicité', value: 1230, color: '#D946A8' },
  { name: 'Com. Master', value: 84, color: '#94A3B8' },
];

export const agencyRisks = [
  { label: 'Concentration Client A', value: '55.3%', detail: 'du media dépensé', severity: 'danger' },
  { label: 'Exposition Crédit', value: '$18.5K', detail: 'media avancé', severity: 'danger' },
  { label: 'Marge Nette', value: '24.2%', detail: 'vs 31.5% en Dec', severity: 'warning' },
  { label: 'Clients Arrêtés', value: '10', detail: '19% des clients', severity: 'warning' },
];

// Structuring (Finance Corp) Tab
export const structuringKPIs = [
  { label: 'Total Clients', value: '44', detail: "Géré par l'équipe", color: 'navy' },
  { label: 'CA', value: '$49,800', detail: 'Moy. $1,132/client', color: 'green' },
  { label: 'Marge Nette', value: '$38,210', detail: '76.7% du CA', color: 'gold' },
  { label: 'Complétés', value: '30', detail: '14 en cours', color: 'blue' },
];

export const structuringWaterfall = [
  { label: 'CA', value: '$49,800', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Publicité', value: '-$2,900', type: 'negative' },
  { label: 'Com. Sales', value: '-$3,880', type: 'negative' },
  { label: 'Com. Referral', value: '-$450', type: 'negative' },
  { label: 'Events', value: '-$1,200', type: 'negative' },
  { label: 'Coûts Fournisseurs', value: '-$3,160', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$11,590', type: 'total-negative' },
  { label: 'MARGE NETTE', value: '$38,210', type: 'highlight' },
];

export const structuringServices = [
  { name: 'Company Formation', value: 21500, pct: '43%', status: 'Top' },
  { name: 'Adresse Virtuelle', value: 14800, pct: '30%', status: 'Top' },
  { name: 'Corporate Banking', value: 7200, pct: '14%', status: 'Croissance' },
  { name: 'Payment Solutions', value: 3900, pct: '8%', status: 'Stable' },
  { name: 'Compliance Services', value: 2400, pct: '5%', status: 'Stable' },
];

export const structuringServicesChart = [
  { name: 'Company Form.', value: 21500, color: '#1E3A5F' },
  { name: 'Adresse Virt.', value: 14800, color: '#10B981' },
  { name: 'Corp. Banking', value: 7200, color: '#C9A227' },
  { name: 'Payment Sol.', value: 3900, color: '#F59E0B' },
  { name: 'Compliance', value: 2400, color: '#4F5BD5' },
];

// Digit (Tech Solutions) Tab
export const digitKPIs = [
  { label: 'Marge Nette', value: '$44,680', detail: '35.1% du CA', color: 'pink' },
  { label: 'CA', value: '$127,300', detail: 'Setup + Licences', color: 'green' },
  { label: 'Taux de Marge', value: '35.1%', detail: 'Marge / CA', color: 'blue' },
  { label: 'Transactions', value: '298', detail: '251 Setup + 47 Licences', color: 'gold' },
];

export const digitWaterfall = [
  { label: 'CA', value: '$127,300', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Coûts Fournisseurs', value: '-$33,400', type: 'negative' },
  { label: 'Com. Réseau', value: '-$14,500', type: 'negative' },
  { label: 'Com. Sales', value: '-$3,600', type: 'negative' },
  { label: 'Salaires (Fixe)', value: '-$27,800', type: 'negative' },
  { label: 'Autres (Outils, Frais...)', value: '-$3,320', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$82,620', type: 'total-negative' },
  { label: 'MARGE NETTE', value: '$44,680', type: 'highlight' },
];

export const digitRevenueBreakdown = [
  { name: 'Set-up Premium', value: 85200, deals: '251', ticket: '$339' },
  { name: 'Licence Pro', value: 31400, deals: '47', ticket: '$668' },
  { name: 'Module Analytics', value: 6100, deals: '—', ticket: '—' },
  { name: 'Module Automation', value: 3200, deals: '—', ticket: '—' },
  { name: 'Autres', value: 1400, deals: '—', ticket: '—' },
];

export const digitRevenueChart = [
  { name: 'Set-up Premium', value: 85200, color: '#D946A8' },
  { name: 'Licence Pro', value: 31400, color: '#EC4899' },
  { name: 'Module Analytics', value: 6100, color: '#F472B6' },
  { name: 'Module Auto.', value: 3200, color: '#F9A8D4' },
  { name: 'Autres', value: 1400, color: '#FBCFE8' },
];

// SPY (DataTools) Tab
export const spyKPIs = [
  { label: 'CA', value: '$19,350', detail: "Outils d'analyse", color: 'orange' },
  { label: 'Marge Nette', value: '$4,790', detail: '24.8% du CA', color: 'green' },
  { label: 'Coûts Produit', value: '$12,800', detail: '66.2% du CA', color: 'pink' },
  { label: 'Total Com.', value: '$1,760', detail: 'Réseau + Sales', color: 'blue' },
];

export const spyWaterfall = [
  { label: 'CA', value: '$19,350', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Coûts Produit (Licences)', value: '-$12,800', type: 'negative' },
  { label: 'Com. Réseau', value: '-$1,290', type: 'negative' },
  { label: 'Com. Sales', value: '-$470', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$14,560', type: 'total-negative' },
  { label: 'MARGE NETTE', value: '$4,790', type: 'highlight' },
];

export const spyCostsPie = [
  { name: 'Marge Nette ($4.8K)', value: 4790, color: '#10B981' },
  { name: 'Coûts Produit ($12.8K)', value: 12800, color: '#F59E0B' },
  { name: 'Com. Réseau ($1.3K)', value: 1290, color: '#D946A8' },
  { name: 'Com. Sales ($0.5K)', value: 470, color: '#4F5BD5' },
];

export const spyAnalysis = [
  { label: 'Coûts Produit', value: '66.2%', detail: 'Part importante des licences', severity: 'warning' },
  { label: 'Com. Totales', value: '9.1%', detail: 'Réseau 6.7% + Sales 2.4%', severity: 'primary' },
  { label: 'Taux de Marge', value: '24.8%', detail: 'Marge la plus faible', severity: 'success' },
];

// Comment (ReviewBoost) Tab
export const commentKPIs = [
  { label: 'CA', value: '$3,160', detail: "Services d'engagement", color: 'green' },
  { label: 'Marge Nette', value: '$2,910', detail: '92.1% du CA', color: 'green' },
  { label: 'Coûts Produit', value: '$0', detail: 'Aucun coût', color: 'blue' },
  { label: 'Com. Sales', value: '$250', detail: '7.9% du CA', color: 'pink' },
];

export const commentWaterfall = [
  { label: 'CA', value: '$3,160', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Coûts Produit', value: '$0', type: 'muted' },
  { label: 'Com. Sales (7.9%)', value: '-$250', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$250', type: 'total-negative' },
  { label: 'MARGE NETTE', value: '$2,910', type: 'highlight' },
];

// Holding Tab
export const holdingKPIs = [
  { label: 'Résultat Net Groupe', value: '$87,850', detail: 'Après frais holding', color: 'navy' },
  { label: 'Distribuable (90%)', value: '$79,065', detail: 'Salaires management', color: 'gold' },
  { label: 'Réserves (10%)', value: '$8,785', detail: 'Trésorerie holding', color: 'green' },
  { label: 'Frais Holding', value: '$5,850', detail: 'Compta + Assistante', color: 'pink' },
];

export const holdingManagementFees = [
  { label: 'Media Agency', value: '$3,110', type: 'positive' },
  { label: 'Finance Corp', value: '$38,210', type: 'positive' },
  { label: 'Tech Solutions', value: '$44,680', type: 'positive' },
  { label: 'DataTools', value: '$4,790', type: 'positive' },
  { label: 'ReviewBoost', value: '$2,910', type: 'positive' },
  { label: 'TOTAL BÉNÉFICE', value: '$93,700', type: 'total-positive' },
];

export const holdingRefacturation = [
  { label: 'Media Agency (60%)', value: '$2,310', type: 'positive' },
  { label: 'Finance Corp (40%)', value: '$1,540', type: 'positive' },
  { label: 'Tech Solutions (hors scope)', value: '$0', type: 'muted' },
  { label: 'TOTAL REFACTURATION', value: '$3,850', type: 'total-positive' },
];

export const holdingCharges = [
  { label: 'Compta + CFO Groupe', value: '-$3,850', type: 'negative' },
  { label: 'Salaire Assistante', value: '-$2,000', type: 'negative' },
  { label: 'TOTAL FRAIS HOLDING', value: '-$5,850', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Alexandre (37.5%)', value: '-$29,644', type: 'negative' },
  { label: 'Sébastien (37.5%)', value: '-$29,644', type: 'negative' },
  { label: 'Camille (25%)', value: '-$19,763', type: 'negative' },
  { label: 'TOTAL SALAIRES', value: '-$79,051', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'RÉSERVES HOLDING (10%)', value: '$8,785', type: 'highlight' },
];

export const holdingSynthese = [
  { label: 'MARGE BRUTE GROUPE', value: '$93,700', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Compta + CFO', value: '-$3,850', type: 'negative', indent: true },
  { label: 'Salaire Assistante', value: '-$2,000', type: 'negative', indent: true },
  { label: 'RÉSULTAT NET', value: '$87,850', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Salaires management (90%)', value: '-$79,065', type: 'negative', indent: true },
  { label: '', value: '', type: 'spacer' },
  { label: 'RÉSERVES HOLDING (10%)', value: '$8,785', type: 'highlight' },
];

export const holdingPieData = [
  { name: 'Alexandre ($29.6K)', value: 29644, color: '#1E3A5F' },
  { name: 'Sébastien ($29.6K)', value: 29644, color: '#2D4A6F' },
  { name: 'Camille ($19.8K)', value: 19763, color: '#4F5BD5' },
  { name: 'Réserves ($8.8K)', value: 8785, color: '#C9A227' },
];

export const directors = [
  { name: 'Alexandre', pct: '37.5%', amount: '$29,644', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: '' },
  { name: 'Sébastien', pct: '37.5%', amount: '$29,644', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: '' },
  { name: 'Camille', pct: '25%', amount: '$19,763', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', subtitle: '' },
];

// Prime Circle Group - Consolidated Dashboard Data - FÉVRIER 2026

export const ENTITY_ROUTES = {
  agency: '/dashboard-prime-circle-agency/856d4617-0956-45f9-860e-baa0662e78e5',
  structuring: '/dashboard-prime-circle/84c179cf-20d2-4d56-b9b0-c6273cd3dd8b',
  digit: '/dashboard-digit/edb0ce96-ad6f-45bf-842a-8f237976ac4f',
};

// ===== OVERVIEW TAB =====
export const overviewHero = [
  { label: "CA Groupe", value: "$258,543", detail: "6 entités consolidées", color: "navy", variance: "+30.0% vs Jan", varType: "positive" },
  { label: "Marge Brute Groupe", value: "$112,393", detail: "43.5% du CA", color: "success", variance: "+25.4% vs Jan", varType: "positive" },
  { label: "Résultat Net Holding", value: "$94,094", detail: "Après frais holding", color: "gold", variance: "+27.9% vs Jan", varType: "positive" },
  { label: "Réserves Filiales", value: "$11,239", detail: "10% marge brute", color: "primary", variance: "+25.4% vs Jan", varType: "positive" },
];

export const overviewComparison = [
  { entity: 'Agency (Part PCA 50%)', jan: '$2,245', feb: '$12,237', variation: '+445.1%', varType: 'positive', ytd: '$14,482' },
  { entity: 'Structuring', jan: '$41,371', feb: '$53,296', variation: '+28.8%', varType: 'positive', ytd: '$94,667' },
  { entity: 'Digit Solution', jan: '$40,198', feb: '$43,249', variation: '+7.6%', varType: 'positive', ytd: '$83,447' },
  { entity: 'SPY', jan: '$3,262', feb: '$3,559', variation: '+9.1%', varType: 'positive', ytd: '$6,821' },
  { entity: 'Comment/Trustpilot', jan: '$2,531', feb: '$52', variation: '-97.9%', varType: 'negative', ytd: '$2,583' },
];

export const overviewComparisonTotal = { entity: 'MARGE BRUTE GROUPE', jan: '$89,607', feb: '$112,393', variation: '+25.4%', varType: 'positive', ytd: '$202,000' };

export const entityCards = [
  {
    id: 'agency', name: 'Agency', badge: 'Media',
    gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', cssClass: 'agency',
    metrics: [
      { label: 'CA', value: '$35,080' },
      { label: 'Marge Nette', value: '$12,237', colorClass: 'success' },
    ],
    margin: 34.9, marginLevel: 'medium' as const,
  },
  {
    id: 'structuring', name: 'Structuring', badge: 'Banking',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', cssClass: 'structuring',
    metrics: [
      { label: 'CA', value: '$73,500' },
      { label: 'Marge Nette', value: '$53,296', colorClass: 'success' },
    ],
    margin: 72.5, marginLevel: 'high' as const,
  },
  {
    id: 'digit', name: 'Digit Solution', badge: 'Ad Accounts',
    gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)', cssClass: 'digit',
    metrics: [
      { label: 'CA', value: '$122,330' },
      { label: 'Marge Nette', value: '$43,249', colorClass: 'success' },
    ],
    margin: 35.4, marginLevel: 'medium' as const,
  },
  {
    id: 'spy', name: 'SPY', badge: 'Tools',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', cssClass: 'spy',
    metrics: [
      { label: 'CA', value: '$27,300' },
      { label: 'Marge Nette', value: '$3,559', colorClass: 'success' },
    ],
    margin: 13.0, marginLevel: 'low' as const,
  },
  {
    id: 'comment', name: 'Comment', badge: 'Trust',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', cssClass: 'comment',
    metrics: [
      { label: 'CA', value: '$333' },
      { label: 'Marge Nette', value: '$52', colorClass: 'success' },
    ],
    margin: 15.6, marginLevel: 'low' as const,
  },
];

export const consolidatedPL = [
  { label: 'Marge Nette Agency (après 50% Blink)', value: '$12,237', type: 'positive' },
  { label: 'Marge Nette Structuring', value: '$53,296', type: 'positive' },
  { label: 'Marge Nette Digit Solution', value: '$43,249', type: 'positive' },
  { label: 'Marge Nette SPY', value: '$3,559', type: 'positive' },
  { label: 'Marge Nette Comment/Trustpilot', value: '$52', type: 'positive' },
  { label: 'MARGE BRUTE GROUPE', value: '$112,393', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Réserves Filiales (10%)', value: '-$11,239', type: 'negative' },
  { label: 'REMONTÉE HOLDING (90%)', value: '$101,154', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Compta + CFO Groupe', value: '-$3,430', type: 'negative' },
  { label: 'Salaire Assistante', value: '-$1,630', type: 'negative' },
  { label: 'Salaires Fixes Sales', value: '-$2,000', type: 'negative' },
  { label: 'RÉSULTAT NET HOLDING', value: '$94,094', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Maxence (37.5%)', value: '-$35,285', type: 'negative' },
  { label: 'Thibault (37.5%)', value: '-$35,285', type: 'negative' },
  { label: '↳ dont Will', value: '$10,000', type: 'indent-muted' },
  { label: 'Florian (25%)', value: '-$23,524', type: 'negative' },
  { label: 'SALAIRES MANAGEMENT (100%)', value: '-$94,094', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'SOLDE HOLDING', value: '$0', type: 'highlight' },
];

export const pieData = [
  { name: 'Agency ($12.2K)', value: 12237, color: '#F59E0B' },
  { name: 'Structuring ($53.3K)', value: 53296, color: '#1E3A5F' },
  { name: 'Digit Sol. ($43.2K)', value: 43249, color: '#4F5BD5' },
  { name: 'SPY ($3.6K)', value: 3559, color: '#10B981' },
  { name: 'Comment ($52)', value: 52, color: '#D946A8' },
];

// ===== YTD TAB =====
export const ytdHero = [
  { label: "CA YTD", value: "$457,443", detail: "Jan + Fév 2026", color: "navy" },
  { label: "Marge Brute YTD", value: "$202,000", detail: "44.2% du CA", color: "success" },
  { label: "Résultat Net YTD", value: "$167,680", detail: "Holding cumulé", color: "gold" },
  { label: "Réserves Cumulées", value: "$20,200", detail: "Toutes filiales", color: "primary" },
];

export const ytdMonthlyTable = [
  { month: 'Janvier 2026', ca: '$198,900', margin: '$89,607', taux: '45.1%', net: '$73,586' },
  { month: 'Février 2026', ca: '$258,543', margin: '$112,393', taux: '43.5%', net: '$94,094' },
];
export const ytdMonthlyTotal = { month: 'YTD TOTAL', ca: '$457,443', margin: '$202,000', taux: '44.2%', net: '$167,680' };

export const ytdEntityTable = [
  { entity: 'Agency (Part PCA)', jan: '$2,245', feb: '$12,237', ytd: '$14,482', pct: '7.2%' },
  { entity: 'Structuring', jan: '$41,371', feb: '$53,296', ytd: '$94,667', pct: '46.9%' },
  { entity: 'Digit Solution', jan: '$40,198', feb: '$43,249', ytd: '$83,447', pct: '41.3%' },
  { entity: 'SPY', jan: '$3,262', feb: '$3,559', ytd: '$6,821', pct: '3.4%' },
  { entity: 'Comment/Trustpilot', jan: '$2,531', feb: '$52', ytd: '$2,583', pct: '1.3%' },
];
export const ytdEntityTotal = { entity: 'TOTAL GROUPE', jan: '$89,607', feb: '$112,393', ytd: '$202,000', pct: '100%' };

export const ytdTrendData = [
  { month: 'Janvier', ca: 198900, margin: 89607, net: 73586 },
  { month: 'Février', ca: 258543, margin: 112393, net: 94094 },
];

// ===== AGENCY TAB =====
export const agencyKPIs = [
  { label: 'CA Brut', value: '$35,080', detail: '+227% vs Jan ($10,726)', color: 'navy' },
  { label: 'Marge Nette', value: '$24,473', detail: '69.8% du CA', color: 'green' },
  { label: 'Part PCA (50%)', value: '$12,237', detail: 'Après split Blink', color: 'gold' },
  { label: 'Total Charges', value: '$10,606', detail: '30.2% du CA', color: 'pink' },
];

export const agencyComparison = [
  { indicator: 'CA Brut', jan: '$10,726', feb: '$35,080', variation: '+227.0%', varType: 'positive' },
  { indicator: 'Marge Nette', jan: '$4,489', feb: '$24,473', variation: '+445.2%', varType: 'positive' },
  { indicator: 'Part PCA (50%)', jan: '$2,245', feb: '$12,237', variation: '+445.1%', varType: 'positive' },
  { indicator: 'Media Géré', jan: '$279,691', feb: '$515,952', variation: '+84.5%', varType: 'positive' },
  { indicator: 'Transactions', jan: '62', feb: '145', variation: '+133.9%', varType: 'positive' },
];

export const agencyWaterfall = [
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
];

export const agencyExpensesPie = [
  { name: 'Publicité', value: 6666, color: '#D946A8' },
  { name: 'Coûts Setup', value: 2500, color: '#F59E0B' },
  { name: 'Salaires', value: 1200, color: '#4F5BD5' },
  { name: 'Com. Master', value: 211, color: '#94A3B8' },
  { name: 'No Limit Ref.', value: 30, color: '#10B981' },
];

export const agencyRisks = [
  { label: 'Concentration Salmech', value: '25.6%', detail: 'du media dépensé', severity: 'warning' },
  { label: 'CL Exposure', value: '$211K', detail: 'x10 vs Jan', severity: 'danger' },
  { label: 'Marge Nette', value: '69.8%', detail: 'vs 41.8% en Jan', severity: 'success' },
];

// ===== STRUCTURING TAB =====
export const structuringKPIs = [
  { label: 'CA', value: '$73,500', detail: '+38.4% vs Jan', color: 'navy' },
  { label: 'Marge Nette', value: '$53,296', detail: '72.5% du CA', color: 'green' },
  { label: 'Clients', value: '53', detail: '+35.9% vs Jan (39)', color: 'gold' },
  { label: 'Total Charges', value: '$20,204', detail: '27.5% du CA', color: 'pink' },
];

export const structuringComparison = [
  { indicator: 'CA', jan: '$53,962', feb: '$73,500', variation: '+36.2%', varType: 'positive' },
  { indicator: 'Marge Nette', jan: '$41,371', feb: '$53,296', variation: '+28.8%', varType: 'positive' },
  { indicator: 'Taux de Marge', jan: '76.7%', feb: '72.5%', variation: '-4.2pts', varType: 'negative' },
  { indicator: 'Clients', jan: '39', feb: '53', variation: '+35.9%', varType: 'positive' },
  { indicator: 'Ticket Moyen', jan: '$1,384', feb: '$1,387', variation: '+0.2%', varType: 'positive' },
];

export const structuringWaterfall = [
  { label: 'CA', value: '$73,500', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Publicité (ADS)', value: '-$4,525', type: 'negative' },
  { label: 'Com. Sales Nathan', value: '-$5,498', type: 'negative' },
  { label: 'Coûts Fournisseurs', value: '-$10,181', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$20,204', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'MARGE NETTE', value: '$53,296', type: 'highlight' },
];

export const structuringServices = [
  { name: 'LLC Services', value: 19400, pct: '36%', status: 'Top' },
  { name: 'Physical Address US', value: 17700, pct: '33%', status: 'Top' },
  { name: 'AMEX', value: 8000, pct: '15%', status: 'Croissance' },
  { name: 'Autres Banking', value: 4848, pct: '9%', status: 'Stable' },
  { name: 'Revolut Business', value: 4014, pct: '7%', status: 'Stable' },
];

export const structuringServicesChart = [
  { name: 'LLC Services', value: 19400, color: '#1E3A5F' },
  { name: 'Physical Addr.', value: 17700, color: '#10B981' },
  { name: 'AMEX', value: 8000, color: '#C9A227' },
  { name: 'Autres Banking', value: 4848, color: '#F59E0B' },
  { name: 'Revolut Biz', value: 4014, color: '#4F5BD5' },
];

// ===== DIGIT TAB =====
export const digitKPIs = [
  { label: 'CA', value: '$122,330', detail: '-8.9% vs Jan ($134,212)', color: 'navy' },
  { label: 'Marge Nette', value: '$43,249', detail: '35.4% du CA', color: 'green' },
  { label: 'Deals', value: '194', detail: '151 Setup + 43 Ad Account', color: 'gold' },
  { label: 'Total Charges', value: '$79,081', detail: '64.6% du CA', color: 'pink' },
];

export const digitComparison = [
  { indicator: 'CA', jan: '$114,649', feb: '$122,330', variation: '+6.7%', varType: 'positive' },
  { indicator: 'Marge Nette', jan: '$40,198', feb: '$43,249', variation: '+7.6%', varType: 'positive' },
  { indicator: 'Taux de Marge', jan: '35.1%', feb: '35.4%', variation: '+0.3pts', varType: 'positive' },
  { indicator: 'Deals', jan: '267', feb: '194', variation: '-27.3%', varType: 'negative' },
  { indicator: 'Ticket Moyen', jan: '$429', feb: '$631', variation: '+47.0%', varType: 'positive' },
];

export const digitWaterfall = [
  { label: 'CA', value: '$122,330', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Coûts Fournisseurs', value: '-$33,906', type: 'negative' },
  { label: 'Com. Blink', value: '-$12,922', type: 'negative' },
  { label: 'Com. Sales', value: '-$2,656', type: 'negative' },
  { label: 'Salaires', value: '-$21,971', type: 'negative' },
  { label: 'Autres (Tools, Fees, Refunds, BizExp)', value: '-$7,626', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$79,081', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'MARGE NETTE', value: '$43,249', type: 'highlight' },
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

// ===== SPY TAB =====
export const spyKPIs = [
  { label: 'CA', value: '$27,300', detail: '+63.0% vs Jan ($16,750)', color: 'navy' },
  { label: 'Marge Nette', value: '$3,559', detail: '13.0% du CA', color: 'green' },
  { label: 'Deals', value: '5', detail: 'Licences SPY', color: 'gold' },
  { label: 'Total Charges', value: '$13,487', detail: '49.4% du CA', color: 'pink' },
];

export const spyWaterfall = [
  { label: 'CA', value: '$27,300', type: 'positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Coûts Produit/Licences', value: '-$11,250', type: 'negative' },
  { label: 'Com. Blink', value: '-$1,812', type: 'negative' },
  { label: 'Com. Sales', value: '-$425', type: 'negative' },
  { label: 'TOTAL CHARGES', value: '-$13,487', type: 'total-negative' },
  { label: '', value: '', type: 'spacer' },
  { label: 'MARGE NETTE', value: '$3,559', type: 'highlight' },
];

export const spyCostsPie = [
  { name: 'Marge Nette ($3.6K)', value: 3559, color: '#10B981' },
  { name: 'Coûts Produit ($11.3K)', value: 11250, color: '#F59E0B' },
  { name: 'Com. Blink ($1.8K)', value: 1812, color: '#D946A8' },
  { name: 'Com. Sales ($0.4K)', value: 425, color: '#4F5BD5' },
];

export const spyAnalysis = [
  { label: 'Coûts Produit', value: '41.2%', detail: 'Part des licences', severity: 'warning' },
  { label: 'Com. Totales', value: '8.2%', detail: 'Blink + Sales', severity: 'primary' },
  { label: 'Taux de Marge', value: '13.0%', detail: 'Marge la plus faible', severity: 'success' },
];

// ===== COMMENT/TRUSTPILOT TAB =====
export const commentKPIs = [
  { label: 'CA', value: '$333', detail: '-88.2% vs Jan ($2,813)', color: 'navy' },
  { label: 'Marge Nette', value: '$52', detail: '15.6% du CA', color: 'green' },
  { label: 'Deals', value: '20', detail: '16 Comment + 4 Trustpilot', color: 'gold' },
  { label: 'Com. Sales', value: '$281', detail: '84.4% du CA', color: 'pink' },
];

export const commentWaterfall = [
  { label: 'CA', value: '$333', type: 'positive' },
  { label: 'Coûts Produit', value: '$0', type: 'muted' },
  { label: 'Com. Sales (10%)', value: '-$281', type: 'negative' },
  { label: 'MARGE NETTE', value: '$52', type: 'highlight' },
];

export const commentWarning = "Activité en forte baisse ce mois. CA divisé par ~8 vs janvier.";

// ===== HOLDING TAB =====
export const holdingKPIs = [
  { label: 'Remontée Holding (90%)', value: '$101,154', detail: 'Bénéfices filiales', color: 'navy' },
  { label: 'Résultat Net Holding', value: '$94,094', detail: '100% distribué', color: 'gold' },
  { label: 'Réserves Filiales (10%)', value: '$11,239', detail: 'Trésorerie entités', color: 'green' },
  { label: 'Frais Holding', value: '$7,060', detail: 'Compta + Assist. + Sales', color: 'pink' },
];

export const holdingComparison = [
  { indicator: 'Marge Brute Groupe', jan: '$89,607', feb: '$112,393', variation: '+25.4%', varType: 'positive' },
  { indicator: 'Réserves Filiales (10%)', jan: '$8,961', feb: '$11,239', variation: '+25.4%', varType: 'positive' },
  { indicator: 'Remontée Holding (90%)', jan: '$80,646', feb: '$101,154', variation: '+25.4%', varType: 'positive' },
  { indicator: 'Frais Holding', jan: '$7,060', feb: '$7,060', variation: '0%', varType: 'neutral' },
  { indicator: 'Résultat Net Holding', jan: '$73,586', feb: '$94,094', variation: '+27.9%', varType: 'positive' },
];

export const holdingManagementFees = [
  { label: 'Prime Circle Agency', value: '$12,237', type: 'positive' },
  { label: 'Prime Circle Structuring', value: '$53,296', type: 'positive' },
  { label: 'Digit Solution', value: '$43,249', type: 'positive' },
  { label: 'SPY', value: '$3,559', type: 'positive' },
  { label: 'Comment/Trustpilot', value: '$52', type: 'positive' },
  { label: 'MARGE BRUTE GROUPE', value: '$112,393', type: 'total-positive' },
];

export const holdingSynthese = [
  { label: 'MARGE BRUTE GROUPE', value: '$112,393', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Réserves Filiales (10%)', value: '-$11,239', type: 'negative', indent: true },
  { label: 'REMONTÉE HOLDING (90%)', value: '$101,154', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Compta + CFO', value: '-$3,430', type: 'negative', indent: true },
  { label: 'Salaire Assistante', value: '-$1,630', type: 'negative', indent: true },
  { label: 'Salaires Fixes Sales', value: '-$2,000', type: 'negative', indent: true },
  { label: 'RÉSULTAT NET HOLDING', value: '$94,094', type: 'total-positive' },
  { label: '', value: '', type: 'spacer' },
  { label: 'Salaires management (100%)', value: '-$94,094', type: 'negative', indent: true },
  { label: '↳ dont Will (via Thibault)', value: '$10,000', type: 'indent-muted', indent: true },
  { label: '', value: '', type: 'spacer' },
  { label: 'SOLDE HOLDING', value: '$0', type: 'highlight' },
];

export const holdingPieData = [
  { name: 'Maxence ($35.3K)', value: 35285, color: '#1E3A5F' },
  { name: 'Thibault ($35.3K)', value: 35285, color: '#2D4A6F' },
  { name: 'Florian ($23.5K)', value: 23524, color: '#4F5BD5' },
  { name: 'Réserves Fil. ($11.2K)', value: 11239, color: '#C9A227' },
];

export const directors = [
  { name: 'Maxence', pct: '37.5%', amount: '$35,285', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: 'vs $27,595 Jan (+27.9%)' },
  { name: 'Thibault', pct: '37.5%', amount: '$35,285', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', subtitle: 'dont $10K Will' },
  { name: 'Florian', pct: '25%', amount: '$23,524', gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', subtitle: 'vs $18,396 Jan (+27.9%)' },
];

// ===== RESERVES TAB =====
export const reservesHero = [
  { label: "Réserves Janvier", value: "$8,961", detail: "10% marge brute Jan", color: "navy" },
  { label: "Réserves Février", value: "$11,239", detail: "10% marge brute Fév", color: "success" },
  { label: "Réserves YTD", value: "$20,200", detail: "Cumul 2026", color: "gold" },
  { label: "Croissance", value: "+25.4%", detail: "Fév vs Jan", color: "primary" },
];

export const reservesEntityTable = [
  { entity: 'Agency (Part PCA)', jan: '$225', feb: '$1,224', ytd: '$1,448' },
  { entity: 'Structuring', jan: '$4,137', feb: '$5,330', ytd: '$9,467' },
  { entity: 'Digit Solution', jan: '$4,020', feb: '$4,325', ytd: '$8,345' },
  { entity: 'SPY', jan: '$326', feb: '$356', ytd: '$682' },
  { entity: 'Comment/Trustpilot', jan: '$253', feb: '$5', ytd: '$258' },
];
export const reservesEntityTotal = { entity: 'TOTAL RÉSERVES', jan: '$8,961', feb: '$11,239', ytd: '$20,200' };

export const reservesCards = [
  { name: 'Agency (Part PCA)', amount: '$1,448', pct: '7.2%' },
  { name: 'Structuring', amount: '$9,467', pct: '46.9%' },
  { name: 'Digit Solution', amount: '$8,345', pct: '41.3%' },
  { name: 'SPY', amount: '$682', pct: '3.4%' },
  { name: 'Comment/Trustpilot', amount: '$258', pct: '1.3%' },
];

// ─── Skalis Middle East — FY 2025 Data ───

export const SKALIS_KPI = {
  revenue: 6_561_487,
  cogsDirect: 4_874_880,
  cogsPercent: 74.3,
  difcFees: 219_067,
  medicalInsurance: 54_829,
  margeDirecte: 1_412_711,
  margeDirectePercent: 21.5,
  internalSalary: 260_256,
  structureCosts: 427_891,
  structureCostsPercent: 6.5,
  resultatOperationnel: 984_821,
  fxGain: 26_813,
  resultatNet: 1_011_634,
  margeNette: 15.4,
  margeOperationnelle: 15.0,
  cashBanques: 258_096,
  arNonEncaisse: 1_861_539,
  consultantsPortes: 16,
  caMoyenConsultant: 327_879,
  facturesEmises: 126,
};

export const PL_ROWS = [
  { section: 'PRODUITS' },
  { label: "Chiffre d'Affaires", value: 6_561_487, level: 0, highlight: true },
  { label: '↳ Sales', value: 6_561_276, level: 2 },
  { label: '↳ Autres charges (produit)', value: 211, level: 2 },
  { label: 'Coût des Ventes (COGS officiel)', value: 0, level: 1, color: 'green' },
  { label: 'Marge Brute', value: 6_561_487, level: 0, positive: true },
  { section: 'COGS ÉCONOMIQUE — COÛTS DIRECTS CONSULTANTS' },
  { label: 'External Salary (salaires portés)', value: -3_046_591, level: 1, negative: true },
  { label: 'Consultant Expense (coût direct)', value: -1_828_289, level: 1, negative: true },
  { label: 'Sous-total COGS économique', value: -4_874_880, level: 'cogs' },
  { section: 'COÛTS DIRECTS LIÉS À LA STRUCTURE DIFC' },
  { label: 'DIFC Fees (licence, conformité)', value: -219_067, level: 1, negative: true },
  { label: 'Medical Insurance', value: -54_829, level: 1, negative: true },
  { label: "MARGE DIRECTE D'ACTIVITÉ", value: 1_412_711, level: 'mdir' },
  { label: 'Taux de marge directe', value: '21,5%', level: 2, color: 'purple' },
  { section: 'COÛTS DE STRUCTURE' },
  { label: 'Internal Salary (business development)', value: -260_256, level: 1, negative: true },
  { label: 'Frais bancaires', value: -38_241, level: 1, negative: true },
  { label: 'Travel Expense', value: -27_113, level: 1, negative: true },
  { label: 'Legal Expense', value: -83_564, level: 1, negative: true },
  { label: 'IT & Internet', value: -11_025, level: 1, negative: true },
  { label: 'Accounting & Audit', value: -6_734, level: 1, negative: true },
  { label: 'Autres frais', value: -958, level: 1, negative: true },
  { label: 'Total charges de structure', value: -427_891, level: 0, color: 'blue' },
  { label: 'Résultat opérationnel', value: 984_821, level: 0, positive: true, highlight: true },
  { section: 'HORS EXPLOITATION' },
  { label: 'Gain / Perte de change', value: 26_813, level: 1, color: 'amber' },
  { label: 'RÉSULTAT NET', value: 1_011_634, level: 0, positive: true, highlightGreen: true },
  { label: '≈ USD 275K · ≈ EUR 253K', value: 'marge 15,4%', level: 2, color: 'muted' },
];

export const COST_BREAKDOWN = {
  cogs: [
    { label: 'External Salary (portés)', value: 3_046_591, percent: 54.6, tag: 'COGS' },
    { label: 'Consultant Expense', value: 1_828_289, percent: 32.8, tag: 'COGS' },
  ],
  difc: [
    { label: 'DIFC Fees (licence / conformité)', value: 219_067, percent: 3.9, tag: 'DIFC' },
    { label: 'Medical Insurance', value: 54_829, percent: 1.0, tag: 'DIFC' },
  ],
  structure: [
    { label: 'Internal Salary (biz dev)', value: 260_256, percent: 4.7, tag: 'STRUCT.' },
    { label: 'Legal Expense', value: 83_564, percent: 1.5, tag: 'STRUCT.' },
    { label: 'Frais bancaires', value: 38_241, percent: 0.7, tag: 'STRUCT.' },
    { label: 'Travel Expense', value: 27_113, percent: 0.5, tag: 'STRUCT.' },
    { label: 'IT & Internet', value: 11_025, percent: 0.2, tag: 'STRUCT.' },
    { label: 'Accounting & Audit', value: 6_734, percent: 0.1, tag: 'STRUCT.' },
    { label: 'Autres frais', value: 958, percent: 0.0, tag: 'STRUCT.' },
  ],
  totals: {
    cogsTotal: 4_874_880,
    difcTotal: 273_896,
    structureTotal: 427_891,
  },
  per100AED: [
    { label: 'External Salary (portés)', value: 46.4, color: 'red' },
    { label: 'Consultant Expense', value: 27.9, color: 'red' },
    { label: 'DIFC Fees + Assurance', value: 4.2, color: 'amber' },
    { label: 'Coûts de structure', value: 6.5, color: 'blue' },
    { label: 'Résultat net', value: 15.4, color: 'purple', isTotal: true },
  ],
};

export const CONSULTANTS = [
  { name: 'BENHARI Morad [S/T]', invoices: 15, ca: 546_988, avg: 36_466, tier: 'HIGH' },
  { name: 'Jalel Yahia [S/T]', invoices: 5, ca: 455_159, avg: 91_032, tier: 'HIGH' },
  { name: 'Bousri Ikram', invoices: 17, ca: 444_958, avg: 26_174, tier: 'HIGH' },
  { name: 'ABBOUD Meriem', invoices: 6, ca: 443_069, avg: 73_845, tier: 'HIGH' },
  { name: 'Abderrahim Jalel [S/T]', invoices: 15, ca: 425_750, avg: 28_383, tier: 'MID' },
  { name: 'GHAZALI Saïd', invoices: 7, ca: 399_234, avg: 57_033, tier: 'MID' },
  { name: 'AIT HAMMOU Mohammed', invoices: 8, ca: 348_095, avg: 43_512, tier: 'MID' },
  { name: 'MAYODE Herve', invoices: 6, ca: 333_362, avg: 55_560, tier: 'MID' },
  { name: 'MIMOUN Samir [S/T]', invoices: 8, ca: 328_145, avg: 41_018, tier: 'MID' },
  { name: 'KABACHE Omar', invoices: 10, ca: 322_150, avg: 32_215, tier: 'MID' },
  { name: 'Bernard Xavier', invoices: 3, ca: 284_019, avg: 94_673, tier: 'MID' },
  { name: 'TOUATI Foad [S/T]', invoices: 6, ca: 268_634, avg: 44_772, tier: 'MID' },
  { name: 'GHANDRI Hamza', invoices: 4, ca: 265_069, avg: 66_267, tier: 'MID' },
  { name: 'KHIAL Mokhtar [S/T]', invoices: 5, ca: 238_428, avg: 47_686, tier: 'MID' },
  { name: 'DERDOUR Rachid', invoices: 6, ca: 201_171, avg: 33_529, tier: 'LOW' },
  { name: 'BENDHIA Iaad', invoices: 11, ca: 165_625, avg: 15_057, tier: 'LOW' },
];

export const TREASURY = {
  banks: [
    { name: 'HSBC AED', balance: 287_000, positive: true },
    { name: 'HSBC EUR', balance: -148_000, positive: false },
    { name: 'SG AED', balance: 117_000, positive: true },
    { name: 'SG EUR', balance: -1_000, positive: false },
  ],
  cashFlow: [
    { label: 'Résultat net comptable', value: 1_011_634, color: 'green', widthPercent: 54 },
    { label: 'AR non-encaissé', value: -1_861_539, color: 'red', widthPercent: 100 },
    { label: 'AP fournisseurs', value: 757_642, color: 'amber', widthPercent: 41 },
    { label: 'CCA Reesk Consulting', value: 469_722, color: 'blue', widthPercent: 25 },
    { label: 'Cash réel fin 2025', value: 258_096, color: 'dark', widthPercent: 14, isTotal: true },
  ],
  hsbcAed: [
    { date: '25 Oct 25', desc: 'INV-SK-250006 INESAMI L.L.C-FZ', amount: -13_052, cat: 'EXT. SALARY' },
    { date: '25 Oct 25', desc: 'INV-SK-250008 INESAMI L.L.C-FZ', amount: -31_112, cat: 'EXT. SALARY' },
    { date: '25 Oct 25', desc: 'INV-SK-250007 INESAMI L.L.C-FZ', amount: -56_564, cat: 'EXT. SALARY' },
    { date: '10 Oct 25', desc: 'VISA DIFC INVESTMENTS LTD', amount: -4_000, cat: 'DIFC FEES' },
    { date: '25 Sep 25', desc: 'INESAMI L.L.C-FZ', amount: -53_730, cat: 'EXT. SALARY' },
    { date: '25 Sep 25', desc: 'INESAMI L.L.C-FZ', amount: -45_246, cat: 'EXT. SALARY' },
    { date: '25 Sep 25', desc: 'INESAMI L.L.C-FZ', amount: -20_882, cat: 'EXT. SALARY' },
  ],
  hsbcEur: [
    { date: '23 Déc 25', desc: 'REESK DIGITAL SOLUTION A202509-0011', amount: 19_617, cat: 'REVENU' },
    { date: '17 Déc 25', desc: 'REESK DIGITAL SOLUTION PAIEMENT', amount: 6_000, cat: 'REVENU' },
    { date: '17 Déc 25', desc: 'SKALIS BELGIUM SRL', amount: 1_896, cat: 'INTRA-GROUPE' },
    { date: '19 Déc 25', desc: 'EL BAHRAOUI CHOROK FX AED 5235', amount: -1_255, cat: 'INT. SALARY' },
    { date: '18 Sep 25', desc: 'NONREF RTN AE1250916-000967', amount: 9_657, cat: 'À IDENTIFIER' },
  ],
  sgEur: [
    { date: '19 Déc 25', desc: 'SKALIS DEUTSCHLAND GMBH', amount: 18_877, cat: 'INTRA-GROUPE' },
    { date: '31 Déc 25', desc: 'REESK DIGITAL SOLUTION F202509', amount: 13_068, cat: 'REVENU' },
    { date: '22 Déc 25', desc: 'INESAMI EUR INV-SK-250004', amount: -18_194, cat: 'EXT. SALARY' },
    { date: '31 Déc 25', desc: 'EL BAHRAOUI CHOROK salaire déc 25', amount: -6_642, cat: 'INT. SALARY' },
  ],
};

export const BREAK_EVEN = {
  margeDirecteConsultant: 88_000,
  structureCosts: 427_891,
  breakEvenConsultants: 5,
  avgCA: 327_879,
  dirMargRate: 0.215,
  hypotheses: [
    { label: 'CA moyen / consultant / an', value: '327 879 AED', color: 'red' },
    { label: 'COGS direct (~74,3%)', value: '~243 612 AED', color: 'red' },
    { label: 'DIFC + Assurance (~4,2%)', value: '~13 771 AED', color: 'amber' },
    { label: 'Marge directe (~21,5%)', value: '~70 496 AED', color: 'purple' },
    { label: 'Quote-part coûts structure (428K ÷ 16)', value: '~26 743 AED', color: 'blue' },
  ],
  resultatNetConsultant: '~43 753 AED',
  structureDetail: [
    { label: 'Internal Salary (biz dev)', value: 260_256, percent: 60.8 },
    { label: 'Legal Expense', value: 83_564, percent: 19.5 },
    { label: 'Frais bancaires', value: 38_241, percent: 8.9 },
    { label: 'Travel Expense', value: 27_113, percent: 6.3 },
    { label: 'IT, Audit, Autres', value: 18_717, percent: 4.4 },
  ],
};

export const INSIGHTS = [
  { title: '📋 Résultat apparent — à confirmer', type: 'amber', text: "Sur la base des données disponibles à ce stade, le P&L fait apparaître un résultat positif. Cette tendance est encourageante mais ne peut pas être consolidée avant la réception des éléments manquants." },
  { title: '📐 Marge directe — indicateur à suivre', type: 'amber', text: "Le retraitement CA − COGS − DIFC − Assurance fait apparaître une marge directe sur les données partielles disponibles. Ce ratio est pertinent comme KPI de suivi de l'activité brute." },
  { title: '💰 Écart cash / comptable — à investiguer', type: 'amber', text: "Un écart est visible entre le résultat comptable et le cash réel disponible en banque. L'AR enregistré en est l'explication principale apparente." },
  { title: '🔍 Postes nécessitant des clarifications', type: 'blue', text: "Plusieurs postes du P&L nécessitent des précisions : l'écart entre le CA P&L et les ventes ventilées par consultant, la nature des paiements INESAMI, ainsi que le contenu exact des mouvements de fin d'année." },
  { title: '📊 Structure des charges — tendance générale', type: 'blue', text: "Les données disponibles suggèrent que l'essentiel des charges est constitué de coûts directement liés aux consultants portés, ce qui est cohérent avec un modèle EOR/portage salarial." },
  { title: '📅 Prochaine étape', type: 'blue', text: "L'analyse complète, les conclusions opérationnelles et les éventuelles recommandations seront produites dès réception des éléments attendus de Stéphane et Reffy." },
];

export const MISSING_ELEMENTS = [
  { id: '01', label: 'Relevés compte courant novembre & décembre 2025', from: 'Fatima / Reffy', reason: 'Finalisation P&L, réconciliation trésorerie', status: 'MANQUANT' },
  { id: '02', label: 'Éléments comptables en suspens transmis à Fatima', from: 'Stéphane / Reffy', reason: 'Clôture comptabilité 2025', status: 'MANQUANT' },
  { id: '03', label: 'Détail AR — aging par client', from: 'Stéphane / Reffy', reason: 'Évaluation du risque de trésorerie réel', status: 'MANQUANT' },
  { id: '04', label: 'Détail AP — créanciers et échéances', from: 'Stéphane / Reffy', reason: 'Visibilité sur les engagements de paiement à venir', status: 'MANQUANT' },
  { id: '05', label: 'Nature Shareholder account SAS Reesk (469K AED)', from: 'Stéphane', reason: 'Qualification de la structure financière', status: 'PARTIEL' },
];

export const NAV_ITEMS = [
  { id: 'overview', label: 'Vue Générale', icon: '📊' },
  { id: 'pl', label: 'P&L & Retraitement', icon: '📄' },
  { id: 'costs', label: 'Structure des Coûts', icon: '💸' },
  { id: 'cons', label: 'Analyse Consultants', icon: '👥' },
  { id: 'treas', label: 'Trésorerie & Banque', icon: '🏦' },
  { id: 'be', label: 'Break-Even', icon: '🎯' },
  { id: 'ins', label: 'Observations', icon: '💡', section: 'ADVISORY' },
];

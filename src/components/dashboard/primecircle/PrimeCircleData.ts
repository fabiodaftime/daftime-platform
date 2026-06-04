export interface Transaction {
  name: string;
  service: string;
  status: 'Closed' | 'In progress' | 'Cancelled' | 'To start';
  turnover: number;
  margin: number;
}

export type PCMonthId = 'jan-2026' | 'feb-2026' | 'mar-2026' | 'apr-2026' | 'may-2026';

export const PC_AVAILABLE_MONTHS = [
  { id: 'jan-2026', label: 'January 2026' },
  { id: 'feb-2026', label: 'February 2026' },
  { id: 'mar-2026', label: 'March 2026' },
  { id: 'apr-2026', label: 'April 2026' },
  { id: 'may-2026', label: 'May 2026' },
];

export interface PCMonthData {
  monthId: PCMonthId;
  monthLabel: string;
  transactions: Transaction[];
  kpis: {
    totalCustomers: number;
    totalTurnover: number;
    netProfit: number;
    netMarginRate: number;
    completedServices: number;
    inProgressServices: number;
    cancelledServices: number;
    avgPerCustomer: number;
  };
  m1Comparison: {
    prevMonthLabel?: string;
    customers: { prev: number; cur: number; diff: number; pct: number };
    turnover: { prev: number; cur: number; diff: number; pct: number };
    netProfit: { prev: number; cur: number; diff: number; pct: number; direction: 'positive' | 'negative' };
    completed: { prev: number; cur: number; diff: number; pct: number };
  } | null;
  ytdData: {
    customers: number;
    turnover: number;
    netProfit: number;
    netMarginRate: number;
    costs: number;
    costsPct: number;
    avgPerMonth: number;
  };
  monthlyComparison: {
    month: string;
    customers: number;
    turnover: number;
    totalCosts: number;
    netProfit: number;
    netMarginRate: number;
    varProfit: number | null;
    varProfitDirection?: 'positive' | 'negative';
    isExclRow?: boolean;
    exclLabel?: string;
  }[];
  costs: {
    awdEvent?: number;
    productProviderCosts?: number;
    productProviderDetail?: string;
    advertising: number;
    advertisingDetail?: string;
    marketing?: number;
    marketingDetail?: string;
    alibabaPurchases?: number;
    salesCommission?: number;
    bankFees?: number;
    serviceCosts?: number;
    referralCommission?: number;
    events?: number;
    operatingExpenses?: number;
    operatingExpensesBreakdown?: { label: string; value: number }[];
    total: number;
    recurringTotal?: number;
  };
  serviceCategories: { name: string; value: number }[];
  statusData: {
    completed: { count: number; amount: number };
    inProgress: { count: number; amount: number };
  };
}

export const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

// ===== JAN 2026 =====
const janTransactions: Transaction[] = [
  { name: "roheet", service: "parker bank", status: "Closed", turnover: 600, margin: 600 },
  { name: "crypto gg", service: "delete llc", status: "Closed", turnover: 250, margin: 100 },
  { name: "Kabangu John", service: "ein", status: "Closed", turnover: 250, margin: 165 },
  { name: "@fabusinesss", service: "physical address us", status: "Closed", turnover: 2000, margin: 800 },
  { name: "mehdihere", service: "sokin", status: "Closed", turnover: 550, margin: 550 },
  { name: "@ppninjawarrior", service: "physical address + itin", status: "Closed", turnover: 2500, margin: 1050 },
  { name: "33 7 69 71 70 13", service: "physical address us", status: "Closed", turnover: 1600, margin: 400 },
  { name: "mehdihere", service: "revolut business", status: "In progress", turnover: 850, margin: 850 },
  { name: "262692287542", service: "physical address monthly", status: "Closed", turnover: 200, margin: 0 },
  { name: "youssdx", service: "ITIN", status: "In progress", turnover: 500, margin: 375 },
  { name: "@fabusinesss", service: "amex", status: "In progress", turnover: 2000, margin: 2000 },
  { name: "33686899219", service: "physical address + amex", status: "In progress", turnover: 4000, margin: 2800 },
  { name: "dorian padel", service: "llc add member", status: "Closed", turnover: 400, margin: 239 },
  { name: "math9097", service: "amex", status: "In progress", turnover: 2000, margin: 2000 },
  { name: "dorian padel", service: "revolut business", status: "In progress", turnover: 1164, margin: 1164 },
  { name: "Thomas_X10", service: "LLC + slash", status: "Closed", turnover: 1700, margin: 1450 },
  { name: "mehdi berthé", service: "LLC", status: "Closed", turnover: 400, margin: 150 },
  { name: "33672221442", service: "LLC", status: "Closed", turnover: 800, margin: 550 },
  { name: "mouni sali", service: "LLC + slash", status: "Closed", turnover: 2000, margin: 1750 },
  { name: "49 176 47621526", service: "physical address us", status: "Closed", turnover: 2000, margin: 1000 },
  { name: "tharun cham", service: "slash", status: "Closed", turnover: 699, margin: 699 },
  { name: "mansome12", service: "revolut business", status: "In progress", turnover: 1000, margin: 1000 },
  { name: "64278722056", service: "LLC", status: "Closed", turnover: 1000, margin: 750 },
  { name: "naraniya9", service: "2 LLC", status: "Closed", turnover: 1200, margin: 700 },
  { name: "gradynio", service: "2 LLC", status: "Closed", turnover: 2000, margin: 1500 },
  { name: "447973180800", service: "LLC", status: "Closed", turnover: 1000, margin: 750 },
  { name: "keti", service: "capital one", status: "In progress", turnover: 1499, margin: 1499 },
  { name: "nickm", service: "revolut business", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "mxh09any", service: "LLC + slash", status: "Closed", turnover: 1600, margin: 1350 },
  { name: "MCH", service: "LLC", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "Alexklaric", service: "amex", status: "In progress", turnover: 2000, margin: 2000 },
  { name: "971563656551", service: "LLC + slash + airwallex", status: "In progress", turnover: 2500, margin: 2250 },
  { name: "baki2x banking", service: "amex", status: "In progress", turnover: 2000, margin: 2000 },
  { name: "lampardcfc", service: "physical address us", status: "Closed", turnover: 2000, margin: 1000 },
  { name: "dorian padel", service: "physical address + amex", status: "In progress", turnover: 3400, margin: 2400 },
  { name: "klasverr1", service: "LLC + slash", status: "Closed", turnover: 1400, margin: 1150 },
  { name: "rodeste", service: "sokin", status: "In progress", turnover: 1000, margin: 1000 },
  { name: "gradynio", service: "LLC", status: "Closed", turnover: 1100, margin: 780 },
  { name: "33659881468", service: "LLC", status: "Closed", turnover: 800, margin: 550 },
];

const janData: PCMonthData = {
  monthId: 'jan-2026',
  monthLabel: 'January 2026',
  transactions: janTransactions,
  kpis: {
    totalCustomers: 39,
    totalTurnover: 53962,
    netProfit: 41371,
    netMarginRate: 76.7,
    completedServices: 26,
    inProgressServices: 13,
    cancelledServices: 0,
    avgPerCustomer: 1384,
  },
  m1Comparison: null,
  ytdData: {
    customers: 39,
    turnover: 53962,
    netProfit: 41371,
    netMarginRate: 76.7,
    costs: 12591,
    costsPct: 23.3,
    avgPerMonth: 53962,
  },
  monthlyComparison: [
    { month: 'January 2026', customers: 39, turnover: 53962, totalCosts: 12591, netProfit: 41371, netMarginRate: 76.7, varProfit: null },
  ],
  costs: {
    advertising: 2690,
    salesCommission: 4213,
    referralCommission: 350,
    events: 1000,
    serviceCosts: 4338,
    total: 12591,
  },
  serviceCategories: [
    { name: 'LLC Services', value: 19400 },
    { name: 'Physical Addr.', value: 17700 },
    { name: 'AMEX', value: 8000 },
    { name: 'Other Banking', value: 4848 },
    { name: 'Revolut Biz', value: 4014 },
  ],
  statusData: {
    completed: { count: 26, amount: 30049 },
    inProgress: { count: 13, amount: 23913 },
  },
};

// ===== FEB 2026 =====
const febTransactions: Transaction[] = [
  { name: "jognib", service: "ocean payment", status: "Closed", turnover: 1700, margin: 900 },
  { name: "Fabien3713", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "jonecosmo", service: "delete", status: "Cancelled", turnover: 0, margin: 0 },
  { name: "naraniya9", service: "llc", status: "Closed", turnover: 600, margin: 450 },
  { name: "jonecosmo", service: "2 llc", status: "Closed", turnover: 2000, margin: 1506 },
  { name: "33789667628 / allan", service: "ITIN", status: "In progress", turnover: 500, margin: 375 },
  { name: "kelyan rd", service: "ITIN", status: "In progress", turnover: 500, margin: 375 },
  { name: "nickm", service: "airwallex", status: "Closed", turnover: 0, margin: 500 },
  { name: "daroyo", service: "LLC + slash", status: "Closed", turnover: 2000, margin: 1750 },
  { name: "tb_th", service: "parker bank", status: "In progress", turnover: 1000, margin: 1000 },
  { name: "tb_th", service: "physical address us", status: "Closed", turnover: 3000, margin: 1800 },
  { name: "Omer", service: "amex", status: "In progress", turnover: 2000, margin: 2000 },
  { name: "sultan09999", service: "llc", status: "Closed", turnover: 700, margin: 550 },
  { name: "Noam LeadGen", service: "llc", status: "Closed", turnover: 1200, margin: 884 },
  { name: "972502122005", service: "ein", status: "Closed", turnover: 500, margin: 432 },
  { name: "Franco Zamudio", service: "llc", status: "Closed", turnover: 500, margin: 250 },
  { name: "@traffi_cx", service: "physical address + itin", status: "In progress", turnover: 6500, margin: 4900 },
  { name: "mathvand26", service: "LLC + slash", status: "Closed", turnover: 1600, margin: 1350 },
  { name: "mowgliofm / lorenzo", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "jonecosmo", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "petkii", service: "physical address us", status: "Closed", turnover: 2000, margin: 800 },
  { name: "jaymcfee", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "262692287542", service: "physical address monthly", status: "Closed", turnover: 230, margin: 0 },
  { name: "fabianstin", service: "sokin", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "Sy aboubakri", service: "LLC + slash", status: "Closed", turnover: 2000, margin: 1300 },
  { name: "mowgliofm / lorenzo", service: "physical address", status: "Closed", turnover: 1800, margin: 600 },
  { name: "sultan09999", service: "slash", status: "Closed", turnover: 700, margin: 700 },
  { name: "cranberryjohnny", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "aaron743", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "iwanichan07", service: "physical address", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "mathvand26", service: "physical address", status: "Closed", turnover: 2160, margin: 940 },
  { name: "jonecosmo", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "imomer7", service: "physical address", status: "Closed", turnover: 2000, margin: 800 },
  { name: "iwanichan07", service: "amex", status: "In progress", turnover: 2000, margin: 2000 },
  { name: "33645660875 / hugo", service: "physical address + amex", status: "In progress", turnover: 3500, margin: 2300 },
  { name: "Zine", service: "llc", status: "Closed", turnover: 800, margin: 550 },
  { name: "Luke J", service: "ITIN", status: "In progress", turnover: 500, margin: 375 },
  { name: "coinGEOX", service: "LLC + sokin", status: "In progress", turnover: 2000, margin: 1750 },
  { name: "33668457341 / quentin", service: "llc", status: "Closed", turnover: 900, margin: 563 },
  { name: "dottorMA", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "33783537478 Nathan", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "447537166223", service: "llc", status: "Closed", turnover: 700, margin: 450 },
  { name: "nunobrito7", service: "physical address", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "imomer7", service: "amex", status: "In progress", turnover: 1500, margin: 1500 },
  { name: "affsophro", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "piraterie_tpm", service: "llc", status: "Closed", turnover: 1210, margin: 946 },
  { name: "Jonathan", service: "physical address", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "33670666750", service: "llc", status: "Closed", turnover: 700, margin: 450 },
  { name: "Rog1004", service: "LLC + slash", status: "Closed", turnover: 1700, margin: 1450 },
  { name: "Nathanyel Sebbane", service: "revolut business", status: "In progress", turnover: 1000, margin: 1000 },
  { name: "33620601178 victor", service: "physical address + llc", status: "Closed", turnover: 2800, margin: 1800 },
  { name: "18199519066", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "REF-43633T jaurés", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
];

const febData: PCMonthData = {
  monthId: 'feb-2026',
  monthLabel: 'February 2026',
  transactions: febTransactions,
  kpis: {
    totalCustomers: 53,
    totalTurnover: 73500,
    netProfit: 21036,
    netMarginRate: 28.6,
    completedServices: 41,
    inProgressServices: 11,
    cancelledServices: 1,
    avgPerCustomer: 1387,
  },
  m1Comparison: {
    customers: { prev: 39, cur: 53, diff: 14, pct: 35.9 },
    turnover: { prev: 53962, cur: 73500, diff: 19538, pct: 36.2 },
    netProfit: { prev: 41371, cur: 21036, diff: -20335, pct: -49.2, direction: 'negative' },
    completed: { prev: 26, cur: 41, diff: 15, pct: 57.7 },
  },
  ytdData: {
    customers: 92,
    turnover: 127462,
    netProfit: 62407,
    netMarginRate: 48.9,
    costs: 65055,
    costsPct: 51.0,
    avgPerMonth: 63731,
  },
  monthlyComparison: [
    { month: 'January 2026', customers: 39, turnover: 53962, totalCosts: 12591, netProfit: 41371, netMarginRate: 76.7, varProfit: null },
    { month: 'February 2026', customers: 53, turnover: 73500, totalCosts: 52464, netProfit: 21036, netMarginRate: 28.6, varProfit: -49.2, varProfitDirection: 'negative' },
    { month: 'Feb (excl. AWD)', customers: 53, turnover: 73500, totalCosts: 24065, netProfit: 49435, netMarginRate: 67.3, varProfit: 19.5, varProfitDirection: 'positive', isExclRow: true },
  ],
  costs: {
    awdEvent: 28399,
    productProviderCosts: 18939,
    productProviderDetail: 'Fiverr $8,139 + Tony Durant LLC $10,800',
    advertising: 4309,
    advertisingDetail: 'Facebook Ads $4,059 + WLP Marketing $250',
    marketing: 436,
    marketingDetail: 'Notebook Advertising LLC (Prime Circle)',
    alibabaPurchases: 331,
    bankFees: 50,
    total: 52464,
    recurringTotal: 24065,
  },
  serviceCategories: [
    { name: 'LLC Services', value: 22610 },
    { name: 'Physical Addr.', value: 20690 },
    { name: 'LLC + Bundle', value: 15800 },
    { name: 'AMEX', value: 5500 },
    { name: 'Slash', value: 2700 },
    { name: 'Other', value: 6200 },
  ],
  statusData: {
    completed: { count: 41, amount: 52500 },
    inProgress: { count: 11, amount: 21000 },
  },
};

// ===== MAR 2026 =====
const marTransactions: Transaction[] = [
  { name: "Hichem", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "33634240719 dimitri", service: "llc + itin", status: "In progress", turnover: 0, margin: 950 },
  { name: "33652941587 helwane", service: "llc", status: "Closed", turnover: 800, margin: 550 },
  { name: "33669483389 Maxence", service: "itin", status: "In progress", turnover: 750, margin: 580 },
  { name: "REF-43633T jaurés", service: "adress physique", status: "Closed", turnover: 2000, margin: 1250 },
  { name: "giuseppe", service: "llc + itin", status: "In progress", turnover: 1200, margin: 560 },
  { name: "Hichem", service: "slash", status: "Closed", turnover: 1000, margin: 900 },
  { name: "41783385605", service: "llc", status: "Closed", turnover: 800, margin: 550 },
  { name: "971562637738/ayo", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "klasverr1", service: "llc + slash", status: "Closed", turnover: 1400, margin: 1150 },
  { name: "EnzoMhdx", service: "itin", status: "In progress", turnover: 500, margin: 350 },
  { name: "panth3ra", service: "itin", status: "In progress", turnover: 500, margin: 350 },
  { name: "gradynio", service: "llc", status: "Closed", turnover: 1100, margin: 750 },
  { name: "33781208048 nico", service: "airwallex", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "fruktik_kiwi", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "kopbogg", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "fruktik_kiwi", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "Melvin Sunil", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "hyppolite", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "jonecosmo", service: "cancel llc", status: "Closed", turnover: 300, margin: 100 },
  { name: "jonecosmo", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "Sabrina", service: "adress physique", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "kevinyuith", service: "slash + llc", status: "Closed", turnover: 2000, margin: 1750 },
  { name: "joefromslash", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "chief meme", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "frank", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "startecx", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "hyppolite", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "sultan09999", service: "itin", status: "In progress", turnover: 500, margin: 350 },
  { name: "louksD", service: "slash + llc", status: "Closed", turnover: 1800, margin: 1550 },
  { name: "justcallmenicko", service: "llc", status: "Closed", turnover: 700, margin: 450 },
  { name: "damien_009", service: "slash + llc", status: "Closed", turnover: 1800, margin: 1550 },
  { name: "justcallmenicko", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "gradyio", service: "llc", status: "Closed", turnover: 1100, margin: 750 },
  { name: "33782931633 stephane", service: "slash + llc", status: "Closed", turnover: 1700, margin: 1450 },
  { name: "3246765208 Alex", service: "airwallex", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "@khazin17", service: "itin", status: "In progress", turnover: 500, margin: 350 },
  { name: "Charlene Ormo", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "vshlace", service: "slash", status: "Closed", turnover: 900, margin: 900 },
  { name: "kevinyuith", service: "airwallex", status: "In progress", turnover: 1000, margin: 1000 },
  { name: "danielkmv", service: "amex", status: "Closed", turnover: 2000, margin: 2000 },
  { name: "Ilyas", service: "llc", status: "Closed", turnover: 1000, margin: 684 },
  { name: "anri977", service: "renouvellement + change owner", status: "Closed", turnover: 750, margin: 434 },
  { name: "danielkmv", service: "revolut business", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "hud/ x6rkr_on_ig", service: "itin", status: "Closed", turnover: 500, margin: 350 },
  { name: "lorenzo", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "arramae", service: "slash + llc", status: "Closed", turnover: 1700, margin: 1450 },
  { name: "aalexandrino", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "Dimitri vulpe", service: "llc + tax filling", status: "Closed", turnover: 1500, margin: 1295 },
  { name: "law bulk", service: "2 llc + tax filling", status: "Closed", turnover: 1500, margin: 1078 },
  { name: "danielkmv", service: "physical adress", status: "Closed", turnover: 1700, margin: 900 },
];

const marData: PCMonthData = {
  monthId: 'mar-2026',
  monthLabel: 'March 2026',
  transactions: marTransactions,
  kpis: {
    totalCustomers: 51,
    totalTurnover: 55000,
    netProfit: 29606,
    netMarginRate: 53.8,
    completedServices: 43,
    inProgressServices: 8,
    cancelledServices: 0,
    avgPerCustomer: 1078,
  },
  m1Comparison: {
    prevMonthLabel: 'Feb',
    customers: { prev: 53, cur: 51, diff: -2, pct: -3.8 },
    turnover: { prev: 73500, cur: 55000, diff: -18500, pct: -25.2 },
    netProfit: { prev: 21036, cur: 29606, diff: 8570, pct: 40.7, direction: 'positive' },
    completed: { prev: 41, cur: 43, diff: 2, pct: 4.9 },
  },
  ytdData: {
    customers: 143,
    turnover: 181612,
    netProfit: 91163,
    netMarginRate: 50.2,
    costs: 90449,
    costsPct: 49.8,
    avgPerMonth: 60537,
  },
  monthlyComparison: [
    { month: 'January 2026', customers: 39, turnover: 53112, totalCosts: 12591, netProfit: 40521, netMarginRate: 76.3, varProfit: null },
    { month: 'February 2026', customers: 53, turnover: 73500, totalCosts: 52464, netProfit: 21036, netMarginRate: 28.6, varProfit: -48.1, varProfitDirection: 'negative' },
    { month: 'Feb (excl. AWD)', customers: 53, turnover: 73500, totalCosts: 24065, netProfit: 49435, netMarginRate: 67.3, varProfit: 22.0, varProfitDirection: 'positive', isExclRow: true },
    { month: 'March 2026', customers: 51, turnover: 55000, totalCosts: 25394, netProfit: 29606, netMarginRate: 53.8, varProfit: 40.7, varProfitDirection: 'positive' },
  ],
  costs: {
    productProviderCosts: 10019,
    productProviderDetail: 'COGS (Fiverr)',
    advertising: 9828,
    advertisingDetail: 'Facebook Ads',
    salesCommission: 4698,
    alibabaPurchases: 849,
    total: 25394,
  },
  serviceCategories: [
    { name: 'LLC Services', value: 18800 },
    { name: 'Slash', value: 11800 },
    { name: 'Slash + LLC', value: 12500 },
    { name: 'Physical Addr.', value: 5700 },
    { name: 'AMEX', value: 2000 },
    { name: 'Other', value: 4200 },
  ],
  statusData: {
    completed: { count: 43, amount: 50050 },
    inProgress: { count: 8, amount: 4950 },
  },
};

// ===== APR 2026 =====
const aprTransactions: Transaction[] = [
  { name: "REF-23834 well - Ads", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "pedrospx", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "liukaimkt", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "212604645231 bryan", service: "llc + llc + revolut + slash (cancel)", status: "Closed", turnover: 2500, margin: 2000 },
  { name: "hyppolite", service: "itin", status: "Closed", turnover: 500, margin: 300 },
  { name: "33602787182 ibrahim", service: "slash", status: "Closed", turnover: 500, margin: 500 },
  { name: "tren guy", service: "llc + revolut", status: "Closed", turnover: 1400, margin: 1150 },
  { name: "joefromslash", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "Sam Planet", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "971504559450 peter", service: "tax filling", status: "Closed", turnover: 700, margin: 450 },
  { name: "5562993119556 marco", service: "amex", status: "To start", turnover: 2000, margin: 2000 },
  { name: "kassim", service: "physical adress", status: "Closed", turnover: 2000, margin: 1000 },
  { name: "353871246033 eclarit", service: "2 llc + tax filling", status: "Closed", turnover: 1400, margin: 560 },
  { name: "citroman", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "keyciemaq", service: "slash + llc", status: "Closed", turnover: 1750, margin: 1500 },
  { name: "joefromslash", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "Snjitkrrr", service: "adress physique + amex", status: "In progress", turnover: 4000, margin: 3200 },
  { name: "Daniel Kolmakov", service: "ocean payment", status: "Closed", turnover: 1500, margin: 750 },
  { name: "33760839370 tal stanislas", service: "physical adress", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "carfarah", service: "itin", status: "In progress", turnover: 500, margin: 350 },
  { name: "anthony suissa", service: "llc", status: "Closed", turnover: 575, margin: 290 },
  { name: "joefromslash", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "joefromslash", service: "llc", status: "Closed", turnover: 1000, margin: 650 },
  { name: "dslkmflott", service: "llc", status: "Closed", turnover: 1000, margin: 725 },
  { name: "remielyn", service: "slash + llc", status: "Closed", turnover: 1750, margin: 1500 },
  { name: "34653408194 Xavi", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "law bulk", service: "4 llc", status: "Closed", turnover: 4000, margin: 2750 },
  { name: "uasurfer", service: "slash + llc", status: "Closed", turnover: 2000, margin: 1750 },
  { name: "212604645231", service: "llc", status: "Closed", turnover: 600, margin: 350 },
  { name: "david dincklestien", service: "slash + llc", status: "Closed", turnover: 1750, margin: 1500 },
  { name: "ybtkx", service: "tax filling x3", status: "Closed", turnover: 2400, margin: 1500 },
  { name: "Max sch", service: "tax filling", status: "Closed", turnover: 750, margin: 500 },
  { name: "REF-20707W nikita - Ads", service: "physical adress", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "sultan09999", service: "3 slash", status: "Closed", turnover: 2100, margin: 2100 },
  { name: "egpking", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "fruktik_kiwi", service: "itin", status: "In progress", turnover: 500, margin: 300 },
  { name: "918617093328 arijit paul biswas", service: "itin", status: "Closed", turnover: 500, margin: 325 },
  { name: "REF-71229T kim barrett", service: "tax filling", status: "Closed", turnover: 1000, margin: 750 },
  { name: "James Harington", service: "physical adress", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "abrudolf", service: "slash + llc", status: "Closed", turnover: 1750, margin: 1500 },
  { name: "svetskiReal", service: "physical adress", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "Flavien 33624004566", service: "physical adress", status: "Closed", turnover: 1600, margin: 800 },
  { name: "yassiine007", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "33658448446 liam", service: "airwallex us", status: "In progress", turnover: 1000, margin: 1000 },
  { name: "anthony suissa", service: "itin", status: "In progress", turnover: 450, margin: 250 },
  { name: "Yash +919958235268", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "facondoprofitads", service: "physical adress", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "33635386786 arthur", service: "itin", status: "In progress", turnover: 900, margin: 550 },
  { name: "yassiine007", service: "3 slash", status: "In progress", turnover: 2500, margin: 2500 },
  { name: "sophiedxb", service: "hk company + airwallex hk", status: "In progress", turnover: 2000, margin: 1200 },
];

const aprData: PCMonthData = {
  monthId: 'apr-2026',
  monthLabel: 'April 2026',
  transactions: aprTransactions,
  kpis: {
    totalCustomers: 50,
    totalTurnover: 70875,
    netProfit: 38536,
    netMarginRate: 54.4,
    completedServices: 41,
    inProgressServices: 8,
    cancelledServices: 0,
    avgPerCustomer: 1418,
  },
  m1Comparison: {
    prevMonthLabel: 'Mar',
    customers: { prev: 51, cur: 50, diff: -1, pct: -2.0 },
    turnover: { prev: 55000, cur: 70875, diff: 15875, pct: 28.9 },
    netProfit: { prev: 29606, cur: 38536, diff: 8930, pct: 30.2, direction: 'positive' },
    completed: { prev: 43, cur: 41, diff: -2, pct: -4.7 },
  },
  ytdData: {
    customers: 193,
    turnover: 252487,
    netProfit: 129699,
    netMarginRate: 51.4,
    costs: 122788,
    costsPct: 48.6,
    avgPerMonth: 63122,
  },
  monthlyComparison: [
    { month: 'January 2026', customers: 39, turnover: 53112, totalCosts: 12591, netProfit: 40521, netMarginRate: 76.3, varProfit: null },
    { month: 'February 2026', customers: 53, turnover: 73500, totalCosts: 52464, netProfit: 21036, netMarginRate: 28.6, varProfit: -48.1, varProfitDirection: 'negative' },
    { month: 'Feb (excl. AWD)', customers: 53, turnover: 73500, totalCosts: 24065, netProfit: 49435, netMarginRate: 67.3, varProfit: 22.0, varProfitDirection: 'positive', isExclRow: true },
    { month: 'March 2026', customers: 51, turnover: 55000, totalCosts: 25394, netProfit: 29606, netMarginRate: 53.8, varProfit: 40.7, varProfitDirection: 'positive' },
    { month: 'April 2026', customers: 50, turnover: 70875, totalCosts: 32339, netProfit: 38536, netMarginRate: 54.4, varProfit: 30.2, varProfitDirection: 'positive' },
  ],
  costs: {
    productProviderCosts: 18725,
    productProviderDetail: 'COGS (Fiverr)',
    advertising: 7889,
    advertisingDetail: 'Facebook Ads',
    salesCommission: 5367,
    bankFees: 358,
    total: 32339,
  },
  serviceCategories: [
    { name: 'Physical Addr.', value: 17600 },
    { name: 'LLC Services', value: 12175 },
    { name: 'Slash', value: 11100 },
    { name: 'Slash + LLC', value: 10400 },
    { name: 'ITIN / Tax', value: 9600 },
    { name: 'Other', value: 10000 },
  ],
  statusData: {
    completed: { count: 41, amount: 57025 },
    inProgress: { count: 8, amount: 11850 },
  },
};

// ===== MAY 2026 ===== (source: Banking_Customers_2025-2026_VF, mai 2026)
// Headline réel (TO 56 780 $, marge brute par ligne 43 570 $, 42 clients).
// Opex non-COGS (Ads, Commissions, Bank fees) estimés au prorata d'Avril faute
// de fichier opex transmis pour Mai → drapeau "données partielles".
const mayTransactions: Transaction[] = [
  { name: "Flo 33 6 71 60 59 08", service: "itin", status: "In progress", turnover: 500, margin: 335 },
  { name: "facondoprofitads", service: "amex", status: "To start", turnover: 2000, margin: 2000 },
  { name: "julian sailley", service: "itin", status: "In progress", turnover: 250, margin: 90 },
  { name: "rocco 41 78 300 5545", service: "1 llc + physical adress + bank", status: "Closed", turnover: 3400, margin: 2350 },
  { name: "marco_isellforyou", service: "2 llc + 2 itin", status: "In progress", turnover: 3000, margin: 2170 },
  { name: "33775855440 tanguy", service: "llc", status: "Closed", turnover: 300, margin: 52 },
  { name: "33781208048 nico", service: "slash + sokin", status: "Closed", turnover: 1500, margin: 1500 },
  { name: "sultan09999", service: "1 slash + llc", status: "Closed", turnover: 1500, margin: 1250 },
  { name: "anurag", service: "airwallex us", status: "In progress", turnover: 400, margin: 400 },
  { name: "64278722056 andrew kim", service: "itin", status: "In progress", turnover: 500, margin: 335 },
  { name: "33683928769 sam", service: "1 slash + itin", status: "In progress", turnover: 1500, margin: 1300 },
  { name: "33698462900 Mathis", service: "llc + physical adress + bank + itin", status: "In progress", turnover: 3050, margin: 1800 },
  { name: "Sahib98s", service: "hk company + airwallex hk", status: "Closed", turnover: 2500, margin: 1700 },
  { name: "Mihail sido renko", service: "physical adress", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "Pierre-Alexandre-Ayache", service: "ein", status: "Closed", turnover: 500, margin: 390 },
  { name: "rafa", service: "llc", status: "Closed", turnover: 580, margin: 380 },
  { name: "Mihail sido renko", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "Mathiassecom", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "fortunatofranco", service: "llc + physical adress", status: "Closed", turnover: 2000, margin: 750 },
  { name: "cosworld96", service: "slash", status: "Closed", turnover: 600, margin: 600 },
  { name: "skooldam", service: "llc", status: "Closed", turnover: 750, margin: 250 },
  { name: "Xavi", service: "aspire", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "33683928769 sam", service: "itin", status: "In progress", turnover: 400, margin: 230 },
  { name: "sultan09999", service: "slash", status: "Closed", turnover: 700, margin: 700 },
  { name: "tataneeeee", service: "slash + physical adress", status: "Closed", turnover: 3000, margin: 1900 },
  { name: "Jupelo", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "theroheet", service: "llc", status: "Closed", turnover: 700, margin: 450 },
  { name: "tren guy", service: "llc", status: "Closed", turnover: 750, margin: 250 },
  { name: "nigga bob", service: "slash", status: "Closed", turnover: 700, margin: 700 },
  { name: "Art M", service: "slash", status: "Closed", turnover: 750, margin: 750 },
  { name: "rekllc", service: "aspire + llc", status: "In progress", turnover: 1750, margin: 1500 },
  { name: "oluwaadaniel", service: "slash + llc", status: "In progress", turnover: 1500, margin: 1250 },
  { name: "nigga bob", service: "slash", status: "Closed", turnover: 700, margin: 700 },
  { name: "s44psn", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "Teddy_niobe", service: "revolut business + llc", status: "In progress", turnover: 1500, margin: 1250 },
  { name: "leonecom", service: "slash", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "noccebusiness", service: "llc", status: "Closed", turnover: 1000, margin: 750 },
  { name: "js1234js", service: "physical adress", status: "Closed", turnover: 2000, margin: 1200 },
  { name: "thereal_poly", service: "slash + llc", status: "Closed", turnover: 1000, margin: 1000 },
  { name: "33781555988 danila", service: "itin", status: "In progress", turnover: 500, margin: 338 },
  { name: "33622166042 vvv", service: "3 llc + 4 slash", status: "In progress", turnover: 4500, margin: 4000 },
  { name: "ju1234567890123456", service: "5 slash", status: "Closed", turnover: 2500, margin: 2500 },
];

const mayData: PCMonthData = {
  monthId: 'may-2026',
  monthLabel: 'May 2026',
  transactions: mayTransactions,
  kpis: {
    totalCustomers: 42,
    totalTurnover: 56780,
    netProfit: 23327,        // 56 780 − Total costs 33 453
    netMarginRate: 41.1,
    completedServices: 28,
    inProgressServices: 13,
    cancelledServices: 0,
    avgPerCustomer: 1352,
  },
  m1Comparison: {
    prevMonthLabel: 'Avr',
    customers: { prev: 50, cur: 42, diff: -8, pct: -16.0 },
    turnover: { prev: 70875, cur: 56780, diff: -14095, pct: -19.9 },
    netProfit: { prev: 38536, cur: 23327, diff: -15209, pct: -39.5, direction: 'negative' },
    completed: { prev: 41, cur: 28, diff: -13, pct: -31.7 },
  },
  ytdData: {
    customers: 235,
    turnover: 309267,
    netProfit: 153026,
    netMarginRate: 49.5,
    costs: 156241,
    costsPct: 50.5,
    avgPerMonth: 61853,
  },
  monthlyComparison: [
    { month: 'January 2026', customers: 39, turnover: 53112, totalCosts: 12591, netProfit: 40521, netMarginRate: 76.3, varProfit: null },
    { month: 'February 2026', customers: 53, turnover: 73500, totalCosts: 52464, netProfit: 21036, netMarginRate: 28.6, varProfit: -48.1, varProfitDirection: 'negative' },
    { month: 'Feb (excl. AWD)', customers: 53, turnover: 73500, totalCosts: 24065, netProfit: 49435, netMarginRate: 67.3, varProfit: 22.0, varProfitDirection: 'positive', isExclRow: true },
    { month: 'March 2026', customers: 51, turnover: 55000, totalCosts: 25394, netProfit: 29606, netMarginRate: 53.8, varProfit: 40.7, varProfitDirection: 'positive' },
    { month: 'April 2026', customers: 50, turnover: 70875, totalCosts: 32339, netProfit: 38536, netMarginRate: 54.4, varProfit: 30.2, varProfitDirection: 'positive' },
    { month: 'May 2026', customers: 42, turnover: 56780, totalCosts: 33453, netProfit: 23327, netMarginRate: 41.1, varProfit: -39.5, varProfitDirection: 'negative' },
  ],
  costs: {
    productProviderCosts: 13210,
    productProviderDetail: 'COGS implicites (TO 56 780 − marge brute 43 570)',
    advertising: 5893,
    advertisingDetail: 'Facebook Ads Mai 2026 — montant confirmé client',
    salesCommission: 7535,
    bankFees: 50,
    operatingExpenses: 6765,
    operatingExpensesBreakdown: [
      { label: 'Tools (SaaS / IA / LinkedIn)', value: 1588 },
      { label: 'Global Expense (April Intl + FL Consulting)', value: 1471 },
      { label: 'Travel (Booking, Holafly, Inflight)', value: 1016 },
      { label: 'Event (Mamo Deluxe Digital Adv)', value: 917 },
      { label: 'Tools & Office (Amazon, Canva, Captions.ai…)', value: 883 },
      { label: 'Lunch', value: 568 },
      { label: 'Transport (Careem)', value: 253 },
      { label: 'Marketing Tools (Replit)', value: 70 },
    ],
    total: 33453,
  },


  serviceCategories: [
    { name: 'LLC Services', value: 12010 },
    { name: 'Slash', value: 11200 },
    { name: 'Physical Addr.', value: 8000 },
    { name: 'Combos LLC+Addr/Slash', value: 13500 },
    { name: 'ITIN / Tax', value: 4500 },
    { name: 'Other (aspire, hk, amex, ein, airwallex)', value: 7570 },
  ],
  statusData: {
    completed: { count: 28, amount: 35430 },
    inProgress: { count: 13, amount: 19350 },
  },
};

const monthDataMap: Record<PCMonthId, PCMonthData> = {
  'jan-2026': janData,
  'feb-2026': febData,
  'mar-2026': marData,
  'apr-2026': aprData,
  'may-2026': mayData,
};

export function getPCMonthData(monthId: PCMonthId): PCMonthData {
  return monthDataMap[monthId];
}

// Keep backward-compatible exports pointing to feb
export const transactions = febTransactions;
export const kpis = febData.kpis;
export const m1Comparison = febData.m1Comparison!;
export const ytdData = febData.ytdData;
export const monthlyComparison = febData.monthlyComparison;
export const costs = febData.costs;
export const serviceCategories = febData.serviceCategories;
export const statusData = febData.statusData;

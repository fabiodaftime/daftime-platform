export interface Transaction {
  name: string;
  service: string;
  status: 'Closed' | 'In progress' | 'Cancelled';
  turnover: number;
  margin: number;
}

export type PCMonthId = 'jan-2026' | 'feb-2026' | 'mar-2026';

export const PC_AVAILABLE_MONTHS = [
  { id: 'jan-2026', label: 'January 2026' },
  { id: 'feb-2026', label: 'February 2026' },
  { id: 'mar-2026', label: 'March 2026' },
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

const monthDataMap: Record<PCMonthId, PCMonthData> = {
  'jan-2026': janData,
  'feb-2026': febData,
  'mar-2026': marData,
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

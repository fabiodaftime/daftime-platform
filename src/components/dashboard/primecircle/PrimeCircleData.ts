export interface Transaction {
  name: string;
  service: string;
  status: 'Closed' | 'In progress' | 'Cancelled';
  turnover: number;
  margin: number;
}

export const transactions: Transaction[] = [
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

export const kpis = {
  totalCustomers: 53,
  totalTurnover: 73500,
  totalMargin: 53296,
  marginRate: 72.5,
  completedServices: 41,
  inProgressServices: 11,
  cancelledServices: 1,
  avgPerCustomer: 1387
};

// M-1 comparison (vs January)
export const m1Comparison = {
  customers: { jan: 39, feb: 53, diff: 14, pct: 35.9 },
  turnover: { jan: 53112, feb: 73500, diff: 20388, pct: 38.4 },
  margin: { jan: 40521, feb: 53296, diff: 12775, pct: 31.5 },
  completed: { jan: 26, feb: 41, diff: 15, pct: 57.7 },
};

// YTD (Jan + Feb)
export const ytdData = {
  customers: 92,
  turnover: 126612,
  margin: 93817,
  marginRate: 74.1,
  costs: 32795,
  costsPct: 25.9,
  avgPerMonth: 63306,
};

// Monthly comparison table
export const monthlyComparison = [
  { month: 'January 2026', customers: 39, turnover: 53112, margin: 40521, marginRate: 76.3, ads: 2957, commission: 4137, varTurnover: null },
  { month: 'February 2026', customers: 53, turnover: 73500, margin: 53296, marginRate: 72.5, ads: 4525, commission: 5498, varTurnover: 38.4 },
];

export const costs = {
  advertising: 4525,
  salesCommission: 5498,
  serviceCosts: 10181,
  total: 20204
};

export const serviceCategories = [
  { name: 'LLC Services', value: 22610 },
  { name: 'Physical Addr.', value: 20690 },
  { name: 'LLC + Bundle', value: 15800 },
  { name: 'AMEX', value: 5500 },
  { name: 'Slash', value: 2700 },
  { name: 'Other', value: 6200 },
];

export const statusData = {
  completed: { count: 41, amount: 52500 },
  inProgress: { count: 11, amount: 21000 }
};

export const formatCurrency = (value: number) => {
  return `$${value.toLocaleString()}`;
};

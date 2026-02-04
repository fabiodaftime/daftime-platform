export interface Transaction {
  name: string;
  service: string;
  status: 'Closed' | 'In progress';
  turnover: number;
  margin: number;
}

export const transactions: Transaction[] = [
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
  { name: "33659881468", service: "LLC", status: "Closed", turnover: 800, margin: 550 }
];

export const kpis = {
  totalCustomers: 39,
  totalTurnover: 53962,
  totalMargin: 41371,
  marginRate: 76.7,
  completedServices: 26,
  inProgressServices: 13,
  avgPerCustomer: 1384
};

export const costs = {
  advertising: 2690,
  salesCommission: 4213,
  referralCommission: 350,
  events: 1000,
  serviceCosts: 4338,
  total: 12591
};

export const serviceCategories = [
  { name: 'LLC Services', value: 19400 },
  { name: 'Physical Addr. US', value: 17700 },
  { name: 'AMEX', value: 8000 },
  { name: 'Other Banking', value: 4848 },
  { name: 'Revolut Biz', value: 4014 }
];

export const statusData = {
  completed: { count: 26, amount: 30049 },
  inProgress: { count: 13, amount: 23913 }
};

export const formatCurrency = (value: number) => {
  return `$${value.toLocaleString()}`;
};

export const EXCHANGE_RATE = 3.6725;

export const months = ['Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25'];

export const data = {
  grossRevenue: [116800.88, 128454.51, 75252.54, 111550.01, 84661.46, 44342.95, 44088.86, 53561.58, 95008.77, 130613.00, 164069.56, 134733.24],
  totalExpenses: [75671.83, 81168.42, 74827.61, 68367.51, 54618.94, 49469.11, 52926.19, 56437.21, 64340.51, 64330.76, 66143.83, 80676.28],
  ebitda: [41129.05, 47286.09, 424.93, 43182.50, 30042.52, -5126.16, -8837.33, -2875.63, 30668.26, 66282.24, 97925.73, 54056.96],
  profitMargin: [0.3521, 0.3681, 0.0056, 0.3871, 0.3549, -0.1156, -0.2004, -0.0537, 0.3228, 0.5075, 0.5969, 0.4012],
  occupancy: [0.8487, 0.9393, 0.76, 0.8987, 0.8261, 0.596, 0.6501, 0.6418, 0.8444, 0.9427, 0.9574, 0.767],
  adr: [122.70, 121.02, 97.58, 110.26, 101.84, 82.30, 76.28, 81.83, 100.78, 121.07, 154.38, 157.31],
  bedBookable: [1080, 1080, 1080, 1080, 1080, 1080, 1080, 1080, 1080, 1080, 1080, 1080],
  bedsBooked: [748, 878, 780, 960, 825, 546, 562, 646, 912, 1052, 1034, 856],
  staffSalary: [16500, 16500, 16500, 16500, 6500, 6500, 6500, 6500, 16500, 16500, 16500, 21500],
  operatingCost: [20294.42, 24119.11, 18583.53, 11882.53, 9346.72, 7180.31, 10089.19, 8618.21, 9370.47, 8693.75, 8814.58, 20516.38],
  rent: [31666.67, 31666.67, 31666.67, 31666.67, 31666.67, 30000, 30000, 30000, 31666.67, 31666.67, 31666.67, 31666.67],
  energy: [5961.74, 7808.64, 5101.41, 5649.74, 5141.74, 4948.80, 5637.00, 5818.00, 5654.37, 6780.34, 5770.58, 5499.23]
};

export const toUSD = (val: number) => val / EXCHANGE_RATE;

export const dataUSD = {
  grossRevenue: data.grossRevenue.map(toUSD),
  totalExpenses: data.totalExpenses.map(toUSD),
  ebitda: data.ebitda.map(toUSD),
  adr: data.adr.map(toUSD)
};

// Calculated KPIs
export const kpis = {
  annualRevenueAED: data.grossRevenue.reduce((a, b) => a + b, 0),
  annualEBITDAAED: data.ebitda.reduce((a, b) => a + b, 0),
  avgOccupancy: data.occupancy.reduce((a, b) => a + b, 0) / 12,
  peakRevenue: Math.max(...data.grossRevenue),
  peakRevenueMonth: months[data.grossRevenue.indexOf(Math.max(...data.grossRevenue))],
  peakMargin: Math.max(...data.profitMargin),
  peakMarginMonth: months[data.profitMargin.indexOf(Math.max(...data.profitMargin))],
  peakOccupancy: Math.max(...data.occupancy),
  peakOccupancyMonth: months[data.occupancy.indexOf(Math.max(...data.occupancy))],
  totalStaff: data.staffSalary.reduce((a, b) => a + b, 0),
  totalOps: data.operatingCost.reduce((a, b) => a + b, 0),
  totalRent: data.rent.reduce((a, b) => a + b, 0),
  totalEnergy: data.energy.reduce((a, b) => a + b, 0),
};

export const chartColors = {
  orange: '#D35400',
  orangeLight: '#F39C12',
  orangeLighter: 'rgba(243, 156, 18, 0.2)',
  green: '#27AE60',
  greenLight: 'rgba(39, 174, 96, 0.2)',
  red: '#E74C3C',
  gray: '#9E9E9E'
};

export const formatAED = (value: number) => {
  return `AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export const formatUSD = (value: number) => {
  return `USD ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

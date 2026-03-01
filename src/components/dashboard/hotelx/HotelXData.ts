export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
export const KEYS = 350;

export interface MonthlyData {
  occ: number;
  adr: number;
  revpar: number;
  rooms: number;
  fb: number;
  anc: number;
  costs: number;
  net: number;
  tot: number;
}

const raw = [
  {occ:91,adr:1050,revpar:956, rooms:10368,fb:3059,anc:1493,costs:10205,net:2254},
  {occ:88,adr:980, revpar:862, rooms:8452, fb:2493,anc:1217,costs:8319, net:1837},
  {occ:82,adr:760, revpar:623, rooms:6762, fb:1995,anc:974, costs:6656, net:1470},
  {occ:79,adr:680, revpar:537, rooms:5641, fb:1664,anc:812, costs:5552, net:1226},
  {occ:65,adr:530, revpar:344, rooms:3738, fb:1103,anc:538, costs:3679, net:813 },
  {occ:48,adr:400, revpar:192, rooms:2016, fb:595, anc:290, costs:1984, net:438 },
  {occ:44,adr:380, revpar:167, rooms:1814, fb:535, anc:261, costs:1785, net:394 },
  {occ:42,adr:370, revpar:155, rooms:1686, fb:497, anc:243, costs:1659, net:366 },
  {occ:62,adr:520, revpar:322, rooms:3385, fb:999, anc:487, costs:3332, net:736 },
  {occ:78,adr:610, revpar:476, rooms:5162, fb:1523,anc:743, costs:5081, net:1122},
  {occ:86,adr:840, revpar:722, rooms:7585, fb:2238,anc:1092,costs:7466, net:1649},
  {occ:90,adr:990, revpar:891, rooms:9667, fb:2852,anc:1392,costs:9515, net:2101},
];

export const monthlyData: MonthlyData[] = raw.map(d => ({
  ...d,
  tot: d.rooms + d.fb + d.anc,
}));

export const budgetOcc = [88,85,80,76,62,46,42,40,60,74,83,88];
export const budgetAdr = [1000,940,720,640,500,380,360,350,495,580,800,950];

// P&L data
export const plData = [
  {h:'REVENUE'},
  {l:'Rooms Revenue',v:66280000,pct:69.5,yoy:9.4,n:'Weighted ADR AED 729 x 90,881 nights sold'},
  {l:'Food & Beverage',v:19553000,pct:20.5,yoy:10.8,n:'Restaurants, Bar, In-Room Dining'},
  {l:'Spa & Wellness',v:5302000,pct:5.6,yoy:13.2,n:'Treatments + retail'},
  {l:'Meetings & Events',v:2784000,pct:2.9,yoy:16.4,n:'MICE - fastest growing segment'},
  {l:'Other Ancillary',v:1461000,pct:1.5,yoy:5.8,n:'Parking, laundry, misc.'},
  {t:'TOTAL REVENUE',v:95380000,pct:100.0,yoy:9.1},
  {h:'OPERATING COSTS'},
  {l:'Cost of Goods Sold',v:-17645000,pct:-18.5,yoy:7.8,n:'F&B COGS + room amenities + linen'},
  {l:'Payroll & Benefits',v:-28232000,pct:-29.6,yoy:7.0,n:'Staff, visa, insurance, DEWS'},
  {l:'Utilities & Energy',v:-5818000,pct:-6.1,yoy:3.4,n:'Electricity, district cooling, water'},
  {l:'Sales & Marketing',v:-4006000,pct:-4.2,yoy:11.8,n:'OTA commissions, digital, PR'},
  {l:'Admin & General',v:-6486000,pct:-6.8,yoy:5.3,n:'IT, insurance, legal, finance'},
  {l:'Maintenance & CapEx',v:-3052000,pct:-3.2,yoy:2.0,n:'FF&E reserve + repairs'},
  {t:'GROSS OPERATING PROFIT',v:30141000,pct:31.6,yoy:11.4},
  {l:'Brand Management Fee',v:-6200000,pct:-6.5,yoy:9.1,n:'Base 3% + Incentive 3.5%'},
  {l:'Owner Costs & Reserve',v:-4580000,pct:-4.8,yoy:3.8,n:'Property insurance, tax, reserves'},
  {t:'EBITDA',v:19361000,pct:20.3,yoy:13.2},
  {l:'Depreciation & Amort.',v:-3529000,pct:-3.7,yoy:1.5,n:'Asset useful life 25-40 years'},
  {t:'EBIT',v:15832000,pct:16.6,yoy:15.4},
  {l:'Finance Costs (net)',v:0,pct:0,yoy:0,n:'Debt-free assumption'},
  {l:'Corporate Tax (9%)',v:-1439280,pct:-1.5,yoy:null,n:'UAE CT on AED 15,992,000 taxable income'},
  {t:'NET PROFIT',v:14392720,pct:15.1,yoy:16.8},
] as Array<{h?:string;l?:string;t?:string;v?:number;pct?:number;yoy?:number|null;n?:string}>;

// Cost categories
export const costCategories = ['Payroll & Benefits','COGS','Admin & General','Brand Mgmt Fee','Utilities & Energy','Sales & Marketing','Maintenance','Owner Costs'];
export const costValues = [28232,17645,6486,6200,5818,4006,3052,4580];

// Payroll by department
export const payrollDepts = ['Rooms & Front Office','F&B Service','Kitchen','Spa & Recreation','Engineering','Sales & Rev. Mgmt','HR & Admin','Finance & GM'];
export const payrollValues = [7200,5800,4100,2900,2600,2300,1900,1432];

// Benchmark data
export const compSet = [
  {name:'Hotel X (Ours)',revpar:519,note:'Our Property'},
  {name:'Ultra-Lux A (RAK 5★)',revpar:620,note:'Larger asset'},
  {name:'Ultra-Lux B (RAK flagship)',revpar:780,note:'Top tier'},
  {name:'Mid-Scale (RAK 4★)',revpar:310,note:'Budget segment'},
  {name:'RAK Market (all seg.)',revpar:353,note:'Provincial avg'},
  {name:'UAE Provincial (all seg.)',revpar:352,note:'National avg'},
];

export const trendData = [
  {year:'2022',hotelX:370,market:235},
  {year:'2023',hotelX:420,market:292},
  {year:'2024',hotelX:467,market:317},
  {year:'2025 (Actual)',hotelX:519,market:353},
  {year:'2026 (Proj.)',hotelX:588,market:390},
];

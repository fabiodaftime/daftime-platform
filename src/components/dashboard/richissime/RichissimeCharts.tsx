import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { DATA, SCENARIOS, RichissimeScenario, COSTS } from './RichissimeData';

// Colors
const COLORS = {
  gold: '#C8A35F',
  goldDark: '#A88B4A',
  goldLight: '#D4B87A',
  navy: '#1B2B4B',
  navyLight: '#2A3F66',
  success: '#2D8B6F',
  warning: '#C75D3A',
  danger: '#DC2626',
  info: '#3B82F6'
};

// Overview Main Chart - Revenue Evolution
export function RichissimeOverviewChart() {
  const allMonths = [...DATA.historical.months, ...DATA.q4.months];
  const chartData = allMonths.map((month, idx) => {
    const revenue = idx < DATA.historical.months.length
      ? DATA.historical.revenue[idx]
      : DATA.q4.revenue[idx - DATA.historical.months.length];
    const forecast = idx < DATA.historical.months.length
      ? DATA.historical.forecast[idx]
      : DATA.q4.forecast[idx - DATA.historical.months.length];
    return { month, revenue, forecast };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Legend />
        <Bar dataKey="revenue" name="CA Réel" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="forecast" name="Prévu" stroke={COLORS.navy} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Products Donut Chart
export function RichissimeProductsDonut() {
  const data = [
    { name: 'Liberty Cashflow', value: 45, color: COLORS.gold },
    { name: 'Masterclasses', value: 22, color: COLORS.navy },
    { name: 'Coaching', value: 18, color: COLORS.success },
    { name: 'Podcast', value: 8, color: COLORS.warning },
    { name: 'Affiliation', value: 7, color: COLORS.goldLight },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) => `${value}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={3} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value}%`]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Costs Donut Chart
export function RichissimeCostsDonut() {
  const data = [
    { name: 'Formateurs', value: 16.5, color: COLORS.warning },
    { name: 'Marketing', value: 21.2, color: COLORS.gold },
    { name: 'Plateforme', value: 5.3, color: COLORS.navy },
    { name: 'Stripe', value: 4.0, color: COLORS.success },
    { name: 'Admin', value: 9.6, color: COLORS.navyLight },
    { name: 'Autres', value: 3.6, color: COLORS.goldLight },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ value }) => `${value}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={3} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value}%`]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Forecast Bar Chart
export function RichissimeForecastBarChart() {
  const data = DATA.q4.months.map((month, idx) => ({
    month,
    reel: DATA.q4.revenue[idx],
    prevu: DATA.q4.forecast[idx]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Legend />
        <Bar dataKey="reel" name="Réel" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
        <Bar dataKey="prevu" name="Prévu" fill={COLORS.navyLight} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Variance Chart
export function RichissimeVarianceChart() {
  const data = DATA.q4.months.map((month, idx) => {
    const variance = ((DATA.q4.revenue[idx] - DATA.q4.forecast[idx]) / DATA.q4.forecast[idx] * 100);
    return {
      month,
      variance: parseFloat(variance.toFixed(1)),
      color: variance >= 0 ? COLORS.success : COLORS.warning
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v}%`} domain={[-10, 10]} />
        <Tooltip formatter={(value: number) => [`${value}%`]} />
        <Bar dataKey="variance" name="Écart %">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Yearly Comparison Chart
export function RichissimeYearlyChart() {
  const allMonths = [...DATA.historical.months, ...DATA.q4.months];
  const chartData = allMonths.map((month, idx) => {
    const revenue = idx < DATA.historical.months.length
      ? DATA.historical.revenue[idx]
      : DATA.q4.revenue[idx - DATA.historical.months.length];
    const forecast = idx < DATA.historical.months.length
      ? DATA.historical.forecast[idx]
      : DATA.q4.forecast[idx - DATA.historical.months.length];
    return { month, revenue, forecast };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Legend />
        <Area type="monotone" dataKey="revenue" name="Réel" fill="rgba(200,163,95,0.1)" stroke={COLORS.gold} strokeWidth={3} />
        <Line type="monotone" dataKey="forecast" name="Prévu" stroke={COLORS.navy} strokeWidth={2} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Radar Chart
export function RichissimeRadarChart() {
  const data = [
    { subject: 'CA', actual: 103, target: 100 },
    { subject: 'EBITDA', actual: 90, target: 100 },
    { subject: 'Marge', actual: 94, target: 100 },
    { subject: 'Clients', actual: 105, target: 100 },
    { subject: 'NPS', actual: 111, target: 100 },
    { subject: 'Conversion', actual: 105, target: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid stroke="#E2DDD3" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748B' }} />
        <PolarRadiusAxis angle={30} domain={[0, 120]} tick={{ fontSize: 10, fill: '#64748B' }} />
        <Radar name="Réel Q4" dataKey="actual" stroke={COLORS.gold} fill={COLORS.gold} fillOpacity={0.2} strokeWidth={2} />
        <Radar name="Objectif" dataKey="target" stroke={COLORS.navy} fill={COLORS.navy} fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Cumulative Chart
export function RichissimeCumulativeChart() {
  const allMonths = [...DATA.historical.months, ...DATA.q4.months];
  let cumReal = 0, cumForecast = 0;
  const chartData = allMonths.map((month, idx) => {
    const revenue = idx < DATA.historical.months.length
      ? DATA.historical.revenue[idx]
      : DATA.q4.revenue[idx - DATA.historical.months.length];
    const forecast = idx < DATA.historical.months.length
      ? DATA.historical.forecast[idx]
      : DATA.q4.forecast[idx - DATA.historical.months.length];
    cumReal += revenue;
    cumForecast += forecast;
    return { month, cumReal: parseFloat(cumReal.toFixed(1)), cumForecast: parseFloat(cumForecast.toFixed(1)) };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Legend />
        <Area type="monotone" dataKey="cumReal" name="Cumul Réel" fill="rgba(200,163,95,0.15)" stroke={COLORS.gold} strokeWidth={3} />
        <Line type="monotone" dataKey="cumForecast" name="Cumul Prévu" stroke={COLORS.navy} strokeWidth={2} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Evolution 2026 Chart
export function RichissimeEvolution2026Chart({ scenario }: { scenario: RichissimeScenario }) {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const data = months.map((month, idx) => ({
    month,
    ca: scenario.forecast2026[idx]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Area type="monotone" dataKey="ca" name="CA 2026" fill="rgba(200,163,95,0.1)" stroke={COLORS.gold} strokeWidth={3} dot={{ r: 5, fill: COLORS.gold }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Scenarios Comparison Chart
export function RichissimeScenariosChart() {
  const data = [
    { name: 'Prudent', ca: SCENARIOS.prudent.total2026 },
    { name: 'Base', ca: SCENARIOS.base.total2026 },
    { name: 'Optimiste', ca: SCENARIOS.optimiste.total2026 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Bar dataKey="ca" name="CA 2026" radius={[4, 4, 0, 0]}>
          <Cell fill={COLORS.navyLight} />
          <Cell fill={COLORS.gold} />
          <Cell fill={COLORS.success} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Quarterly Growth Chart
export function RichissimeQuarterlyChart({ scenario }: { scenario: RichissimeScenario }) {
  const q1 = scenario.forecast2026.slice(0, 3).reduce((a, b) => a + b, 0);
  const q2 = scenario.forecast2026.slice(3, 6).reduce((a, b) => a + b, 0);
  const q3 = scenario.forecast2026.slice(6, 9).reduce((a, b) => a + b, 0);
  const q4 = scenario.forecast2026.slice(9, 12).reduce((a, b) => a + b, 0);

  const data = [
    { quarter: 'Q1', ca: q1 },
    { quarter: 'Q2', ca: q2 },
    { quarter: 'Q3', ca: q3 },
    { quarter: 'Q4', ca: q4 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Bar dataKey="ca" name="CA" radius={[8, 8, 0, 0]}>
          <Cell fill={COLORS.goldLight} />
          <Cell fill={COLORS.gold} />
          <Cell fill={COLORS.goldDark} />
          <Cell fill={COLORS.navy} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Products Pie Chart
export function RichissimeProductsPie() {
  const data = [
    { name: 'Liberty CF', value: 134.8 },
    { name: 'Masterclass', value: 65.9 },
    { name: 'Coaching', value: 53.9 },
    { name: 'Podcast', value: 24.0 },
    { name: 'Affiliation', value: 20.9 },
  ];
  const colors = [COLORS.gold, COLORS.navy, COLORS.success, COLORS.warning, COLORS.goldLight];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => `${value} k€`}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} stroke="#fff" strokeWidth={3} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Legend layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Products Bar Chart
export function RichissimeProductsBarChart() {
  const data = [
    { name: 'Liberty CF', reel: 45, prevu: 50 },
    { name: 'Masterclass', reel: 22, prevu: 20 },
    { name: 'Coaching', reel: 18, prevu: 15 },
    { name: 'Podcast', reel: 8, prevu: 10 },
    { name: 'Affiliation', reel: 7, prevu: 5 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
        <Tooltip formatter={(value: number) => [`${value}%`]} />
        <Legend />
        <Bar dataKey="reel" name="Réel" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
        <Bar dataKey="prevu" name="Prévu" fill={COLORS.navyLight} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Costs Monthly Charts
export function RichissimeCostsMonthlyChart({ month }: { month: 'oct' | 'nov' | 'dec' }) {
  const labels = ['Formateurs', 'Marketing', 'Plateforme', 'Stripe', 'Admin', 'Autres'];
  const costs = COSTS[month];
  const data = labels.map((label, idx) => ({
    label,
    reel: costs.actual[idx] / 1000,
    budget: costs.forecast[idx] / 1000
  }));
  const color = month === 'dec' ? COLORS.warning : month === 'nov' ? COLORS.success : COLORS.gold;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value.toFixed(1)} k€`]} />
        <Legend />
        <Bar dataKey="reel" name="Réel" fill={color} radius={[4, 4, 0, 0]} />
        <Bar dataKey="budget" name="Budget" fill={COLORS.navyLight} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Costs Structure Chart
export function RichissimeCostsStructureChart() {
  const data = [
    { name: 'Prudent', formateurs: 15, marketing: 18, tech: 9, admin: 10 },
    { name: 'Base', formateurs: 13, marketing: 16, tech: 9, admin: 9 },
    { name: 'Optimiste', formateurs: 11, marketing: 15, tech: 8, admin: 8 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(value: number) => [`${value}%`]} />
        <Legend />
        <Bar dataKey="formateurs" name="Formateurs" stackId="a" fill={COLORS.warning} />
        <Bar dataKey="marketing" name="Marketing" stackId="a" fill={COLORS.gold} />
        <Bar dataKey="tech" name="Tech" stackId="a" fill={COLORS.navy} />
        <Bar dataKey="admin" name="Admin" stackId="a" fill={COLORS.success} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Margins Evolution Chart
export function RichissimeMarginsEvolutionChart() {
  const data = DATA.q4.months.map((month, idx) => ({
    month,
    margeReelle: DATA.q4.margins[idx],
    margePrevue: DATA.q4.marginsForecast[idx]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
        <Tooltip formatter={(value: number) => [`${value}%`]} />
        <Legend />
        <Area type="monotone" dataKey="margeReelle" name="Marge Réelle" fill="rgba(200,163,95,0.2)" stroke={COLORS.gold} strokeWidth={3} />
        <Line type="monotone" dataKey="margePrevue" name="Prévue" stroke={COLORS.navy} strokeWidth={2} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Margins Comparison Chart
export function RichissimeMarginsComparisonChart() {
  const data = [
    { name: 'Prudent', margeBrute: 62, margeEBITDA: 28 },
    { name: 'Base', margeBrute: 65, margeEBITDA: 32 },
    { name: 'Optimiste', margeBrute: 68, margeEBITDA: 38 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v}%`} domain={[0, 80]} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
        <Tooltip formatter={(value: number) => [`${value}%`]} />
        <Legend />
        <Bar dataKey="margeBrute" name="Marge Brute" fill={COLORS.gold} radius={[0, 4, 4, 0]} />
        <Bar dataKey="margeEBITDA" name="Marge EBITDA" fill={COLORS.success} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Waterfall Chart
export function RichissimeWaterfallChart() {
  const data = [
    { name: 'CA Q4', value: 299.5, fill: COLORS.gold },
    { name: 'Formateurs', value: -49.4, fill: COLORS.warning },
    { name: 'Marketing', value: -63.5, fill: COLORS.warning },
    { name: 'Plateforme', value: -15.9, fill: COLORS.warning },
    { name: 'Stripe', value: -12.0, fill: COLORS.warning },
    { name: 'Admin', value: -28.8, fill: COLORS.warning },
    { name: 'Autres', value: -10.8, fill: COLORS.warning },
    { name: 'EBITDA', value: 113.1, fill: COLORS.success },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Objectives Roadmap Chart
export function RichissimeRoadmapChart({ scenario }: { scenario: RichissimeScenario }) {
  const q1 = scenario.forecast2026.slice(0, 3).reduce((a, b) => a + b, 0);
  const q2 = scenario.forecast2026.slice(3, 6).reduce((a, b) => a + b, 0);
  const q3 = scenario.forecast2026.slice(6, 9).reduce((a, b) => a + b, 0);
  const q4 = scenario.forecast2026.slice(9, 12).reduce((a, b) => a + b, 0);

  const data = [
    { quarter: 'Q1 2026', ca: q1 },
    { quarter: 'Q2 2026', ca: q2 },
    { quarter: 'Q3 2026', ca: q3 },
    { quarter: 'Q4 2026', ca: q4 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD3" />
        <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v} k€`} />
        <Tooltip formatter={(value: number) => [`${value} k€`]} />
        <Bar dataKey="ca" name="Objectif CA" radius={[8, 8, 0, 0]}>
          <Cell fill={COLORS.goldLight} />
          <Cell fill={COLORS.gold} />
          <Cell fill={COLORS.goldDark} />
          <Cell fill={COLORS.navy} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

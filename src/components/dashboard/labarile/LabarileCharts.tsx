import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  LineChart,
  Line,
  LabelList,
} from 'recharts';
import { ACTUALS, ACTUALS_2026, SCENARIOS, MONTHS_2026, Scenario, BASKET_EVOLUTION, PROGRAMS_MIX, CLOSERS_DATA } from './LabarileData';
import {
  LabarileGradients,
  LabarileTooltip,
  LAB_AXIS_TICK,
  LAB_GRID_STROKE,
} from './LabarileChartPrimitives';

const COLORS = {
  primary: '#7CC9CC',
  primaryDark: '#5AB5B8',
  primaryLight: '#9DD8DA',
  ice: '#C9EDEF',
  success: '#4EB79F',
  warning: '#E87E60',
  coaches: '#E87E60',
  marketing: '#7CC9CC',
  admin: '#4EB79F',
  stripe: '#9DD8DA',
  tools: '#C9EDEF',
};

interface RevenueChartProps {
  scenario: Scenario;
}

export function LabarileMainRevenueChart({ scenario, actuals2026Override }: RevenueChartProps & { actuals2026Override?: { months: string[]; revenue: number[] } }) {
  const actuals2026 = actuals2026Override ?? ACTUALS_2026;
  const actuals2026Count = actuals2026.revenue.length;
  const data = [
    ...ACTUALS.months.map((month, idx) => ({
      month,
      actual: ACTUALS.revenue[idx],
      projected: null as number | null,
    })),
    ...MONTHS_2026.map((month, idx) => ({
      month: month + ' 26',
      actual: idx < actuals2026Count ? actuals2026.revenue[idx] : (null as number | null),
      projected: idx < actuals2026Count ? (null as number | null) : scenario.forecast2026[idx],
    })),
  ];

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#666', fontSize: 11 }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tickFormatter={(v) => v + ' k'}
            tick={{ fill: '#666', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '12px'
            }}
            formatter={(value: number) => [value?.toFixed(1) + ' kAED', '']}
          />
          <Legend />
          <Bar dataKey="actual" fill={COLORS.primary} name="CA Réel" radius={[4, 4, 0, 0]} />
          <Bar dataKey="projected" fill={COLORS.ice} name="CA Projeté" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
}

export function LabarileDonutChart({ data }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <div className="h-[260px] lg:h-[300px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={3}
            dataKey="value"
            stroke="white"
            strokeWidth={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={
              <LabarileTooltip valueFormatter={(v) => v + '%'} />
            }
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value) => <span className="text-xs text-labarile-muted">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Centered total */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center -mt-7">
        <p className="text-[10px] uppercase tracking-wider text-labarile-muted font-semibold">Total</p>
        <p className="font-bebas text-2xl text-labarile-primary-dark leading-none">{total}%</p>
      </div>
    </div>
  );
}

export function LabarileEvolutionChart({ scenario }: RevenueChartProps) {
  const data = MONTHS_2026.map((month, idx) => ({ month, value: scenario.forecast2026[idx] }));

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={{ stroke: '#E0E0E0' }} tickLine={false} />
          <YAxis tickFormatter={(v) => v + ' k'} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number) => [value + ' kAED', 'CA Mensuel']} />
          <Area type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={3} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileServicesMixChart() {
  const data = [
    { scenario: 'Prudent', individual: SCENARIOS.prudent.servicesMix.individual, collective: SCENARIOS.prudent.servicesMix.collective, elearning: SCENARIOS.prudent.servicesMix.elearning },
    { scenario: 'Base', individual: SCENARIOS.base.servicesMix.individual, collective: SCENARIOS.base.servicesMix.collective, elearning: SCENARIOS.base.servicesMix.elearning },
    { scenario: 'Optimiste', individual: SCENARIOS.optimiste.servicesMix.individual, collective: SCENARIOS.optimiste.servicesMix.collective, elearning: SCENARIOS.optimiste.servicesMix.elearning },
  ];

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="scenario" tick={{ fill: '#666', fontSize: 12 }} />
          <YAxis tickFormatter={(v) => v + '%'} tick={{ fill: '#666', fontSize: 11 }} domain={[0, 100]} />
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value: number) => [value + '%', '']} />
          <Legend />
          <Bar dataKey="individual" stackId="a" fill={COLORS.primary} name="Coaching Individuel" />
          <Bar dataKey="collective" stackId="a" fill={COLORS.success} name="Coaching Collectif" />
          <Bar dataKey="elearning" stackId="a" fill={COLORS.primaryLight} name="E-learning" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileCostsChart() {
  const data = [
    { scenario: 'Prudent', coaches: SCENARIOS.prudent.costs.coaches, marketing: SCENARIOS.prudent.costs.marketing, admin: SCENARIOS.prudent.costs.admin },
    { scenario: 'Base', coaches: SCENARIOS.base.costs.coaches, marketing: SCENARIOS.base.costs.marketing, admin: SCENARIOS.base.costs.admin },
    { scenario: 'Optimiste', coaches: SCENARIOS.optimiste.costs.coaches, marketing: SCENARIOS.optimiste.costs.marketing, admin: SCENARIOS.optimiste.costs.admin },
  ];

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="scenario" tick={{ fill: '#666', fontSize: 12 }} />
          <YAxis tickFormatter={(v) => v + '%'} tick={{ fill: '#666', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value: number) => [value + '%', '']} />
          <Legend />
          <Bar dataKey="coaches" fill={COLORS.warning} name="Coaches" radius={[4, 4, 0, 0]} />
          <Bar dataKey="marketing" fill={COLORS.primary} name="Marketing" radius={[4, 4, 0, 0]} />
          <Bar dataKey="admin" fill={COLORS.success} name="Admin" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileMarginsChart() {
  const data = [
    { scenario: 'Prudent', gross: SCENARIOS.prudent.margins.gross, operating: SCENARIOS.prudent.margins.operating },
    { scenario: 'Base', gross: SCENARIOS.base.margins.gross, operating: SCENARIOS.base.margins.operating },
    { scenario: 'Optimiste', gross: SCENARIOS.optimiste.margins.gross, operating: SCENARIOS.optimiste.margins.operating },
  ];

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => v + '%'} tick={{ fill: '#666', fontSize: 11 }} domain={[0, 60]} />
          <YAxis type="category" dataKey="scenario" tick={{ fill: '#666', fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value: number) => [value + '%', '']} />
          <Legend />
          <Bar dataKey="gross" fill={COLORS.primary} name="Marge Brute" radius={[0, 4, 4, 0]} />
          <Bar dataKey="operating" fill={COLORS.success} name="Marge Opérationnelle" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// NEW CHARTS for Breakdown page
export function LabarileProgramsChart() {
  return (
    <div className="h-[250px] lg:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={PROGRAMS_MIX} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
            {PROGRAMS_MIX.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value: number) => [value + '%', '']} />
          <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="text-xs text-labarile-muted">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileClosersChart() {
  const data = CLOSERS_DATA.map(c => ({ name: c.name, ca: parseFloat(c.ca.replace(/,/g, '')) / 1000 }));

  return (
    <div className="h-[250px] lg:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="horizontal" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 12 }} />
          <YAxis tickFormatter={(v) => v + 'k'} tick={{ fill: '#666', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value: number) => [value.toFixed(1) + ' kAED', '']} />
          <Bar dataKey="ca" name="CA (kAED)" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={['#4EB79F', '#7CC9CC', '#9DD8DA', '#C9EDEF', '#E4F5F7'][index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileBasketChart() {
  return (
    <div className="h-[250px] lg:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={BASKET_EVOLUTION} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="basketGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} />
          <YAxis domain={[7000, 'auto']} tickFormatter={(v) => v.toLocaleString()} tick={{ fill: '#666', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value: number) => [value.toLocaleString() + ' AED', 'Panier Moyen']} />
          <Area type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={3} fill="url(#basketGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Monthly Costs Chart (Actual only)
interface MonthlyCostsChartProps {
  actual: { coaches: number; marketing: number; it: number; stripe: number; admin: number; autres: number };
  revenue: number;
  scenario?: Scenario;
}

export function LabarileMonthlyCostsChart({ actual, revenue }: MonthlyCostsChartProps) {
  const labels = ['Coaches', 'Marketing', 'IT & Tools', 'Stripe/Fees', 'Admin', 'Autres'];
  const actualValues = [actual.coaches, actual.marketing, actual.it, actual.stripe, actual.admin, actual.autres];

  const data = labels.map((label, idx) => ({
    name: label,
    actual: Math.round(actualValues[idx]),
  }));

  return (
    <div className="h-[260px] lg:h-[310px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 16, left: 6, bottom: 5 }} barCategoryGap="30%">
          <LabarileGradients />
          <CartesianGrid strokeDasharray="4 6" stroke={LAB_GRID_STROKE} vertical={false} />
          <XAxis dataKey="name" tick={LAB_AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
          <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + ' k'} tick={LAB_AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(232,126,96,0.08)' }}
            content={
              <LabarileTooltip
                valueFormatter={(v) => {
                  const pct = revenue > 0 ? ((v / revenue) * 100).toFixed(1) : '0.0';
                  return (v / 1000).toFixed(1) + 'k AED · ' + pct + '%';
                }}
              />
            }
          />
          <Bar dataKey="actual" name="Réel" fill="url(#lab-grad-warning)" radius={[8, 8, 0, 0]} maxBarSize={56}>
            <LabelList
              dataKey="actual"
              position="top"
              formatter={(v: number) => (v / 1000).toFixed(0) + 'k'}
              style={{ fill: '#a04a30', fontSize: 10, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Treasury Charts
export function LabarileTreasuryDonut() {
  const data = [
    { name: 'Tréso Disponible', value: 350.6, color: COLORS.warning },
    { name: 'Provision TVA EU', value: 150, color: '#F59E0B' },
  ];

  return (
    <div className="h-[250px] lg:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} 
            formatter={(value: number) => [value.toFixed(1) + ' kAED (' + (value / 500.6 * 100).toFixed(1) + '%)', '']}
          />
          <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="text-xs text-labarile-muted">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileDebtChart() {
  const data = [
    { name: 'Dettes Fournisseurs', value: 33.6, color: COLORS.warning },
    { name: 'TVA UAE', value: 3.7, color: '#F59E0B' },
    { name: 'Provision TVA EU', value: 150, color: '#DC2626' },
  ];

  return (
    <div className="h-[250px] lg:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis tickFormatter={(v) => v + 'k'} tick={{ fill: '#666', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} formatter={(value: number) => [value.toFixed(1) + ' kAED', '']} />
          <Bar dataKey="value" name="Montant (kAED)" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

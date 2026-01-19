import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { ACTUALS, SCENARIOS, MONTHS_2026, Scenario } from './LabarileData';

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
  tools: '#C9EDEF'
};

interface RevenueChartProps {
  scenario: Scenario;
}

export function LabarileMainRevenueChart({ scenario }: RevenueChartProps) {
  const data = [
    ...ACTUALS.months.map((month, idx) => ({
      month,
      actual: ACTUALS.revenue[idx],
      projected: null
    })),
    ...MONTHS_2026.map((month, idx) => ({
      month: month + ' 26',
      actual: null,
      projected: scenario.forecast2026[idx]
    }))
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
          <Bar 
            dataKey="actual" 
            fill={COLORS.primary}
            name="CA Réel"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="projected" 
            fill={COLORS.ice}
            name="CA Projeté"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
}

export function LabarileDonutChart({ data }: DonutChartProps) {
  return (
    <div className="h-[200px] lg:h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number) => [value + '%', '']}
          />
          <Legend 
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileEvolutionChart({ scenario }: RevenueChartProps) {
  const data = MONTHS_2026.map((month, idx) => ({
    month,
    value: scenario.forecast2026[idx]
  }));

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
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#666', fontSize: 11 }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            formatter={(value: number) => [value + ' kAED', 'CA Mensuel']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={COLORS.primary}
            strokeWidth={3}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileServicesMixChart() {
  const data = [
    {
      scenario: 'Prudent',
      individual: SCENARIOS.prudent.servicesMix.individual,
      collective: SCENARIOS.prudent.servicesMix.collective,
      elearning: SCENARIOS.prudent.servicesMix.elearning
    },
    {
      scenario: 'Base',
      individual: SCENARIOS.base.servicesMix.individual,
      collective: SCENARIOS.base.servicesMix.collective,
      elearning: SCENARIOS.base.servicesMix.elearning
    },
    {
      scenario: 'Optimiste',
      individual: SCENARIOS.optimiste.servicesMix.individual,
      collective: SCENARIOS.optimiste.servicesMix.collective,
      elearning: SCENARIOS.optimiste.servicesMix.elearning
    }
  ];

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="horizontal" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" horizontal={true} vertical={false} />
          <XAxis dataKey="scenario" tick={{ fill: '#666', fontSize: 12 }} />
          <YAxis 
            tickFormatter={(v) => v + '%'} 
            tick={{ fill: '#666', fontSize: 11 }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [value + '%', '']}
          />
          <Legend />
          <Bar dataKey="individual" stackId="a" fill={COLORS.primary} name="Coaching Individuel" radius={[0, 0, 0, 0]} />
          <Bar dataKey="collective" stackId="a" fill={COLORS.success} name="Coaching Collectif" radius={[0, 0, 0, 0]} />
          <Bar dataKey="elearning" stackId="a" fill={COLORS.primaryLight} name="E-learning" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LabarileCostsChart() {
  const data = [
    {
      scenario: 'Prudent',
      coaches: SCENARIOS.prudent.costs.coaches,
      marketing: SCENARIOS.prudent.costs.marketing,
      admin: SCENARIOS.prudent.costs.admin
    },
    {
      scenario: 'Base',
      coaches: SCENARIOS.base.costs.coaches,
      marketing: SCENARIOS.base.costs.marketing,
      admin: SCENARIOS.base.costs.admin
    },
    {
      scenario: 'Optimiste',
      coaches: SCENARIOS.optimiste.costs.coaches,
      marketing: SCENARIOS.optimiste.costs.marketing,
      admin: SCENARIOS.optimiste.costs.admin
    }
  ];

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="scenario" tick={{ fill: '#666', fontSize: 12 }} />
          <YAxis 
            tickFormatter={(v) => v + '%'} 
            tick={{ fill: '#666', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [value + '%', '']}
          />
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
    {
      scenario: 'Prudent',
      gross: SCENARIOS.prudent.margins.gross,
      operating: SCENARIOS.prudent.margins.operating
    },
    {
      scenario: 'Base',
      gross: SCENARIOS.base.margins.gross,
      operating: SCENARIOS.base.margins.operating
    },
    {
      scenario: 'Optimiste',
      gross: SCENARIOS.optimiste.margins.gross,
      operating: SCENARIOS.optimiste.margins.operating
    }
  ];

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" horizontal={false} />
          <XAxis 
            type="number" 
            tickFormatter={(v) => v + '%'} 
            tick={{ fill: '#666', fontSize: 11 }}
            domain={[0, 60]}
          />
          <YAxis 
            type="category" 
            dataKey="scenario" 
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [value + '%', '']}
          />
          <Legend />
          <Bar dataKey="gross" fill={COLORS.primary} name="Marge Brute" radius={[0, 4, 4, 0]} />
          <Bar dataKey="operating" fill={COLORS.success} name="Marge Opérationnelle" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

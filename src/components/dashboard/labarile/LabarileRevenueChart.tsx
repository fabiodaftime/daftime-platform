import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RevenueDataPoint {
  month: string;
  actual: number;
  budget?: number;
}

interface LabarileRevenueChartProps {
  data: RevenueDataPoint[];
  showBudget?: boolean;
}

export function LabarileRevenueChart({ data, showBudget = false }: LabarileRevenueChartProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" vertical={false} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: 'hsl(0, 0%, 40%)', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(0, 0%, 88%)' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={formatValue}
            tick={{ fill: 'hsl(0, 0%, 40%)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid hsl(0, 0%, 88%)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            formatter={(value: number) => [formatValue(value) + ' €', '']}
          />
          {showBudget && <Legend />}
          <Bar 
            dataKey="actual" 
            fill="hsl(180, 40%, 75%)" 
            radius={[4, 4, 0, 0]}
            name="Réalisé"
          />
          {showBudget && (
            <Bar 
              dataKey="budget" 
              fill="hsl(0, 0%, 85%)" 
              radius={[4, 4, 0, 0]}
              name="Budget"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RevenueDataPoint {
  month: string;
  actual: number;
  budget?: number;
}

interface BocuseRevenueChartProps {
  data: RevenueDataPoint[];
  title: string;
  showBudget?: boolean;
}

export function BocuseRevenueChart({ data, title, showBudget = false }: BocuseRevenueChartProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div className="bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-5 shadow-xl border border-white/10">
      {title && (
        <h3 className="text-white font-medium mb-4">{title}</h3>
      )}
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#a8b0c8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={formatValue}
              tick={{ fill: '#a8b0c8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#101d6a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
              formatter={(value: number) => [formatValue(value) + ' AED', '']}
            />
            {showBudget && <Legend />}
            <Bar 
              dataKey="actual" 
              fill="#F80000" 
              radius={[4, 4, 0, 0]}
              name="Réalisé"
            />
            {showBudget && (
              <Bar 
                dataKey="budget" 
                fill="rgba(255,255,255,0.3)" 
                radius={[4, 4, 0, 0]}
                name="Budget"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

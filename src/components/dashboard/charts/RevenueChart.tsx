import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RevenueChartProps {
  data: {
    month: string;
    actual: number;
    budget: number;
    priorYear: number;
  }[];
  currency?: string;
}

export function RevenueChart({ data, currency = 'EUR' }: RevenueChartProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-dashboard-card rounded-lg p-5 border border-dashboard-border">
      <h3 className="text-sm font-medium text-dashboard-text-muted uppercase tracking-wider mb-4">
        Revenue Comparison
      </h3>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 25%)" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(220, 15%, 25%)' }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={formatValue}
              tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 20%, 18%)',
                border: '1px solid hsl(220, 15%, 25%)',
                borderRadius: '8px',
                color: 'hsl(220, 10%, 85%)',
              }}
              formatter={(value: number) => [formatValue(value), '']}
            />
            <Legend 
              wrapperStyle={{ color: 'hsl(220, 10%, 55%)' }}
            />
            <Bar 
              dataKey="actual" 
              name="Actual" 
              fill="hsl(45, 70%, 50%)" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="budget" 
              name="Budget" 
              fill="hsl(210, 80%, 55%)" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="priorYear" 
              name="Prior Year" 
              fill="hsl(220, 10%, 45%)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

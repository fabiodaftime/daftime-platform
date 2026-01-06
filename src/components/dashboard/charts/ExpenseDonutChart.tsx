import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ExpenseDonutChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  currency?: string;
  onSliceClick?: (category: string) => void;
}

export function ExpenseDonutChart({ data, currency = 'EUR', onSliceClick }: ExpenseDonutChartProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-dashboard-card rounded-lg p-5 border border-dashboard-border">
      <h3 className="text-sm font-medium text-dashboard-text-muted uppercase tracking-wider mb-4">
        Expense Breakdown
      </h3>
      
      <div className="h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              onClick={(entry) => onSliceClick?.(entry.name)}
              style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="hsl(220, 20%, 18%)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 20%, 18%)',
                border: '1px solid hsl(220, 15%, 25%)',
                borderRadius: '8px',
                color: 'hsl(220, 10%, 85%)',
              }}
              formatter={(value: number, name: string) => [
                `${formatValue(value)} (${((value / total) * 100).toFixed(1)}%)`,
                name
              ]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => (
                <span style={{ color: 'hsl(220, 10%, 85%)', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute top-1/2 left-[calc(50%-45px)] -translate-y-1/2 text-center">
          <p className="text-xs text-dashboard-text-muted">Total</p>
          <p className="text-lg font-bold text-dashboard-text">{formatValue(total)}</p>
        </div>
      </div>
    </div>
  );
}

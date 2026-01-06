import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ExpenseDataPoint {
  name: string;
  value: number;
  color: string;
  percent: number;
}

interface BocuseExpenseChartProps {
  data: ExpenseDataPoint[];
  title: string;
}

export function BocuseExpenseChart({ data, title }: BocuseExpenseChartProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-5 shadow-xl border border-white/10">
      {title && (
        <h3 className="text-white font-medium mb-4">{title}</h3>
      )}
      
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
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#101d6a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
              formatter={(value: number, name: string) => [
                `${formatValue(value)} AED (${((value / total) * 100).toFixed(1)}%)`,
                name
              ]}
            />
            <Legend 
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value) => <span className="text-bocuse-gray text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-20px' }}>
          <p className="text-xs text-bocuse-gray">Total</p>
          <p className="text-lg font-bold text-white">{formatValue(total)}</p>
          <p className="text-xs text-bocuse-gray">AED</p>
        </div>
      </div>
    </div>
  );
}

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ExpenseDataPoint {
  name: string;
  value: number;
  color: string;
}

interface LabarileExpenseChartProps {
  data: ExpenseDataPoint[];
}

export function LabarileExpenseChart({ data }: LabarileExpenseChartProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M €`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K €`;
    return value.toString() + ' €';
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
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
              border: '1px solid hsl(0, 0%, 88%)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            formatter={(value: number, name: string) => [
              `${formatValue(value)} (${((value / total) * 100).toFixed(1)}%)`,
              name
            ]}
          />
          <Legend 
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

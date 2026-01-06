import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface CashFlowChartProps {
  data: {
    month: string;
    balance: number;
  }[];
  currency?: string;
}

export function CashFlowChart({ data, currency = 'EUR' }: CashFlowChartProps) {
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
        Cash Position
      </h3>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(45, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              formatter={(value: number) => [formatValue(value), 'Cash Balance']}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="hsl(45, 70%, 50%)"
              strokeWidth={2}
              fill="url(#cashGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

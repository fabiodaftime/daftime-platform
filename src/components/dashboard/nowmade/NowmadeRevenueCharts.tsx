import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, Area, Legend, Cell } from 'recharts';
import { data, months, chartColors } from './NowmadeData';

interface NowmadeRevenueChartsProps {
  currency: 'AED' | 'USD';
}

export function NowmadeRevenueCharts({ currency }: NowmadeRevenueChartsProps) {
  const revenueData = months.map((month, i) => ({
    month,
    revenue: data.grossRevenue[i],
    expenses: data.totalExpenses[i],
    ebitda: data.ebitda[i],
  }));

  const marginData = months.map((month, i) => ({
    month,
    margin: data.profitMargin[i] * 100,
  }));

  return (
    <section className="nowmade-section">
      <h2 className="nowmade-section-title">Revenue & Profitability</h2>
      <div className="nowmade-chart-grid">
        <div className="nowmade-chart-card">
          <h3>Monthly Revenue vs Expenses vs EBITDA <span className="nowmade-currency-badge">AED</span></h3>
          <div className="nowmade-chart-container tall">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis 
                  tickFormatter={(val) => `AED ${(val / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [`AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill={chartColors.orange} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill={chartColors.gray} radius={[4, 4, 0, 0]} />
                <Area 
                  type="monotone" 
                  dataKey="ebitda" 
                  name="EBITDA" 
                  stroke={chartColors.orangeLight} 
                  fill={chartColors.orangeLighter}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="nowmade-chart-card">
          <h3>Profit Margin Evolution <span className="nowmade-currency-badge">%</span></h3>
          <div className="nowmade-chart-container tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis 
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margin']}
                />
                <Bar dataKey="margin" name="Margin" radius={[4, 4, 0, 0]}>
                  {marginData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.margin >= 0 ? chartColors.green : chartColors.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

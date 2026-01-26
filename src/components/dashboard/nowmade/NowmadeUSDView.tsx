import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, Area, Legend } from 'recharts';
import { data, dataUSD, months, chartColors, formatUSD, formatPercent, EXCHANGE_RATE, kpis } from './NowmadeData';
import { NowmadeKPIGrid } from './NowmadeKPIGrid';

export function NowmadeUSDView() {
  const revenueData = months.map((month, i) => ({
    month,
    revenue: dataUSD.grossRevenue[i],
    expenses: dataUSD.totalExpenses[i],
    ebitda: dataUSD.ebitda[i],
  }));

  // Calculate cumulative EBITDA
  let cumulative = 0;
  const cumulativeData = months.map((month, i) => {
    cumulative += dataUSD.ebitda[i];
    return {
      month,
      cumulative,
    };
  });

  return (
    <>
      <NowmadeKPIGrid currency="USD" />

      <section className="nowmade-section">
        <h2 className="nowmade-section-title">Revenue & Profitability</h2>
        <div className="nowmade-chart-grid">
          <div className="nowmade-chart-card">
            <h3>Monthly Revenue vs Expenses vs EBITDA <span className="nowmade-currency-badge">USD</span></h3>
            <div className="nowmade-chart-container tall">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(val) => `USD ${(val / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`USD ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]}
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
            <h3>Cumulative EBITDA Growth <span className="nowmade-currency-badge">USD</span></h3>
            <div className="nowmade-chart-container tall">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(val) => `USD ${(val / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`USD ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Cumulative EBITDA']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    name="Cumulative EBITDA" 
                    stroke={chartColors.green} 
                    fill={chartColors.greenLight}
                    strokeWidth={2}
                    dot={{ fill: chartColors.green, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="nowmade-section">
        <h2 className="nowmade-section-title">Monthly Performance Table</h2>
        <div className="nowmade-chart-card" style={{ overflowX: 'auto' }}>
          <table className="nowmade-data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue (USD)</th>
                <th>Expenses (USD)</th>
                <th>EBITDA (USD)</th>
                <th>Margin</th>
                <th>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month, i) => (
                <tr key={month}>
                  <td><strong>{month}</strong></td>
                  <td>${dataUSD.grossRevenue[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>${dataUSD.totalExpenses[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className={data.profitMargin[i] >= 0 ? 'positive' : 'negative'}>
                    ${dataUSD.ebitda[i].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className={data.profitMargin[i] >= 0 ? 'positive' : 'negative'}>
                    {formatPercent(data.profitMargin[i])}
                  </td>
                  <td>{formatPercent(data.occupancy[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

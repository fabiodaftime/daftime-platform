import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { formatCurrency, type PCMonthData } from './PrimeCircleData';

const barColors = ['#1E56A0', '#17B169', '#4A90D9', '#7C3AED', '#F59E0B', '#8899A6'];

interface Props { data: PCMonthData; }

export function PrimeCircleCharts({ data }: Props) {
  return (
    <>
      <div className="pc-section-title">Analytics — {data.monthLabel}</div>
      <div className="pc-charts-grid">
        <div className="pc-chart-card">
          <h3>Revenue by Service Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.serviceCategories} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#536471', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#536471', fontSize: 11, fontWeight: 600 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Turnover']} contentStyle={{ background: 'white', border: '2px solid #B8C5CC', borderRadius: '4px', fontFamily: 'IBM Plex Sans' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.serviceCategories.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {data.monthlyComparison.length > 1 && (
          <div className="pc-chart-card">
            <h3>Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[
                  { name: 'Customers', ...Object.fromEntries(data.monthlyComparison.map(m => [m.month.split(' ')[0], m.customers])) },
                  { name: 'Turnover (k$)', ...Object.fromEntries(data.monthlyComparison.map(m => [m.month.split(' ')[0], +(m.turnover / 1000).toFixed(1)])) },
                  { name: 'Margin (k$)', ...Object.fromEntries(data.monthlyComparison.map(m => [m.month.split(' ')[0], +(m.margin / 1000).toFixed(1)])) },
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="name" tick={{ fill: '#536471', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#536471', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'white', border: '2px solid #B8C5CC', borderRadius: '4px' }} />
                <Legend wrapperStyle={{ paddingTop: 16, fontWeight: 600 }} />
                {data.monthlyComparison.map((m, i) => (
                  <Bar key={m.month} dataKey={m.month.split(' ')[0]} name={m.month.split(' ')[0]} fill={i === 0 ? '#B8C5CC' : '#1E56A0'} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}

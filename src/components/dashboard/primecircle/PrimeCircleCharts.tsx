import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { serviceCategories, formatCurrency } from './PrimeCircleData';

const barColors = ['#1E56A0', '#17B169', '#4A90D9', '#7C3AED', '#F59E0B', '#8899A6'];

const trendData = [
  { name: 'Customers', jan: 39, feb: 53 },
  { name: 'Turnover (k$)', jan: 53.1, feb: 73.5 },
  { name: 'Margin (k$)', jan: 40.5, feb: 53.3 },
];

export function PrimeCircleCharts() {
  return (
    <>
      <div className="pc-section-title">Analytics — February 2026</div>
      <div className="pc-charts-grid">
        <div className="pc-chart-card">
          <h3>Revenue by Service Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={serviceCategories} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#536471', fontSize: 11, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fill: '#536471', fontSize: 11, fontWeight: 600 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Turnover']}
                contentStyle={{ 
                  background: 'white', 
                  border: '2px solid #B8C5CC',
                  borderRadius: '4px',
                  fontFamily: 'IBM Plex Sans'
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {serviceCategories.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="pc-chart-card">
          <h3>Monthly Trend (Jan vs Feb)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="name"
                tick={{ fill: '#536471', fontSize: 11, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fill: '#536471', fontSize: 11, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={{ background: 'white', border: '2px solid #B8C5CC', borderRadius: '4px' }} />
              <Legend wrapperStyle={{ paddingTop: 16, fontWeight: 600 }} />
              <Bar dataKey="jan" name="January" fill="#B8C5CC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="feb" name="February" fill="#1E56A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

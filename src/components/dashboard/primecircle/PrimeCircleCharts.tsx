import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { serviceCategories, statusData, formatCurrency } from './PrimeCircleData';

const barColors = ['#1E56A0', '#17B169', '#4A90D9', '#F59E0B', '#22D17B'];
const pieColors = ['#17B169', '#F59E0B'];

const pieData = [
  { name: `Completed (${formatCurrency(statusData.completed.amount)})`, value: statusData.completed.amount },
  { name: `In Progress (${formatCurrency(statusData.inProgress.amount)})`, value: statusData.inProgress.amount }
];

export function PrimeCircleCharts() {
  return (
    <>
      <div className="pc-section-title">Analytics</div>
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
          <h3>Service Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={90}
                dataKey="value"
                paddingAngle={2}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index]} />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom"
                formatter={(value) => <span style={{ color: '#536471', fontWeight: 600, fontSize: '12px' }}>{value}</span>}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                contentStyle={{ 
                  background: 'white', 
                  border: '2px solid #B8C5CC',
                  borderRadius: '4px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

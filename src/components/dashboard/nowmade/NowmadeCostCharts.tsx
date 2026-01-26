import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { data, months, kpis } from './NowmadeData';

const costColors = {
  staff: '#D35400',
  ops: '#F39C12',
  rent: '#E59866',
  energy: '#FAD7A0',
};

export function NowmadeCostCharts() {
  const costBreakdownData = months.map((month, i) => ({
    month,
    staff: data.staffSalary[i],
    ops: data.operatingCost[i],
    rent: data.rent[i],
    energy: data.energy[i],
  }));

  const pieData = [
    { name: 'Staff Salary', value: kpis.totalStaff, color: costColors.staff },
    { name: 'Operating Costs', value: kpis.totalOps, color: costColors.ops },
    { name: 'Rent', value: kpis.totalRent, color: costColors.rent },
    { name: 'Energy', value: kpis.totalEnergy, color: costColors.energy },
  ];

  return (
    <section className="nowmade-section">
      <h2 className="nowmade-section-title">Cost Structure Analysis</h2>
      <div className="nowmade-chart-grid">
        <div className="nowmade-chart-card">
          <h3>Monthly Cost Breakdown <span className="nowmade-currency-badge">AED</span></h3>
          <div className="nowmade-chart-container tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdownData}>
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
                <Bar dataKey="staff" name="Staff Salary" stackId="a" fill={costColors.staff} />
                <Bar dataKey="ops" name="Operating Costs" stackId="a" fill={costColors.ops} />
                <Bar dataKey="rent" name="Rent" stackId="a" fill={costColors.rent} />
                <Bar dataKey="energy" name="Energy" stackId="a" fill={costColors.energy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="nowmade-chart-card">
          <h3>Expense Categories (Annual Total)</h3>
          <div className="nowmade-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

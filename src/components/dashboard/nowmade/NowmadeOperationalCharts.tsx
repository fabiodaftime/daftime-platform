import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, Area, Legend } from 'recharts';
import { data, months, chartColors } from './NowmadeData';

export function NowmadeOperationalCharts() {
  const occupancyData = months.map((month, i) => ({
    month,
    occupancy: data.occupancy[i] * 100,
    adr: data.adr[i],
  }));

  const bedsData = months.map((month, i) => ({
    month,
    bedsSold: data.bedsBooked[i],
    capacity: data.bedBookable[i],
  }));

  return (
    <section className="nowmade-section">
      <h2 className="nowmade-section-title">Operational Performance</h2>
      <div className="nowmade-chart-grid">
        <div className="nowmade-chart-card">
          <h3>Occupancy Rate & ADR <span className="nowmade-currency-badge">AED</span></h3>
          <div className="nowmade-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(val) => `AED ${val}`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'Occupancy' ? `${value.toFixed(1)}%` : `AED ${value.toFixed(0)}`,
                    name
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="occupancy" 
                  name="Occupancy" 
                  yAxisId="left"
                  stroke={chartColors.orange} 
                  fill={chartColors.orangeLighter}
                />
                <Line 
                  type="monotone" 
                  dataKey="adr" 
                  name="ADR (AED)" 
                  yAxisId="right"
                  stroke={chartColors.orangeLight} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="nowmade-chart-card">
          <h3>Beds Sold vs Capacity</h3>
          <div className="nowmade-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bedsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bedsSold" name="Beds Sold" fill={chartColors.orange} radius={[4, 4, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="capacity" 
                  name="Capacity" 
                  stroke={chartColors.gray} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

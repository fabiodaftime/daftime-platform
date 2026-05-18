import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ACTUALS_2026 } from './LabarileData';

const COLORS_BY_INDEX = ['#7CC9CC', '#4EB79F', '#9DD8DA', '#5AB5B8'];

interface Props {
  actuals2026Override?: { months: string[]; revenue: number[] };
}

/** Affiche le CA mensuel réel 2026 uniquement (Jan→Avr), aucune projection. */
export function LabarileActual2026Chart({ actuals2026Override }: Props) {
  const src = actuals2026Override ?? ACTUALS_2026;
  const data = src.months.map((m, i) => ({ month: m, ca: src.revenue[i] }));

  return (
    <div className="h-[280px] lg:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} axisLine={{ stroke: '#E0E0E0' }} tickLine={false} />
          <YAxis tickFormatter={(v) => v + ' k'} tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }}
            formatter={(v: number) => [v.toFixed(1) + ' kAED', 'CA Réel']}
          />
          <Bar dataKey="ca" name="CA Réel" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS_BY_INDEX[i % COLORS_BY_INDEX.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

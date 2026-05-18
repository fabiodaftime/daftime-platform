import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { ACTUALS_2026 } from './LabarileData';
import {
  LabarileGradients,
  LabarileTooltip,
  LAB_GRADIENT_BY_INDEX,
  LAB_AXIS_TICK,
  LAB_GRID_STROKE,
} from './LabarileChartPrimitives';

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
        <BarChart data={data} margin={{ top: 24, right: 16, left: -8, bottom: 5 }} barCategoryGap="28%">
          <LabarileGradients />
          <CartesianGrid strokeDasharray="4 6" stroke={LAB_GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="month"
            tick={LAB_AXIS_TICK}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tickFormatter={(v) => v + ' k'}
            tick={LAB_AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(124,201,204,0.08)' }}
            content={
              <LabarileTooltip
                valueFormatter={(v) => v.toFixed(1) + ' kAED'}
              />
            }
          />
          <Bar dataKey="ca" name="CA Réel" radius={[8, 8, 0, 0]} maxBarSize={64}>
            {data.map((_, i) => (
              <Cell key={i} fill={LAB_GRADIENT_BY_INDEX[i % LAB_GRADIENT_BY_INDEX.length]} />
            ))}
            <LabelList
              dataKey="ca"
              position="top"
              formatter={(v: number) => v.toFixed(0) + 'k'}
              style={{ fill: '#0f4a4d', fontSize: 11, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

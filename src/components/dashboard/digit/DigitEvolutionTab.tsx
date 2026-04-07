import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { D, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

const typeColor: Record<string, string> = {
  primary: D.primary, success: D.green, accent: D.primary, warning: D.orange,
};

export function DigitEvolutionTab({ data }: Props) {
  const { evolutionKPIs, evolutionProductKPIs, evolutionChartData, evolutionInsights } = data;

  if (!evolutionKPIs) {
    return (
      <div>
        <h2 className="digit-section-title">Évolution MoM</h2>
        <div className="digit-card">
          <p style={{ color: D.textMuted, textAlign: 'center', padding: '2rem' }}>
            Pas de données de comparaison disponibles pour ce mois (premier mois).
          </p>
        </div>
      </div>
    );
  }

  const chartLabels = ['CA Total', 'Marge', 'Deals', 'Digit', 'SPY', 'CT'];
  const chartColors = evolutionChartData!.map(v => v >= 0 ? D.green : D.red);

  return (
    <div>
      <h2 className="digit-section-title">Month-over-Month Evolution — {data.monthLabel}</h2>
      <div className="digit-kpi-grid">
        {evolutionKPIs.map((kpi: any, i: number) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
            <div className="digit-metric-comparison">
              <span style={{ fontSize: '0.75rem', color: D.textMuted }}>{kpi.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="digit-section-title">Évolution par Produit</h2>
      <div className="digit-kpi-grid">
        {evolutionProductKPIs!.map((kpi: any, i: number) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
            <div className="digit-metric-comparison">
              <span style={{ fontSize: '0.75rem', color: D.textMuted }}>{kpi.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="digit-chart-container">
        <div className="digit-chart-title">Évolution Mensuelle Détaillée</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartLabels.map((l, i) => ({ name: l, value: evolutionChartData![i] }))}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
            <YAxis tickFormatter={(v) => v + '%'} tick={{ fontSize: 11, fontWeight: 600 }} />
            <Tooltip formatter={(v: number) => v + '%'} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartColors.map((color, i) => <Cell key={i} fill={color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="digit-card">
        <h3 className="digit-card-title">📊 Key Insights — MoM Analysis</h3>
        <div style={{ display: 'grid', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <strong style={{ color: D.green }}>✅ Points positifs :</strong>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', lineHeight: 1.8 }}>
              {evolutionInsights!.positives.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
          <div>
            <strong style={{ color: D.orange }}>⚠️ Points d'attention :</strong>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', lineHeight: 1.8 }}>
              {evolutionInsights!.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
          <div style={{ background: D.bg, padding: '1rem', borderRadius: 4, marginTop: '0.5rem' }}>
            <strong>💡 Conclusion :</strong> {evolutionInsights!.conclusion}
          </div>
        </div>
      </div>
    </div>
  );
}

import { LabarileKPICard } from './LabarileKPICard';
import { LabarileChartContainer } from './LabarileChartContainer';
import { LabarileActual2026Chart } from './LabarileActual2026Chart';
import { useLabarileMonthly } from './useLabarileMonthly';

export function LabarileBreakdownPage() {
  const { monthlyCosts2026, ytd2026, actuals2026 } = useLabarileMonthly(2026);
  const months = monthlyCosts2026;
  const totalCa = ytd2026.caTotal;
  const avg = months.length > 0 ? totalCa / months.length : 0;
  const best = [...months].sort((a, b) => b.revenue - a.revenue)[0];
  const worst = [...months].sort((a, b) => a.revenue - b.revenue)[0];

  const fmtK = (n: number) => `${Math.round(n / 1000).toLocaleString('fr-FR')}k AED`;

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="CA YTD 2026" value={fmtK(totalCa)} subtext={`${months.length} mois — Jan → Avr`} variant="primary" />
        <LabarileKPICard label="CA Moyen Mensuel" value={fmtK(avg)} subtext="Moyenne YTD" />
        <LabarileKPICard label="Meilleur mois" value={best ? fmtK(best.revenue) : '—'} subtext={best?.month ?? ''} variant="success" />
        <LabarileKPICard label="Mois le plus faible" value={worst ? fmtK(worst.revenue) : '—'} subtext={worst?.month ?? ''} variant="warning" />
      </div>

      <LabarileChartContainer title="Répartition du CA par mois — Réel 2026">
        <LabarileActual2026Chart actuals2026Override={actuals2026} />
      </LabarileChartContainer>

      <div className="bg-labarile-white border border-labarile-border rounded-xl overflow-hidden">
        <h3 className="px-5 py-4 font-bebas text-lg lg:text-xl text-labarile-primary-dark tracking-wide">
          📊 Détail mensuel des ventes 2026
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-labarile-ice1 to-labarile-ice2">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase font-bold text-labarile-primary-dark">Mois</th>
                <th className="px-4 py-3 text-right text-xs uppercase font-bold text-labarile-primary-dark">CA (AED)</th>
                <th className="px-4 py-3 text-right text-xs uppercase font-bold text-labarile-primary-dark">% du YTD</th>
                <th className="px-4 py-3 text-right text-xs uppercase font-bold text-labarile-primary-dark">vs moyenne</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const pctYtd = totalCa > 0 ? (m.revenue / totalCa) * 100 : 0;
                const diffAvg = m.revenue - avg;
                const diffPct = avg > 0 ? (diffAvg / avg) * 100 : 0;
                return (
                  <tr key={m.month} className="hover:bg-labarile-light-gray border-t border-labarile-border">
                    <td className="px-4 py-3 text-sm font-semibold">{m.month}</td>
                    <td className="px-4 py-3 text-sm text-right">{Math.round(m.revenue).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm text-right">{pctYtd.toFixed(1)}%</td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${diffAvg >= 0 ? 'text-labarile-success' : 'text-labarile-warning'}`}>
                      {diffAvg >= 0 ? '+' : ''}{Math.round(diffAvg / 1000)}k ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%)
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-labarile-ice1 font-bold border-t-2 border-labarile-primary">
                <td className="px-4 py-3 text-sm">TOTAL YTD 2026</td>
                <td className="px-4 py-3 text-sm text-right">{Math.round(totalCa).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-sm text-right">100%</td>
                <td className="px-4 py-3 text-sm text-right">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ Note :</strong> Le détail closers / programmes Q4 2025 n'a pas été reconduit pour la période 2026 — la performance est ici présentée au niveau du chiffre d'affaires mensuel. À enrichir dès que le détail des ventes par closer / programme sera disponible pour 2026.
        </p>
      </div>
    </div>
  );
}

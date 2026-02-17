import { LabarileKPICard } from './LabarileKPICard';
import { LabarileChartContainer } from './LabarileChartContainer';
import { LabarileProgramsChart, LabarileClosersChart, LabarileBasketChart } from './LabarileCharts';
import { BREAKDOWN_KPI, CLOSERS_DATA } from './LabarileData';

export function LabarileBreakdownPage() {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Total Ventes Q4" value={String(BREAKDOWN_KPI.totalVentes)} subtext={BREAKDOWN_KPI.totalContracted + ' contractés'} variant="primary" />
        <LabarileKPICard label="Panier Moyen" value={BREAKDOWN_KPI.panierMoyen} subtext={BREAKDOWN_KPI.panierMoyenEur} />
        <LabarileKPICard label="Top Closer" value={BREAKDOWN_KPI.topCloser} subtext={BREAKDOWN_KPI.topCloserShare + ' du CA'} variant="success" />
        <LabarileKPICard label="Programme Principal" value={BREAKDOWN_KPI.programPrincipal} subtext={BREAKDOWN_KPI.programShare + ' des ventes'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <LabarileChartContainer title="Répartition par Type de Programme">
          <LabarileProgramsChart />
        </LabarileChartContainer>
        <LabarileChartContainer title="Performance par Closer">
          <LabarileClosersChart />
        </LabarileChartContainer>
      </div>

      <LabarileChartContainer title="Évolution Panier Moyen Q4 2025">
        <LabarileBasketChart />
      </LabarileChartContainer>

      {/* Closers Detail Table */}
      <div className="bg-labarile-white border border-labarile-border rounded-xl overflow-hidden">
        <h3 className="px-5 py-4 font-bebas text-lg lg:text-xl text-labarile-primary-dark tracking-wide">
          📊 Détail Performance Closers Q4
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-labarile-ice1 to-labarile-ice2">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">Closer</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">Nb Ventes</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">CA Total (AED)</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">% du CA</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">Panier Moyen</th>
              </tr>
            </thead>
            <tbody>
              {CLOSERS_DATA.map((c, idx) => (
                <tr key={idx} className="hover:bg-labarile-light-gray transition-colors">
                  <td className="px-4 py-3 text-sm border-t border-labarile-border font-semibold">{c.name}</td>
                  <td className="px-4 py-3 text-sm border-t border-labarile-border">{c.ventes}</td>
                  <td className="px-4 py-3 text-sm border-t border-labarile-border">{c.ca} AED</td>
                  <td className="px-4 py-3 text-sm border-t border-labarile-border">{c.share}%</td>
                  <td className="px-4 py-3 text-sm border-t border-labarile-border">{c.panierMoyen} AED</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

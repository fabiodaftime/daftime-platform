import { LabarileKPICard } from './LabarileKPICard';
import { LabarileMonthlyCostsChart } from './LabarileCharts';
import { MONTHLY_COSTS, MONTHLY_COSTS_2026, COSTS_Q4_DETAIL, type Scenario, type MonthlyCostData } from './LabarileData';

interface LabarileCostsPageProps {
  scenario: Scenario;
}

// Comments based on actuals only (no scenario comparison)
function generateActualComments(monthData: MonthlyCostData): string[] {
  const rev = monthData.revenue;
  const act = monthData.actual;
  const comments: string[] = [];

  const items: { label: string; actual: number }[] = [
    { label: 'Coaches', actual: act.coaches },
    { label: 'Marketing', actual: act.marketing },
    { label: 'IT & Tools', actual: act.it },
    { label: 'Stripe/Fees', actual: act.stripe },
    { label: 'Admin', actual: act.admin },
  ];
  if (act.autres > 0) items.push({ label: 'Autres', actual: act.autres });

  for (const item of items) {
    if (item.actual === 0) continue;
    const pctActual = (item.actual / rev * 100).toFixed(1);
    const amountK = (item.actual / 1000).toFixed(1);
    comments.push(`• ${item.label}: ${amountK}k AED (${pctActual}% du CA).`);
  }

  const totalCharges = Object.values(act).reduce((a, b) => a + b, 0);
  const totalPct = (totalCharges / rev * 100).toFixed(1);
  const ebitdaPct = (100 - parseFloat(totalPct)).toFixed(1);
  comments.push(`📌 Charges totales ${totalPct}% — Marge EBITDA ${ebitdaPct}%.`);

  return comments;
}

export function LabarileCostsPage({ scenario }: LabarileCostsPageProps) {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Mois suivis Q4 2025" value={`${MONTHLY_COSTS.length}`} subtext="Réels mensuels" />
        <LabarileKPICard label="Mois suivis YTD 2026" value={`${MONTHLY_COSTS_2026.length}`} subtext="Janvier → Avril" variant="primary" />
        <LabarileKPICard label="CA Q4 2025" value="1,305k AED" subtext="Ajusté avec revenus Dec" variant="warning" />
        <LabarileKPICard
          label="CA YTD 2026"
          value={`${Math.round(MONTHLY_COSTS_2026.reduce((a, m) => a + m.revenue, 0) / 1000).toLocaleString()}k AED`}
          subtext="Janvier → Avril"
          variant="success"
        />
      </div>

      {/* Section Q4 2025 */}
      <div className="bg-labarile-ice1 border-l-4 border-l-labarile-primary rounded-md px-4 py-2">
        <p className="font-bebas text-base tracking-wider text-labarile-primary-dark">Q4 2025 — Réel</p>
      </div>

      {MONTHLY_COSTS.map((monthData, idx) => {
        const comments = generateActualComments(monthData);
        return (
          <div key={idx} className="bg-labarile-white border border-labarile-border rounded-xl p-5 lg:p-7">
            <h3 className="font-bebas text-lg lg:text-xl text-labarile-title mb-4 tracking-wide">
              📊 {monthData.month} — Réel (CA: {(monthData.revenue / 1000).toFixed(1)} kAED)
            </h3>
            <LabarileMonthlyCostsChart actual={monthData.actual} revenue={monthData.revenue} />
            <div className="mt-4 rounded-lg p-4 border-l-4 bg-labarile-ice1 border-l-labarile-primary">
              <p className="font-bold text-sm mb-2 text-labarile-primary-dark">💬 Détail du mois :</p>
              <ul className="space-y-1.5 ml-4 list-disc">
                {comments.map((c, cidx) => (
                  <li key={cidx} className="text-sm leading-relaxed text-labarile-text">{c}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}

      {/* Section YTD 2026 */}
      <div className="bg-labarile-ice1 border-l-4 border-l-labarile-success rounded-md px-4 py-2 mt-2">
        <p className="font-bebas text-base tracking-wider text-labarile-primary-dark">
          YTD 2026 — Réel (Janvier → Avril)
        </p>
      </div>

      {MONTHLY_COSTS_2026.map((monthData, idx) => {
        const comments = generateActualComments(monthData);
        return (
          <div key={`m26-${idx}`} className="bg-labarile-white border border-labarile-border rounded-xl p-5 lg:p-7">
            <h3 className="font-bebas text-lg lg:text-xl text-labarile-title mb-4 tracking-wide">
              📊 {monthData.month} — Réel (CA: {(monthData.revenue / 1000).toFixed(1)} kAED)
            </h3>
            <LabarileMonthlyCostsChart actual={monthData.actual} revenue={monthData.revenue} />
            <div className="mt-4 rounded-lg p-4 border-l-4 bg-labarile-ice1 border-l-labarile-primary">
              <p className="font-bold text-sm mb-2 text-labarile-primary-dark">💬 Détail du mois :</p>
              <ul className="space-y-1.5 ml-4 list-disc">
                {[...monthData.comments, ...comments].map((c, cidx) => (
                  <li key={cidx} className="text-sm leading-relaxed text-labarile-text">{c}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}

      {/* Q4 Synthesis */}
      <div className="bg-gradient-to-br from-labarile-ice1 to-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary-dark mb-4 tracking-wide">
          📋 SYNTHÈSE Q4 2025
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          <div>
            <p className="text-sm font-bold text-labarile-title mb-1">CA Total Q4 Ajusté:</p>
            <p className="font-bebas text-2xl text-labarile-primary">1,305,177 AED</p>
            <p className="text-xs text-labarile-muted mt-1">+52,977 AED revenus non comptabilisés (Dec)</p>
          </div>
          <div>
            <p className="text-sm font-bold text-labarile-title mb-1">Charges Totales Q4:</p>
            <p className="font-bebas text-2xl text-labarile-warning">603,769 AED</p>
            <p className="text-xs text-labarile-muted mt-1">46.3% du CA</p>
          </div>
          <div>
            <p className="text-sm font-bold text-labarile-title mb-1">EBITDA Q4:</p>
            <p className="font-bebas text-2xl text-labarile-success">701,431 AED</p>
            <p className="text-xs text-labarile-muted mt-1">53.7% de marge</p>
          </div>
        </div>

        <div className="mt-2 bg-amber-50 border-l-4 border-l-amber-500 rounded-lg p-4">
          <p className="font-bold text-sm text-amber-700 mb-2">📊 Détail Charges Q4 par Catégorie:</p>
          <div className="text-sm text-labarile-text space-y-1">
            {COSTS_Q4_DETAIL.map((cat, idx) => (
              <div key={idx}>{cat.category}: {cat.amount} ({cat.pct}){cat.note ? ` — ${cat.note}` : ''}</div>
            ))}
            <div className="mt-2 pt-2 border-t border-amber-300 font-bold">TOTAL: 603.8k (46.3%)</div>
          </div>
        </div>
      </div>

      {/* YTD 2026 Synthesis */}
      {(() => {
        const ytd = MONTHLY_COSTS_2026.reduce((acc, m) => {
          const charges = Object.values(m.actual).reduce((a, b) => a + b, 0);
          return { ca: acc.ca + m.revenue, charges: acc.charges + charges };
        }, { ca: 0, charges: 0 });
        const chargesPct = (ytd.charges / ytd.ca * 100);
        const ebitda = ytd.ca - ytd.charges;
        const ebitdaPctYtd = (ebitda / ytd.ca * 100);
        return (
          <div className="bg-gradient-to-br from-emerald-50 to-labarile-white border-2 border-labarile-success rounded-xl p-5 lg:p-7">
            <h3 className="font-bebas text-xl lg:text-2xl text-labarile-success mb-4 tracking-wide">
              📋 SYNTHÈSE YTD 2026 (Janvier → Avril)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <div>
                <p className="text-sm font-bold text-labarile-title mb-1">CA Total YTD 2026:</p>
                <p className="font-bebas text-2xl text-labarile-primary">{ytd.ca.toLocaleString()} AED</p>
                <p className="text-xs text-labarile-muted mt-1">Moyenne mensuelle: {Math.round(ytd.ca / 4).toLocaleString()} AED</p>
              </div>
              <div>
                <p className="text-sm font-bold text-labarile-title mb-1">Charges Totales YTD:</p>
                <p className="font-bebas text-2xl text-labarile-warning">{Math.round(ytd.charges).toLocaleString()} AED</p>
                <p className="text-xs text-labarile-muted mt-1">{chargesPct.toFixed(1)}% du CA</p>
              </div>
              <div>
                <p className="text-sm font-bold text-labarile-title mb-1">EBITDA YTD:</p>
                <p className="font-bebas text-2xl text-labarile-success">{Math.round(ebitda).toLocaleString()} AED</p>
                <p className="text-xs text-labarile-muted mt-1">{ebitdaPctYtd.toFixed(1)}% de marge</p>
              </div>
            </div>
            <div className="bg-labarile-white rounded-lg p-4 text-sm text-labarile-text">
              💡 Run-rate annualisé YTD: <strong>{Math.round(ytd.ca / 4 * 12 / 1000).toLocaleString()} kAED</strong>.
            </div>
          </div>
        );
      })()}
    </div>
  );
}

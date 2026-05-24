import { LabarileKPICard } from './LabarileKPICard';
import { LabarileMonthlyCostsChart } from './LabarileCharts';
import { type MonthlyCostData, MARGIN_TARGET_BAND } from './LabarileData';
import { useLabarileMonthly } from './useLabarileMonthly';
import { LabarileCategoryDrilldown } from './LabarileCategoryDrilldown';
import { LabarileConsistencyCheck } from './LabarileConsistencyCheck';


const MONTH_LABEL_TO_NUM: Record<string, number> = {
  JANVIER: 1, FÉVRIER: 2, FEVRIER: 2, MARS: 3, AVRIL: 4, MAI: 5, JUIN: 6,
  JUILLET: 7, AOÛT: 8, AOUT: 8, SEPTEMBRE: 9, OCTOBRE: 10, NOVEMBRE: 11, DÉCEMBRE: 12, DECEMBRE: 12,
};
function parseMonthLabel(label: string): { year: number; month: number } | null {
  const m = label.trim().match(/^([A-ZÉÈÊÀÂÎÏÔÛÇa-zéèêàâîïôûç]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTH_LABEL_TO_NUM[m[1].toUpperCase()];
  if (!month) return null;
  return { year: +m[2], month };
}

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

export function LabarileCostsPage() {
  const { monthlyCosts2026: MONTHLY_COSTS_2026, ytd2026 } = useLabarileMonthly(2026);
  const ytd = MONTHLY_COSTS_2026.reduce<{ ca: number; charges: number }>((acc, m) => {
    const charges = (Object.values(m.actual) as number[]).reduce((a, b) => a + b, 0);
    return { ca: acc.ca + m.revenue, charges: acc.charges + charges };
  }, { ca: 0, charges: 0 });
  const chargesPct = ytd.ca > 0 ? (ytd.charges / ytd.ca) * 100 : 0;
  const ebitda = ytd.ca - ytd.charges;
  const ebitdaPctYtd = ytd.ca > 0 ? (ebitda / ytd.ca) * 100 : 0;

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <LabarileConsistencyCheck monthlyCosts={MONTHLY_COSTS_2026} displayedYtd={ytd2026} />

      {/* Bande cible marge EBITDA — validée call 18/05/2026 (post-retraitement Anissa) */}
      {(() => {
        const inBand = ebitdaPctYtd >= MARGIN_TARGET_BAND.min && ebitdaPctYtd <= MARGIN_TARGET_BAND.max;
        const above = ebitdaPctYtd > MARGIN_TARGET_BAND.max;
        const cls = inBand
          ? 'bg-emerald-50 border-l-emerald-500 text-emerald-700'
          : above
          ? 'bg-sky-50 border-l-sky-500 text-sky-700'
          : 'bg-amber-50 border-l-amber-500 text-amber-700';
        return (
          <div className={`border-l-4 rounded-lg p-4 ${cls}`}>
            <p className="font-bold text-sm mb-1">
              🎯 Bande cible marge EBITDA : {MARGIN_TARGET_BAND.min}–{MARGIN_TARGET_BAND.max}%
            </p>
            <p className="text-sm text-labarile-text">
              Référence validée lors du call du 18/05/2026 (Luc, Simon, Fabio) après retraitement des doublons d'écritures et des paiements TVA par Anissa. Marge YTD 2026 actuelle : <strong>{ebitdaPctYtd.toFixed(1)}%</strong>{' '}
              {inBand ? '— dans la bande cible.' : above ? '— au-dessus de la cible (à confirmer sur la durée).' : '— sous la cible : surveiller les charges variables.'}
            </p>
          </div>
        );
      })()}



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard label="Mois suivis 2026" value={`${MONTHLY_COSTS_2026.length}`} subtext="Janvier → Avril" variant="primary" />
        <LabarileKPICard label="CA YTD 2026" value={`${(ytd.ca / 1000).toFixed(0)}k AED`} subtext="Réel mensuel" variant="success" />
        <LabarileKPICard label="Charges YTD" value={`${(ytd.charges / 1000).toFixed(0)}k AED`} subtext={`${chargesPct.toFixed(1)}% du CA`} variant="warning" />
        <LabarileKPICard label="EBITDA YTD" value={`${(ebitda / 1000).toFixed(0)}k AED`} subtext={`Marge ${ebitdaPctYtd.toFixed(1)}%`} variant="success" />
      </div>

      <div className="bg-labarile-ice1 border-l-4 border-l-labarile-success rounded-md px-4 py-2 mt-2">
        <p className="font-bebas text-base tracking-wider text-labarile-primary-dark">
          YTD 2026 — Réel (Janvier → Avril)
        </p>
      </div>

      {MONTHLY_COSTS_2026.map((monthData, idx) => {
        const comments = generateActualComments(monthData);
        const ym = parseMonthLabel(monthData.month);
        return (
          <div key={`m26-${idx}`} className="bg-labarile-white border border-labarile-border rounded-xl p-5 lg:p-7">
            <h3 className="font-bebas text-lg lg:text-xl text-labarile-title mb-4 tracking-wide">
              📊 {monthData.month} — Réel (CA: {(monthData.revenue / 1000).toFixed(1)} kAED)
            </h3>
            <LabarileMonthlyCostsChart actual={monthData.actual} revenue={monthData.revenue} />
            {ym && (
              <LabarileCategoryDrilldown
                year={ym.year}
                month={ym.month}
                monthLabel={monthData.month}
                totals={monthData.actual}
                revenue={monthData.revenue}
              />
            )}
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

      <div className="bg-gradient-to-br from-emerald-50 to-labarile-white border-2 border-labarile-success rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-success mb-4 tracking-wide">
          📋 SYNTHÈSE YTD 2026 (Janvier → Avril)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          <div>
            <p className="text-sm font-bold text-labarile-title mb-1">CA Total YTD 2026:</p>
            <p className="font-bebas text-2xl text-labarile-primary">{ytd.ca.toLocaleString()} AED</p>
            <p className="text-xs text-labarile-muted mt-1">Moyenne mensuelle: {Math.round(ytd.ca / Math.max(1, MONTHLY_COSTS_2026.length)).toLocaleString()} AED</p>
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
          💡 Run-rate annualisé YTD: <strong>{Math.round((ytd.ca / Math.max(1, MONTHLY_COSTS_2026.length)) * 12 / 1000).toLocaleString()} kAED</strong>.
        </div>
      </div>
    </div>
  );
}

import { LabarileKPICard } from './LabarileKPICard';
import { useLabarileMonthly } from './useLabarileMonthly';

// Reprise du résultat 2025 — UAE (activité transférée de Suisse en Oct 2025)
// Q4 2025 : EBITDA ≈ 701k AED. CT 2025 estimée : 9% × max(0, 701 − 375) = 29k AED.
// Résultat net 2025 ≈ 672k AED.
const RESULT_2025_NET_AED = 672_000;
const CT_2025_PROVISIONED_AED = 29_000;
const EBITDA_2025_AED = 701_000;

// Provision CT 2026 (9% sur profit annuel après abattement 375k)
const CT_RATE = 0.09;
const CT_ALLOWANCE_AED = 375_000;
// Réserve légale (UAE Free Zone — pas obligatoire, mais 5% pratique recommandée)
const LEGAL_RESERVE_PCT = 0.05;

const fmt = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} AED`;
const fmtK = (n: number) => `${Math.round(n / 1000).toLocaleString('fr-FR')}k AED`;

export function LabarileDividendsPage() {
  const { ytd2026 } = useLabarileMonthly(2026);
  const ytdMonths = ytd2026.months || 0;
  const ytdNetProfit2026 = ytd2026.netProfit; // EBITDA proxy YTD (charges déduites)

  // Run-rate annuel pour estimer la CT 2026
  const profitAnnualRunRate = ytdMonths > 0 ? ytdNetProfit2026 * (12 / ytdMonths) : 0;
  const taxableAnnual = Math.max(0, profitAnnualRunRate - CT_ALLOWANCE_AED);
  const ct2026AnnualEstimate = taxableAnnual * CT_RATE;
  const ct2026YtdProrata = ytdMonths > 0 ? ct2026AnnualEstimate * (ytdMonths / 12) : 0;

  // Résultat net 2026 YTD (après CT prorata)
  const netResult2026Ytd = ytdNetProfit2026 - ct2026YtdProrata;

  // Capacité distributive
  const reportANouveau = RESULT_2025_NET_AED + netResult2026Ytd;
  const legalReserve = Math.max(0, netResult2026Ytd) * LEGAL_RESERVE_PCT;
  const distributable = Math.max(0, reportANouveau - legalReserve);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* Stratégie fiscale validée call 18/05/2026 — salaires variables vs dividendes */}
      <div className="bg-amber-50 border-l-4 border-l-amber-500 rounded-lg p-4">
        <p className="font-bold text-sm text-amber-700 mb-1">
          📌 Stratégie fiscale actée — Salaires variables plutôt que dividendes
        </p>
        <p className="text-sm text-labarile-text">
          Décision prise lors du call du 18/05/2026 (Luc, Simon, Fabio) : privilégier des
          <strong> contrats de travail avec clause de rémunération variable</strong> plutôt que la
          distribution de dividendes, afin d'optimiser la fiscalité (déductibilité des salaires
          côté société, charge réduite côté dirigeants vs IR sur dividendes). Demande de rédaction
          envoyée à Justine. Le calcul de capacité distributive ci-dessous reste affiché à titre
          de référence en attendant la mise en place des nouveaux contrats.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <LabarileKPICard
          label="Reprise résultat 2025"
          value={fmtK(RESULT_2025_NET_AED)}
          subtext={`Q4 2025 net (EBITDA ${fmtK(EBITDA_2025_AED)} − CT ~${fmtK(CT_2025_PROVISIONED_AED)})`}
          variant="primary"
        />
        <LabarileKPICard
          label="Résultat net YTD 2026"
          value={fmtK(netResult2026Ytd)}
          subtext={`${ytdMonths} mois — après CT prorata`}
          variant="success"
        />
        <LabarileKPICard
          label="Report à nouveau cumulé"
          value={fmtK(reportANouveau)}
          subtext="Reprise 2025 + Net YTD 2026"
        />
        <LabarileKPICard
          label="Dividende distribuable"
          value={fmtK(distributable)}
          subtext={`Après réserve légale ${(LEGAL_RESERVE_PCT * 100).toFixed(0)}%`}
          variant="success"
        />
      </div>

      {/* Tableau de calcul */}
      <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-4 tracking-wide">
          🧮 Calcul détaillé du dividende distribuable
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-labarile-ice1">
                <th className="px-3 py-3 text-left text-xs font-bold border-b-2 border-labarile-border">Élément</th>
                <th className="px-3 py-3 text-right text-xs font-bold border-b-2 border-labarile-border">Montant (AED)</th>
                <th className="px-3 py-3 text-left text-xs font-bold border-b-2 border-labarile-border">Détail</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-labarile-light-gray">
                <td className="px-3 py-2 text-sm border-b font-semibold">EBITDA 2025 (Q4)</td>
                <td className="px-3 py-2 text-sm border-b text-right">{fmt(EBITDA_2025_AED)}</td>
                <td className="px-3 py-2 text-xs border-b text-labarile-muted">Activité UAE démarrée Oct 2025 (transfert Suisse)</td>
              </tr>
              <tr className="hover:bg-labarile-light-gray">
                <td className="px-3 py-2 text-sm border-b">− Corporate Tax 2025</td>
                <td className="px-3 py-2 text-sm border-b text-right text-red-600">−{fmt(CT_2025_PROVISIONED_AED)}</td>
                <td className="px-3 py-2 text-xs border-b text-labarile-muted">9% × (701k − 375k abattement)</td>
              </tr>
              <tr className="bg-labarile-ice1">
                <td className="px-3 py-2 text-sm font-bold">= Résultat net 2025 reporté</td>
                <td className="px-3 py-2 text-sm text-right font-bold text-labarile-primary">{fmt(RESULT_2025_NET_AED)}</td>
                <td className="px-3 py-2 text-xs text-labarile-muted">Reprise au 01/01/2026</td>
              </tr>

              <tr className="hover:bg-labarile-light-gray">
                <td className="px-3 py-2 text-sm border-b font-semibold pt-4">EBITDA YTD 2026</td>
                <td className="px-3 py-2 text-sm border-b text-right">{fmt(ytdNetProfit2026)}</td>
                <td className="px-3 py-2 text-xs border-b text-labarile-muted">Jan→Avr 2026 ({ytdMonths} mois) — CA {fmtK(ytd2026.caTotal)}</td>
              </tr>
              <tr className="hover:bg-labarile-light-gray">
                <td className="px-3 py-2 text-sm border-b">− Provision CT 2026 (prorata)</td>
                <td className="px-3 py-2 text-sm border-b text-right text-red-600">−{fmt(ct2026YtdProrata)}</td>
                <td className="px-3 py-2 text-xs border-b text-labarile-muted">
                  CT annuelle estimée {fmtK(ct2026AnnualEstimate)} × {ytdMonths}/12 mois
                </td>
              </tr>
              <tr className="bg-labarile-ice1">
                <td className="px-3 py-2 text-sm font-bold">= Résultat net YTD 2026</td>
                <td className="px-3 py-2 text-sm text-right font-bold text-labarile-success">{fmt(netResult2026Ytd)}</td>
                <td className="px-3 py-2 text-xs text-labarile-muted">Profit disponible sur la période</td>
              </tr>

              <tr className="bg-blue-50">
                <td className="px-3 py-2 text-sm font-bold">= Report à nouveau cumulé</td>
                <td className="px-3 py-2 text-sm text-right font-bold text-blue-700">{fmt(reportANouveau)}</td>
                <td className="px-3 py-2 text-xs text-blue-700">Base distribuable brute</td>
              </tr>
              <tr className="hover:bg-labarile-light-gray">
                <td className="px-3 py-2 text-sm border-b">− Réserve légale ({(LEGAL_RESERVE_PCT * 100).toFixed(0)}%)</td>
                <td className="px-3 py-2 text-sm border-b text-right text-amber-700">−{fmt(legalReserve)}</td>
                <td className="px-3 py-2 text-xs border-b text-labarile-muted">5% du net 2026 (bonne pratique UAE Free Zone)</td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="px-3 py-2 text-base font-bold text-emerald-700">💰 Dividende max distribuable</td>
                <td className="px-3 py-2 text-base text-right font-bold text-emerald-700">{fmt(distributable)}</td>
                <td className="px-3 py-2 text-xs text-emerald-700">À ce jour, à valider en AG</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-amber-50 border-l-4 border-l-amber-500 rounded-lg p-4">
        <p className="font-bold text-sm text-amber-700 mb-2">⚠️ Points d'attention avant distribution</p>
        <ul className="text-sm text-labarile-text ml-5 list-disc space-y-1">
          <li>La CT 2026 doit être <strong>réellement provisionnée en trésorerie</strong> avant tout versement (échéance paiement 30/09/2027).</li>
          <li>Garder un coussin de trésorerie opérationnel (≥ 3 mois de charges).</li>
          <li>Le résultat 2026 affiché est <strong>YTD au 30/04/2026</strong> — il évoluera mois après mois.</li>
          <li>Vérifier les obligations TVA EU en cours avant toute distribution (provision Saving Taxes 150k AED conservée).</li>
        </ul>
      </div>

      <div className="bg-blue-50 border-l-4 border-l-blue-500 rounded-lg p-4">
        <p className="font-bold text-sm text-blue-700 mb-2">ℹ️ Hypothèses du calcul</p>
        <ul className="text-sm text-labarile-text ml-5 list-disc space-y-1">
          <li><strong>Reprise 2025</strong> : EBITDA Q4 2025 = 701k AED, CT 9% sur (701 − 375 abattement) = 29k AED → net 672k AED.</li>
          <li><strong>CT 2026 estimée</strong> : run-rate annuel ({fmtK(profitAnnualRunRate)}) − abattement 375k AED, taxé à 9%.</li>
          <li><strong>Réserve légale</strong> : 5% du résultat net 2026 (pratique UAE — pas légalement obligatoire en Free Zone).</li>
        </ul>
      </div>
    </div>
  );
}

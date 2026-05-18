import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { YTD_2026 as REF_YTD_2026, type MonthlyCostData } from './LabarileData';
import { CATEGORY_LABELS, type LabarileCategory } from './LabarileMapping';

interface Props {
  monthlyCosts: MonthlyCostData[];
  /** YTD affiché (calculé par le hook). */
  displayedYtd: { caTotal: number; netProfit: number; months: number };
  /** Tolérance en AED pour considérer une différence comme négligeable (arrondis). */
  tolerance?: number;
}

type Severity = 'ok' | 'warning' | 'error';
interface Issue {
  severity: Severity;
  scope: string;
  message: string;
  expected: number;
  actual: number;
  diff: number;
}

const CATEGORIES: LabarileCategory[] = ['coaches', 'marketing', 'it', 'stripe', 'admin', 'autres'];

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

export function LabarileConsistencyCheck({ monthlyCosts, displayedYtd, tolerance = 1 }: Props) {
  const [accountsByMonth, setAccountsByMonth] = useState<Map<string, Map<string, number>>>(new Map());
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const years = [...new Set(monthlyCosts.map((m) => parseMonthLabel(m.month)?.year).filter(Boolean))] as number[];
      if (years.length === 0) { setAccountsLoaded(true); return; }
      const { data, error } = await (supabase as any)
        .from('labarile_pl_accounts')
        .select('year,month,category,amount')
        .in('year', years);
      if (cancelled) return;
      if (error) {
        console.warn('[LabarileConsistencyCheck]', error.message);
        setAccountsLoaded(true);
        return;
      }
      const map = new Map<string, Map<string, number>>();
      for (const r of (data as any[]) ?? []) {
        const key = `${r.year}-${r.month}`;
        if (!map.has(key)) map.set(key, new Map());
        const cat = map.get(key)!;
        cat.set(r.category, (cat.get(r.category) ?? 0) + Number(r.amount));
      }
      setAccountsByMonth(map);
      setAccountsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [monthlyCosts]);

  const issues: Issue[] = [];

  // 1) Recompute YTD from months
  const computedCa = monthlyCosts.reduce((a, m) => a + m.revenue, 0);
  const computedCharges = monthlyCosts.reduce(
    (a, m) => a + CATEGORIES.reduce((s, c) => s + (m.actual[c] ?? 0), 0), 0,
  );
  const computedEbitda = computedCa - computedCharges;

  // 1a) Affiché vs recomputé
  if (Math.abs(displayedYtd.caTotal - computedCa) > tolerance) {
    issues.push({
      severity: 'error', scope: 'YTD · CA affiché',
      message: 'Le CA YTD affiché diffère de la somme des mois.',
      expected: computedCa, actual: displayedYtd.caTotal, diff: displayedYtd.caTotal - computedCa,
    });
  }
  if (Math.abs(displayedYtd.netProfit - computedEbitda) > tolerance) {
    // Net profit ≠ EBITDA strictement, mais ici on utilise la même base (pas d'impôts dans le modèle)
    issues.push({
      severity: 'warning', scope: 'YTD · Résultat affiché',
      message: 'Le résultat YTD affiché diffère de l\'EBITDA recalculé (CA − charges).',
      expected: computedEbitda, actual: displayedYtd.netProfit, diff: displayedYtd.netProfit - computedEbitda,
    });
  }

  // 1b) Recomputé vs référence hardcodée YTD_2026
  if (Math.abs(REF_YTD_2026.caTotal - computedCa) > tolerance) {
    issues.push({
      severity: 'warning', scope: 'YTD · CA vs référence',
      message: `Référence hardcodée YTD_2026.caTotal (${REF_YTD_2026.caTotal.toLocaleString()}) ne correspond pas à la somme actuelle.`,
      expected: REF_YTD_2026.caTotal, actual: computedCa, diff: computedCa - REF_YTD_2026.caTotal,
    });
  }
  if (Math.abs(REF_YTD_2026.netProfit - computedEbitda) > tolerance * 10) {
    issues.push({
      severity: 'warning', scope: 'YTD · Résultat vs référence',
      message: `Référence YTD_2026.netProfit (${REF_YTD_2026.netProfit.toLocaleString()}) diverge du calcul actuel.`,
      expected: REF_YTD_2026.netProfit, actual: computedEbitda, diff: computedEbitda - REF_YTD_2026.netProfit,
    });
  }

  // 2) Per-month: sum of account-level detail vs aggregated category (si l'import détail existe)
  if (accountsLoaded && accountsByMonth.size > 0) {
    for (const m of monthlyCosts) {
      const ym = parseMonthLabel(m.month);
      if (!ym) continue;
      const detail = accountsByMonth.get(`${ym.year}-${ym.month}`);
      if (!detail) continue;
      for (const cat of CATEGORIES) {
        const aggregate = m.actual[cat] ?? 0;
        const fromDetail = detail.get(cat) ?? 0;
        if (Math.abs(aggregate - fromDetail) > tolerance) {
          issues.push({
            severity: 'warning',
            scope: `${m.month} · ${CATEGORY_LABELS[cat]}`,
            message: 'Somme des comptes ≠ agrégat mensuel. Réimporter le P&L peut resynchroniser.',
            expected: fromDetail, actual: aggregate, diff: aggregate - fromDetail,
          });
        }
      }
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const allOk = issues.length === 0;

  const variant = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok';
  const styles: Record<typeof variant, string> = {
    ok: 'bg-emerald-50 border-l-emerald-500 text-emerald-900',
    warning: 'bg-amber-50 border-l-amber-500 text-amber-900',
    error: 'bg-red-50 border-l-red-500 text-red-900',
  };
  const Icon = variant === 'ok' ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`rounded-lg border-l-4 ${styles[variant]} p-4`}>
      <button
        type="button"
        onClick={() => !allOk && setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 text-left"
      >
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-sm">
            {allOk
              ? '✅ Cohérence vérifiée — Totaux YTD = somme des mois (et détail comptes le cas échéant).'
              : `⚠️ ${issues.length} incohérence${issues.length > 1 ? 's' : ''} détectée${issues.length > 1 ? 's' : ''}`}
          </p>
          {!allOk && (
            <p className="text-xs mt-1 opacity-80">
              {errors.length > 0 && <>{errors.length} erreur{errors.length > 1 ? 's' : ''} bloquante{errors.length > 1 ? 's' : ''}. </>}
              {warnings.length > 0 && <>{warnings.length} avertissement{warnings.length > 1 ? 's' : ''}. </>}
              Cliquer pour {expanded ? 'masquer' : 'voir'} le détail.
            </p>
          )}
          <p className="text-[11px] mt-1 opacity-70">
            CA recalculé : <strong>{Math.round(computedCa).toLocaleString()} AED</strong> ·
            Charges : <strong>{Math.round(computedCharges).toLocaleString()} AED</strong> ·
            EBITDA : <strong>{Math.round(computedEbitda).toLocaleString()} AED</strong> ·
            {monthlyCosts.length} mois agrégés
            {accountsByMonth.size > 0 && <> · {accountsByMonth.size} mois avec détail comptes</>}
          </p>
        </div>
        {!allOk && (
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </button>

      {expanded && !allOk && (
        <div className="mt-3 border-t pt-3 space-y-2">
          {issues.map((iss, idx) => (
            <div key={idx} className="text-xs bg-white/60 rounded p-2 border">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${
                    iss.severity === 'error' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {iss.severity === 'error' ? 'ERREUR' : 'WARN'}
                  </span>
                  <strong>{iss.scope}</strong> — {iss.message}
                </div>
              </div>
              <div className="mt-1 ml-1 font-mono text-[11px] opacity-80">
                attendu {Math.round(iss.expected).toLocaleString()} ·
                affiché {Math.round(iss.actual).toLocaleString()} ·
                écart <strong>{iss.diff >= 0 ? '+' : ''}{Math.round(iss.diff).toLocaleString()}</strong> AED
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

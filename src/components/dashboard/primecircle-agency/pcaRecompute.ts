// PCA Recompute & Correct
// -----------------------
// Régénère, à partir des valeurs mensuelles brutes (gross, expenses) et du
// libellé du mois, l'ensemble des champs dérivés et cumulés :
//   • net         = gross - expenses
//   • pcaShare    = net / 2
//   • marginPct   = net / gross * 100  (0 si gross == 0)
//   • expenseRatio= expenses / gross * 100
//   • ytdGross / ytdExpenses / ytdNet / ytdPcaShare = cumuls jan→mois
//
// Renvoie une "ordonnance de correction" exploitable :
//   - corrections par mois (champ → valeur saisie / valeur correcte / Δ)
//   - patch TS prêt-à-coller pour PrimeCircleAgencyData.ts
// Aucune écriture côté code : c'est l'opérateur qui patche, on garantit
// juste que les chiffres affichés sont alignés avec une seule source
// (gross, expenses).

import {
  getPCAMonthData,
  PCA_AVAILABLE_MONTHS,
  type PCAMonthData,
  type PCAMonthId,
} from './PrimeCircleAgencyData';

export const PCA_RECOMPUTE_TOLERANCE_USD = 1;
export const PCA_RECOMPUTE_TOLERANCE_PCT = 0.2;

export type PCARecomputeField =
  | 'net'
  | 'pcaShare'
  | 'marginPct'
  | 'expenseRatio'
  | 'ytdGross'
  | 'ytdExpenses'
  | 'ytdNet'
  | 'ytdPcaShare';

export interface PCAFieldCorrection {
  field: PCARecomputeField;
  declared: number;
  recomputed: number;
  delta: number;
  unit: 'usd' | 'pct';
}

export interface PCAMonthRecompute {
  monthId: PCAMonthId;
  label: string;
  gross: number;
  expenses: number;
  recomputed: {
    net: number;
    pcaShare: number;
    marginPct: number;
    expenseRatio: number;
    ytdGross: number;
    ytdExpenses: number;
    ytdNet: number;
    ytdPcaShare: number;
  };
  corrections: PCAFieldCorrection[];
}

export interface PCARecomputeReport {
  months: PCAMonthRecompute[];
  totalCorrections: number;
  patch: string; // TS snippet prêt à coller
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function diff(
  field: PCARecomputeField,
  declared: number,
  recomputed: number,
  unit: 'usd' | 'pct',
): PCAFieldCorrection | null {
  const tol = unit === 'usd' ? PCA_RECOMPUTE_TOLERANCE_USD : PCA_RECOMPUTE_TOLERANCE_PCT;
  const delta = recomputed - declared;
  if (Math.abs(delta) <= tol) return null;
  return { field, declared, recomputed, delta, unit };
}

function buildPatchLine(m: PCAMonthRecompute): string {
  const r = m.recomputed;
  return [
    `// ${m.label} — corrigé`,
    `gross: ${m.gross}, expenses: ${m.expenses}, net: ${r.net}, pcaShare: ${r.pcaShare},`,
    `marginPct: ${r.marginPct}, expenseRatio: ${r.expenseRatio},`,
    `ytdGross: ${r.ytdGross}, ytdExpenses: ${r.ytdExpenses}, ytdNet: ${r.ytdNet}, ytdPcaShare: ${r.ytdPcaShare},`,
  ].join('\n');
}

export function recomputePCA(): PCARecomputeReport {
  const ids = PCA_AVAILABLE_MONTHS.map((m) => m.id as PCAMonthId);
  let cumGross = 0;
  let cumExp = 0;
  let cumNet = 0;
  let cumShare = 0;

  const months: PCAMonthRecompute[] = ids.map((id) => {
    const d: PCAMonthData = getPCAMonthData(id);
    const net = d.gross - d.expenses;
    const pcaShare = net / 2;
    const marginPct = d.gross > 0 ? round2((net / d.gross) * 100) : 0;
    const expenseRatio = d.gross > 0 ? round2((d.expenses / d.gross) * 100) : 0;
    cumGross += d.gross;
    cumExp += d.expenses;
    cumNet += net;
    cumShare += pcaShare;

    const recomputed = {
      net,
      pcaShare,
      marginPct,
      expenseRatio,
      ytdGross: cumGross,
      ytdExpenses: cumExp,
      ytdNet: cumNet,
      ytdPcaShare: cumShare,
    };

    const corrections: PCAFieldCorrection[] = [];
    const push = (c: PCAFieldCorrection | null) => c && corrections.push(c);
    push(diff('net', d.net, net, 'usd'));
    push(diff('pcaShare', d.pcaShare, pcaShare, 'usd'));
    push(diff('marginPct', d.marginPct, marginPct, 'pct'));
    push(diff('expenseRatio', d.expenseRatio, expenseRatio, 'pct'));
    push(diff('ytdGross', d.ytdGross, cumGross, 'usd'));
    push(diff('ytdExpenses', d.ytdExpenses, cumExp, 'usd'));
    push(diff('ytdNet', d.ytdNet, cumNet, 'usd'));
    push(diff('ytdPcaShare', d.ytdPcaShare, cumShare, 'usd'));

    return {
      monthId: id,
      label: d.monthLabel,
      gross: d.gross,
      expenses: d.expenses,
      recomputed,
      corrections,
    };
  });

  const totalCorrections = months.reduce((s, m) => s + m.corrections.length, 0);
  const patch = months.map(buildPatchLine).join('\n\n');

  return { months, totalCorrections, patch };
}

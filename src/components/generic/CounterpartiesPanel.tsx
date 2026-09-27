// Revue des CONTREPARTIES bancaires d'un dossier : propositions de l'IA à valider (< 90 %),
// qualifications automatiques de l'IA (hypothèses, révocables) et règles du conseiller.
// Une décision = une règle valable pour tous les mois ; la standardisation du mois est relancée.
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Globe, Trash2 } from 'lucide-react';
import { CP_CATEGORIES, CP_CATEGORY_LABELS, type BankRule, type CpCategory, type Proposal } from '../../../supabase/functions/_shared/counterparties';

export type CpOp = { op: 'accept' | 'set' | 'reject' | 'delete' | 'share'; match: string; category?: string; label?: string };

const fmt = (x: number) => Math.round(x).toLocaleString('fr-FR');
const pct = (x?: number) => (typeof x === 'number' ? `${Math.round(x * 100)} %` : '');

function CatSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className="h-7 rounded border bg-background px-1.5 text-xs">
      {CP_CATEGORIES.map((c) => <option key={c} value={c}>{CP_CATEGORY_LABELS[c]}</option>)}
    </select>
  );
}

export function CounterpartiesPanel({ context, busy, onApply }: {
  context: { bank_rules?: BankRule[]; bank_rule_proposals?: Proposal[] } | null | undefined;
  busy: boolean;
  onApply: (ops: CpOp[]) => void;
}) {
  const proposals = useMemo(() => [...(context?.bank_rule_proposals ?? [])].sort((a, b) => b.amount - a.amount), [context]);
  const rules = context?.bank_rules ?? [];
  const iaRules = rules.filter((r) => r.source === 'ia');
  const staffRules = rules.filter((r) => r.source !== 'ia');
  const [choice, setChoice] = useState<Record<string, string>>({});
  if (!proposals.length && !rules.length) return null;
  const catOf = (p: Proposal) => choice[p.match] ?? p.category;

  return (
    <details className="mb-4 border rounded-lg bg-background" open={proposals.length > 0}>
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium flex flex-wrap items-center gap-2">
        Contreparties bancaires
        {proposals.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{proposals.length} à valider</span>}
        {iaRules.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">{iaRules.length} qualifiée(s) par l'IA</span>}
        <span className="text-xs text-muted-foreground">{staffRules.length} règle(s) validée(s)</span>
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      </summary>
      <div className="px-3 pb-3 space-y-4">
        {proposals.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Débits que le moteur ne sait pas classer. Tant qu'ils ne sont pas qualifiés, ils restent <b>hors charges</b> : le résultat peut être surestimé. Choisis la catégorie puis valide — la règle vaut pour tous les mois.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {proposals.map((p) => (
                    <tr key={p.match} className="border-t">
                      <td className="py-1.5 pr-2 max-w-[260px]">
                        <div className="truncate font-medium" title={p.label}>{p.label}</div>
                        {p.reason && <div className="text-[11px] text-muted-foreground truncate" title={p.reason}>{p.reason}</div>}
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums whitespace-nowrap">{fmt(p.amount)}</td>
                      <td className="py-1.5 pr-2 whitespace-nowrap">
                        <CatSelect value={catOf(p)} onChange={(v) => setChoice((c) => ({ ...c, [p.match]: v }))} disabled={busy} />
                        {p.confidence > 0 && <span className="ml-1.5 text-[11px] text-muted-foreground">IA {pct(p.confidence)}</span>}
                      </td>
                      <td className="py-1.5 whitespace-nowrap text-right">
                        <Button size="sm" variant="outline" className="h-7 px-2" disabled={busy}
                          onClick={() => onApply([{ op: 'accept', match: p.match, category: catOf(p), label: p.label }])}>
                          <Check className="w-3.5 h-3.5 mr-1" />Valider
                        </Button>
                        <button className="ml-1 text-muted-foreground hover:text-destructive align-middle" disabled={busy} title="Écarter (ne plus demander)"
                          onClick={() => onApply([{ op: 'reject', match: p.match }])}><X className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {proposals.some((p) => p.confidence >= 0.3) && (
              <Button size="sm" variant="ghost" className="mt-1 h-7 text-xs" disabled={busy}
                onClick={() => onApply(proposals.filter((p) => p.confidence >= 0.3 || choice[p.match]).map((p) => ({ op: 'accept' as const, match: p.match, category: catOf(p), label: p.label })))}>
                Valider toutes les propositions affichées
              </Button>
            )}
          </div>
        )}

        {rules.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Règles appliquées. <span className="px-1.5 rounded bg-sky-100 text-sky-800">IA</span> = hypothèse posée automatiquement (confiance ≥ 90 %) : confirme-la ou corrige-la.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {[...iaRules, ...staffRules].map((r) => (
                    <tr key={r.match} className="border-t">
                      <td className="py-1.5 pr-2 max-w-[260px]">
                        <span className="font-mono text-xs">{r.match}</span>
                        {r.label && <span className="text-xs text-muted-foreground"> · {r.label}</span>}
                      </td>
                      <td className="py-1.5 pr-2 whitespace-nowrap">
                        <CatSelect value={r.category} disabled={busy}
                          onChange={(v) => onApply([{ op: 'set', match: r.match, category: v, label: r.label }])} />
                        {r.source === 'ia' && <span className="ml-1.5 text-[11px] px-1.5 rounded bg-sky-100 text-sky-800">IA {pct(r.confidence)}</span>}
                      </td>
                      <td className="py-1.5 whitespace-nowrap text-right">
                        {r.source === 'ia' && (
                          <Button size="sm" variant="outline" className="h-7 px-2" disabled={busy}
                            onClick={() => onApply([{ op: 'set', match: r.match, category: r.category, label: r.label }])}>
                            <Check className="w-3.5 h-3.5 mr-1" />Confirmer
                          </Button>
                        )}
                        {r.source !== 'ia' && (CP_CATEGORIES as readonly string[]).includes(r.category) && (
                          <button className="ml-1 text-muted-foreground hover:text-primary align-middle" disabled={busy}
                            title="Même nature chez tous les clients (ex. Qonto, Canva) : l'ajouter au dictionnaire commun"
                            onClick={() => onApply([{ op: 'share', match: r.match, category: r.category as CpCategory, label: r.label }])}><Globe className="w-4 h-4" /></button>
                        )}
                        <button className="ml-1 text-muted-foreground hover:text-destructive align-middle" disabled={busy} title="Supprimer la règle"
                          onClick={() => onApply([{ op: 'delete', match: r.match }])}><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

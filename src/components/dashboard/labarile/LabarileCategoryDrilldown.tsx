import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, FileText } from 'lucide-react';
import { CATEGORY_LABELS, type LabarileCategory } from './LabarileMapping';
import { useLabarileAccounts } from './useLabarileAccounts';

interface Props {
  year: number;
  month: number; // 1-12
  monthLabel: string;
  /** Total connu (depuis le hook agrégé) pour comparaison rapide. */
  totals: Record<LabarileCategory, number>;
  revenue: number;
}

const CATEGORIES: LabarileCategory[] = ['coaches', 'marketing', 'it', 'stripe', 'admin', 'autres'];

export function LabarileCategoryDrilldown({ year, month, monthLabel, totals, revenue }: Props) {
  const [open, setOpen] = useState<LabarileCategory | null>(null);
  const { rows, loading } = useLabarileAccounts(year, month);
  const hasDetail = rows.length > 0;

  const accountsByCat = (cat: LabarileCategory) => rows.filter((r) => r.category === cat);
  const sumOf = (cat: LabarileCategory) => accountsByCat(cat).reduce((a, r) => a + Number(r.amount), 0);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-labarile-muted uppercase tracking-wider">
          🔍 Drill-down — cliquer pour voir les comptes sources
        </p>
        {!hasDetail && !loading && (
          <span className="text-[11px] text-labarile-muted italic">
            Pas de détail importé pour ce mois
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {CATEGORIES.map((cat) => {
          const total = totals[cat] ?? 0;
          const detailCount = accountsByCat(cat).length;
          const clickable = hasDetail && detailCount > 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => clickable && setOpen(cat)}
              disabled={!clickable}
              className={`text-left rounded-lg border p-2 transition ${
                clickable
                  ? 'bg-labarile-white border-labarile-primary/30 hover:border-labarile-primary hover:bg-labarile-ice1 cursor-pointer'
                  : 'bg-muted/30 border-labarile-border cursor-not-allowed opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold text-labarile-primary-dark">
                  {CATEGORY_LABELS[cat]}
                </span>
                {clickable && <Search className="w-3 h-3 text-labarile-primary" />}
              </div>
              <div className="font-bebas text-base text-labarile-title">
                {Math.round(total / 1000).toLocaleString()}k
              </div>
              <div className="text-[10px] text-labarile-muted">
                {clickable ? `${detailCount} compte${detailCount > 1 ? 's' : ''}` : '—'}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {CATEGORY_LABELS[open]} — {monthLabel}
                </DialogTitle>
                <DialogDescription>
                  Comptes P&L source qui composent ce montant (importés depuis le P&L Zoho).
                </DialogDescription>
              </DialogHeader>

              {(() => {
                const accs = accountsByCat(open);
                const sum = sumOf(open);
                const aggregate = totals[open] ?? 0;
                const diff = aggregate - sum;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <Badge variant="outline">{accs.length} comptes</Badge>
                      <Badge>Total détail : {Math.round(sum).toLocaleString()} AED</Badge>
                      <Badge variant="secondary">
                        Total agrégé : {Math.round(aggregate).toLocaleString()} AED
                      </Badge>
                      {Math.abs(diff) > 1 && (
                        <Badge variant="destructive">
                          Écart : {Math.round(diff).toLocaleString()} AED
                        </Badge>
                      )}
                      {revenue > 0 && (
                        <Badge variant="outline">
                          {((sum / revenue) * 100).toFixed(1)}% du CA
                        </Badge>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/50 backdrop-blur">
                          <tr className="border-b">
                            <th className="text-left p-2 font-semibold">Compte</th>
                            <th className="text-right p-2 font-semibold">Montant (AED)</th>
                            <th className="text-right p-2 font-semibold">% catég.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accs.map((r, i) => (
                            <tr key={i} className="border-b hover:bg-muted/30">
                              <td className="p-2">{r.account}</td>
                              <td className="p-2 text-right font-mono">
                                {Math.round(Number(r.amount)).toLocaleString()}
                              </td>
                              <td className="p-2 text-right text-muted-foreground">
                                {sum > 0 ? ((Number(r.amount) / sum) * 100).toFixed(1) : '0'}%
                              </td>
                            </tr>
                          ))}
                          {accs.length === 0 && (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                Aucun compte trouvé pour cette catégorie.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {Math.abs(diff) > 1 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                        ⚠️ L'écart entre le total agrégé (table mensuelle) et la somme des comptes détaillés
                        peut indiquer que l'agrégat a été modifié manuellement ou que l'import du détail est
                        incomplet pour ce mois. Réimporte le P&L pour synchroniser.
                      </p>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

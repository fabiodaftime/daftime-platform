// Grille de COUVERTURE des sources (famille × mois), calculée depuis la reconnaissance au dépôt.
// Dit ce qui manque AVANT de standardiser : « août : pas de factures logistique, pas de banque ».
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { coverageGrid, EXPECTED_FAMILIES, FAMILY_LABELS, type DetectedSource, type SourceFamily } from '../../../supabase/functions/_shared/detectSource';

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const mLabel = (p: string) => `${MONTHS_FR[Number(p.slice(5, 7)) - 1]} ${p.slice(2, 4)}`;
const addMonths = (p: string, k: number) => { const d = new Date(Date.UTC(Number(p.slice(0, 4)), Number(p.slice(5, 7)) - 1 + k, 1)); return d.toISOString().slice(0, 10); };

export function SourceCoverage({ clientId, period, activity, refreshKey }: { clientId: string; period: string; activity?: string; refreshKey?: unknown }) {
  const [rows, setRows] = useState<{ period: string | null; detected: DetectedSource | null }[]>([]);
  useEffect(() => {
    let off = false;
    supabase.from('files' as never).select('period, detected').eq('client_id', clientId)
      .then(({ data }) => { if (!off) setRows((data ?? []) as never); });
    return () => { off = true; };
  }, [clientId, refreshKey]);

  const grid = useMemo(() => coverageGrid(rows), [rows]);
  const analyzed = rows.filter((r) => r.detected).length;
  if (!analyzed) return null;
  const expected = EXPECTED_FAMILIES[activity ?? ''] ?? EXPECTED_FAMILIES.ecommerce;
  const extra = (Object.keys(grid) as SourceFamily[]).filter((f) => !expected.includes(f) && f !== 'other' && grid[f].size);
  const families = [...expected, ...extra];
  const months = Array.from({ length: 6 }, (_, i) => addMonths(period, i - 5));

  return (
    <div className="mt-4">
      <div className="text-xs font-medium mb-1">Couverture des sources <span className="font-normal text-muted-foreground">— {analyzed}/{rows.length} fichier(s) reconnus au dépôt</span></div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr><th className="text-left font-normal text-muted-foreground pr-3 py-1" />
              {months.map((m) => <th key={m} className={`px-2 py-1 font-normal ${m === period ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{mLabel(m)}</th>)}
            </tr>
          </thead>
          <tbody>
            {families.map((f) => (
              <tr key={f} className="border-t">
                <td className="pr-3 py-1 whitespace-nowrap">{FAMILY_LABELS[f]}{expected.includes(f) ? '' : ' ·'}</td>
                {months.map((m) => {
                  const ok = grid[f].has(m);
                  // Pub sans export des régies : lue dans la banque si les débits sont qualifiés (moins détaillé).
                  const viaBank = !ok && f === 'ads' && grid.bank.has(m);
                  return (
                    <td key={m} className="px-2 py-1 text-center" title={ok ? 'couvert' : viaBank ? 'pas d\'export des régies : dépense lue dans la banque (sans détail par campagne)' : 'aucun fichier pour ce mois'}>
                      {ok ? <span className="text-emerald-600">✓</span> : viaBank ? <span className="text-amber-600">banque</span> : expected.includes(f) ? <span className="text-destructive">✗</span> : <span className="text-muted-foreground">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

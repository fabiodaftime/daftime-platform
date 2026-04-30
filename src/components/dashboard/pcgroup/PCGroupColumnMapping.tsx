import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Info } from 'lucide-react';

export interface ColumnMappingEntry {
  column: string;        // ex: "Janvier"
  source: string;        // ex: "Cycle de clôture mensuel — Janvier 2026"
  formula?: string;      // ex: "Somme des marges nettes des 5 entités"
  note?: string;         // ex: "Saisi manuellement depuis le P&L Pennylane"
}

interface Props {
  /** Title shown in the drawer header (defaults to "Source & mapping des colonnes"). */
  title?: string;
  /** Short context line (entity / table) shown under the title. */
  context?: string;
  /** Mapping entries, one per visible column. */
  entries: ColumnMappingEntry[];
  /** Optional global note shown above the entries. */
  note?: string;
}

/**
 * Small "ℹ️ Source & mapping" trigger that opens a side drawer explaining where
 * each column (Janvier / Février / Mars / Variation / YTD) comes from.
 *
 * Designed to live in the header of any pcg-section comparison table.
 */
export function PCGroupColumnMappingTrigger({ title = 'Source & mapping des colonnes', context, entries, note }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="pcg-mapping-btn"
        onClick={() => setOpen(true)}
        aria-label="Afficher la source et le mapping des colonnes"
      >
        <Info size={14} />
        <span>Source &amp; mapping</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[480px] sm:max-w-[520px] overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-[--pcg-navy-deep,#0F1E33]">{title}</SheetTitle>
            {context && (
              <SheetDescription className="text-[--pcg-text-secondary,#475569]">
                {context}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {note && (
              <div className="pcg-mapping-note">
                {note}
              </div>
            )}

            <ul className="pcg-mapping-list">
              {entries.map((e, i) => (
                <li key={i} className="pcg-mapping-item">
                  <div className="pcg-mapping-col">{e.column}</div>
                  <div className="pcg-mapping-body">
                    <div className="pcg-mapping-row">
                      <span className="pcg-mapping-label">Source</span>
                      <span className="pcg-mapping-value">{e.source}</span>
                    </div>
                    {e.formula && (
                      <div className="pcg-mapping-row">
                        <span className="pcg-mapping-label">Formule</span>
                        <span className="pcg-mapping-value">{e.formula}</span>
                      </div>
                    )}
                    {e.note && (
                      <div className="pcg-mapping-row">
                        <span className="pcg-mapping-label">Note</span>
                        <span className="pcg-mapping-value pcg-mapping-muted">{e.note}</span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * Build a default mapping from the visible column headers.
 * Used when a tab does not provide custom entries — guarantees consistency
 * across Agency / Structuring / Digit / Holding / Overview.
 */
export function buildDefaultColumnMapping(headers: string[]): ColumnMappingEntry[] {
  return headers
    .filter((h) => h !== 'Indicateur' && h !== 'Entité')
    .map<ColumnMappingEntry>((h) => {
      if (h === 'Janvier') {
        return {
          column: 'Janvier',
          source: 'Cycle de clôture mensuel — Janvier 2026',
          formula: 'Valeurs saisies par le CFO Advisory à partir du P&L mensuel.',
        };
      }
      if (h === 'Février') {
        return {
          column: 'Février',
          source: 'Cycle de clôture mensuel — Février 2026',
          formula: 'Valeurs saisies par le CFO Advisory à partir du P&L mensuel.',
        };
      }
      if (h === 'Mars') {
        return {
          column: 'Mars',
          source: 'Cycle de clôture mensuel — Mars 2026',
          formula: 'Valeurs saisies par le CFO Advisory à partir du P&L mensuel.',
        };
      }
      if (h.startsWith('Variation')) {
        const isFebMar = h.includes('Fév→Mars');
        return {
          column: h,
          source: isFebMar ? 'Calcul automatique Février → Mars' : 'Calcul automatique mois courant vs M-1',
          formula: isFebMar
            ? '(Mars − Février) ÷ Février × 100'
            : '(Mois courant − M-1) ÷ M-1 × 100',
          note: "Affichée en vert si positive, rouge si négative (selon l'indicateur).",
        };
      }
      if (h === 'YTD') {
        return {
          column: 'YTD',
          source: 'Cumul Year-To-Date 2026',
          formula: 'Somme des mois disponibles depuis Janvier 2026.',
          note: 'Mise à jour à chaque clôture mensuelle.',
        };
      }
      return { column: h, source: 'Donnée du dashboard consolidé Prime Circle Group.' };
    });
}

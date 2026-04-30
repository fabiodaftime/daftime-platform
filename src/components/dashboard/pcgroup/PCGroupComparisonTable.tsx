import { PCGroupColumnMappingTrigger, buildDefaultColumnMapping, type ColumnMappingEntry } from './PCGroupColumnMapping';

interface ComparisonRow {
  cells: string[];
  varIndex?: number;
  varType?: string;
}

interface Props {
  title: string;
  headers: string[];
  rows: ComparisonRow[];
  /** Optional context (e.g. "Onglet Agency · Mars 2026") shown in the mapping drawer. */
  mappingContext?: string;
  /** Optional override for the column mapping entries. Defaults to one entry per column. */
  mappingEntries?: ColumnMappingEntry[];
  /** Set to false to hide the mapping trigger (e.g. when the table doesn't expose period columns). */
  showMapping?: boolean;
}

export function PCGroupComparisonTable({
  title,
  headers,
  rows,
  mappingContext,
  mappingEntries,
  showMapping = true,
}: Props) {
  const entries = mappingEntries ?? buildDefaultColumnMapping(headers);

  return (
    <div className="pcg-section">
      <div className="pcg-section-header pcg-section-header-row">
        <h3 className="pcg-section-title">{title}</h3>
        {showMapping && entries.length > 0 && (
          <PCGroupColumnMappingTrigger
            context={mappingContext}
            entries={entries}
          />
        )}
      </div>
      <div className="pcg-section-body">
        <table className="pcg-comparison-table">
          <thead>
            <tr>
              {headers.map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.cells.map((cell, j) => (
                  <td
                    key={j}
                    className={j === row.varIndex ? `pcg-var-${row.varType}` : ''}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

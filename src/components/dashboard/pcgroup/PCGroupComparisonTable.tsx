interface ComparisonRow {
  cells: string[];
  varIndex?: number;
  varType?: string;
}

interface Props {
  title: string;
  headers: string[];
  rows: ComparisonRow[];
}

export function PCGroupComparisonTable({ title, headers, rows }: Props) {
  return (
    <div className="pcg-section">
      <div className="pcg-section-header">
        <h3 className="pcg-section-title">{title}</h3>
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

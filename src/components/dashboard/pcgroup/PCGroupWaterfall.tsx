interface WaterfallRow {
  label: string;
  value: string;
  type: string;
  indent?: boolean;
}

export function PCGroupWaterfall({ data, title }: { data: WaterfallRow[]; title: string }) {
  return (
    <div className="pcg-section">
      <div className="pcg-section-header">
        <h3 className="pcg-section-title">{title}</h3>
      </div>
      <div className="pcg-section-body">
        <table className="pcg-waterfall">
          <tbody>
            {data.map((row, i) => {
              if (row.type === 'spacer') return <tr key={i}><td colSpan={2} style={{ height: 12, border: 'none' }} /></tr>;
              const isTotal = row.type.startsWith('total');
              const isHighlight = row.type === 'highlight';
              const isMuted = row.type === 'muted';
              const isIndentMuted = row.type === 'indent-muted';
              const cls = [
                isTotal ? 'pcg-row-total' : '',
                isHighlight ? 'pcg-row-highlight' : '',
              ].join(' ');
              const valCls = row.type === 'positive' || row.type === 'total-positive' ? 'positive' :
                row.type === 'negative' || row.type === 'total-negative' ? 'negative' :
                  (isMuted || isIndentMuted) ? 'muted' : '';
              return (
                <tr key={i} className={cls}>
                  <td className="pcg-row-label" style={{
                    ...(row.indent ? { paddingLeft: '1.5rem' } : undefined),
                    ...(isIndentMuted ? { paddingLeft: '1.5rem', fontSize: '0.85rem', color: '#64748b' } : undefined),
                  }}>
                    {isHighlight ? <strong>{row.label}</strong> : row.label}
                  </td>
                  <td className={`pcg-row-value ${valCls}`} style={isIndentMuted ? { fontSize: '0.85rem', color: '#64748b' } : undefined}>{row.value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

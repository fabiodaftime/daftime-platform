import React from 'react';
import { C, fmtF, type PCAMonthData } from './PrimeCircleAgencyData';

interface Props { data: PCAMonthData; }

export function PCABlinkTab({ data }: Props) {
  const bgMap: Record<string, string> = {
    primarySoft: C.primarySoft, greenSoft: C.greenSoft, redSoft: C.redSoft, purpleSoft: C.purpleSoft,
  };

  return (
    <div>
      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Suivi Blink - Benefit & Media</h3>
          <p className="pca-section-subtitle">{data.monthLabel}</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="pca-table">
            <thead>
              <tr>
                {data.blinkHeaders.map((h, i) => (
                  <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.blinkRows.map((r, i) => (
                <React.Fragment key={i}>
                  <tr>
                    <td style={{ fontWeight: r.b ? 700 : 400, background: r.bg ? bgMap[r.bg] || 'transparent' : 'transparent', textAlign: 'left' }}>{r.l}</td>
                    {r.v.map((val, ci) => (
                      <td key={ci} style={{ fontWeight: r.b ? 700 : 400, background: r.bg ? bgMap[r.bg] || 'transparent' : 'transparent', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {val === 0 ? '$0' : fmtF(val)}
                      </td>
                    ))}
                  </tr>
                  {r.sep && <tr><td colSpan={data.blinkHeaders.length} style={{ height: 10, border: 'none' }}></td></tr>}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

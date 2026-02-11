import { C, fmtF } from './PrimeCircleAgencyData';

const blinkRows = [
  { l: "Net Revenue", v: [198, 10644, 5854, 8518, 4489], bg: null, b: false, sep: false },
  { l: "CA PCA (50%)", v: [99, 5322, 2927, 4259, 2244], bg: null, b: false, sep: false },
  { l: "CA PCA (50%) Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: C.primarySoft, b: true, sep: false },
  { l: "CA Blink to PAID at Blink (50%)", v: [99, 5322, 2927, 4259, 2244], bg: null, b: false, sep: false },
  { l: "Amount Paid by PCA on Benefit", v: [0, 0, 0, 0, 0], bg: C.redSoft, b: false, sep: false },
  { l: "To Paid at Blink Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: C.redSoft, b: true, sep: true },
  { l: "Total Media to Pay (CL)", v: [31788, 12866, 5730, 4406, 21009], bg: null, b: false, sep: false },
  { l: "Amount Paid by PCA on Media", v: [31788, 12866, 5730, 4406, 21009], bg: C.greenSoft, b: false, sep: false },
  { l: "To Paid at Blink Cumulated (Media)", v: [0, 0, 0, 0, 0], bg: C.greenSoft, b: true, sep: true },
  { l: "Total Blink to Pay / Month (Benefit & Media)", v: [31887, 18188, 8657, 8665, 23253], bg: null, b: false, sep: false },
  { l: "Total Blink to Pay Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: C.purpleSoft, b: true, sep: false },
];

const headers = ["", "Sep-25", "Oct-25", "Nov-25", "Dec-25", "Jan-26"];

export function PCABlinkTab() {
  return (
    <div>
      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Suivi Blink - Benefit & Media</h3>
          <p className="pca-section-subtitle">Reporting Sep 2025 - Jan 2026</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="pca-table">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blinkRows.map((r, i) => (
                <>
                  <tr key={i}>
                    <td style={{ fontWeight: r.b ? 700 : 400, background: r.bg || 'transparent', textAlign: 'left' }}>{r.l}</td>
                    {r.v.map((val, ci) => (
                      <td key={ci} style={{ fontWeight: r.b ? 700 : 400, background: r.bg || 'transparent', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {val === 0 ? '$0' : fmtF(val)}
                      </td>
                    ))}
                  </tr>
                  {r.sep && <tr key={`sep-${i}`}><td colSpan={6} style={{ height: 10, border: 'none' }}></td></tr>}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

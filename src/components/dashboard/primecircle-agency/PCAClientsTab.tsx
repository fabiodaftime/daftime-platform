import { C, fmtF, type PCAMonthData } from './PrimeCircleAgencyData';
import { PCABadge, PCAStatusDot } from './PCAShared';

interface Props { data: PCAMonthData; }

export function PCAClientsTab({ data }: Props) {
  return (
    <div>
      <div className="pca-kpi-grid">
        {data.clientKPIs.map((kpi, i) => (
          <div key={i} className="pca-kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="pca-kpi-label">{kpi.label}</div>
                <div className="pca-kpi-value">{kpi.value}</div>
                {kpi.sub && <div className="pca-kpi-sub">{kpi.sub}</div>}
              </div>
              <span className="pca-kpi-icon">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Top 10 Clients - {data.monthLabel} (par encaissement)</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="pca-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>#</th>
                <th style={{ textAlign: 'left' }}>Client</th>
                <th style={{ textAlign: 'right' }}>Encaissé</th>
                <th style={{ textAlign: 'right' }}>Type</th>
                <th style={{ textAlign: 'center' }}>Statut</th>
                <th style={{ textAlign: 'left' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.topClientsRev.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: i < 3 ? C.accent : C.textMuted }}>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtF(c.received)}</td>
                  <td style={{ textAlign: 'right' }}><PCABadge color={c.type === 'CL' ? C.orangeText : C.primary}>{c.type}</PCABadge></td>
                  <td style={{ textAlign: 'center' }}><PCAStatusDot status={c.status} /></td>
                  <td style={{ color: C.textSecondary, fontSize: 12 }}>{c.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Nouveaux Clients Cles - {data.monthLabel}</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="pca-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Client</th>
                <th style={{ textAlign: 'right' }}>Sub</th>
                <th style={{ textAlign: 'right' }}>Tier</th>
                <th style={{ textAlign: 'right' }}>Type</th>
                <th style={{ textAlign: 'left' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {data.newClientsDetail.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td style={{ textAlign: 'right' }}>{c.sub > 0 ? fmtF(c.sub) : '---'}</td>
                  <td style={{ textAlign: 'right' }}><PCABadge color={C.primary}>{c.tier}</PCABadge></td>
                  <td style={{ textAlign: 'right' }}><PCABadge color={c.type === 'CL' ? C.orangeText : C.primary}>{c.type}</PCABadge></td>
                  <td style={{ color: C.textSecondary, fontSize: 11 }}>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pca-section">
        <div style={{ marginBottom: 20 }}>
          <h3 className="pca-section-title">Tiers & Types</h3>
          <p className="pca-section-subtitle">Repartition des {data.transactions} transactions</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            {data.tierBreakdown.map((t, i) => {
              const max = Math.max(...data.tierBreakdown.map(x => x.count));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 50, color: C.textSecondary }}>{t.tier}</span>
                  <div className="pca-bar-track">
                    <div className="pca-bar-fill" style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, width: `${(t.count / max) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.text, width: 28 }}>{t.count}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: C.primarySoft, borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid ' + C.border }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.primary }}>{data.ccCount}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>CC ({data.ccPct}%)</div>
            </div>
            <div style={{ background: C.orangeSoft, borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid ' + C.border }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.orangeText }}>{data.clCount}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>CL ({data.clPct}%)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

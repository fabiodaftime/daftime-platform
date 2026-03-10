import { C, fmtF, topClientsRev, newClientsDetail, tierBreakdown } from './PrimeCircleAgencyData';
import { PCABadge, PCAStatusDot } from './PCAShared';

export function PCAClientsTab() {
  return (
    <div>
      <div className="pca-kpi-grid">
        {[
          { label: "Nouveaux", value: "116", icon: "🆕", sub: "vs 21 en Jan" },
          { label: "Renouveles", value: "20", icon: "🔄", sub: "vs 20 en Jan" },
          { label: "Upgraded", value: "6", icon: "⬆️", sub: "vs 1 en Jan" },
          { label: "Trials", value: "3", icon: "🧪" },
          { label: "CC Comptes", value: "66", icon: "💳" },
          { label: "CL Comptes", value: "79", icon: "⚡", sub: "54.5% des tx" },
        ].map((kpi, i) => (
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
          <h3 className="pca-section-title">Top 10 Clients - Fevrier (par encaissement)</h3>
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
              {topClientsRev.map((c, i) => (
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
          <h3 className="pca-section-title">Nouveaux Clients Cles - Fevrier</h3>
          <p className="pca-section-subtitle">Selection des 10 plus importants</p>
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
              {newClientsDetail.map((c, i) => (
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
          <p className="pca-section-subtitle">Repartition des 145 transactions</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            {tierBreakdown.map((t, i) => {
              const max = Math.max(...tierBreakdown.map(x => x.count));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 50, color: C.textSecondary }}>{t.tier}</span>
                  <div className="pca-bar-track">
                    <div className="pca-bar-fill" style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`, width: `${(t.count / max) * 100}%` }}>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.text, width: 28 }}>{t.count}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: C.primarySoft, borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid ' + C.border }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.primary }}>66</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>CC (45.5%)</div>
            </div>
            <div style={{ background: C.orangeSoft, borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid ' + C.border }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.orangeText }}>79</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>CL (54.5%)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

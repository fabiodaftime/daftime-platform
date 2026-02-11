import { C, fmtF, topClientsRev, newClientsDetail, tierBreakdown } from './PrimeCircleAgencyData';
import { PCABadge, PCAStatusDot } from './PCAShared';

export function PCAClientsTab() {
  return (
    <div>
      <div className="pca-kpi-grid">
        {[
          { label: "Nouveaux Clients", value: "21", icon: "🆕", sub: "Dont Stelio $13K" },
          { label: "Renouveles", value: "20", icon: "🔄" },
          { label: "Trials", value: "20", icon: "🧪", sub: "~35% conversion" },
          { label: "Stopped", value: "14", icon: "🛑" },
          { label: "CC Comptes", value: "47", icon: "💳" },
          { label: "CL Comptes", value: "14", icon: "⚡", sub: "Risque credit" },
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
          <h3 className="pca-section-title">Top 10 Clients - Janvier (par encaissement)</h3>
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

      <div className="pca-two-col">
        <div className="pca-section">
          <div style={{ marginBottom: 20 }}>
            <h3 className="pca-section-title">Nouveaux Clients - Detail</h3>
            <p className="pca-section-subtitle">21 nouvelles inscriptions en janvier</p>
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
                    <td style={{ textAlign: 'right' }}>{c.tier}</td>
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
            <p className="pca-section-subtitle">Repartition des 62 transactions</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Par Tier</div>
              {tierBreakdown.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text, width: 50 }}>{t.tier}</span>
                  <div className="pca-bar-track">
                    <div className="pca-bar-fill" style={{ background: `linear-gradient(90deg, ${C.primary}, #7C8CF5)`, width: `${(t.count / 47) * 100}%` }}>
                      <span className="pca-bar-label">{t.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>CC vs CL</div>
              <div style={{ background: C.primarySoft, borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 10, border: '1px solid ' + C.border }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.primary }}>47</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>CC (75.8%)</div>
              </div>
              <div style={{ background: C.orangeSoft, borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid ' + C.border }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.orangeText }}>14</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>CL (22.6%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

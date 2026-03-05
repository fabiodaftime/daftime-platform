import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { holdingKPIs, holdingManagementFees, holdingRefacturation, holdingSynthese, holdingPieData, directors } from './PCGroupData';
import { PCGroupWaterfall } from './PCGroupWaterfall';

export function PCGroupHoldingTab() {
  return (
    <div>
      <div className="pcg-kpi-grid">
        {holdingKPIs.map((kpi, i) => (
          <div key={i} className={`pcg-kpi-card ${kpi.color}`}>
            <div className="pcg-kpi-label">{kpi.label}</div>
            <div className="pcg-kpi-value">{kpi.value}</div>
            <div className="pcg-kpi-detail">{kpi.detail}</div>
          </div>
        ))}
      </div>

      <div className="pcg-charts-row">
        {/* Remontées Filiales (90%) */}
        <div className="pcg-section">
          <div className="pcg-section-header">
            <div>
              <h3 className="pcg-section-title">📥 Remontées Filiales (90%)</h3>
              <p className="pcg-section-subtitle">Quote-part bénéfice vers Holding</p>
            </div>
          </div>
          <div className="pcg-section-body">
            <p className="pcg-table-subheader">Bénéfice par entité (100%)</p>
            <table className="pcg-waterfall">
              <tbody>
                {holdingManagementFees.map((r, i) => (
                  <tr key={i} className={r.type.startsWith('total') ? 'pcg-row-total' : ''}>
                    <td className="pcg-row-label">{r.label}</td>
                    <td className={`pcg-row-value ${r.type === 'positive' || r.type === 'total-positive' ? 'positive' : ''}`}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ height: 12 }} />
            <table className="pcg-waterfall">
              <tbody>
                <tr>
                  <td className="pcg-row-label">Réserves Filiales (10%)</td>
                  <td className="pcg-row-value negative">-$8,961</td>
                </tr>
                <tr className="pcg-row-highlight">
                  <td className="pcg-row-label"><strong>REMONTÉE HOLDING (90%)</strong></td>
                  <td className="pcg-row-value positive">$80,646</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Charges */}
        <div className="pcg-section">
          <div className="pcg-section-header">
            <div>
              <h3 className="pcg-section-title">📤 Charges Holding</h3>
              <p className="pcg-section-subtitle">Utilisation des fonds</p>
            </div>
          </div>
           <div className="pcg-section-body">
            <p className="pcg-table-subheader">Frais de structure</p>
            <table className="pcg-waterfall">
              <tbody>
                <tr>
                  <td className="pcg-row-label">Compta + CFO Groupe</td>
                  <td className="pcg-row-value negative">-$3,430</td>
                </tr>
                <tr>
                  <td className="pcg-row-label">Salaire Assistante</td>
                  <td className="pcg-row-value negative">-$1,630</td>
                </tr>
                <tr>
                  <td className="pcg-row-label">Salaires Fixes Sales</td>
                  <td className="pcg-row-value negative">-$2,000</td>
                </tr>
                <tr className="pcg-row-total">
                  <td className="pcg-row-label">TOTAL FRAIS HOLDING</td>
                  <td className="pcg-row-value negative">-$7,060</td>
                </tr>
              </tbody>
            </table>
            <div style={{ height: 16 }} />
            <p className="pcg-table-subheader">Salaires Management (100% résultat net)</p>
            <table className="pcg-waterfall">
              <tbody>
                <tr>
                  <td className="pcg-row-label">Maxence (37.5%)</td>
                  <td className="pcg-row-value negative">-$27,595</td>
                </tr>
                <tr>
                  <td className="pcg-row-label">Thibault (37.5%)</td>
                  <td className="pcg-row-value negative">-$27,595</td>
                </tr>
                <tr>
                  <td className="pcg-row-label" style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>↳ dont Will</td>
                  <td className="pcg-row-value" style={{ fontSize: '0.85rem', color: '#64748b' }}>$10,000</td>
                </tr>
                <tr>
                  <td className="pcg-row-label">Florian (25%)</td>
                  <td className="pcg-row-value negative">-$18,396</td>
                </tr>
                <tr className="pcg-row-total">
                  <td className="pcg-row-label">TOTAL SALAIRES</td>
                  <td className="pcg-row-value negative">-$73,586</td>
                </tr>
              </tbody>
            </table>
            <div style={{ height: 16 }} />
            <table className="pcg-waterfall">
              <tbody>
                <tr className="pcg-row-highlight">
                  <td className="pcg-row-label"><strong>SOLDE HOLDING</strong></td>
                  <td className="pcg-row-value">$0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>

      {/* Directors */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <div>
            <h3 className="pcg-section-title">👥 Répartition Dirigeants - Janvier 2026</h3>
            <p className="pcg-section-subtitle">90% du résultat net groupe = $76,677</p>
          </div>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-directors-grid">
            {directors.map((d, i) => (
              <div key={i} className="pcg-director-card" style={{ background: d.gradient }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
                <div className="pcg-director-name">{d.name}</div>
                <div className="pcg-director-pct">{d.pct}</div>
                <div className="pcg-director-amount">{d.amount}</div>
                {d.subtitle && (
                  <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>{d.subtitle}</div>
                )}
                <div className="pcg-director-bar">
                  <div style={{ width: d.pct, height: '100%', background: '#C9A227', borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Synthèse */}
      <div className="pcg-section">
        <div className="pcg-section-header">
          <h3 className="pcg-section-title">📊 Synthèse Flux Holding</h3>
        </div>
        <div className="pcg-section-body">
          <div className="pcg-charts-row">
            <PCGroupWaterfall data={holdingSynthese} title="" />
            <div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={holdingPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                      {holdingPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginTop: 8 }}>
                Répartition du Résultat Net Groupe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

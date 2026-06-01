import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { DIGIT_AVAILABLE_MONTHS, type DigitMonthId, D, fmt, fmtF } from '@/components/dashboard/digit/DigitData';
import {
  ENTITY_META,
  type EntityScope,
  getEntityMonthSlice,
  getEntityEvolution,
  getEntityYTD,
} from '@/components/dashboard/digit/digitEntityScopes';
import { computeDigitHoldingTransfers } from '@/components/dashboard/digit/digitHoldingTransfers';
import '@/pages/DashboardDigit.css';

interface Props { scope: EntityScope; entityId: string }

export function EntityScopedDashboard({ scope, entityId }: Props) {
  const navigate = useNavigate();
  const meta = ENTITY_META[scope];
  const [selectedMonth, setSelectedMonth] = useState<DigitMonthId>('apr-2026');

  const slice = useMemo(() => getEntityMonthSlice(scope, selectedMonth), [scope, selectedMonth]);
  const evo = useMemo(() => getEntityEvolution(scope, selectedMonth), [scope, selectedMonth]);
  const ytd = useMemo(() => getEntityYTD(scope, selectedMonth), [scope, selectedMonth]);
  const holding = useMemo(() => computeDigitHoldingTransfers(selectedMonth), [selectedMonth]);
  const holdingScope = holding.subActivities.find((s) => s.key === scope)!;

  return (
    <div className="digit-dashboard">
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />

      <header className="digit-header" style={{ borderTopColor: meta.accent }}>
        <div className="digit-header-inner">
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} style={{ color: '#536471' }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <ViewSwitcher current={scope} entityId={entityId} />
          </div>
          <div className="digit-header-main">
            <div>
              <h1 className="digit-title">{meta.emoji} {meta.label}</h1>
              <div className="digit-subtitle">Vue isolée — données étanches Core / SPY / Comment</div>
              <div style={{ marginTop: 8 }}>
                <MonthSelector
                  months={DIGIT_AVAILABLE_MONTHS}
                  selectedMonth={selectedMonth}
                  onMonthChange={(id) => setSelectedMonth(id as DigitMonthId)}
                  variant="blue"
                />
              </div>
            </div>
            <div className="digit-period-badge" style={{ background: meta.accent }}>{slice.monthLabel}</div>
          </div>
        </div>
      </header>

      <div className="digit-tab-content">
        {slice.alert && (
          <div style={{ background: D.orangeSoft, border: `1px solid ${D.orange}`, borderLeft: `4px solid ${D.orange}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem', color: D.orangeText }}>
            ⚠️ {slice.alert}
          </div>
        )}

        <h2 className="digit-section-title">Performance {slice.monthLabel}</h2>
        <div className="digit-kpi-grid">
          <KpiCard label="CA" value={fmtF(slice.ca)} sub={`${slice.kpis[0]?.sub || ''}`} accent={meta.accent} />
          <KpiCard label="Marge nette" value={fmtF(slice.marge)} sub={`${slice.margePct.toFixed(1)}% du CA`} accent={D.green} />
          <KpiCard label="Taux de marge" value={`${slice.margePct.toFixed(1)}%`} sub="Périmètre isolé" accent={D.primary} />
          <KpiCard label="À remonter au groupe (90%)" value={fmtF(slice.marge * 0.9)} sub="Part Holding théorique" accent="#C9A227" />
        </div>

        {slice.costsKPIs && (
          <>
            <h2 className="digit-section-title">Charges & Marge — Décomposition</h2>
            <div className="digit-kpi-grid">
              {slice.costsKPIs.map((k, i) => (
                <KpiCard key={i} label={k.label} value={k.value} sub={k.sub} accent={meta.accent} />
              ))}
            </div>
          </>
        )}

        {slice.costsBreakdown && (
          <div className="digit-chart-container">
            <div className="digit-chart-title">Détail P&L {meta.label}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                {slice.costsBreakdown.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${D.border}` }}>
                    <td style={{ padding: '10px 12px', color: D.text, fontWeight: 500 }}>{row.label}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: row.negative ? D.red : D.text, fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>{row.value}</td>
                  </tr>
                ))}
                {slice.costsTotal && (
                  <tr style={{ background: D.surfaceAlt, borderTop: `2px solid ${meta.accent}` }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: D.text }}>Marge nette</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 700, color: D.green }}>{slice.costsTotal}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!slice.costsBreakdown && (
          <div style={{ background: D.primarySoft, border: `1px dashed ${D.primary}`, borderRadius: 8, padding: '14px 16px', marginBottom: 16, fontSize: '0.85rem', color: D.textSecondary }}>
            ℹ️ Détail des charges {meta.label} non disponible pour {slice.monthLabel}. Disponible à partir de février 2026.
          </div>
        )}

        <h2 className="digit-section-title">Évolution YTD</h2>
        <div className="digit-kpi-grid">
          <KpiCard label="CA YTD" value={fmtF(ytd.ca)} sub={`${evo.length} mois`} accent={meta.accent} />
          <KpiCard label="Marge YTD" value={fmtF(ytd.marge)} sub={`${ytd.margePct.toFixed(1)}% du CA`} accent={D.green} />
          <KpiCard label="Cumul à remonter (90%)" value={fmtF(ytd.marge * 0.9)} sub="Objectif Holding YTD" accent="#C9A227" />
        </div>
        <div className="digit-chart-container">
          <div className="digit-chart-title">CA & Marge — {meta.label}</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={evo}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Bar dataKey="ca" name="CA" fill={meta.accent} radius={[4, 4, 0, 0]} />
              <Bar dataKey="marge" name="Marge" fill={D.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h2 className="digit-section-title">Remontées Holding — {meta.label}</h2>
        <div className="digit-kpi-grid">
          <KpiCard label="Théorique 90%" value={fmtF(Math.round(holdingScope.totalExpected))} sub={`Marge YTD ${fmtF(Math.round(holdingScope.totalMargin))}`} accent="#C9A227" />
          <KpiCard label="Reçu" value={fmtF(Math.round(holdingScope.totalReceived))} sub={`Taux ${holdingScope.recoveryRate.toFixed(0)}%`} accent={D.green} />
          <KpiCard label="Reste à remonter" value={fmtF(Math.round(holdingScope.totalRemaining))} sub="FIFO sur mois ouverts" accent={holdingScope.totalRemaining > 0 ? D.red : D.green} />
        </div>
        <div className="digit-chart-container">
          <div className="digit-chart-title">Historique mensuel</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: D.surfaceAlt, borderBottom: `2px solid ${meta.accent}` }}>
                {['Mois', 'Marge', '90% dû', 'Reçu', 'Solde', 'Statut'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Mois' || h === 'Statut' ? 'left' : 'right', color: D.text, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdingScope.rows.map((r) => (
                <tr key={r.month} style={{ borderBottom: `1px solid ${D.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.longLabel}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono' }}>{fmtF(Math.round(r.margin))}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono' }}>{fmtF(Math.round(r.expected))}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', color: D.green }}>{fmtF(Math.round(r.received))}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', color: r.balance > 0 ? D.red : D.text }}>{fmtF(Math.round(r.balance))}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, background: r.status === 'paid' ? D.greenSoft : r.status === 'partial' ? '#FEF3C7' : D.redSoft, color: r.status === 'paid' ? D.greenText : r.status === 'partial' ? '#92400E' : D.redText }}>
                      {r.status === 'paid' ? '✅ Couvert' : r.status === 'partial' ? '🟡 Partiel' : '🔴 Dû'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="digit-footer">
        Dashboard {meta.label} — {slice.monthLabel} | Vue isolée
      </footer>
    </div>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="digit-metric-card" style={{ borderLeftColor: accent }}>
      <div className="digit-metric-label">{label}</div>
      <div className="digit-metric-value">{value}</div>
      <div className="digit-metric-sub">{sub}</div>
    </div>
  );
}

export function ViewSwitcher({ current, entityId }: { current: EntityScope | 'core'; entityId: string }) {
  const navigate = useNavigate();
  const items: Array<{ key: EntityScope | 'core'; label: string; route: string; color: string }> = [
    { key: 'core', label: '🟦 Digit Solution (Groupe)', route: `/dashboard-digit/${entityId}`, color: '#1E56A0' },
    { key: 'spy', label: '🛰️ SPY', route: `/dashboard-spy/${entityId}`, color: '#7C3AED' },
    { key: 'comment', label: '💬 Comment', route: `/dashboard-comment/${entityId}`, color: '#17B169' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, background: '#F4F7FA', padding: 4, borderRadius: 8, border: '1px solid #CFD9DE' }}>
      {items.map((it) => {
        const active = it.key === current;
        return (
          <button
            key={it.key}
            onClick={() => !active && navigate(it.route)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: '0.78rem',
              fontWeight: 700,
              border: 'none',
              cursor: active ? 'default' : 'pointer',
              background: active ? it.color : 'transparent',
              color: active ? '#fff' : '#536471',
              transition: 'all 0.15s',
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

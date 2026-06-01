import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { DIGIT_AVAILABLE_MONTHS, type DigitMonthId, D, fmt, fmtF } from '@/components/dashboard/digit/DigitData';
import {
  ENTITY_META,
  type EntityScope,
  getEntityMonthSlice,
  getEntityEvolution,
  getEntityYTD,
} from '@/components/dashboard/digit/digitEntityScopes';
import { computeDigitHoldingTransfers, getTransferRate } from '@/components/dashboard/digit/digitHoldingTransfers';
import '@/pages/DashboardDigit.css';

interface Props { scope: EntityScope; entityId: string }

type TabId = 'overview' | 'ytd' | 'revenue' | 'holding';

export function EntityScopedDashboard({ scope, entityId }: Props) {
  const navigate = useNavigate();
  const meta = ENTITY_META[scope];
  const [selectedMonth, setSelectedMonth] = useState<DigitMonthId>('apr-2026');
  const [tab, setTab] = useState<TabId>('overview');

  const slice = useMemo(() => getEntityMonthSlice(scope, selectedMonth), [scope, selectedMonth]);
  const evo = useMemo(() => getEntityEvolution(scope, selectedMonth), [scope, selectedMonth]);
  const ytd = useMemo(() => getEntityYTD(scope, selectedMonth), [scope, selectedMonth]);
  const transferRate = getTransferRate(scope);
  const showHolding = transferRate > 0;
  const holdingScope = useMemo(
    () => (showHolding ? computeDigitHoldingTransfers(selectedMonth).subActivities.find((s) => s.key === scope)! : null),
    [showHolding, scope, selectedMonth],
  );

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'overview', label: "📊 Vue d'ensemble" },
    { id: 'ytd', label: '📈 YTD 2026' },
    { id: 'revenue', label: '💰 Analyse CA' },
    ...(showHolding ? [{ id: 'holding' as TabId, label: '💸 Remontées Holding' }] : []),
  ];

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
              <div className="digit-subtitle">
                {scope === 'spy'
                  ? 'Vue isolée — entité indépendante, remontée vers son propre holding'
                  : 'Vue isolée — entité contribuant 90% de sa marge à la Holding Digit'}
              </div>
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

      <div className="digit-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`digit-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="digit-tab-content">
        {tab === 'overview' && (
          <OverviewSection slice={slice} meta={meta} showHolding={showHolding} transferRate={transferRate} />
        )}
        {tab === 'ytd' && <YTDSection ytd={ytd} evo={evo} meta={meta} showHolding={showHolding} />}
        {tab === 'revenue' && <RevenueSection evo={evo} slice={slice} meta={meta} />}
        {tab === 'holding' && holdingScope && <HoldingSection holdingScope={holdingScope} meta={meta} />}
      </div>

      <footer className="digit-footer">
        Dashboard {meta.label} — {slice.monthLabel} | Vue isolée
      </footer>
    </div>
  );
}

// ============= Sections =============

function OverviewSection({
  slice, meta, showHolding, transferRate,
}: {
  slice: ReturnType<typeof getEntityMonthSlice>;
  meta: typeof ENTITY_META[EntityScope];
  showHolding: boolean;
  transferRate: number;
}) {
  return (
    <>
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
        <KpiCard
          label={`À remonter (${(transferRate * 100).toFixed(0)}%)`}
          value={fmtF(slice.marge * transferRate)}
          sub={scope === 'spy' ? 'Vers holding propre SPY' : 'Vers Holding Digit'}
          accent="#C9A227"
        />
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
          ℹ️ Détail des charges {meta.label} non disponible pour {slice.monthLabel}. La ventilation analytique
          des charges par entité n'est pas encore en place dans la source — seuls les totaux CA / Marge sont garantis isolés.
        </div>
      )}
    </>
  );
}

function YTDSection({
  ytd, evo, meta, showHolding,
}: {
  ytd: ReturnType<typeof getEntityYTD>;
  evo: ReturnType<typeof getEntityEvolution>;
  meta: typeof ENTITY_META[EntityScope];
  showHolding: boolean;
}) {
  return (
    <>
      <h2 className="digit-section-title">Year-To-Date 2026 — {meta.label}</h2>
      <div className="digit-kpi-grid">
        <KpiCard label="CA YTD" value={fmtF(ytd.ca)} sub={`${evo.length} mois cumulés`} accent={meta.accent} />
        <KpiCard label="Marge YTD" value={fmtF(ytd.marge)} sub={`${ytd.margePct.toFixed(1)}% du CA`} accent={D.green} />
        <KpiCard label="Taux de marge YTD" value={`${ytd.margePct.toFixed(1)}%`} sub="Moyenne pondérée" accent={D.primary} />
        {showHolding && (
          <KpiCard label="Cumul à remonter (90%)" value={fmtF(ytd.marge * 0.9)} sub="Objectif Holding YTD" accent="#C9A227" />
        )}
      </div>

      <h2 className="digit-section-title">Détail mensuel</h2>
      <div className="digit-chart-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: D.surfaceAlt, borderBottom: `2px solid ${meta.accent}` }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: D.text, fontWeight: 700 }}>Mois</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: D.text, fontWeight: 700 }}>CA</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: D.text, fontWeight: 700 }}>Marge</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: D.text, fontWeight: 700 }}>Marge %</th>
            </tr>
          </thead>
          <tbody>
            {evo.map((p) => (
              <tr key={p.name} style={{ borderBottom: `1px solid ${D.border}` }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono' }}>{fmtF(p.ca)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', color: D.green }}>{fmtF(p.marge)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono' }}>{p.ca > 0 ? ((p.marge / p.ca) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            ))}
            <tr style={{ background: D.surfaceAlt, borderTop: `2px solid ${meta.accent}` }}>
              <td style={{ padding: '12px', fontWeight: 700 }}>Total YTD</td>
              <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>{fmtF(ytd.ca)}</td>
              <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 700, color: D.green }}>{fmtF(ytd.marge)}</td>
              <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>{ytd.margePct.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="digit-chart-container">
        <div className="digit-chart-title">Évolution CA & Marge</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evo}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
            <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
            <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
            <Line type="monotone" dataKey="ca" name="CA" stroke={meta.accent} strokeWidth={3} dot={{ r: 5 }} />
            <Line type="monotone" dataKey="marge" name="Marge" stroke={D.green} strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function RevenueSection({
  evo, slice, meta,
}: {
  evo: ReturnType<typeof getEntityEvolution>;
  slice: ReturnType<typeof getEntityMonthSlice>;
  meta: typeof ENTITY_META[EntityScope];
}) {
  // Évolution M/M-1
  const rows = evo.map((p, i) => {
    const prev = i > 0 ? evo[i - 1] : null;
    const delta = prev ? p.ca - prev.ca : 0;
    const deltaPct = prev && prev.ca > 0 ? (delta / prev.ca) * 100 : 0;
    return { ...p, delta, deltaPct };
  });

  return (
    <>
      <h2 className="digit-section-title">Analyse CA — {meta.label}</h2>
      <div className="digit-kpi-grid">
        <KpiCard label={`CA ${slice.monthLabel}`} value={fmtF(slice.ca)} sub="Périmètre isolé" accent={meta.accent} />
        <KpiCard label="Meilleur mois" value={fmtF(Math.max(...evo.map((p) => p.ca)))} sub={evo.reduce((a, b) => (b.ca > a.ca ? b : a)).name} accent={D.green} />
        <KpiCard label="Mois cumulés" value={`${evo.length}`} sub="Visibilité YTD" accent={D.primary} />
      </div>

      <div className="digit-chart-container">
        <div className="digit-chart-title">CA mensuel</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={evo}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
            <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
            <Bar dataKey="ca" name="CA" fill={meta.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="digit-chart-container">
        <div className="digit-chart-title">Évolution M/M-1</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: D.surfaceAlt, borderBottom: `2px solid ${meta.accent}` }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: D.text, fontWeight: 700 }}>Mois</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: D.text, fontWeight: 700 }}>CA</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: D.text, fontWeight: 700 }}>Δ vs M-1</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: D.text, fontWeight: 700 }}>%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} style={{ borderBottom: `1px solid ${D.border}` }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono' }}>{fmtF(r.ca)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', color: i === 0 ? D.textMuted : r.delta >= 0 ? D.green : D.red }}>{i === 0 ? '—' : (r.delta >= 0 ? '+' : '') + fmtF(r.delta)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'IBM Plex Mono', color: i === 0 ? D.textMuted : r.delta >= 0 ? D.green : D.red }}>{i === 0 ? '—' : (r.deltaPct >= 0 ? '+' : '') + r.deltaPct.toFixed(1) + '%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function HoldingSection({
  holdingScope, meta,
}: {
  holdingScope: NonNullable<ReturnType<typeof computeDigitHoldingTransfers>['subActivities'][number]>;
  meta: typeof ENTITY_META[EntityScope];
}) {
  return (
    <>
      <h2 className="digit-section-title">Remontées Holding — {meta.label}</h2>
      <p style={{ color: D.textSecondary, marginTop: -8, marginBottom: 20, fontSize: '0.9rem' }}>
        Suivi des 90% de marge nette dus à la Holding pour cette entité. Imputation FIFO : les encaissements
        couvrent en priorité les mois les plus anciens.
      </p>
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
    </>
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

export function ViewSwitcher({ current, entityId }: { current: EntityScope | 'group'; entityId: string }) {
  const navigate = useNavigate();
  const items: Array<{ key: EntityScope | 'group'; label: string; route: string; color: string }> = [
    { key: 'group', label: '🟦 Digit Solution (Groupe)', route: `/dashboard-digit/${entityId}`, color: '#0A1628' },
    { key: 'core', label: '🟦 Digit Core', route: `/dashboard-digit-core/${entityId}`, color: '#1E56A0' },
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

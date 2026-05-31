import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { D, PIE_COLORS, fmt, type DigitMonthData } from './DigitData';

interface Props { data: DigitMonthData; }

const typeColor: Record<string, string> = {
  primary: D.primary, success: D.green, accent: D.primary, warning: D.orange,
};

export function DigitOverviewTab({ data }: Props) {
  const { overviewKPIs, overviewProducts, overviewChartData, comparisonM1 } = data;

  return (
    <div>
      {/* Bandeau Catch-up COO 22/05 — fiabilisation reporting Digit */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
          border: `1px solid ${D.border}`,
          borderLeft: `4px solid ${D.primary}`,
          borderRadius: 10,
          padding: '16px 18px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🛠️</span>
          <strong style={{ color: D.text, fontSize: '0.95rem' }}>
            Fiabilisation reporting — décisions catch-up COO du 22/05/2026
          </strong>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              background: '#FEF3C7',
              color: '#92400E',
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            En cours
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: D.textSecondary, lineHeight: 1.55, marginBottom: 10 }}>
          <strong style={{ color: D.text }}>Périmètre Digit Core isolé</strong> — Le dashboard distingue
          désormais Digit Solution (Core), SPY et Comment/Trust dans des vues étanches (voir onglets
          dédiés et <em>Remontées Holding</em>). Les charges Core ne réagrègent plus Spy + Comment,
          ce qui éliminait l'écart majeur de ~15 k€ historiquement constaté en janvier.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
          {[
            { m: 'Janvier', src: '41 198 €', dash: '41 392 €', delta: '+194 €', tone: 'warn' },
            { m: 'Février', src: '44 248 €', dash: '~45 250 €', delta: '~+1 k€', tone: 'warn' },
            { m: 'Mars', src: '57 658 €', dash: '57 458 €', delta: '−200 €', tone: 'warn' },
            { m: 'Avril', src: '42 347 €', dash: '42 347 €', delta: 'Aligné', tone: 'ok' },
          ].map((r) => (
            <div
              key={r.m}
              style={{
                background: '#fff',
                border: `1px solid ${D.border}`,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ color: D.textMuted, fontWeight: 600, marginBottom: 4 }}>{r.m} — marge nette Digit</div>
              <div style={{ color: D.text }}>Source COO : <strong>{r.src}</strong></div>
              <div style={{ color: D.text }}>Dashboard : <strong>{r.dash}</strong></div>
              <div
                style={{
                  marginTop: 4,
                  display: 'inline-block',
                  padding: '1px 8px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  background: r.tone === 'ok' ? D.greenSoft : '#FEF3C7',
                  color: r.tone === 'ok' ? D.greenText : '#92400E',
                }}
              >
                Δ {r.delta}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.8rem', color: D.textSecondary, lineHeight: 1.55 }}>
          <strong style={{ color: D.text }}>Causes résiduelles</strong> : changement de mode de calcul
          des salaires <em>sales</em> non répercuté uniformément (Jan/Fév ≈ 1 k€), mappage statique
          Excel → CSV → Supabase (cellules de marge récupérées au lieu d'être recalculées
          dynamiquement à partir des charges affichées), et démarrage du flux CSV en mars.
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: `1px dashed ${D.border}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
            fontSize: '0.78rem',
            color: D.textSecondary,
          }}
        >
          <div>
            ✅ <strong style={{ color: D.text }}>Scission par entité</strong> — vues Digit / SPY /
            Comment étanches (onglets Produits, Évolution, Holding).
          </div>
          <div>
            📤 <strong style={{ color: D.text }}>Section Remontées Holding</strong> — 90 % de marge
            nette à reporter au groupe, ventilé par activité (onglet dédié).
          </div>
          <div>
            🔒 <strong style={{ color: D.text }}>Verrouillage Excel historiques</strong> — feuilles
            mensuelles closes figées pour éviter toute modification rétroactive.
          </div>
          <div>
            🔌 <strong style={{ color: D.text }}>Automatisation Zoho / Airtable</strong> — flux CRM
            (Pipedrive) → reporting, suppression de la double saisie (cible 2026 S2).
          </div>
          <div>
            📞 <strong style={{ color: D.text }}>Flo — flux SPY</strong> — clarifier le compte
            bancaire d'encaissement (MaxScale ?) et qui est responsable du remontée groupe.
          </div>
        </div>
      </div>

      <h2 className="digit-section-title">Performance {data.monthLabel}</h2>
      <div className="digit-kpi-grid">

        {overviewKPIs.map((kpi, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[kpi.type] || D.primary }}>
            <div className="digit-metric-label">{kpi.label}</div>
            <div className="digit-metric-value">{kpi.value}</div>
            <div className="digit-metric-sub">{kpi.sub}</div>
            {comparisonM1 && i === 0 && (
              <div className="digit-metric-comparison">
                <span className={`digit-badge ${parseFloat(String(comparisonM1[2]?.value).replace('%','')) >= 0 ? 'positive' : 'negative'}`}>{comparisonM1[2]?.value}</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs {comparisonM1[0]?.label?.replace('CA ','') || 'M-1'} ({comparisonM1[2]?.sub})</span>
              </div>
            )}
            {comparisonM1 && i === 1 && (
              <div className="digit-metric-comparison">
                <span className={`digit-badge ${parseFloat(String(comparisonM1[3]?.value).replace('%','')) >= 0 ? 'positive' : 'negative'}`}>{comparisonM1[3]?.value}</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs {comparisonM1[0]?.label?.replace('CA ','') || 'M-1'} ({comparisonM1[3]?.sub})</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="digit-section-title">Répartition par Produit</h2>
      <div className="digit-kpi-grid">
        {overviewProducts.map((p, i) => (
          <div key={i} className="digit-metric-card" style={{ borderLeftColor: typeColor[p.type] || D.primary }}>
            <div className="digit-metric-label">{p.label}</div>
            <div className="digit-metric-value">{p.value}</div>
            <div className="digit-metric-sub">{p.sub}</div>
            {p.chg && (
              <div className="digit-metric-comparison">
                <span className={`digit-badge ${p.chg.startsWith('+') ? 'positive' : 'negative'}`}>{p.chg}</span>
                <span style={{ fontSize: '0.75rem', color: D.textMuted }}>vs Janvier {p.chg.startsWith('+') && parseFloat(p.chg) > 50 ? '🚀' : p.chg.startsWith('-') ? '⚠️' : ''}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {overviewChartData && (
        <div className="digit-chart-container">
          <div className="digit-chart-title">Évolution CA & Marge ({overviewChartData.labels.join(' vs ')})</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={overviewChartData.labels.map((l, i) => ({ name: l, 'CA Total': overviewChartData.ca[i], 'Marge Totale': overviewChartData.marge[i] }))}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fontWeight: 600 }} />
              <Tooltip formatter={(v: number) => '$' + v.toLocaleString()} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Bar dataKey="CA Total" fill={D.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Marge Totale" fill={D.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

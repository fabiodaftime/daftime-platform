import { useMemo, useState } from 'react';
import {
  getAllRestatements,
  ENTITY_LABELS,
  MONTH_LABELS,
  formatRestatementValue,
  formatDelta,
  deltaPct,
  type RestatementEntity,
  type RestatementEntry,
} from './restatementHistory';
import type { PCGSourceMonthId } from './sources/entityAdapters';

interface Props {
  /** Si fourni, restreint à une seule entité (ex: 'agency' dans le dashboard PCA). */
  restrictEntity?: RestatementEntity;
  /** Couleur d'accent (gold pour PCG, navy pour PCA). */
  accent?: 'gold' | 'navy';
}

const ACCENTS = {
  gold: { fg: '#D4A855', bgSoft: 'rgba(212,168,85,0.10)', border: 'rgba(212,168,85,0.35)' },
  navy: { fg: '#1E56A0', bgSoft: 'rgba(30,86,160,0.08)',  border: 'rgba(30,86,160,0.30)' },
};

export function RestatementHistoryTab({ restrictEntity, accent = 'gold' }: Props) {
  const A = ACCENTS[accent];
  const all = useMemo(() => getAllRestatements(), []);
  const filtered = useMemo(
    () => (restrictEntity ? all.filter((r) => r.entity === restrictEntity) : all),
    [all, restrictEntity],
  );

  const [entityFilter, setEntityFilter] = useState<RestatementEntity | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<PCGSourceMonthId | 'all'>('all');

  const entitiesPresent = useMemo(
    () => Array.from(new Set(filtered.map((r) => r.entity))) as RestatementEntity[],
    [filtered],
  );
  const monthsPresent = useMemo(
    () => Array.from(new Set(filtered.map((r) => r.monthId))) as PCGSourceMonthId[],
    [filtered],
  );

  const view = useMemo(() => {
    return filtered.filter((r) => {
      if (entityFilter !== 'all' && r.entity !== entityFilter) return false;
      if (monthFilter !== 'all' && r.monthId !== monthFilter) return false;
      return true;
    });
  }, [filtered, entityFilter, monthFilter]);

  // KPI synthèse
  const totalCount = view.length;
  const totalAbsImpactUSD = view.reduce((acc, r) => {
    if (r.unit !== 'usd') return acc;
    return acc + Math.abs(r.newValue - r.oldValue);
  }, 0);
  const monthsAffected = new Set(view.map((r) => r.monthId)).size;

  return (
    <div style={{ padding: '24px', fontFamily: 'inherit' }}>
      {/* Intro */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0F1419' }}>
          📋 Historique des restatements
        </h2>
        <p style={{ fontSize: 13, color: '#536471', margin: '6px 0 0' }}>
          Journal versionné de toutes les corrections appliquées à des chiffres
          déjà publiés. Chaque entrée trace l'ancienne valeur, la nouvelle, et
          les KPI consolidés impactés.
        </p>
      </div>

      {/* KPI strip */}
      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        marginBottom: 20,
      }}>
        {[
          { l: 'Restatements', v: String(totalCount) },
          { l: 'Mois impactés', v: String(monthsAffected) },
          { l: 'Impact absolu cumulé', v: `$${Math.round(totalAbsImpactUSD).toLocaleString('en-US')}` },
        ].map((k) => (
          <div key={k.l} style={{
            background: A.bgSoft, border: `1px solid ${A.border}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#536471', fontWeight: 600 }}>
              {k.l}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: A.fg, marginTop: 4 }}>
              {k.v}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {!restrictEntity && (
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as any)}
            style={selectStyle}
          >
            <option value="all">Toutes entités</option>
            {entitiesPresent.map((e) => (
              <option key={e} value={e}>{ENTITY_LABELS[e]}</option>
            ))}
          </select>
        )}
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value as any)}
          style={selectStyle}
        >
          <option value="all">Tous les mois</option>
          {monthsPresent.map((m) => (
            <option key={m} value={m}>{MONTH_LABELS[m]}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {view.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: '#8899A6',
          background: '#F4F7FA', borderRadius: 10, border: '1px dashed #CFD9DE',
        }}>
          Aucun restatement pour ce filtre.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {view.map((r) => (
            <RestatementCard key={r.id} r={r} accent={A} />
          ))}
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #CFD9DE',
  background: '#FFFFFF',
  fontSize: 13,
  color: '#0F1419',
  fontWeight: 500,
  cursor: 'pointer',
  minWidth: 180,
};

function RestatementCard({ r, accent }: { r: RestatementEntry; accent: typeof ACCENTS.gold }) {
  const delta = r.newValue - r.oldValue;
  const pct = deltaPct(r.oldValue, r.newValue);
  const isPositive = delta >= 0;
  const deltaColor = isPositive ? '#16A34A' : '#DC2626';

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 12,
      padding: '16px 18px', boxShadow: '0 1px 2px rgba(15,20,25,0.04)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
              padding: '3px 8px', borderRadius: 4,
              background: accent.bgSoft, color: accent.fg, border: `1px solid ${accent.border}`,
            }}>
              {ENTITY_LABELS[r.entity]}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: '3px 8px', borderRadius: 4,
              background: '#F4F7FA', color: '#536471',
            }}>
              {MONTH_LABELS[r.monthId]}
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F1419', marginTop: 8 }}>
            {r.kpi}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#8899A6', fontWeight: 500 }}>
            Restated le
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1419' }}>
            {new Date(r.restatedOn).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Old → New → Delta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ValueBox label="Avant" value={formatRestatementValue(r.oldValue, r.unit)} color="#8899A6" />
        <ValueBox label="Après" value={formatRestatementValue(r.newValue, r.unit)} color="#0F1419" bold />
        <ValueBox
          label="Delta"
          value={`${formatDelta(delta, r.unit)}${pct != null ? ` (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)` : ''}`}
          color={deltaColor}
          bold
        />
      </div>

      {/* Reason */}
      <div style={{
        background: '#F4F7FA', borderRadius: 8, padding: '10px 12px', marginBottom: r.cascadeImpacts?.length ? 10 : 0,
      }}>
        <div style={{ fontSize: 11, color: '#536471', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
          Raison · {r.source}
        </div>
        <div style={{ fontSize: 13, color: '#0F1419', lineHeight: 1.5 }}>
          {r.reason}
        </div>
      </div>

      {/* Cascade */}
      {r.cascadeImpacts && r.cascadeImpacts.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, color: '#536471', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            Impacts en cascade
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {r.cascadeImpacts.map((c, i) => {
              const cd = c.delta;
              const cColor = cd >= 0 ? '#16A34A' : '#DC2626';
              return (
                <span key={i} style={{
                  fontSize: 12, padding: '4px 10px', borderRadius: 6,
                  background: cd >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
                  border: `1px solid ${cd >= 0 ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
                  color: '#0F1419',
                }}>
                  <span style={{ color: '#536471' }}>{c.label}: </span>
                  <strong style={{ color: cColor }}>{formatDelta(cd, c.unit ?? 'usd')}</strong>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ValueBox({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#8899A6', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: bold ? 700 : 500, color, fontFamily: 'JetBrains Mono, IBM Plex Mono, monospace' }}>
        {value}
      </div>
    </div>
  );
}

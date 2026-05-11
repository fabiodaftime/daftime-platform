import { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchIntercoCashAudit } from './config/pcgroupConfigClient';

interface AuditRow {
  id: string;
  month_id: string;
  entity_code: string;
  action: string;
  old_amount: number | null;
  new_amount: number | null;
  actor_name: string | null;
  note: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: '#10B981',
  update: '#1E3A5F',
  delete: '#EF4444',
};

const ACTION_LABEL: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
};

const fmt = (n: number | null) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

export function IntercosCashAuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchIntercoCashAudit({ limit: 100 });
      setRows(data as AuditRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && rows.length === 0) load();
  }, [open]);

  return (
    <div
      style={{
        marginTop: 24,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} color="#1E3A5F" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1E3A5F' }}>
            Journal d'audit — Remontées de cash
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {open && (
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} style={{ marginRight: 4 }} />
              Actualiser
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? 'Masquer' : 'Afficher'}
          </Button>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 16, color: '#6B7280', fontSize: 13 }}>Chargement…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 16, color: '#6B7280', fontSize: 13 }}>
              Aucune modification enregistrée pour le moment.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600 }}>Mois</th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600 }}>Entité</th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600, textAlign: 'right' }}>
                    Avant
                  </th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600, textAlign: 'right' }}>
                    Après
                  </th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600, textAlign: 'right' }}>
                    Δ
                  </th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600 }}>Auteur</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const delta =
                    r.new_amount != null && r.old_amount != null
                      ? r.new_amount - r.old_amount
                      : r.new_amount != null
                        ? r.new_amount
                        : r.old_amount != null
                          ? -r.old_amount
                          : null;
                  return (
                    <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: 8, color: '#374151', whiteSpace: 'nowrap' }}>
                        {new Date(r.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ padding: 8 }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: `${ACTION_COLORS[r.action] ?? '#6B7280'}20`,
                            color: ACTION_COLORS[r.action] ?? '#6B7280',
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        >
                          {ACTION_LABEL[r.action] ?? r.action}
                        </span>
                      </td>
                      <td style={{ padding: 8, color: '#374151' }}>{r.month_id}</td>
                      <td style={{ padding: 8, color: '#374151', textTransform: 'capitalize' }}>
                        {r.entity_code}
                      </td>
                      <td style={{ padding: 8, color: '#6B7280', textAlign: 'right' }}>
                        {fmt(r.old_amount)}
                      </td>
                      <td style={{ padding: 8, color: '#1E3A5F', textAlign: 'right', fontWeight: 600 }}>
                        {fmt(r.new_amount)}
                      </td>
                      <td
                        style={{
                          padding: 8,
                          textAlign: 'right',
                          fontWeight: 600,
                          color: delta == null ? '#6B7280' : delta >= 0 ? '#10B981' : '#EF4444',
                        }}
                      >
                        {delta == null ? '—' : (delta >= 0 ? '+' : '') + fmt(delta)}
                      </td>
                      <td style={{ padding: 8, color: '#6B7280' }}>{r.actor_name ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CashRow {
  id: string;
  month_id: string;
  entity_code: string;
  amount_received: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  entityCode: string | string[]; // 'digit' ou ['digit','spy','comment']
  entityLabel: string; // ex: 'Digit Solution'
  mode: 'received' | 'remaining';
  expectedTotal: number; // total attendu (USD)
}

const fmtUSD = (n: number) =>
  `$${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n))}`;

export function IntercoCashSourceDrawer({
  open,
  onClose,
  entityCode,
  entityLabel,
  mode,
  expectedTotal,
}: Props) {
  const [rows, setRows] = useState<CashRow[]>([]);
  const [loading, setLoading] = useState(false);
  const codes = Array.isArray(entityCode) ? entityCode : [entityCode];
  const codesKey = codes.join(',');

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('pcgroup_intercos_cash')
        .select('*')
        .in('entity_code', codes)
        .order('month_id', { ascending: true });
      if (alive) {
        setRows((data ?? []) as CashRow[]);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, codesKey]);

  if (!open) return null;

  const totalReceived = rows.reduce((a, r) => a + Number(r.amount_received ?? 0), 0);
  const remaining = Math.max(0, expectedTotal - totalReceived);
  const headerTitle =
    mode === 'received'
      ? `Déjà remonté — ${entityLabel}`
      : `Solde restant — ${entityLabel}`;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 30, 51, 0.45)',
          zIndex: 70,
          animation: 'pcg-fade-in 150ms ease-out',
        }}
      />
      {/* Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(520px, 100vw)',
          background: '#FFFFFF',
          boxShadow: '-8px 0 32px rgba(15, 30, 51, 0.18)',
          zIndex: 71,
          display: 'flex',
          flexDirection: 'column',
          animation: 'pcg-slide-in 200ms ease-out',
        }}
      >
        <header
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            background: 'linear-gradient(135deg, #0F1E33 0%, #1E3A5F 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Détail des lignes sources
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{headerTitle}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              borderRadius: 6,
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Récap */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F3F4F6',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            background: '#FAFBFC',
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Attendu</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1E3A5F' }}>{fmtUSD(expectedTotal)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Déjà remonté</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>{fmtUSD(totalReceived)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Solde restant</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#D97706' }}>{fmtUSD(remaining)}</div>
          </div>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', margin: '12px 0 8px' }}>
            Lignes sources (table pcgroup_intercos_cash)
          </div>

          {loading ? (
            <div style={{ padding: 24, color: '#6B7280', fontSize: 13 }}>Chargement…</div>
          ) : rows.length === 0 ? (
            <div
              style={{
                padding: 16,
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 6,
                color: '#92400E',
                fontSize: 13,
              }}
            >
              Aucune ligne source enregistrée pour <strong>{entityLabel}</strong>. Le solde restant est égal au total attendu.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600 }}>Mois</th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600 }}>Entité</th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600, textAlign: 'right' }}>Montant</th>
                  <th style={{ padding: 8, color: '#6B7280', fontWeight: 600 }}>Mis à jour</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: 8, color: '#374151', fontWeight: 600, verticalAlign: 'top' }}>{r.month_id}</td>
                    <td style={{ padding: 8, color: '#6B7280', textTransform: 'capitalize', verticalAlign: 'top' }}>{r.entity_code}</td>
                    <td style={{ padding: 8, color: '#059669', fontWeight: 700, textAlign: 'right', verticalAlign: 'top' }}>
                      {fmtUSD(Number(r.amount_received ?? 0))}
                      {r.note ? (
                        <div style={{ fontSize: 10, fontWeight: 500, color: '#92400E', marginTop: 4, fontStyle: 'italic', textAlign: 'right' }}>
                          {r.note}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: 8, color: '#9CA3AF', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {new Date(r.updated_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #1E3A5F', background: '#F9FAFB' }}>
                  <td style={{ padding: 8, fontWeight: 700, color: '#1E3A5F' }}>TOTAL</td>
                  <td />
                  <td style={{ padding: 8, fontWeight: 700, color: '#059669', textAlign: 'right' }}>
                    {fmtUSD(totalReceived)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          )}

          {mode === 'remaining' && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: 6,
                fontSize: 12,
                color: '#9A3412',
              }}
            >
              <strong>Calcul :</strong> Solde restant = Attendu ({fmtUSD(expectedTotal)}) − Déjà remonté ({fmtUSD(totalReceived)}) = <strong>{fmtUSD(remaining)}</strong>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes pcg-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pcg-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

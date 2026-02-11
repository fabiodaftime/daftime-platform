import { C, fmtF } from './PrimeCircleAgencyData';

export function PCATooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid ' + C.border, borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 24px rgba(30,30,47,0.08)' }}>
      <p style={{ color: C.textMuted, fontSize: 11, margin: '0 0 6px', fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 13, margin: '3px 0', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? fmtF(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function PCABadge({ children, color }: { children: React.ReactNode; color?: string }) {
  const col = color || C.primary;
  const soft = col === C.greenText ? C.greenSoft : col === C.redText ? C.redSoft : col === C.orangeText ? C.orangeSoft : col === C.purple ? C.purpleSoft : col === C.accent ? C.accentSoft : C.primarySoft;
  return <span className="pca-badge" style={{ background: soft, color: col }}>{children}</span>;
}

export function PCAStatusDot({ status }: { status: string }) {
  const active = status === 'Active';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span className="pca-status-dot" style={{ background: active ? C.green : C.red }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: active ? C.greenText : C.redText }}>{status}</span>
    </span>
  );
}

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PCGroupAgencyTab } from './PCGroupAgencyTab';
import { PCGroupStructuringTab } from './PCGroupStructuringTab';
import { PCGroupDigitTab } from './PCGroupDigitTab';
import { PCGroupSpyTab } from './PCGroupSpyTab';
import { PCGroupCommentTab } from './PCGroupCommentTab';
import { PCGroupHoldingTab } from './PCGroupHoldingTab';
import type { PCGroupEntityRoutes } from './PCGroupData';

interface Props {
  data: any;
  entityRoutes: PCGroupEntityRoutes;
}

type EntityKey = 'agency' | 'structuring' | 'digit' | 'spy' | 'comment' | 'holding';

const ENTITIES: Array<{
  key: EntityKey;
  icon: string;
  label: string;
  amountFrom: (d: any) => string | undefined;
}> = [
  { key: 'agency',      icon: '📢', label: 'Agency',         amountFrom: (d) => d.agencyKPIs?.[2]?.value },
  { key: 'structuring', icon: '🏛️', label: 'Structuring',    amountFrom: (d) => d.structuringKPIs?.[1]?.value },
  { key: 'digit',       icon: '💻', label: 'Digit Solution', amountFrom: (d) => d.digitKPIs?.[1]?.value },
  { key: 'spy',         icon: '🔍', label: 'SPY',            amountFrom: (d) => d.spyKPIs?.[1]?.value },
  { key: 'comment',     icon: '💬', label: 'Comment',        amountFrom: (d) => d.commentKPIs?.[1]?.value },
  { key: 'holding',     icon: '🏦', label: 'Holding',        amountFrom: (d) => d.holdingKPIs?.[1]?.value },
];

export function PCGroupEntitiesAccordion({ data, entityRoutes }: Props) {
  const [open, setOpen] = useState<Set<EntityKey>>(new Set(['agency']));

  const toggle = (key: EntityKey) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => setOpen(new Set(ENTITIES.map((e) => e.key)));
  const collapseAll = () => setOpen(new Set());

  const renderBody = (key: EntityKey) => {
    switch (key) {
      case 'agency':      return <PCGroupAgencyTab data={data} entityRoutes={entityRoutes} />;
      case 'structuring': return <PCGroupStructuringTab data={data} entityRoutes={entityRoutes} />;
      case 'digit':       return <PCGroupDigitTab data={data} entityRoutes={entityRoutes} />;
      case 'spy':         return <PCGroupSpyTab data={data} />;
      case 'comment':     return <PCGroupCommentTab data={data} />;
      case 'holding':     return <PCGroupHoldingTab data={data} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 4px',
        }}
      >
        <div style={{ fontSize: 14, color: '#6B7280' }}>
          {open.size} / {ENTITIES.length} entité{open.size > 1 ? 's' : ''} ouverte{open.size > 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={expandAll}
            style={{
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #D4A85555',
              background: 'transparent',
              color: '#D4A855',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Tout ouvrir
          </button>
          <button
            onClick={collapseAll}
            style={{
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              background: 'transparent',
              color: '#6B7280',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Tout fermer
          </button>
        </div>
      </div>

      {ENTITIES.map((e) => {
        const isOpen = open.has(e.key);
        const amount = e.amountFrom(data);
        return (
          <section
            key={e.key}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              boxShadow: isOpen ? '0 4px 16px rgba(15,30,51,0.08)' : '0 1px 3px rgba(15,30,51,0.04)',
              overflow: 'hidden',
              transition: 'box-shadow 150ms ease',
            }}
          >
            <button
              onClick={() => toggle(e.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: isOpen
                  ? 'linear-gradient(135deg, #0F1E33 0%, #1E3A5F 100%)'
                  : '#FAFBFC',
                border: 'none',
                cursor: 'pointer',
                color: isOpen ? '#FFFFFF' : '#0F1E33',
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{e.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.2 }}>{e.label}</span>
                {amount && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: isOpen ? 'rgba(212,168,85,0.2)' : '#F3F4F6',
                      color: isOpen ? '#D4A855' : '#6B7280',
                    }}
                  >
                    {amount}
                  </span>
                )}
              </div>
              <ChevronDown
                size={20}
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                  opacity: 0.8,
                }}
              />
            </button>
            {isOpen && (
              <div style={{ padding: '20px', background: '#FAFBFC', borderTop: '1px solid #E5E7EB' }}>
                {renderBody(e.key)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

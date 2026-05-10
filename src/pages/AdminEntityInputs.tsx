// Super Admin: centralized monthly inputs entry per entity.
// Currently supports the 'digit' layout (pilot). Extend ENTITY_REGISTRY to add more.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  ENTITY_REGISTRY,
  SUPPORTED_MONTHS,
  type EntityLayoutKey,
} from '@/lib/entityInputs/schema';
import {
  useEntityInputsByMonth,
  useUpsertEntityInputs,
} from '@/lib/entityInputs/hooks';

type Draft = Record<string, Record<string, string>>; // [monthId][fieldKey] = string

export default function AdminEntityInputs() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [layout, setLayout] = useState<EntityLayoutKey>('digit');
  const meta = ENTITY_REGISTRY[layout];

  const { byMonth, isLoading } = useEntityInputsByMonth(layout);
  const upsert = useUpsertEntityInputs();
  const [draft, setDraft] = useState<Draft>({});
  const [savingMonth, setSavingMonth] = useState<string | null>(null);

  // Initialize draft from DB whenever the data loads.
  useEffect(() => {
    if (isLoading) return;
    const next: Draft = {};
    for (const m of SUPPORTED_MONTHS) {
      const row = byMonth[m.id];
      next[m.id] = {};
      for (const f of meta.fields) {
        const v = row?.inputs?.[f.key];
        next[m.id][f.key] = v != null ? String(v) : '';
      }
    }
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, layout]);

  const groups = useMemo(() => {
    const seen: string[] = [];
    for (const f of meta.fields) if (!seen.includes(f.group)) seen.push(f.group);
    return seen;
  }, [meta]);

  const isDirty = (monthId: string): boolean => {
    const row = byMonth[monthId];
    return meta.fields.some((f) => {
      const dbVal = row?.inputs?.[f.key];
      const draftVal = draft[monthId]?.[f.key] ?? '';
      const draftNum = draftVal === '' ? null : Number(draftVal);
      return dbVal !== draftNum && !(dbVal == null && draftVal === '');
    });
  };

  const handleChange = (monthId: string, key: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [monthId]: { ...prev[monthId], [key]: value },
    }));
  };

  const handleSave = async (monthId: string) => {
    const inputs: Record<string, number> = {};
    for (const f of meta.fields) {
      const raw = draft[monthId]?.[f.key] ?? '';
      const num = raw === '' ? 0 : Number(raw);
      if (!Number.isFinite(num)) {
        toast({ title: 'Valeur invalide', description: `${f.label} (${monthId})`, variant: 'destructive' });
        return;
      }
      inputs[f.key] = num;
    }
    // Validate against schema
    const parsed = meta.schema.safeParse(inputs);
    if (!parsed.success) {
      toast({
        title: 'Validation échouée',
        description: parsed.error.errors[0]?.message ?? 'Champs invalides',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSavingMonth(monthId);
      await upsert.mutateAsync({ layout, monthId, inputs });
      toast({ title: 'Enregistré', description: `${monthId} mis à jour` });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message ?? 'Échec', variant: 'destructive' });
    } finally {
      setSavingMonth(null);
    }
  };

  if (authLoading) return null;
  if (!isSuperAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Accès réservé aux Super Admins.
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', padding: '24px 32px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <h1 style={{ margin: 0, fontFamily: 'serif', fontSize: 28, color: '#0A1628' }}>
            Saisie mensuelle — {meta.label}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(Object.keys(ENTITY_REGISTRY) as EntityLayoutKey[]).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={k === layout ? 'default' : 'outline'}
              onClick={() => setLayout(k)}
            >
              {ENTITY_REGISTRY[k].label}
            </Button>
          ))}
        </div>

        <div style={{
          background: 'white', borderRadius: 12, padding: 16,
          border: '1px solid #E5E1D8', overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAF7F2' }}>
                <th style={th}>Champ</th>
                {SUPPORTED_MONTHS.map((m) => (
                  <th key={m.id} style={th}>{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <FragmentRows
                  key={`g-${g}`}
                  group={g}
                  fields={meta.fields.filter((f) => f.group === g)}
                  draft={draft}
                  onChange={handleChange}
                />
              ))}
              <tr>
                <td style={td} />
                {SUPPORTED_MONTHS.map((m) => (
                  <td key={m.id} style={td}>
                    <Button
                      size="sm"
                      onClick={() => handleSave(m.id)}
                      disabled={!isDirty(m.id) || savingMonth === m.id}
                      style={{ width: '100%' }}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      {savingMonth === m.id ? '…' : 'Enregistrer'}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 16, color: '#64748b', fontSize: 12 }}>
          <History className="w-3 h-3 inline mr-1" />
          Toute modification est journalisée et propagée en temps réel sur le dashboard {meta.label} et le dashboard consolidé.
        </p>
      </div>
    </div>
  );
}

function FragmentRows({
  group, fields, draft, onChange,
}: {
  group: string;
  fields: { key: string; label: string; unit: string }[];
  draft: Draft;
  onChange: (monthId: string, key: string, value: string) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={1 + SUPPORTED_MONTHS.length} style={{
          padding: '12px 8px 4px', fontWeight: 600,
          color: '#D4A855', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5,
        }}>{group}</td>
      </tr>
      {fields.map((f) => (
        <tr key={f.key}>
          <td style={{ ...td, fontWeight: 500 }}>
            {f.label}
            <span style={{ color: '#94a3b8', marginLeft: 6, fontSize: 11 }}>
              {f.unit === 'usd' ? '$' : f.unit === 'pct' ? '%' : '#'}
            </span>
          </td>
          {SUPPORTED_MONTHS.map((m) => (
            <td key={m.id} style={td}>
              <Input
                type="number"
                inputMode="decimal"
                value={draft[m.id]?.[f.key] ?? ''}
                onChange={(e) => onChange(m.id, f.key, e.target.value)}
                style={{ height: 32, fontSize: 13 }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #E5E1D8',
  fontWeight: 600, color: '#0A1628', fontSize: 12,
};
const td: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid #F5F0E8', verticalAlign: 'middle',
};

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  usePCGroupConfig,
  useInvalidatePCGroupConfig,
} from '@/components/dashboard/pcgroup/config/usePCGroupConfig';
import {
  upsertEntity,
  deleteEntity,
} from '@/components/dashboard/pcgroup/config/pcgroupConfigClient';
import {
  ENTITY_BASE_ROLES,
  type EntityBaseRole,
  type PCGEntityRow,
} from '@/components/dashboard/pcgroup/config/types';

type Draft = Partial<PCGEntityRow> & { code: string };

const EMPTY_DRAFT: Draft = {
  code: '',
  name: '',
  badge: '',
  base_role: 'subsidiary',
  source_type: 'manual',
  pie_color: '#1E3A5F',
  gradient: '',
  css_class: '',
  display_order: 99,
  is_active: true,
};

const NAVY = '#0F1B3D';
const GOLD = '#D4A855';

export default function AdminPCGroupEntities() {
  const navigate = useNavigate();
  const cfg = usePCGroupConfig();
  const invalidate = useInvalidatePCGroupConfig();
  const entities = useMemo(
    () => [...(cfg.data?.entities ?? [])].sort((a, b) => a.display_order - b.display_order),
    [cfg.data],
  );

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState<string | null>(null);

  const filialesCount = entities.filter((e) => e.is_active && e.base_role !== 'holding').length;
  const holdingCount = entities.filter((e) => e.is_active && e.base_role === 'holding').length;

  const handleToggleActive = async (e: PCGEntityRow, next: boolean) => {
    setSaving(e.id);
    try {
      await upsertEntity({ ...e, is_active: next });
      await invalidate();
      toast.success(`${e.name} ${next ? 'activée' : 'désactivée'}`);
    } catch (err: any) {
      toast.error(`Erreur: ${err.message ?? err}`);
    } finally {
      setSaving(null);
    }
  };

  const handleRoleChange = async (e: PCGEntityRow, role: EntityBaseRole) => {
    setSaving(e.id);
    try {
      await upsertEntity({ ...e, base_role: role });
      await invalidate();
      toast.success(`${e.name} → ${role}`);
    } catch (err: any) {
      toast.error(`Erreur: ${err.message ?? err}`);
    } finally {
      setSaving(null);
    }
  };

  const handleFieldSave = async (e: PCGEntityRow, patch: Partial<PCGEntityRow>) => {
    setSaving(e.id);
    try {
      await upsertEntity({ ...e, ...patch });
      await invalidate();
    } catch (err: any) {
      toast.error(`Erreur: ${err.message ?? err}`);
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async () => {
    if (!draft.code.trim() || !draft.name?.trim()) {
      toast.error('Code et nom requis');
      return;
    }
    setSaving('__new');
    try {
      await upsertEntity({
        ...EMPTY_DRAFT,
        ...draft,
        code: draft.code.trim().toLowerCase().replace(/\s+/g, '_'),
        display_order: draft.display_order ?? entities.length + 1,
      });
      await invalidate();
      toast.success(`Filiale « ${draft.name} » créée`);
      setDraft(EMPTY_DRAFT);
    } catch (err: any) {
      toast.error(`Erreur: ${err.message ?? err}`);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (e: PCGEntityRow) => {
    if (!confirm(`Supprimer définitivement « ${e.name} » ? Préférable : la désactiver.`)) return;
    setSaving(e.id);
    try {
      await deleteEntity(e.id);
      await invalidate();
      toast.success('Entité supprimée');
    } catch (err: any) {
      toast.error(`Erreur: ${err.message ?? err}`);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}>
      <header
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #1E3A5F 100%)`,
          color: '#fff',
          padding: '20px 32px',
          boxShadow: '0 2px 8px rgba(15,27,61,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ color: '#fff' }}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Building2 size={28} color={GOLD} />
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, margin: 0 }}>
                Filiales du groupe
              </h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
                Création, activation et rôle de base des entités du dashboard consolidé
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Composition active
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: GOLD }}>
              {filialesCount} Filiale{filialesCount > 1 ? 's' : ''} + {holdingCount} Holding
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Liste des entités */}
        <section
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: NAVY, margin: '0 0 16px' }}>
            Entités existantes ({entities.length})
          </h2>

          {entities.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: 13 }}>Aucune entité. Créez-en une ci-dessous.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                    <th style={th}>Nom</th>
                    <th style={th}>Code</th>
                    <th style={th}>Rôle de base</th>
                    <th style={th}>Source</th>
                    <th style={{ ...th, textAlign: 'center' }}>Ordre</th>
                    <th style={{ ...th, textAlign: 'center' }}>Actif</th>
                    <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map((e) => {
                    const isHolding = e.base_role === 'holding';
                    return (
                      <tr key={e.id} style={{ borderBottom: '1px solid #F1F5F9', opacity: e.is_active ? 1 : 0.5 }}>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 999, background: e.pie_color }} />
                            <strong style={{ color: NAVY }}>{e.name}</strong>
                            {isHolding && (
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${GOLD}22`, color: GOLD, fontWeight: 700 }}>
                                HOLDING
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }}>{e.code}</td>
                        <td style={td}>
                          <select
                            value={e.base_role}
                            disabled={saving === e.id}
                            onChange={(ev) => handleRoleChange(e, ev.target.value as EntityBaseRole)}
                            style={selectStyle}
                          >
                            {ENTITY_BASE_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...td, color: '#64748B' }}>{e.source_type}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <Input
                            type="number"
                            defaultValue={e.display_order}
                            disabled={saving === e.id}
                            onBlur={(ev) => {
                              const v = Number(ev.target.value);
                              if (v !== e.display_order) handleFieldSave(e, { display_order: v });
                            }}
                            style={{ width: 64, height: 30, textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <Switch
                            checked={e.is_active}
                            disabled={saving === e.id}
                            onCheckedChange={(v) => handleToggleActive(e, v)}
                          />
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving === e.id}
                            onClick={() => handleDelete(e)}
                            style={{ color: '#EF4444' }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Création */}
        <section
          style={{
            background: '#fff',
            borderRadius: 12,
            border: `1px solid ${GOLD}55`,
            padding: 20,
          }}
        >
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: NAVY, margin: '0 0 4px' }}>
            <Plus size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
            Créer une nouvelle filiale
          </h2>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>
            Le code doit être unique (ex: <code>spy</code>, <code>nowmade</code>). Le rôle de base détermine
            comment l'entité est traitée dans le consolidé (Filiale vs Holding) et son libellé.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Field label="Code (unique)">
              <Input
                value={draft.code}
                placeholder="ex: nowmade"
                onChange={(ev) => setDraft({ ...draft, code: ev.target.value })}
              />
            </Field>
            <Field label="Nom">
              <Input
                value={draft.name ?? ''}
                placeholder="ex: Nowmade JBR"
                onChange={(ev) => setDraft({ ...draft, name: ev.target.value })}
              />
            </Field>
            <Field label="Badge (optionnel)">
              <Input
                value={draft.badge ?? ''}
                placeholder="ex: Hospitality"
                onChange={(ev) => setDraft({ ...draft, badge: ev.target.value })}
              />
            </Field>
            <Field label="Rôle de base">
              <select
                value={draft.base_role}
                onChange={(ev) => setDraft({ ...draft, base_role: ev.target.value as EntityBaseRole })}
                style={selectStyle}
              >
                {ENTITY_BASE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Source">
              <select
                value={draft.source_type}
                onChange={(ev) => setDraft({ ...draft, source_type: ev.target.value as 'dashboard' | 'manual' })}
                style={selectStyle}
              >
                <option value="manual">Manuel (saisie BDD)</option>
                <option value="dashboard">Dashboard (entité dédiée)</option>
              </select>
            </Field>
            <Field label="Couleur (pie)">
              <Input
                type="color"
                value={draft.pie_color ?? '#1E3A5F'}
                onChange={(ev) => setDraft({ ...draft, pie_color: ev.target.value })}
                style={{ height: 38, padding: 4 }}
              />
            </Field>
            <Field label="Ordre d'affichage">
              <Input
                type="number"
                value={draft.display_order ?? entities.length + 1}
                onChange={(ev) => setDraft({ ...draft, display_order: Number(ev.target.value) })}
              />
            </Field>
            <Field label="Active dès création">
              <div style={{ display: 'flex', alignItems: 'center', height: 38 }}>
                <Switch
                  checked={draft.is_active ?? true}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                />
              </div>
            </Field>
          </div>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={handleCreate}
              disabled={saving === '__new'}
              style={{ background: GOLD, color: NAVY, fontWeight: 700 }}
            >
              <Save size={14} className="mr-2" />
              {saving === '__new' ? 'Création…' : 'Créer la filiale'}
            </Button>
          </div>
        </section>

        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 16, lineHeight: 1.6 }}>
          Astuce : préférez désactiver (toggle) plutôt que supprimer. La suppression est définitive
          et peut casser des références historiques (faits manuels, intercos).
        </p>
      </main>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 700,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid #E2E8F0',
};
const td: React.CSSProperties = { padding: '10px', verticalAlign: 'middle' };
const selectStyle: React.CSSProperties = {
  width: '100%',
  height: 34,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid #E2E8F0',
  background: '#fff',
  fontSize: 13,
  color: '#0F1B3D',
  fontFamily: 'inherit',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

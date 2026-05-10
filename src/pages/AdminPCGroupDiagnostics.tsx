import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { PCGroupValidationPanel } from '@/components/dashboard/pcgroup/PCGroupValidationPanel';
import { usePCGroupConfig } from '@/components/dashboard/pcgroup/config/usePCGroupConfig';
import { DEFAULT_TOLERANCE_USD } from '@/components/dashboard/pcgroup/pcGroupValidator';

const STORAGE_KEY = 'pcgroup-diagnostics-settings';

interface DiagSettings {
  toleranceUsd: number;
  checkMetrics: boolean;
}

const DEFAULTS: DiagSettings = {
  toleranceUsd: DEFAULT_TOLERANCE_USD,
  checkMetrics: true,
};

function loadSettings(): DiagSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<DiagSettings>;
    return {
      toleranceUsd: Math.max(0, Number(parsed.toleranceUsd ?? DEFAULTS.toleranceUsd)),
      checkMetrics: parsed.checkMetrics !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Page admin dédiée aux checks de cohérence du dashboard PCGroup consolidé.
 * Liste automatiquement : mois manquants, données entité non importées,
 * écarts entre totaux calculés et totaux figés de référence.
 * Réservée aux super admins (cf. App.tsx).
 */
export default function AdminPCGroupDiagnostics() {
  // Hydrate le store depuis Supabase pour que la validation reflète
  // la config en base (entités actives, mois disponibles, règles intercos).
  usePCGroupConfig();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<DiagSettings>(loadSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #0F1B3D 0%, #1E3A5F 100%)',
          color: '#fff',
          padding: '20px 32px',
          boxShadow: '0 2px 8px rgba(15,27,61,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              style={{ color: '#fff' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldCheck size={28} color="#D4A855" />
              <div>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, margin: 0, fontWeight: 600 }}>
                  Diagnostics PCGroup Consolidé
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: '#CBD5E1' }}>
                  Checks de cohérence automatiques sur l'agrégation multi-sources
                </p>
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: '#D4A855',
              border: '1px solid #D4A85555',
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            Super Admin
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 64px' }}>
        <section
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#0F1B3D', margin: '0 0 8px' }}>
            Comment lire ce panneau
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
            <li>
              <strong style={{ color: '#10B981' }}>OK</strong> : toutes les sources (Agency / Structuring / Digit / bloc manuel) sont importées et les totaux calculés correspondent aux références.
            </li>
            <li>
              <strong style={{ color: '#F59E0B' }}>Écarts</strong> : un ou plusieurs totaux dérivent de la référence figée — utile pour détecter une mise à jour silencieuse d'une source.
            </li>
            <li>
              <strong style={{ color: '#EF4444' }}>Manquant</strong> : aucune donnée pour ce mois, l'agrégation consolidée est impossible.
            </li>
            <li>
              Cliquez sur une ligne pour voir le détail des écarts (attendu vs calculé) et la liste des sources non importées.
            </li>
          </ul>
        </section>

        <section
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <SlidersHorizontal size={16} color="#0F1B3D" />
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#0F1B3D', margin: 0 }}>
              Paramètres de validation
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {/* Tolérance USD */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#0F1B3D' }}>
                  Tolérance d'écart
                </label>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#D4A855' }}>
                  ±${settings.toleranceUsd}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Slider
                  value={[settings.toleranceUsd]}
                  min={0}
                  max={500}
                  step={1}
                  onValueChange={([v]) => setSettings((s) => ({ ...s, toleranceUsd: v }))}
                  disabled={!settings.checkMetrics}
                  style={{ flex: 1, opacity: settings.checkMetrics ? 1 : 0.4 }}
                />
                <Input
                  type="number"
                  min={0}
                  value={settings.toleranceUsd}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, toleranceUsd: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  disabled={!settings.checkMetrics}
                  style={{ width: 90, fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '8px 0 0', lineHeight: 1.5 }}>
                Écart maximal toléré entre le total calculé et la référence figée avant de déclencher une alerte.
              </p>
            </div>

            {/* Toggle vérif métriques */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#0F1B3D' }}>
                  Vérification des métriques
                </label>
                <Switch
                  checked={settings.checkMetrics}
                  onCheckedChange={(checked) => setSettings((s) => ({ ...s, checkMetrics: checked }))}
                />
              </div>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '8px 0 0', lineHeight: 1.5 }}>
                Active la comparaison des totaux (CA, marge, résultat net, réserves) aux valeurs de référence.
                Désactivez pour ne contrôler que la présence des sources.
              </p>
              <button
                type="button"
                onClick={() => setSettings(DEFAULTS)}
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: '#64748B',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Réinitialiser les paramètres
              </button>
            </div>
          </div>
        </section>

        <PCGroupValidationPanel defaultOpen options={settings} />
      </main>
    </div>
  );
}

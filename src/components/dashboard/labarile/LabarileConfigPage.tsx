import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SCENARIOS, MONTHS_2026, type Scenario } from './LabarileData';
import { useToast } from '@/hooks/use-toast';

interface LabarileConfigPageProps {
  companyId: string;
  onScenariosUpdate: (scenarios: Record<string, Scenario>) => void;
}

const VARIANCE = 0.15;
const DEFAULT_BASE_FORECAST = [600, 600, 670, 750, 810, 870, 900, 900, 900, 1000, 1000, 1000];
const DEFAULT_COSTS = { coaches: 10, marketing: 12, admin: 10, stripe: 4.5, tools: 3, autres: 2 };

export function LabarileConfigPage({ companyId, onScenariosUpdate }: LabarileConfigPageProps) {
  const [configMonthly, setConfigMonthly] = useState<number[]>([...DEFAULT_BASE_FORECAST]);
  const [costs, setCosts] = useState({ ...DEFAULT_COSTS });
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [toast2, setToast2] = useState('');
  const { toast } = useToast();

  // Load saved config on mount
  useEffect(() => {
    loadSavedConfig();
  }, [companyId]);

  const loadSavedConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('config_key', 'labarile_scenarios');

      if (error) throw error;

      if (data && data.length > 0) {
        const config = data[0].config_value as any;
        if (config.monthly) setConfigMonthly(config.monthly);
        if (config.costs) setCosts(config.costs);
        setLastSaved(new Date(data[0].updated_at).toLocaleString('fr-FR'));

        // Apply to SCENARIOS immediately
        applyToScenarios(config.monthly || DEFAULT_BASE_FORECAST, config.costs || DEFAULT_COSTS);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const applyToScenarios = (monthly: number[], costsData: typeof DEFAULT_COSTS) => {
    const base = [...monthly];
    const low = base.map(v => Math.round(v * (1 - VARIANCE)));
    const high = base.map(v => Math.round(v * (1 + VARIANCE)));
    const totalBase = base.reduce((a, b) => a + b, 0);
    const totalLow = low.reduce((a, b) => a + b, 0);
    const totalHigh = high.reduce((a, b) => a + b, 0);
    const q4Ann = 5221;
    const calcGrowth = (t: number) => (t >= q4Ann ? '+' : '') + Math.round((t - q4Ann) / q4Ann * 100) + '%';

    const updated: Record<string, Scenario> = {
      prudent: { ...SCENARIOS.prudent, forecast2026: low, total2026: totalLow, growth: calcGrowth(totalLow), costs: { coaches: costsData.coaches, marketing: costsData.marketing, stripe: costsData.stripe, tools: costsData.tools, admin: costsData.admin } },
      base: { ...SCENARIOS.base, forecast2026: base, total2026: totalBase, growth: calcGrowth(totalBase), costs: { coaches: costsData.coaches, marketing: costsData.marketing, stripe: costsData.stripe, tools: costsData.tools, admin: costsData.admin } },
      optimiste: { ...SCENARIOS.optimiste, forecast2026: high, total2026: totalHigh, growth: calcGrowth(totalHigh), costs: { coaches: costsData.coaches, marketing: costsData.marketing, stripe: costsData.stripe, tools: costsData.tools, admin: costsData.admin } },
    };

    Object.assign(SCENARIOS, updated);
    onScenariosUpdate(updated);
  };

  const showToast = (msg: string) => {
    setToast2(msg);
    setTimeout(() => setToast2(''), 3500);
  };

  const totalBase = configMonthly.reduce((a, b) => a + b, 0);
  const totalLow = configMonthly.map(v => Math.round(v * (1 - VARIANCE))).reduce((a, b) => a + b, 0);
  const totalHigh = configMonthly.map(v => Math.round(v * (1 + VARIANCE))).reduce((a, b) => a + b, 0);

  const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
  const ebitda = 100 - totalCosts;
  const ebitdaAmount = Math.round(ebitda / 100 * totalBase);

  const handleMonthChange = (idx: number, value: number) => {
    const newMonthly = [...configMonthly];
    newMonthly[idx] = value;
    setConfigMonthly(newMonthly);
  };

  const handleCostChange = (key: string, value: number) => {
    setCosts(prev => ({ ...prev, [key]: value }));
  };

  const applyScenarios = () => {
    applyToScenarios(configMonthly, costs);
    showToast(`✅ Scénarios appliqués — Base: ${totalBase.toLocaleString()}k | Faible: ${totalLow.toLocaleString()}k | Élevé: ${totalHigh.toLocaleString()}k AED`);
  };

  const saveToDatabase = async () => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const configValue = { monthly: configMonthly, costs };

      const { error } = await supabase
        .from('dashboard_configs')
        .upsert({
          company_id: companyId,
          config_key: 'labarile_scenarios',
          config_value: configValue as any,
          updated_by: user.user?.id || null,
        }, { onConflict: 'company_id,config_key' });

      if (error) throw error;

      // Also apply to live scenarios
      applyToScenarios(configMonthly, costs);
      setLastSaved(new Date().toLocaleString('fr-FR'));
      toast({ title: '✅ Configuration enregistrée', description: 'Les modifications sont visibles par tous les utilisateurs.' });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({ title: 'Erreur', description: "Impossible d'enregistrer la configuration", variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetScenarios = () => {
    setConfigMonthly([...DEFAULT_BASE_FORECAST]);
    setCosts({ ...DEFAULT_COSTS });
    showToast('↩ Valeurs réinitialisées');
  };

  const costSliders = [
    { key: 'coaches', label: 'Coaches', color: 'bg-labarile-warning', min: 0, max: 30, step: 0.5 },
    { key: 'marketing', label: 'Marketing', color: 'bg-labarile-primary', min: 0, max: 25, step: 0.5 },
    { key: 'admin', label: 'Admin', color: 'bg-labarile-success', min: 0, max: 25, step: 0.5 },
    { key: 'stripe', label: 'Stripe/Fees', color: 'bg-amber-400', min: 0, max: 10, step: 0.5 },
    { key: 'tools', label: 'IT & Outils', color: 'bg-purple-500', min: 0, max: 10, step: 0.5 },
    { key: 'autres', label: 'Autres', color: 'bg-gray-400', min: 0, max: 10, step: 0.5 },
  ];

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-4 border-labarile-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* Apply Banner - Temporary */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bebas text-xl text-white tracking-wide">👁️ Prévisualiser (session uniquement)</h3>
          <p className="text-xs text-white/80 mt-1">
            Applique les modifications aux graphiques et commentaires. <strong>Non sauvegardé</strong> — les changements disparaissent si vous quittez.
          </p>
        </div>
        <button
          onClick={applyScenarios}
          className="px-6 py-3 bg-white text-emerald-700 rounded-lg font-bold text-sm hover:bg-white/90 transition-opacity flex items-center gap-2 shrink-0"
        >
          👁️ Appliquer (temporaire)
        </button>
      </div>

      {/* Save Banner - Persistent */}
      <div className="bg-gradient-to-r from-labarile-primary to-labarile-primary-dark rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bebas text-xl text-white tracking-wide">💾 Enregistrer définitivement</h3>
          <p className="text-xs text-white/80 mt-1">
            {lastSaved ? `Dernière sauvegarde : ${lastSaved}` : 'Aucune configuration enregistrée'} — Les modifications seront visibles pour tous les utilisateurs, même après déconnexion.
          </p>
        </div>
        <button
          onClick={saveToDatabase}
          disabled={saving}
          className="px-6 py-3 bg-white text-labarile-primary-dark rounded-lg font-bold text-sm hover:bg-white/90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-labarile-primary border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>💾 Enregistrer pour tous</>
          )}
        </button>
      </div>

      {/* SECTION 1: Revenue Scenarios */}
      <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-5">
          <div>
            <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-1 tracking-wide">📈 Scénarios de Chiffre d'Affaires 2026</h3>
            <p className="text-xs text-labarile-muted">Définissez le scénario Base mois par mois. Les scénarios Faible (−15%) et Élevé (+15%) sont calculés automatiquement.</p>
          </div>
          <div className="flex items-end gap-2 shrink-0">
            <div>
              <label className="text-[11px] font-semibold text-labarile-muted uppercase mb-1 block">Augmentation globale</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  id="global-pct"
                  defaultValue={0}
                  min={-50} max={200} step={1}
                  className="w-20 px-2 py-1.5 border border-labarile-border rounded-md font-bebas text-lg text-labarile-primary text-right bg-labarile-white focus:outline-none focus:border-labarile-primary"
                />
                <span className="text-sm font-bold text-labarile-muted">%</span>
              </div>
            </div>
            <button
              onClick={() => {
                const input = document.getElementById('global-pct') as HTMLInputElement;
                const pct = parseFloat(input?.value || '0');
                if (pct === 0) return;
                const factor = 1 + pct / 100;
                setConfigMonthly(prev => prev.map(v => Math.round(v * factor)));
                showToast(`✅ CA ajusté de ${pct > 0 ? '+' : ''}${pct}% sur tous les mois`);
                if (input) input.value = '0';
              }}
              className="px-3 py-1.5 bg-labarile-primary text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Appliquer
            </button>
          </div>
        </div>

        {/* Monthly Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
          {MONTHS_2026.map((month, idx) => {
            const low = Math.round(configMonthly[idx] * (1 - VARIANCE));
            const high = Math.round(configMonthly[idx] * (1 + VARIANCE));
            return (
              <div key={idx} className="bg-labarile-light-gray rounded-lg p-3 border border-labarile-border">
                <p className="text-[11px] font-semibold text-labarile-muted uppercase mb-1.5">{month} 2026</p>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={configMonthly[idx]}
                    onChange={(e) => handleMonthChange(idx, parseInt(e.target.value) || 0)}
                    min={0} max={5000} step={10}
                    className="w-full px-2 py-1.5 border border-labarile-border rounded-md font-bebas text-lg text-labarile-primary text-right bg-labarile-white focus:outline-none focus:border-labarile-primary"
                  />
                  <span className="text-[11px] text-labarile-muted">k</span>
                </div>
                <div className="flex justify-between mt-1.5 text-[10px]">
                  <span className="text-labarile-warning">−15%: {low}k</span>
                  <span className="text-labarile-success">+15%: {high}k</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recap Table */}
        <div className="bg-labarile-ice1 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-labarile-primary-dark mb-3">Récapitulatif automatique des 3 scénarios</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-labarile-primary text-white">
                  <th className="px-2 py-2 text-left">Mois</th>
                  <th className="px-2 py-2 text-right text-orange-200">📉 Faible</th>
                  <th className="px-2 py-2 text-right">📊 Base</th>
                  <th className="px-2 py-2 text-right text-emerald-200">📈 Élevé</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS_2026.map((month, idx) => {
                  const base = configMonthly[idx];
                  const low = Math.round(base * (1 - VARIANCE));
                  const high = Math.round(base * (1 + VARIANCE));
                  return (
                    <tr key={idx} className="border-b border-labarile-border">
                      <td className="px-2 py-1.5 font-medium">{month}</td>
                      <td className="px-2 py-1.5 text-right text-labarile-warning">{low.toLocaleString()}k</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-labarile-primary">{base.toLocaleString()}k</td>
                      <td className="px-2 py-1.5 text-right text-labarile-success">{high.toLocaleString()}k</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-labarile-primary text-white font-bold">
                  <td className="px-2 py-2">TOTAL 2026</td>
                  <td className="px-2 py-2 text-right text-orange-200">{totalLow.toLocaleString()}k AED</td>
                  <td className="px-2 py-2 text-right">{totalBase.toLocaleString()}k AED</td>
                  <td className="px-2 py-2 text-right text-emerald-200">{totalHigh.toLocaleString()}k AED</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={applyScenarios} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            👁️ Appliquer (temporaire)
          </button>
          <button onClick={resetScenarios} className="px-5 py-2.5 bg-labarile-white text-labarile-muted border border-labarile-border rounded-lg text-sm hover:bg-labarile-light-gray transition-colors">
            ↩ Réinitialiser
          </button>
        </div>
      </div>

      {/* SECTION 2: Cost Structure */}
      <div className="bg-labarile-white border-2 border-blue-500 rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-blue-600 mb-1 tracking-wide">💰 Structure de Charges (% du CA)</h3>
        <p className="text-xs text-labarile-muted mb-5">Ajustez la part de chaque poste en % du CA. L'EBITDA est calculé automatiquement.</p>

        <div className="space-y-4 mb-5">
          {costSliders.map((slider) => (
            <div key={slider.key} className="flex items-center gap-4">
              <label className="w-28 text-sm font-medium text-labarile-title">{slider.label}</label>
              <input
                type="range"
                min={slider.min} max={slider.max} step={slider.step}
                value={(costs as any)[slider.key]}
                onChange={(e) => handleCostChange(slider.key, parseFloat(e.target.value))}
                className="flex-1 h-2 rounded-full accent-labarile-primary cursor-pointer"
              />
              <span className="w-14 text-right text-sm font-bold text-labarile-primary">{(costs as any)[slider.key]}%</span>
            </div>
          ))}
        </div>

        {/* Visual Bar */}
        <div className="mb-4">
          <div className="flex h-8 rounded-lg overflow-hidden">
            {costSliders.map((slider) => (
              <div
                key={slider.key}
                className={`${slider.color} transition-all duration-300`}
                style={{ width: `${(costs as any)[slider.key]}%` }}
                title={`${slider.label}: ${(costs as any)[slider.key]}%`}
              />
            ))}
            <div className="flex-1 bg-emerald-100" title={`EBITDA: ${ebitda.toFixed(1)}%`} />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-labarile-light-gray rounded-lg">
            <p className="text-xs text-labarile-muted">Total Charges</p>
            <p className="font-bebas text-xl text-labarile-warning">{totalCosts.toFixed(1)}%</p>
          </div>
          <div className="text-center p-3 bg-labarile-light-gray rounded-lg">
            <p className="text-xs text-labarile-muted">EBITDA</p>
            <p className={`font-bebas text-xl ${ebitda >= 50 ? 'text-labarile-success' : ebitda >= 35 ? 'text-amber-500' : 'text-red-500'}`}>
              {ebitda.toFixed(1)}%
            </p>
          </div>
          <div className="text-center p-3 bg-labarile-light-gray rounded-lg">
            <p className="text-xs text-labarile-muted">EBITDA Montant</p>
            <p className="font-bebas text-xl text-labarile-primary">{ebitdaAmount.toLocaleString()}k</p>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={applyScenarios}
          className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-bold text-base hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
        >
          👁️ Appliquer (temporaire)
        </button>
        <button
          onClick={saveToDatabase}
          disabled={saving}
          className="px-8 py-3.5 bg-gradient-to-r from-labarile-primary to-labarile-primary-dark text-white rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>💾 Enregistrer définitivement</>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast2 && (
        <div className="fixed bottom-6 right-6 bg-labarile-text text-white px-5 py-3 rounded-xl text-sm shadow-lg z-50 animate-fade-in max-w-sm">
          {toast2}
        </div>
      )}
    </div>
  );
}

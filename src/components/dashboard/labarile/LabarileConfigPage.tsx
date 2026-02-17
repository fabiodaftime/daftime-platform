import { useState, useCallback } from 'react';
import { SCENARIOS, MONTHS_2026, type Scenario } from './LabarileData';

interface LabarileConfigPageProps {
  onScenariosUpdate: (scenarios: Record<string, Scenario>) => void;
}

const VARIANCE = 0.15;
const DEFAULT_BASE_FORECAST = [600, 600, 670, 750, 810, 870, 900, 900, 900, 1000, 1000, 1000];
const DEFAULT_COSTS = { coaches: 10, marketing: 12, admin: 10, stripe: 4.5, tools: 3, autres: 2 };

export function LabarileConfigPage({ onScenariosUpdate }: LabarileConfigPageProps) {
  const [configMonthly, setConfigMonthly] = useState<number[]>([...DEFAULT_BASE_FORECAST]);
  const [costs, setCosts] = useState({ ...DEFAULT_COSTS });
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
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
    const base = [...configMonthly];
    const low = base.map(v => Math.round(v * (1 - VARIANCE)));
    const high = base.map(v => Math.round(v * (1 + VARIANCE)));
    const q4Ann = 5221;
    const calcGrowth = (t: number) => (t >= q4Ann ? '+' : '') + Math.round((t - q4Ann) / q4Ann * 100) + '%';

    const updated: Record<string, Scenario> = {
      prudent: { ...SCENARIOS.prudent, forecast2026: low, total2026: totalLow, growth: calcGrowth(totalLow), costs: { coaches: costs.coaches, marketing: costs.marketing, stripe: costs.stripe, tools: costs.tools, admin: costs.admin } },
      base: { ...SCENARIOS.base, forecast2026: base, total2026: totalBase, growth: calcGrowth(totalBase), costs: { coaches: costs.coaches, marketing: costs.marketing, stripe: costs.stripe, tools: costs.tools, admin: costs.admin } },
      optimiste: { ...SCENARIOS.optimiste, forecast2026: high, total2026: totalHigh, growth: calcGrowth(totalHigh), costs: { coaches: costs.coaches, marketing: costs.marketing, stripe: costs.stripe, tools: costs.tools, admin: costs.admin } },
    };

    Object.assign(SCENARIOS, updated);
    onScenariosUpdate(updated);
    showToast(`✅ Scénarios mis à jour — Base: ${totalBase.toLocaleString()}k | Faible: ${totalLow.toLocaleString()}k | Élevé: ${totalHigh.toLocaleString()}k AED`);
  };

  const resetScenarios = () => {
    setConfigMonthly([...DEFAULT_BASE_FORECAST]);
    showToast('↩ Valeurs réinitialisées');
  };

  const applyCosts = () => {
    const updated = { ...costs };
    ['prudent', 'base', 'optimiste'].forEach(s => {
      SCENARIOS[s].costs = { coaches: updated.coaches, marketing: updated.marketing, stripe: updated.stripe, tools: updated.tools, admin: updated.admin };
    });
    showToast(`✅ Structure de charges appliquée — EBITDA cible: ${ebitda.toFixed(1)}%`);
  };

  const resetCosts = () => {
    setCosts({ ...DEFAULT_COSTS });
    showToast('↩ Charges réinitialisées');
  };

  const costSliders = [
    { key: 'coaches', label: 'Coaches', color: 'bg-labarile-warning', min: 0, max: 30, step: 0.5 },
    { key: 'marketing', label: 'Marketing', color: 'bg-labarile-primary', min: 0, max: 25, step: 0.5 },
    { key: 'admin', label: 'Admin', color: 'bg-labarile-success', min: 0, max: 25, step: 0.5 },
    { key: 'stripe', label: 'Stripe/Fees', color: 'bg-amber-400', min: 0, max: 10, step: 0.5 },
    { key: 'tools', label: 'IT & Outils', color: 'bg-purple-500', min: 0, max: 10, step: 0.5 },
    { key: 'autres', label: 'Autres', color: 'bg-gray-400', min: 0, max: 10, step: 0.5 },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* SECTION 1: Revenue Scenarios */}
      <div className="bg-labarile-white border-2 border-labarile-primary rounded-xl p-5 lg:p-7">
        <h3 className="font-bebas text-xl lg:text-2xl text-labarile-primary mb-1 tracking-wide">📈 Scénarios de Chiffre d'Affaires 2026</h3>
        <p className="text-xs text-labarile-muted mb-5">Définissez le scénario Base mois par mois. Les scénarios Faible (−15%) et Élevé (+15%) sont calculés automatiquement.</p>

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
                <tr className="bg-labarile-primary text-labarile-white">
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
                <tr className="bg-labarile-primary text-labarile-white font-bold">
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
          <button onClick={applyScenarios} className="px-5 py-2.5 bg-labarile-primary text-labarile-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            ✅ Appliquer aux graphiques
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

        <div className="flex flex-wrap gap-3">
          <button onClick={applyCosts} className="px-5 py-2.5 bg-blue-600 text-labarile-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            ✅ Appliquer aux graphiques
          </button>
          <button onClick={resetCosts} className="px-5 py-2.5 bg-labarile-white text-labarile-muted border border-labarile-border rounded-lg text-sm hover:bg-labarile-light-gray transition-colors">
            ↩ Réinitialiser
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-labarile-text text-labarile-white px-5 py-3 rounded-xl text-sm shadow-lg z-50 animate-fade-in max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

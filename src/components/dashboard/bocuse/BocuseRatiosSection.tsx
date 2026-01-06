import { BocuseKPICard } from './BocuseKPICard';

const HIDDEN_COSTS = [
  {
    title: 'Frais Bancaires & CB',
    amount: '127 932 AED',
    percent: '2,1% du CA',
    description: 'Commission CB élevée (~3% sur paiements). Négocier avec la banque ou diversifier les moyens de paiement.',
  },
  {
    title: 'IT & Outils Digitaux',
    amount: '266 664 AED',
    percent: '4,3% du CA',
    description: 'Ratio élevé pour la restauration. Auditer les abonnements SaaS et licences.',
  },
  {
    title: 'Prime Location (Loyer)',
    amount: '1 511 682 AED',
    percent: '24,5% du CA',
    description: 'Emplacement premium Abu Dhabi. Compenser par volume de ventes et positionnement haut de gamme.',
  },
];

export function BocuseRatiosSection() {
  return (
    <div className="space-y-8">
      {/* Ratios de Rentabilité */}
      <div>
        <h3 className="font-playfair text-xl text-white mb-4 pb-2 border-b-2 border-bocuse-red inline-block">
          Ratios de Rentabilité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <BocuseKPICard
            label="Marge Brute"
            value="72,3%"
            subtext="Benchmark : 65-75%"
            badge="Excellent"
            variant="success"
          />
          <BocuseKPICard
            label="Marge EBITDA"
            value="15,7%"
            subtext="Avant amortissements"
          />
          <BocuseKPICard
            label="Marge Opérationnelle"
            value="14,1%"
            subtext="EBIT / CA"
          />
          <BocuseKPICard
            label="Marge Nette"
            value="12,0%"
            subtext="Objectif atteint"
            variant="success"
          />
        </div>
      </div>

      {/* Ratios Opérationnels */}
      <div>
        <h3 className="font-playfair text-xl text-white mb-4 pb-2 border-b-2 border-bocuse-red inline-block">
          Ratios Opérationnels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BocuseKPICard
            label="Loyer / CA"
            value="24,5%"
            subtext="Benchmark : 8-12%"
            badge="Attention"
            variant="warning"
          />
          <BocuseKPICard
            label="Masse Salariale / CA"
            value="21,9%"
            subtext="Benchmark : 25-35%"
            badge="Optimisé"
            variant="success"
          />
          <BocuseKPICard
            label="Food Cost"
            value="27,7%"
            subtext="Benchmark : 28-35%"
            badge="Excellent"
            variant="success"
          />
        </div>
      </div>

      {/* Coûts Cachés Alert */}
      <div className="bg-red-500/15 border border-bocuse-red rounded-xl p-5">
        <h4 className="text-red-400 font-semibold mb-2">⚠️ Coûts Cachés Identifiés</h4>
        <p className="text-bocuse-gray text-sm mb-4">
          Plusieurs postes de charges méritent une attention particulière car ils peuvent impacter significativement la rentabilité :
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HIDDEN_COSTS.map((cost) => (
            <div key={cost.title} className="bg-bocuse-card/50 rounded-lg p-4">
              <h5 className="text-white font-medium">{cost.title}</h5>
              <p className="text-bocuse-red font-bold text-lg">{cost.amount}</p>
              <p className="text-red-400 text-sm">{cost.percent}</p>
              <p className="text-bocuse-gray text-xs mt-2">{cost.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const EXPENSE_CATEGORIES = [
  { category: 'COGS (Matières premières)', amount: 1715592, percent: 27.7, monthly: 171559, observation: '✅ Food cost maîtrisé' },
  { category: 'Loyer', amount: 1511682, percent: 24.5, monthly: 151168, observation: '⚠️ Charge fixe élevée' },
  { category: 'Masse salariale', amount: 1351428, percent: 21.9, monthly: 135143, observation: '✅ Conforme au marché' },
  { category: 'IT & Télécom', amount: 266664, percent: 4.3, monthly: 26666, observation: '⚠️ À optimiser' },
  { category: 'Utilities', amount: 143982, percent: 2.3, monthly: 14398, observation: '✅ Normal' },
  { category: 'Frais bancaires & CB', amount: 127932, percent: 2.1, monthly: 12793, observation: '⚠️ Coût caché significatif' },
  { category: 'Marketing', amount: 89622, percent: 1.4, monthly: 8962, observation: '📈 Potentiel à développer' },
];

export function BocuseExpenseTable() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-5 shadow-xl border border-white/10 mt-6">
      <h3 className="font-playfair text-xl text-white mb-4 pb-2 border-b-2 border-bocuse-red inline-block">
        Détail par Catégorie
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bocuse-darker">
              <th className="text-left text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Catégorie</th>
              <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Montant (AED)</th>
              <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">% du CA</th>
              <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Mensuel Moyen</th>
              <th className="text-left text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Observation</th>
            </tr>
          </thead>
          <tbody>
            {EXPENSE_CATEGORIES.map((row) => (
              <tr 
                key={row.category} 
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-white font-medium">{row.category}</td>
                <td className="py-3 px-4 text-right text-white font-semibold">{formatCurrency(row.amount)}</td>
                <td className="py-3 px-4 text-right text-red-400">{row.percent}%</td>
                <td className="py-3 px-4 text-right text-bocuse-gray">{formatCurrency(row.monthly)}</td>
                <td className="py-3 px-4 text-bocuse-gray">{row.observation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

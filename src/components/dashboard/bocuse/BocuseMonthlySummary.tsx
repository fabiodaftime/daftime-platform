interface MonthlyData {
  month: string;
  revenue: number;
  grossMargin?: number;
  netIncome: number;
  netMarginPct: number;
}

interface BocuseMonthlySummaryProps {
  data: MonthlyData[];
}

export function BocuseMonthlySummary({ data }: BocuseMonthlySummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-5 shadow-xl border border-white/10">
      <h3 className="text-white font-medium mb-4">📋 Synthèse Mensuelle</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bocuse-darker">
              <th className="text-left text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Mois</th>
              <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">CA</th>
              <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Marge Brute</th>
              <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Résultat Net</th>
              <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Marge Nette</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={row.month} 
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-white font-medium">{row.month}</td>
                <td className="py-3 px-4 text-right text-white">{formatCurrency(row.revenue)}</td>
                <td className="py-3 px-4 text-right text-white">{formatCurrency(row.grossMargin || row.revenue * 0.723)}</td>
                <td className="py-3 px-4 text-right text-green-400">{formatCurrency(row.netIncome)}</td>
                <td className="py-3 px-4 text-right text-bocuse-gray">{row.netMarginPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

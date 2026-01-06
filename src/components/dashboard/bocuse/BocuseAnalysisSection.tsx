const MARKET_ANALYSIS = [
  {
    icon: '🌍',
    title: 'Contexte Économique',
    description: 'Abu Dhabi connaît une croissance soutenue du secteur F&B portée par :',
    points: [
      'Diversification économique post-pétrole',
      'Tourisme en hausse (+15% en 2024)',
      'Expatriés à fort pouvoir d\'achat',
      'Événements majeurs (F1, concerts, expositions)',
    ],
  },
  {
    icon: '🍽️',
    title: 'Segment Gastronomique',
    description: 'Le fine dining français bénéficie d\'un positionnement privilégié :',
    points: [
      'Clientèle locale aisée et expatriés européens',
      'Ticket moyen élevé accepté (200-400 AED/pers)',
      'Demande pour expériences authentiques',
      'Concurrence limitée sur le segment brasserie chic',
    ],
  },
  {
    icon: '📈',
    title: 'Forces de Bocuse Abu Dhabi',
    description: 'Atouts différenciants sur le marché :',
    points: [
      'Marque iconique – Héritage Paul Bocuse',
      'Marge brute excellente (72,3%)',
      'Food cost maîtrisé (27,7%)',
      'Concept éprouvé – Réplication du modèle Lyon',
    ],
  },
  {
    icon: '⚠️',
    title: 'Points de Vigilance',
    description: 'Défis identifiés à adresser :',
    points: [
      'Saisonnalité forte – Creux estival majeur',
      'Loyer premium – 24,5% du CA',
      'Dépendance tourisme – Volatilité potentielle',
      'Recrutement – Talents culinaires français',
    ],
  },
];

const RECOMMENDATIONS = [
  {
    title: '📅 Court Terme (6 mois)',
    items: [
      'Offres estivales : Brunch climatisé, happy hour, menu déjeuner business',
      'Négociation bancaire : Réduire les commissions CB de 3% à 2%',
      'Audit IT : Rationaliser les abonnements (économie potentielle : 50K AED)',
      'Marketing digital : Augmenter budget de 1,4% à 3% du CA',
    ],
  },
  {
    title: '🎯 Moyen Terme (12-24 mois)',
    items: [
      'Diversification : Catering corporate et événementiel privé',
      'Fidélisation : Programme VIP pour résidents',
      'Partenariats : Hôtels 5★, compagnies aériennes (First Class)',
      'Extension : Terrasse couverte climatisée pour l\'été',
    ],
  },
];

const PROJECTIONS = [
  { indicator: 'Chiffre d\'Affaires', current: '6 182 746', projected: '7 419 295', target: '8 900 000', growth: '+20%' },
  { indicator: 'Marge Brute', current: '72,3%', projected: '72,3%', target: '73,5%', growth: '+1,2pt' },
  { indicator: 'Marge Nette', current: '12,0%', projected: '12,0%', target: '14,0%', growth: '+2pt' },
  { indicator: 'Résultat Net', current: '741 929', projected: '890 315', target: '1 246 000', growth: '+40%' },
];

export function BocuseAnalysisSection() {
  return (
    <div className="space-y-8">
      {/* Context Box */}
      <div className="bg-green-500/15 border border-green-500 rounded-xl p-5">
        <h4 className="text-green-400 font-semibold mb-2">🚀 Contexte : Ouverture Récente</h4>
        <p className="text-bocuse-gray text-sm">
          La Brasserie Bocuse Abu Dhabi est un établissement en phase de lancement, bénéficiant de la notoriété 
          internationale de la marque Paul Bocuse. Ces données représentent les 10 premiers mois d'exploitation 
          (Jan-Oct 2025), période cruciale pour établir la clientèle et optimiser les opérations.
        </p>
      </div>

      {/* Market Analysis */}
      <div>
        <h3 className="font-playfair text-xl text-white mb-4 pb-2 border-b-2 border-bocuse-red inline-block">
          Analyse du Marché F&B à Abu Dhabi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MARKET_ANALYSIS.map((item) => (
            <div key={item.title} className="bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-5 border border-white/10">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <span>{item.icon}</span>
                {item.title}
              </h4>
              <p className="text-bocuse-gray text-sm mb-3">{item.description}</p>
              <ul className="text-bocuse-gray text-sm space-y-1">
                {item.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-bocuse-red">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="font-playfair text-xl text-white mb-4 pb-2 border-b-2 border-bocuse-red inline-block">
          Recommandations Stratégiques
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RECOMMENDATIONS.map((rec) => (
            <div key={rec.title} className="bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-5 border border-white/10">
              <h4 className="text-white font-medium mb-3">{rec.title}</h4>
              <ul className="text-bocuse-gray text-sm space-y-2">
                {rec.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-bocuse-red">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Projections Table */}
      <div>
        <h3 className="font-playfair text-xl text-white mb-4 pb-2 border-b-2 border-bocuse-red inline-block">
          Projection & Objectifs
        </h3>
        <div className="bg-gradient-to-br from-bocuse-card to-bocuse-light rounded-2xl p-5 border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bocuse-darker">
                <th className="text-left text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Indicateur</th>
                <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">2025 (10 mois)</th>
                <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">2025 Projeté (12 mois)</th>
                <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Objectif 2026</th>
                <th className="text-right text-white font-medium uppercase text-xs tracking-wide py-3 px-4">Croissance</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTIONS.map((row) => (
                <tr key={row.indicator} className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-3 px-4 text-white font-medium">{row.indicator}</td>
                  <td className="py-3 px-4 text-right text-bocuse-gray">{row.current}</td>
                  <td className="py-3 px-4 text-right text-white">{row.projected}</td>
                  <td className="py-3 px-4 text-right text-white font-semibold">{row.target}</td>
                  <td className="py-3 px-4 text-right text-green-400 font-semibold">{row.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conclusion */}
      <div className="bg-green-500/15 border border-green-500 rounded-xl p-5">
        <h4 className="text-green-400 font-semibold mb-2">✅ Conclusion</h4>
        <p className="text-bocuse-gray text-sm">
          Malgré un loyer élevé (typique des emplacements premium Abu Dhabi), la Brasserie Bocuse affiche des 
          fondamentaux solides : marge brute excellente, food cost maîtrisé, et marge nette de 12% atteinte 
          dès la première année. Les principaux leviers de croissance résident dans le lissage de la saisonnalité 
          et l'optimisation des coûts IT/bancaires. Le positionnement haut de gamme et la marque Bocuse constituent 
          des atouts majeurs sur un marché F&B en expansion.
        </p>
      </div>
    </div>
  );
}

interface RichissimeHeaderProps {
  title: string;
  subtitle: string;
  scenario: string;
  onScenarioChange: (scenario: string) => void;
}

export function RichissimeHeader({
  title,
  subtitle,
  scenario,
  onScenarioChange
}: RichissimeHeaderProps) {
  return (
    <header className="bg-white px-6 lg:px-10 py-5 border-b border-richissime-border sticky top-0 z-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="pl-12 lg:pl-0">
          <h2 className="font-playfair text-xl lg:text-2xl text-richissime-navy font-semibold">
            {title}
          </h2>
          <p className="text-[11px] text-richissime-muted mt-1 font-medium tracking-wider uppercase">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-richissime-success-light text-richissime-success">
            ● Live
          </span>
          <select
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="px-4 py-2.5 border-2 border-richissime-gold rounded-lg font-montserrat text-xs font-medium bg-white text-richissime-navy cursor-pointer focus:outline-none focus:ring-2 focus:ring-richissime-gold/50"
          >
            <option value="base">Scénario Base</option>
            <option value="prudent">Scénario Prudent</option>
            <option value="optimiste">Scénario Optimiste</option>
          </select>
        </div>
      </div>
    </header>
  );
}

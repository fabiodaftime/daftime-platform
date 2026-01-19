import { SCENARIOS } from './LabarileData';

interface LabarileHeaderProps {
  title: string;
  subtitle: string;
  scenario: string;
  onScenarioChange: (scenario: string) => void;
  period: string;
  onPeriodChange: (period: string) => void;
}

export function LabarileHeader({
  title,
  subtitle,
  scenario,
  onScenarioChange,
  period,
  onPeriodChange
}: LabarileHeaderProps) {
  return (
    <header className="bg-labarile-white border-b border-labarile-border sticky top-0 z-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 lg:px-10 py-4 lg:py-5 gap-4">
        <div className="ml-10 lg:ml-0">
          <h2 className="font-bebas text-xl lg:text-[28px] tracking-wide text-labarile-title">
            {title}
          </h2>
          <p className="text-xs lg:text-[13px] text-labarile-muted mt-1">{subtitle}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="px-3 lg:px-4 py-2 lg:py-2.5 border-[1.5px] border-labarile-border rounded-lg font-inter text-sm bg-labarile-white cursor-pointer hover:border-labarile-primary transition-colors focus:outline-none focus:border-labarile-primary"
          >
            <option value="base">Scénario Base</option>
            <option value="prudent">Scénario Prudent</option>
            <option value="optimiste">Scénario Optimiste</option>
          </select>
          
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="px-3 lg:px-4 py-2 lg:py-2.5 border-[1.5px] border-labarile-border rounded-lg font-inter text-sm bg-labarile-white cursor-pointer hover:border-labarile-primary transition-colors focus:outline-none focus:border-labarile-primary"
          >
            <option value="q4-2025">Q4 2025</option>
            <option value="2025">Année 2025</option>
            <option value="2026">Projection 2026</option>
          </select>
        </div>
      </div>
    </header>
  );
}

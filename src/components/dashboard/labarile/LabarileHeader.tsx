import { Calendar, Sparkles } from 'lucide-react';

interface LabarileHeaderProps {
  title: string;
  subtitle: string;
}

export function LabarileHeader({ title, subtitle }: LabarileHeaderProps) {
  return (
    <header className="relative bg-gradient-to-r from-labarile-white via-labarile-white to-labarile-ice1/40 border-b border-labarile-border sticky top-0 z-50 backdrop-blur-sm">
      {/* gradient underline */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-labarile-primary/40 to-transparent" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 lg:px-10 py-4 lg:py-5 gap-4">
        <div className="ml-10 lg:ml-0 flex items-start gap-3">
          <div className="hidden lg:flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-labarile-primary-dark to-labarile-primary shadow-lg shadow-labarile-primary/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bebas text-xl lg:text-[28px] tracking-wide text-labarile-title leading-tight">
              {title}
            </h2>
            <p className="text-xs lg:text-[13px] text-labarile-muted mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-labarile-ice1/70 border border-labarile-primary/20 text-xs text-labarile-primary-dark font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          Réel YTD 2026 · Jan → Avr
        </div>
      </div>
    </header>
  );
}

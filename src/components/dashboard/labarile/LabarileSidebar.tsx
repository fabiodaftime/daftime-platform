import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import labarileLogo from '@/assets/labarile-logo.png';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface LabarileSidebarProps {
  companyName: string;
  logoUrl?: string | null;
  navItems: NavItem[];
  activePage: string;
  onPageChange: (page: string) => void;
  onBack: () => void;
  onClose?: () => void;
}

export function LabarileSidebar({
  companyName,
  logoUrl,
  navItems,
  activePage,
  onPageChange,
  onBack,
  onClose,
}: LabarileSidebarProps) {
  return (
    <aside className="h-full w-[260px] lg:w-[280px] bg-gradient-to-b from-labarile-white via-labarile-white to-labarile-ice1/30 border-r border-labarile-border flex flex-col">
      {/* Logo Section */}
      <div className="p-4 lg:p-6 border-b border-labarile-border flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-labarile-ice1 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-labarile-muted" />
        </button>

        <div className="flex-1 flex justify-center lg:justify-start">
          <img
            src={labarileLogo}
            alt="Labarile Coaching"
            className="h-10 lg:h-12 w-auto object-contain"
          />
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-labarile-ice1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-labarile-muted" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-auto space-y-1">
        {navItems.map((item) => {
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'group relative w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-left rounded-xl transition-all duration-200 text-sm',
                isActive
                  ? 'bg-gradient-to-r from-labarile-primary-dark to-labarile-primary text-white font-semibold shadow-md shadow-labarile-primary/30'
                  : 'text-labarile-text hover:bg-labarile-ice1/70 hover:translate-x-0.5',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg text-base transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-labarile-ice1 text-labarile-primary-dark group-hover:bg-labarile-ice2',
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-labarile-border">
        <div className="flex items-center justify-center gap-2 text-xs text-labarile-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-labarile-success animate-pulse" />
          Daftime Advisory · 2026
        </div>
      </div>
    </aside>
  );
}

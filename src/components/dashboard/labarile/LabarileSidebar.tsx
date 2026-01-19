import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <aside className="h-full w-[260px] lg:w-[280px] bg-labarile-white border-r border-labarile-border flex flex-col">
      {/* Logo Section */}
      <div className="p-4 lg:p-6 border-b border-labarile-border flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-labarile-ice1 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-labarile-muted" />
        </button>
        
        {/* Logo Icon */}
        <div className="w-10 h-10 lg:w-[50px] lg:h-[50px] bg-labarile-primary rounded-xl flex items-center justify-center">
          <span className="font-bebas text-lg lg:text-2xl text-white">LB</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h1 className="font-bebas text-lg lg:text-[22px] text-labarile-primary tracking-wider truncate">
            LABARILE
          </h1>
          <p className="text-[10px] lg:text-[11px] text-labarile-muted font-medium uppercase tracking-wide">
            Coaching Excellence
          </p>
        </div>

        {/* Mobile Close Button */}
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
      <nav className="flex-1 py-4 overflow-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 lg:px-5 py-3 lg:py-3.5 text-left border-l-[3px] border-transparent transition-all text-sm",
                isActive 
                  ? "bg-gradient-to-r from-labarile-ice1 to-labarile-ice2 border-l-labarile-primary text-labarile-primary-dark font-semibold"
                  : "text-labarile-text hover:bg-labarile-ice1"
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-labarile-border">
        <p className="text-xs text-labarile-muted text-center">
          Dashboard Financier © 2025
        </p>
      </div>
    </aside>
  );
}

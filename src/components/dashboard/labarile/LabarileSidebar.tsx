import { ArrowLeft, Building2, X } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
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
    <aside className="h-full w-[260px] bg-labarile-white border-r border-labarile-border flex flex-col">
      {/* Logo Section */}
      <div className="p-5 border-b border-labarile-border flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-labarile-ice1 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-labarile-muted" />
        </button>
        
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="h-10 w-auto" />
        ) : (
          <div className="w-10 h-10 bg-labarile-ice1 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-labarile-primary-dark" />
          </div>
        )}
        
        <span className="font-semibold text-labarile-text truncate flex-1">{companyName}</span>

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
        <p className="px-5 py-2 text-[10px] uppercase tracking-widest text-labarile-muted font-semibold">
          Navigation
        </p>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-3 text-left border-l-[3px] border-transparent transition-all",
                isActive 
                  ? "bg-gradient-to-r from-labarile-ice1 to-labarile-white border-l-labarile-primary text-labarile-primary-dark font-semibold"
                  : "text-labarile-text-secondary hover:bg-labarile-ice1"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
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

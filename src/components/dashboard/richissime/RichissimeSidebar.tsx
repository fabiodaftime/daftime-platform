import { ArrowLeft, X } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface RichissimeSidebarProps {
  companyName: string;
  logoUrl: string | null;
  navItems: NavItem[];
  activePage: string;
  onPageChange: (page: string) => void;
  onBack: () => void;
  onClose?: () => void;
}

export function RichissimeSidebar({
  companyName,
  logoUrl,
  navItems,
  activePage,
  onPageChange,
  onBack,
  onClose
}: RichissimeSidebarProps) {
  return (
    <aside className="w-[260px] h-screen bg-gradient-to-b from-richissime-navy-dark to-richissime-navy overflow-y-auto flex flex-col">
      {/* Close button for mobile */}
      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-white/60 hover:text-richissime-gold"
        >
          <X size={20} />
        </button>
      )}

      {/* Logo */}
      <div className="p-7 border-b border-richissime-gold/20 text-center">
        <div className="font-playfair text-[26px] font-bold text-richissime-gold tracking-[3px]">
          Richissime
        </div>
        <div className="text-[9px] text-richissime-gold-light font-medium uppercase tracking-[4px] mt-1 opacity-80">
          Money & Mindset
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5">
        <div className="text-[9px] text-white/40 uppercase tracking-[2px] px-6 py-2 mt-3">
          Analyse
        </div>
        {navItems.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`
              w-full flex items-center gap-3 px-6 py-3 text-xs font-medium
              border-l-[3px] transition-all duration-300
              ${activePage === item.id
                ? 'bg-gradient-to-r from-richissime-gold/15 to-transparent border-l-richissime-gold text-richissime-gold font-semibold'
                : 'border-l-transparent text-white/60 hover:bg-richissime-gold/10 hover:text-richissime-gold-light'
              }
            `}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="text-[9px] text-white/40 uppercase tracking-[2px] px-6 py-2 mt-3">
          Détails
        </div>
        {navItems.slice(3, 6).map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`
              w-full flex items-center gap-3 px-6 py-3 text-xs font-medium
              border-l-[3px] transition-all duration-300
              ${activePage === item.id
                ? 'bg-gradient-to-r from-richissime-gold/15 to-transparent border-l-richissime-gold text-richissime-gold font-semibold'
                : 'border-l-transparent text-white/60 hover:bg-richissime-gold/10 hover:text-richissime-gold-light'
              }
            `}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="text-[9px] text-white/40 uppercase tracking-[2px] px-6 py-2 mt-3">
          Stratégie
        </div>
        {navItems.slice(6).map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`
              w-full flex items-center gap-3 px-6 py-3 text-xs font-medium
              border-l-[3px] transition-all duration-300
              ${activePage === item.id
                ? 'bg-gradient-to-r from-richissime-gold/15 to-transparent border-l-richissime-gold text-richissime-gold font-semibold'
                : 'border-l-transparent text-white/60 hover:bg-richissime-gold/10 hover:text-richissime-gold-light'
              }
            `}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Back Button */}
      <div className="p-4 border-t border-richissime-gold/20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-richissime-gold transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Retour</span>
        </button>
      </div>
    </aside>
  );
}

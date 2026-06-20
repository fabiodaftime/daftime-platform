// Shell applicatif Daftime : header de marque (logo, titre, utilisateur, déconnexion)
// + conteneur de contenu. Réutilisé par les pages du nouveau front.
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';

export function AppShell({
  title,
  onBack,
  actions,
  children,
  maxWidth = 'max-w-6xl',
}: {
  title?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const doSignOut = async () => { await signOut(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-sm">
        <div className={`${maxWidth} mx-auto px-6 h-16 flex items-center gap-3`}>
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground hover:bg-white/10 -ml-2 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <img src={daftimeLogo} alt="Daftime" className="h-[22px] w-auto brightness-0 invert shrink-0" />
          {title && (
            <div className="font-medium text-sm md:text-base border-l border-white/20 pl-3 truncate">{title}</div>
          )}
          <div className="flex-1" />
          {actions && <div className="flex items-center gap-2">{actions}</div>}
          {user && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:block text-sm text-primary-foreground/70 max-w-[180px] truncate">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={doSignOut} title="Déconnexion" className="text-primary-foreground hover:bg-white/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className={`${maxWidth} mx-auto px-6 py-8`}>{children}</main>
    </div>
  );
}

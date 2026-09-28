// Shell applicatif Daftime (front v2) : barre du haut translucide (logo, titre, menu utilisateur) et, si la page
// fournit une navigation, un menu latéral fin sur ordinateur + une barre d'onglets en bas sur mobile (façon app).
// Le style v2 (`.v2`, index.css) ne s'applique qu'aux pages qui utilisent ce shell.
import { useState, type ComponentType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, MoreHorizontal, X } from 'lucide-react';
import daftimeLogo from '@/assets/daftime-logo-trans.png';
import { StaffCommand } from './StaffCommand';

const STAFF_ROLES = ['admin', 'manager', 'collaborateur', 'super_admin'];

export interface ShellNavItem { key: string; label: string; short?: string; icon: ComponentType<{ className?: string }>; badge?: boolean } // short : libellé de la barre mobile

export function AppShell({
  title, onBack, actions, children, maxWidth = 'max-w-6xl',
  nav, active, onNav, aside,
}: {
  title?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  nav?: ShellNavItem[];                 // navigation de la page (optionnelle)
  active?: string;
  onNav?: (key: string) => void;
  aside?: ReactNode;                    // contenu sous le menu latéral (ex. carte du conseiller)
}) {
  const navigate = useNavigate();
  const { user, signOut, roles } = useAuth();
  const isStaff = (roles ?? []).some((r: { role: string }) => STAFF_ROLES.includes(r.role));
  const [menu, setMenu] = useState(false);
  const [more, setMore] = useState(false);
  const doSignOut = async () => { await signOut(); navigate('/auth'); };
  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase();

  // Mobile : 4 onglets visibles, le reste dans « Plus ».
  const primary = nav ? (nav.length > 5 ? nav.slice(0, 4) : nav) : [];
  const overflow = nav && nav.length > 5 ? nav.slice(4) : [];
  const moreActive = overflow.some((n) => n.key === active);

  return (
    <div className="v2 min-h-screen">
      <header className="glass sticky top-0 z-30 border-b">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 h-16 flex items-center gap-3`}>
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 shrink-0" aria-label="Retour"><ArrowLeft className="w-4 h-4" /></Button>
          )}
          <img src={daftimeLogo} alt="Daftime" className="h-[20px] w-auto shrink-0" />
          {title && <div className="font-medium text-sm md:text-[15px] border-l pl-3 truncate text-foreground/90">{title}</div>}
          <div className="flex-1" />
          {isStaff && <StaffCommand />}
          {/* Actions des pages : écrites pour l'ancienne barre bleu nuit (texte blanc) → recolorées pour la barre claire. */}
          {actions && (
            <div className="flex items-center gap-2 [&_button:hover]:bg-muted [&_.text-emerald-300]:text-[hsl(var(--good))] [&_select]:border [&_input]:border"
              style={{ ['--primary-foreground' as string]: '236 42% 13%' }}>{actions}</div>
          )}
          {user && (
            <div className="relative shrink-0">
              <button onClick={() => setMenu((m) => !m)} aria-label="Mon compte" aria-expanded={menu}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold grid place-items-center ring-2 ring-background hover:ring-accent/60 transition">
                {initials}
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.16 }}
                    className="surface absolute right-0 mt-2 w-64 p-2 z-40" onMouseLeave={() => setMenu(false)}>
                    <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
                    <button onClick={doSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition"><LogOut className="w-4 h-4" /> Se déconnecter</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {nav && nav.length ? (
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 pt-6 pb-28 lg:pb-10 grid grid-cols-1 lg:grid-cols-[228px_1fr] gap-8`}>
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <nav className="space-y-0.5" aria-label="Sections">
                {nav.map((item) => {
                  const on = item.key === active;
                  return (
                    <button key={item.key} onClick={() => onNav?.(item.key)} aria-current={on ? 'page' : undefined}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${on ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'}`}>
                      {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-lg bg-card shadow-[var(--shadow-card)] border" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                      <item.icon className="relative w-4 h-4 shrink-0" />
                      <span className="relative">{item.label}</span>
                      {item.badge && <span className="relative ml-auto h-2 w-2 rounded-full bg-accent shadow-[0_0_0_3px_hsl(var(--accent)/0.25)]" />}
                    </button>
                  );
                })}
              </nav>
              {aside}
            </div>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      ) : (
        <main className={`${maxWidth} mx-auto px-4 sm:px-6 py-8`}>{children}</main>
      )}

      {/* Barre d'onglets mobile */}
      {nav && nav.length > 0 && (
        <nav className="lg:hidden glass fixed bottom-0 inset-x-0 z-30 border-t pb-[env(safe-area-inset-bottom)]" aria-label="Sections">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${primary.length + (overflow.length ? 1 : 0)}, minmax(0, 1fr))` }}>
            {primary.map((item) => {
              const on = item.key === active;
              return (
                <button key={item.key} onClick={() => onNav?.(item.key)} aria-current={on ? 'page' : undefined}
                  className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10.5px] ${on ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {on && <motion.span layoutId="tab-dot" className="absolute top-0 h-[3px] w-8 rounded-b-full bg-accent" />}
                  <span className="relative"><item.icon className="w-5 h-5" />{item.badge && <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-accent" />}</span>
                  <span className="truncate max-w-full px-1">{item.short ?? item.label}</span>
                </button>
              );
            })}
            {overflow.length > 0 && (
              <button onClick={() => setMore(true)} className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10.5px] ${moreActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {moreActive && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-accent" />}
                <MoreHorizontal className="w-5 h-5" /> Plus
              </button>
            )}
          </div>
        </nav>
      )}
      <AnimatePresence>
        {more && (
          <>
            <motion.div className="lg:hidden fixed inset-0 z-40 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)} />
            <motion.div className="lg:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
              <div className="flex items-center justify-between mb-2"><span className="eyebrow">Plus</span><button onClick={() => setMore(false)} aria-label="Fermer" className="p-1"><X className="w-4 h-4" /></button></div>
              {overflow.map((item) => (
                <button key={item.key} onClick={() => { onNav?.(item.key); setMore(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm ${item.key === active ? 'bg-muted font-medium' : 'hover:bg-muted'}`}>
                  <item.icon className="w-4 h-4" /> {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

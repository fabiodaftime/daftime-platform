// Recherche rapide de l'équipe (Ctrl/⌘ + K) : sauter au dossier d'un client, à sa vue client, ou aux pages
// principales. Clients chargés à la première ouverture (liste légère : id, nom, activité).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Building2, Eye, Home, Search, Users } from 'lucide-react';

type C = { id: string; name: string; activity_types?: { name?: string } | null };

export function StaffCommand() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<C[] | null>(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!open || clients) return;
    (async () => {
      const { data } = await supabase.from('clients' as any).select('id, name, activity_types:activity_type_id(name)').order('name');
      setClients(((data as unknown) as C[]) ?? []);
    })();
  }, [open, clients]);

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 h-9 pl-3 pr-2 rounded-lg border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition shadow-[var(--shadow-card)]">
        <Search className="w-4 h-4" /> Rechercher un client
        <kbd className="ml-3 font-mono text-[10.5px] px-1.5 py-0.5 rounded border bg-muted">{isMac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      <button onClick={() => setOpen(true)} className="md:hidden h-9 w-9 grid place-items-center rounded-lg hover:bg-muted" aria-label="Rechercher"><Search className="w-4 h-4" /></button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Un client, une page…" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>{clients ? 'Aucun résultat.' : 'Chargement…'}</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => go('/')}><Home className="mr-2" /> Accueil équipe</CommandItem>
            <CommandItem onSelect={() => go('/admin/clients')}><Users className="mr-2" /> Tous les clients</CommandItem>
          </CommandGroup>
          {clients && clients.length > 0 && (
            <CommandGroup heading="Clients">
              {clients.map((c) => (
                <CommandItem key={c.id} value={`${c.name} ${c.activity_types?.name ?? ''}`} onSelect={() => go(`/admin/clients/${c.id}`)}>
                  <Building2 className="mr-2" />
                  <span className="flex-1 truncate">{c.name}</span>
                  {c.activity_types?.name && <span className="text-xs text-muted-foreground mr-2">{c.activity_types.name}</span>}
                  <button onClick={(e) => { e.stopPropagation(); go(`/client/${c.id}`); }} title="Voir comme le client"
                    className="p-1 rounded hover:bg-muted text-muted-foreground"><Eye className="!w-4 !h-4" /></button>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Helpers partagés pour la zone "clients génériques" (pipeline IA — Phase 3).
import { supabase } from '@/integrations/supabase/client';

/** Invoque une edge function et remonte proprement le message d'erreur serveur. */
export async function invokeFn<T = any>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let msg = error.message ?? 'Erreur';
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      }
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data && (data as any).error) throw new Error((data as any).error);
  return data as T;
}

/** Lit un fichier en base64 (sans le préfixe data:...;base64,). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const comma = res.indexOf(',');
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Mois courant au format 'YYYY-MM-01'. */
export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export const DASHBOARD_STATUSES = ['a_traiter', 'draft_ia', 'revue', 'valide', 'supervision', 'publie'] as const;
export type DashboardStatus = (typeof DASHBOARD_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  a_traiter: 'À traiter',
  draft_ia: 'Brouillon IA',
  revue: 'En revue',
  valide: 'Validé',
  supervision: 'Supervision',
  publie: 'Publié',
};

/** Supprime un client : purge ses fichiers Storage puis la ligne clients (cascade DB). */
export async function deleteClient(clientId: string): Promise<void> {
  const { data: fileRows } = await supabase.from('files' as any).select('storage_path').eq('client_id', clientId);
  const paths = ((fileRows as any[]) ?? []).map((f) => f.storage_path).filter(Boolean);
  if (paths.length) await supabase.storage.from('client-files').remove(paths);
  const { error } = await supabase.from('clients' as any).delete().eq('id', clientId);
  if (error) throw error;
}

/** Journalise un événement dans activity_log (RLS : actor = utilisateur courant). */
export async function logActivity(
  clientId: string,
  action: string,
  opts?: { entity_type?: string; entity_id?: string; metadata?: unknown },
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('activity_log' as any).insert({
    actor_user_id: user?.id ?? null,
    client_id: clientId,
    action,
    entity_type: opts?.entity_type ?? null,
    entity_id: opts?.entity_id ?? null,
    metadata: opts?.metadata ?? {},
  });
}

/** Décale un 'YYYY-MM-01' de N mois. */
export function shiftPeriod(period: string, deltaMonths: number): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Libellé lisible d'une période ('YYYY-MM-01' → 'juin 2026'). */
export function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

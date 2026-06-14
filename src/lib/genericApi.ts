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

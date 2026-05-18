import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LabarileCategory } from './LabarileMapping';

export interface AccountRow {
  account: string;
  amount: number;
  category: LabarileCategory | 'revenue' | 'unmapped';
}

/**
 * Récupère le détail compte-par-compte d'un mois Labarile (table labarile_pl_accounts).
 * Retourne [] si rien n'a encore été importé pour ce mois.
 */
export function useLabarileAccounts(year: number, month: number) {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await (supabase as any)
        .from('labarile_pl_accounts')
        .select('account,amount,category')
        .eq('year', year)
        .eq('month', month)
        .order('amount', { ascending: false });
      if (cancelled) return;
      if (error) {
        console.warn('[useLabarileAccounts]', error.message);
        setRows([]);
      } else {
        setRows((data as AccountRow[]) ?? []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [year, month]);

  return { rows, loading };
}

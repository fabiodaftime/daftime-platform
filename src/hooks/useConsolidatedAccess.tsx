import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PC_GROUP_CONSOLIDATED_ID = 'c12ecc1f-7f17-4bb6-83c2-d182413f687e';

export function useConsolidatedAccess() {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Try to query the consolidated company — RLS will block if no access
        const { data, error } = await supabase
          .from('companies')
          .select('id')
          .eq('id', PC_GROUP_CONSOLIDATED_ID)
          .maybeSingle();

        setHasAccess(!!data && !error);
      } catch {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  return { hasAccess, loading, consolidatedId: PC_GROUP_CONSOLIDATED_ID };
}

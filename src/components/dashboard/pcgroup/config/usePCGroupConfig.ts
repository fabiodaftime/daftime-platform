// Hook React Query qui charge la config PCGroup depuis Supabase et hydrate
// le store singleton. Tous les consommateurs (getMonthData, MANUAL_ENTITIES,
// ENTITY_META) lisent automatiquement les nouvelles valeurs.

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPCGroupConfig } from './pcgroupConfigClient';
import { setPCGroupConfig } from './configStore';
import type { PCGroupConfig } from './types';

export const PCGROUP_CONFIG_QUERY_KEY = ['pcgroup-config'] as const;

export function usePCGroupConfig() {
  const query = useQuery<PCGroupConfig>({
    queryKey: PCGROUP_CONFIG_QUERY_KEY,
    queryFn: fetchPCGroupConfig,
    staleTime: 30_000,
  });

  // Hydrate le store dès qu'on a des données fraîches.
  useEffect(() => {
    if (query.data) {
      setPCGroupConfig(query.data);
    }
  }, [query.data]);

  return query;
}

/** Helper à appeler après une mutation pour forcer un refresh du dashboard. */
export function useInvalidatePCGroupConfig() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PCGROUP_CONFIG_QUERY_KEY });
}

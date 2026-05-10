// Hook réactif qui re-rend le composant à chaque mutation du store PCGroup.
// À utiliser dans les vues/dashboard pour refléter en live les modifications
// admin (entités, mois, règles, données manuelles).

import { useSyncExternalStore } from 'react';
import { getPCGroupConfig, subscribePCGroupConfig } from './configStore';
import type { PCGroupConfig } from './types';

export function useLivePCGroupConfig(): PCGroupConfig {
  return useSyncExternalStore(subscribePCGroupConfig, getPCGroupConfig, getPCGroupConfig);
}

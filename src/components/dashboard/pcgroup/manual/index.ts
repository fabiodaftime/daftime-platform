// Aggregates per-month manual files into the maps consumed by the aggregator.
// To add a new month: create `YYYY-MM.ts` and import it here.

import type { PCGSourceMonthId } from '../sources/entityAdapters';
import type {
  IntercoCashBlock,
  ManualMonthExtras,
  ManualMonthFile,
} from './types';

import JAN_2026 from './2026-01';
import FEB_2026 from './2026-02';
import MAR_2026 from './2026-03';
import APR_2026 from './2026-04';
import MAY_2026 from './2026-05';

const MONTH_FILES: ManualMonthFile[] = [JAN_2026, FEB_2026, MAR_2026, APR_2026, MAY_2026];

export const MANUAL_ENTITIES: Partial<Record<PCGSourceMonthId, ManualMonthExtras>> =
  Object.fromEntries(MONTH_FILES.map((f) => [f.monthId, f.extras])) as Partial<
    Record<PCGSourceMonthId, ManualMonthExtras>
  >;

export const INTERCOS_CASH: Partial<Record<PCGSourceMonthId, IntercoCashBlock>> =
  Object.fromEntries(MONTH_FILES.map((f) => [f.monthId, f.intercosCash])) as Partial<
    Record<PCGSourceMonthId, IntercoCashBlock>
  >;

export type {
  ManualEntityFacts,
  ManualHoldingBlock,
  ManualMonthExtras,
  IntercoCashBlock,
  ManualMonthFile,
} from './types';

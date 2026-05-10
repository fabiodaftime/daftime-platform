// Backward-compat shim. The source of truth now lives in `manual/YYYY-MM.ts`
// (one file per month) and is aggregated by `manual/index.ts`.
//
// Existing imports continue to work:
//   import { MANUAL_ENTITIES, INTERCOS_CASH, ... } from './manualEntities';

export {
  MANUAL_ENTITIES,
  INTERCOS_CASH,
} from './manual';

export type {
  ManualEntityFacts,
  ManualHoldingBlock,
  ManualMonthExtras,
  IntercoCashBlock,
} from './manual';

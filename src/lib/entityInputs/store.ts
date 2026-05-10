// Singleton in-memory store for entity inputs, mirrored from Supabase.
// The consolidated PCGroup aggregator runs synchronously, so adapters need
// a sync read path; this store is hydrated by `useEntityInputsSync` and
// queried by `getEntityInput()` from anywhere.

type Inputs = Record<string, number>;
type Store = Record<string /* layout */, Record<string /* monthId */, Inputs>>;

let state: Store = {};
const listeners = new Set<() => void>();

export function setEntityInputsLayout(layout: string, byMonth: Record<string, Inputs>) {
  state = { ...state, [layout]: byMonth };
  for (const l of listeners) l();
}

export function getEntityInput(layout: string, monthId: string): Inputs | null {
  return state[layout]?.[monthId] ?? null;
}

export function subscribeEntityInputs(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function snapshotEntityInputs(): Store {
  return state;
}

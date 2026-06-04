// Canonical input schemas per entity layout.
// These are the SOURCE OF TRUTH for the figures displayed on the entity
// dashboards AND consumed by the consolidated PCGroup view. Every other
// number (margins, %, totals, YTD, comparatifs) is DERIVED from these.

import { z } from 'zod';

// ---- Digit ----
// Headline + per-product (Core / SPY / Comment) inputs. Costs detail will be
// extended in Phase 2; for now we keep the cost displayed as static fallback.
export const digitInputsSchema = z.object({
  // Headline
  ca_total: z.number().nonnegative(),
  marge_total: z.number(),
  deals_total: z.number().int().nonnegative(),
  // Per product
  ca_core: z.number().nonnegative().default(0),
  marge_core: z.number().default(0),
  ca_spy: z.number().nonnegative().default(0),
  marge_spy: z.number().default(0),
  ca_comment: z.number().nonnegative().default(0),
  marge_comment: z.number().default(0),
});

export type DigitInputs = z.infer<typeof digitInputsSchema>;

// Registry: each layout → its schema + display metadata (used by the saisie UI).
export interface FieldMeta {
  key: string;
  label: string;
  group: string;
  unit: 'usd' | 'count' | 'pct';
}

export const DIGIT_FIELDS: FieldMeta[] = [
  { key: 'ca_total', label: 'CA Total', group: 'Headline', unit: 'usd' },
  { key: 'marge_total', label: 'Marge Totale', group: 'Headline', unit: 'usd' },
  { key: 'deals_total', label: 'Deals', group: 'Headline', unit: 'count' },
  { key: 'ca_core', label: 'CA Digit Solution (Core)', group: 'Produits', unit: 'usd' },
  { key: 'marge_core', label: 'Marge Core', group: 'Produits', unit: 'usd' },
  { key: 'ca_spy', label: 'CA SPY', group: 'Produits', unit: 'usd' },
  { key: 'marge_spy', label: 'Marge SPY', group: 'Produits', unit: 'usd' },
  { key: 'ca_comment', label: 'CA Comment/Trust', group: 'Produits', unit: 'usd' },
  { key: 'marge_comment', label: 'Marge Comment/Trust', group: 'Produits', unit: 'usd' },
];

export const ENTITY_REGISTRY = {
  digit: { schema: digitInputsSchema, fields: DIGIT_FIELDS, label: 'Digit Solution' },
} as const;

export type EntityLayoutKey = keyof typeof ENTITY_REGISTRY;

export const SUPPORTED_MONTHS = [
  { id: 'jan-2026', label: 'Janvier 2026' },
  { id: 'feb-2026', label: 'Février 2026' },
  { id: 'mar-2026', label: 'Mars 2026' },
  { id: 'apr-2026', label: 'Avril 2026' },
  { id: 'may-2026', label: 'Mai 2026' },
] as const;

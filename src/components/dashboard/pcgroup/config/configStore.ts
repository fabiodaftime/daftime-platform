// Singleton store pour la configuration PCGroup.
// - Démarre avec un défaut hardcodé (utilisé en SSR / tests / premier paint).
// - L'override BDD est appliqué dès que `usePCGroupConfig` reçoit les données.
// - Les consommateurs (getMonthData, MANUAL_ENTITIES, ENTITY_META, ...) lisent
//   via les getters de ce module — leur résultat reflète l'override en cours.

import type { PCGroupConfig } from './types';
import { EMPTY_CONFIG } from './types';

// ---------------------------------------------------------------------------
// Défaut "seed" : reproduit les anciens fichiers manual/2026-XX.ts pour que
// les tests de régression et le premier paint fonctionnent sans appel BDD.
// L'override BDD remplace ces valeurs dès qu'il est chargé.
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: PCGroupConfig = {
  entities: [
    { id: 'd-agency',      code: 'agency',      name: 'Agency',         badge: 'Media',       gradient: 'linear-gradient(135deg, #4F5BD5 0%, #6366F1 100%)', css_class: 'agency',      pie_color: '#F59E0B', source_type: 'dashboard', display_order: 1, is_active: true },
    { id: 'd-structuring', code: 'structuring', name: 'Structuring',    badge: 'Banking',     gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%)', css_class: 'structuring', pie_color: '#1E3A5F', source_type: 'dashboard', display_order: 2, is_active: true },
    { id: 'd-digit',       code: 'digit',       name: 'Digit Solution', badge: 'Ad Accounts', gradient: 'linear-gradient(135deg, #D946A8 0%, #EC4899 100%)', css_class: 'digit',       pie_color: '#4F5BD5', source_type: 'dashboard', display_order: 3, is_active: true },
    { id: 'd-spy',         code: 'spy',         name: 'SPY',            badge: 'Tools',       gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', css_class: 'spy',         pie_color: '#10B981', source_type: 'manual',    display_order: 4, is_active: true },
    { id: 'd-comment',     code: 'comment',     name: 'Comment',        badge: 'Trust',       gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', css_class: 'comment',     pie_color: '#D946A8', source_type: 'manual',    display_order: 5, is_active: true },
  ],
  months: [
    { id: 'd-jan', month_id: 'jan-2026', label: 'Janvier 2026', short_label: 'jan', year: 2026, month_num: 1, is_active: true, display_order: 1 },
    { id: 'd-feb', month_id: 'feb-2026', label: 'Février 2026', short_label: 'fév', year: 2026, month_num: 2, is_active: true, display_order: 2 },
    { id: 'd-mar', month_id: 'mar-2026', label: 'Mars 2026',    short_label: 'mar', year: 2026, month_num: 3, is_active: true, display_order: 3 },
    { id: 'd-apr', month_id: 'apr-2026', label: 'Avril 2026',   short_label: 'avr', year: 2026, month_num: 4, is_active: true, display_order: 4 },
  ],
  rules: ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'].map((m, i) => ({
    id: `d-rule-${i}`,
    month_id: m,
    reserves_pct: 10,
    remontee_pct: 90,
    maxence_pct: 37.5,
    thibault_pct: 37.5,
    florian_pct: 25,
    will_in_thibault: 10000,
  })),
  manualFacts: [
    { id: 'd-mf1', month_id: 'jan-2026', entity_code: 'spy',     ca: 16750, charges: 13488, contribution: 3262, margin_pct: 19.5, deals: 5,  warning: null },
    { id: 'd-mf2', month_id: 'jan-2026', entity_code: 'comment', ca:  2813, charges:   281, contribution: 2531, margin_pct: 90.0, deals: 20, warning: '' },
    { id: 'd-mf3', month_id: 'feb-2026', entity_code: 'spy',     ca: 27300, charges: 23741, contribution: 3559, margin_pct: 13.0, deals: 5,  warning: null },
    { id: 'd-mf4', month_id: 'feb-2026', entity_code: 'comment', ca:   333, charges:   193, contribution:  140, margin_pct: 42.0, deals: 20, warning: 'Activité en forte baisse ce mois. CA divisé par ~8 vs janvier.' },
    { id: 'd-mf5', month_id: 'mar-2026', entity_code: 'spy',     ca: 37350, charges: 33880, contribution: 3470, margin_pct:  9.3, deals: 5,  warning: null },
    { id: 'd-mf6', month_id: 'mar-2026', entity_code: 'comment', ca:   861, charges:   158, contribution:  703, margin_pct: 81.6, deals: 20, warning: 'Rebond significatif vs Février. Marge nette excellente à 81.6%.' },
    { id: 'd-mf7', month_id: 'apr-2026', entity_code: 'spy',     ca: 38450, charges: 35352, contribution: 3098, margin_pct:  8.1, deals: 5,  warning: null },
    { id: 'd-mf8', month_id: 'apr-2026', entity_code: 'comment', ca:   438, charges:   174, contribution:  264, margin_pct: 60.3, deals: 20, warning: 'Activité résiduelle. CA quasi nul vs Mars.' },
  ],
  holdingFacts: [
    { id: 'd-h1', month_id: 'jan-2026', frais_total:  7060, frais_detail: [
      { label: 'Compta + CFO Groupe', amount: 3430 },
      { label: 'Salaire Assistante', amount: 1630 },
      { label: 'Salaires Fixes Sales', amount: 2000 },
    ], apport_maxence: 0 },
    { id: 'd-h2', month_id: 'feb-2026', frais_total: 10890, frais_detail: [
      { label: 'Compta + CFO Groupe', amount: 3430 },
      { label: 'Salaire Assistante', amount: 1630 },
      { label: 'Salaires Fixes Sales', amount: 2000 },
      { label: 'Travel Expenses', amount: 3781 },
      { label: 'Bank Fees', amount: 50 },
    ], apport_maxence: 54458 },
    { id: 'd-h3', month_id: 'mar-2026', frais_total:  8378, frais_detail: [
      { label: 'CFO + Compta Groupe', amount: 3430 },
      { label: 'AI Agent', amount: 2000 },
      { label: 'Salaire Fixe Sales', amount: 2000 },
      { label: 'Tools', amount: 780 },
      { label: 'Frais Bancaires', amount: 88 },
      { label: 'Frais Paddel (non remboursés)', amount: 80 },
    ], apport_maxence: 0 },
    { id: 'd-h4', month_id: 'apr-2026', frais_total:  8298, frais_detail: [
      { label: 'CFO + Compta Groupe', amount: 3430 },
      { label: 'AI Agent', amount: 2000 },
      { label: 'Salaire Fixe Sales', amount: 2000 },
      { label: 'Tools', amount: 780 },
      { label: 'Frais Bancaires', amount: 88 },
    ], apport_maxence: 0 },
  ],
  intercosCash: [
    { id: 'd-c1',  month_id: 'jan-2026', entity_code: 'structuring', amount_received: 20000 },
    { id: 'd-c2',  month_id: 'jan-2026', entity_code: 'digit',       amount_received: 12000 },
    { id: 'd-c3',  month_id: 'jan-2026', entity_code: 'agency',      amount_received:  1500 },
    { id: 'd-c4',  month_id: 'jan-2026', entity_code: 'spy',         amount_received:  2000 },
    { id: 'd-c5',  month_id: 'jan-2026', entity_code: 'comment',     amount_received:   500 },
    { id: 'd-c6',  month_id: 'feb-2026', entity_code: 'structuring', amount_received:  1500 },
    { id: 'd-c7',  month_id: 'feb-2026', entity_code: 'digit',       amount_received:   500 },
    { id: 'd-c8',  month_id: 'feb-2026', entity_code: 'agency',      amount_received:   173 },
  ],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let CURRENT: PCGroupConfig = DEFAULT_CONFIG;
let HAS_OVERRIDE = false;

const listeners = new Set<() => void>();

export function getPCGroupConfig(): PCGroupConfig {
  return CURRENT;
}

/** True si l'override BDD a été appliqué au moins une fois. */
export function hasOverride(): boolean {
  return HAS_OVERRIDE;
}

export function setPCGroupConfig(next: PCGroupConfig): void {
  CURRENT = next;
  HAS_OVERRIDE = true;
  listeners.forEach((l) => l());
}

export function resetPCGroupConfig(): void {
  CURRENT = DEFAULT_CONFIG;
  HAS_OVERRIDE = false;
  listeners.forEach((l) => l());
}

export function subscribePCGroupConfig(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export { DEFAULT_CONFIG, EMPTY_CONFIG };

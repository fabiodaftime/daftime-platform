// Catalogue d'indicateurs par activité — désormais DATA-DRIVEN (stocké dans activity_types.config).
// Une ligne sans `formula` = input extrait par l'IA ; avec `formula` = dérivé calculé par le code.
// Les `checks` portent une expression booléenne (true = cohérent). Voir _shared/expr.ts.

import { parseExpr, evalExpr } from './expr.ts';

export interface CatalogLine {
  id: string; label: string; section: string;
  unit?: string;        // 'CUR' = devise client ; sinon littéral ('%', 'x', 'j', '')
  total?: boolean; core?: boolean; hint?: string; note?: string;
  formula?: string;     // présent => DÉRIVÉ (calculé)
}
export interface CatalogCheck { id: string; label: string; severity: 'error' | 'warn'; expr: string }
export interface Catalog { slug?: string; sections: { key: string; label: string }[]; lines: CatalogLine[]; checks: CatalogCheck[] }

// Lit un catalogue depuis activity_types.config (null si non défini / incomplet).
export function getCatalog(config: any): Catalog | null {
  if (config && Array.isArray(config.lines) && config.lines.length && Array.isArray(config.sections)) {
    return { slug: config.slug, sections: config.sections, lines: config.lines, checks: Array.isArray(config.checks) ? config.checks : [] };
  }
  return null;
}

export function inputLines(cat: Catalog): CatalogLine[] {
  return cat.lines.filter((l) => !l.formula);
}

// Calcule les dérivés (formules, par points fixes) + joue les checks, et produit la data standardisée.
export function buildStandardized(
  cat: Catalog,
  inputs: Record<string, number>,
  sources: Record<string, string>,
  currency: string,
  traces?: Record<string, { src: string; value: number }[]>,
): { data: Record<string, unknown>; flags: { id: string; label: string; severity: string }[] } {
  const v: Record<string, number> = {};
  for (const [k, val] of Object.entries(inputs)) if (typeof val === 'number' && isFinite(val)) v[k] = val;

  const derived = cat.lines.filter((l) => l.formula).map((l) => {
    try { return { l, ast: parseExpr(l.formula!) }; } catch { return { l, ast: null }; }
  });
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (const d of derived) {
      if (d.ast && v[d.l.id] == null) {
        const r = evalExpr(d.ast, v);
        if (typeof r === 'number' && isFinite(r)) { v[d.l.id] = Math.round(r * 100) / 100; changed = true; }
      }
    }
    if (!changed) break;
  }

  const sections = cat.sections.map((sec) => ({
    key: sec.key,
    label: sec.label,
    rows: cat.lines.filter((l) => l.section === sec.key && v[l.id] != null).map((l) => ({
      id: l.id, label: l.label, value: v[l.id],
      unit: l.unit === 'CUR' ? currency : (l.unit ?? ''),
      ...(l.formula ? { derived: true, formula: l.formula } : {}),
      ...(l.total ? { type: 'total' } : {}),
      ...(l.note ? { note: l.note } : {}),
      ...(sources[l.id] ? { source: sources[l.id] } : {}),
      ...(traces?.[l.id]?.length ? { trace: traces[l.id] } : {}),
    })),
  })).filter((s) => s.rows.length > 0);

  const flags = cat.checks.filter((c) => {
    try { return evalExpr(parseExpr(c.expr), v) === false; } catch { return false; }
  }).map((c) => ({ id: c.id, label: c.label, severity: c.severity }));

  return { data: { sections, flags, meta: { template: cat.slug ?? 'custom' } }, flags };
}

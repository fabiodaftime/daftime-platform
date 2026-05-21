// Tests de la vérification de cohérence des Flux Intercos.
// Vérifie : détection des écarts ligne/total/KPI + cas nominal (pas d'issue).

import { describe, it, expect } from 'vitest';
import { computeIntercos } from '../pcGroupIntercosCompute';
import { checkIntercosCoherence } from '../intercosCoherenceCheck';
import type { PCGSourceMonthId } from '../sources/entityAdapters';

const MONTHS: PCGSourceMonthId[] = ['jan-2026', 'feb-2026', 'mar-2026', 'apr-2026'];

describe('checkIntercosCoherence — calcul nominal du compute', () => {
  MONTHS.forEach((m) => {
    it(`vue ${m} : aucune incohérence détectée (compute officiel)`, () => {
      const intercos = computeIntercos(m);
      const issues = checkIntercosCoherence(intercos as any);
      expect(issues).toEqual([]);
    });
  });
});

describe('checkIntercosCoherence — détection des régressions', () => {
  const base = () => computeIntercos('apr-2026') as any;

  it('row_remaining_mismatch : reste affiché incohérent avec ytd − received', () => {
    const data = base();
    const row = data.table.rows[0];
    row.remaining = '$999,999';
    const issues = checkIntercosCoherence(data);
    expect(issues.some((i) => i.code === 'row_remaining_mismatch')).toBe(true);
  });

  it('total_ytd_mismatch : ligne TOTAL ≠ somme des lignes', () => {
    const data = base();
    data.table.total.ytd = '$1';
    const issues = checkIntercosCoherence(data);
    expect(issues.some((i) => i.code === 'total_ytd_mismatch')).toBe(true);
  });

  it('total_received_mismatch : remontées totales déconnectées des lignes', () => {
    const data = base();
    data.table.total.received = '$0';
    const issues = checkIntercosCoherence(data);
    expect(issues.some((i) => i.code === 'total_received_mismatch')).toBe(true);
  });

  it('kpi_expected_mismatch : KPI « Somme à Remonter » ne suit pas le total', () => {
    const data = base();
    const kpi = data.kpis.find((k: any) => /à\s*remonter/i.test(k.label));
    kpi.value = '$0';
    const issues = checkIntercosCoherence(data);
    expect(issues.some((i) => i.code === 'kpi_expected_mismatch')).toBe(true);
  });

  it('kpi_received_mismatch : KPI « Somme Remontée » désynchro', () => {
    const data = base();
    const kpi = data.kpis.find((k: any) => /remont[ée]e/i.test(k.label));
    kpi.value = '$1,234,567';
    const issues = checkIntercosCoherence(data);
    expect(issues.some((i) => i.code === 'kpi_received_mismatch')).toBe(true);
  });

  it('kpi_solde_mismatch : KPI « Solde » ne reflète plus max(0, attendu − remonté)', () => {
    const data = base();
    const kpi = data.kpis.find((k: any) => /solde/i.test(k.label));
    kpi.value = '$1';
    const issues = checkIntercosCoherence(data);
    expect(issues.some((i) => i.code === 'kpi_solde_mismatch')).toBe(true);
  });

  it('chaque issue rapporte un delta strictement positif et un message chiffré', () => {
    const data = base();
    data.table.rows[0].remaining = '$10';
    const issues = checkIntercosCoherence(data);
    expect(issues.length).toBeGreaterThan(0);
    issues.forEach((i) => {
      expect(i.delta).toBeGreaterThan(0);
      expect(i.message).toMatch(/\$/);
    });
  });
});

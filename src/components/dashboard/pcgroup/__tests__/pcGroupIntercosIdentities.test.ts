// Identités comptables Flux Intercos (Avril 2026).
// Garantit que KPIs, total tableau et récap restent cohérents entre eux,
// avec des écarts d'arrondi bornés (≤ 1 USD).

import { describe, it, expect } from 'vitest';
import { computeIntercos } from '../pcGroupIntercosCompute';

const parseUSD = (s: string) => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;
const TOL = 1; // USD : tolérance d'arrondi unitaire

describe('Flux Intercos — identités comptables (Avril 2026)', () => {
  const intercos = computeIntercos('apr-2026');

  const kpiToRemit = parseUSD(intercos.kpis[0].value);
  const kpiReceived = parseUSD(intercos.kpis[1].value);
  const kpiSolde = parseUSD(intercos.kpis[2].value);

  it('KPI : Solde = max(0, Somme à Remonter − Somme Remontée)', () => {
    const expected = Math.max(0, kpiToRemit - kpiReceived);
    expect(Math.abs(kpiSolde - expected)).toBeLessThanOrEqual(TOL);
  });

  it('Total tableau (ytd) = KPI Somme à Remonter', () => {
    const totalYtd = parseUSD(intercos.table.total.ytd);
    expect(Math.abs(totalYtd - kpiToRemit)).toBeLessThanOrEqual(TOL);
  });

  it('Récap : ligne "Somme à remonter" (S1 et S2) = KPI à Remonter', () => {
    const row = intercos.recap.find((r: any) => /somme à remonter/i.test(r.label));
    expect(row).toBeTruthy();
    expect(Math.abs(parseUSD(row!.s1) - kpiToRemit)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(parseUSD(row!.s2) - kpiToRemit)).toBeLessThanOrEqual(TOL);
  });

  it('Récap : ligne "Encaissements reçus" = KPI Remontée (S1 et S2)', () => {
    const row = intercos.recap.find((r: any) => /encaissements reçus/i.test(r.label));
    expect(row).toBeTruthy();
    expect(Math.abs(parseUSD(row!.s1) - kpiReceived)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(parseUSD(row!.s2) - kpiReceived)).toBeLessThanOrEqual(TOL);
  });

  it('Récap : ligne "Solde" S1 = KPI Solde ; S2 = max(0, S1 − apport)', () => {
    const recap = intercos.recap;
    const solde = recap.find((r: any) => r.label === 'Solde')!;
    const apportRow = recap.find((r: any) => /apport/i.test(r.label))!;
    const apport = Math.abs(parseUSD(apportRow.s2));

    expect(Math.abs(parseUSD(solde.s1) - kpiSolde)).toBeLessThanOrEqual(TOL);
    const expectedS2 = Math.max(0, parseUSD(solde.s1) - apport);
    expect(Math.abs(parseUSD(solde.s2) - expectedS2)).toBeLessThanOrEqual(TOL);
  });

  it('Récap : "Total fonds disponibles" S2 = Encaissements + Apport', () => {
    const recap = intercos.recap;
    const fonds = recap.find((r: any) => /total fonds disponibles/i.test(r.label))!;
    const apportRow = recap.find((r: any) => /apport/i.test(r.label))!;
    const apport = Math.abs(parseUSD(apportRow.s2));

    expect(Math.abs(parseUSD(fonds.s1) - kpiReceived)).toBeLessThanOrEqual(TOL);
    expect(Math.abs(parseUSD(fonds.s2) - (kpiReceived + apport))).toBeLessThanOrEqual(TOL);
  });

  it('Tableau : total.ytd = somme exacte des lignes (tolérance ≤ nb lignes)', () => {
    const sumRows = intercos.table.rows.reduce(
      (a: number, r: any) => a + parseUSD(r.ytd),
      0,
    );
    expect(Math.abs(parseUSD(intercos.table.total.ytd) - sumRows))
      .toBeLessThanOrEqual(intercos.table.rows.length);
  });

  it('Tableau : pour chaque ligne, ytd = somme des cellules mensuelles', () => {
    intercos.table.rows.forEach((row: any) => {
      const monthSum = intercos.table.columns.reduce(
        (a: number, c: any) => a + parseUSD(row[c.key] ?? '0'),
        0,
      );
      expect(Math.abs(parseUSD(row.ytd) - monthSum))
        .toBeLessThanOrEqual(intercos.table.columns.length);
    });
  });
});

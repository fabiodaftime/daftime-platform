import { computeDigitHoldingTransfers } from '../src/components/dashboard/digit/digitHoldingTransfers';
import { computeIntercos } from '../src/components/dashboard/pcgroup/pcGroupIntercosCompute';
import { loadPCGroupConfig } from '../src/components/dashboard/pcgroup/config/configStore';

(async () => {
  await loadPCGroupConfig();
  const d = computeDigitHoldingTransfers('may-2026' as any);
  console.log('=== DIGIT dashboard (may-2026) ===');
  d.subActivities.forEach(s => {
    console.log(`\n${s.label}: expected=${Math.round(s.totalExpected)} received=${Math.round(s.totalReceived)} remaining=${Math.round(s.totalRemaining)}`);
    s.rows.forEach(r => console.log(`  ${r.shortLabel}: margin=${Math.round(r.margin)} exp=${Math.round(r.expected)} recu=${Math.round(r.received)} bal=${Math.round(r.balance)} [${r.status}]`));
  });
  console.log(`\nTOTAL: exp=${Math.round(d.totals.expected)} recu=${Math.round(d.totals.received)} reste=${Math.round(d.totals.remaining)}`);

  const c = computeIntercos('may-2026' as any);
  console.log('\n=== CONSO Intercos table (may-2026) ===');
  c.legacyTable.rows.forEach((r: any) => {
    console.log(`${r.entity}: ytd=${r.ytd} recu=${r.received} reste=${r.remaining}`);
  });
  console.log('TOTAL:', c.legacyTable.total);
})();

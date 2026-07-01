// Migration Stage 2 — import des données legacy vides depuis l'export Lovable.
// N'importe QUE les tables actuellement vides (les pcgroup_*, revision_templates,
// expense_categories sont déjà seedées par les migrations → exclues ici).
// Idempotent (upsert onConflict id, ignoreDuplicates), ordre de FK respecté.
//
// Usage (PowerShell, depuis la racine du repo) :
//   $env:SUPABASE_URL="https://emsixhbnlvnhpfleecln.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role>"
//   node scripts/migration/3-import-legacy.mjs "C:\Users\fabvi\Downloads\supabase-export"

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import Papa from 'papaparse';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DIR = process.argv[2] ?? 'C:\\Users\\fabvi\\Downloads\\supabase-export';

if (!URL || !KEY) { console.error('❌ Définis $env:SUPABASE_URL et $env:SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const sb = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// Ordre = parents avant enfants. `json` = colonnes jsonb à parser.
const TABLES = [
  { name: 'dataroom_documents' },
  { name: 'labarile_pl_accounts' },
  { name: 'labarile_monthly_pl' },
  { name: 'monthly_financials' },
  { name: 'monthly_expenses' },
  { name: 'dashboard_configs', json: ['config_value'] },
  { name: 'dashboard_comments' },
  { name: 'entity_data_mappings', json: ['field_map', 'month_map'] },
  { name: 'entity_monthly_inputs', json: ['inputs'] },
  { name: 'entity_input_edits_log', json: ['old_value', 'new_value'] },
  { name: 'revision_entities' },
  { name: 'revision_files' },
  { name: 'revision_cycles' },
  { name: 'revision_checklist_items' },
  { name: 'revision_lead_schedules' },
  { name: 'revision_anomalies' },
  { name: 'revision_audit_log', json: ['payload'] },
  { name: 'revision_comments' }, // self-FK parent_id → trié par created_at
];

function normalizeRow(r, jsonCols) {
  const o = {};
  for (const [k, v] of Object.entries(r)) {
    if (v === '' || v === undefined) { o[k] = null; continue; }
    if (jsonCols?.includes(k)) {
      try { o[k] = typeof v === 'string' ? JSON.parse(v) : v; } catch { o[k] = v; }
    } else o[k] = v;
  }
  return o;
}

for (const t of TABLES) {
  const file = join(DIR, `${t.name}.csv`);
  if (!existsSync(file)) { console.log(`— ${t.name}: CSV absent, ignoré`); continue; }
  const csv = readFileSync(file, 'utf8');
  const parsed = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
  let rows = parsed.data.map((r) => normalizeRow(r, t.json));
  if (t.name === 'revision_comments') {
    rows = rows.sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
  }
  if (rows.length === 0) { console.log(`— ${t.name}: vide`); continue; }

  let ok = 0, fail = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error } = await sb.from(t.name).upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (!error) { ok += batch.length; continue; }
    for (const row of batch) {
      const { error: e2 } = await sb.from(t.name).upsert(row, { onConflict: 'id', ignoreDuplicates: true });
      if (e2) { fail++; if (fail <= 3) console.log(`   FAIL ${t.name}: ${e2.message}`); } else ok++;
    }
  }
  console.log(`✓ ${t.name}: ${ok} importé(s)${fail ? `, ${fail} échec(s)` : ''}`);
}
console.log('\nImport legacy terminé.');

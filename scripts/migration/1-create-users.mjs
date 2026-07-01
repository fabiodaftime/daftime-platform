// Migration one-shot : recrée les comptes auth depuis l'export Lovable,
// en PRÉSERVANT les UUID (critique pour que profiles/user_roles restent liés).
//
// Le mot de passe n'est PAS transféré (hashs non exportables) → chaque user
// le redéfinira ensuite via un email de réinitialisation (script 2).
//
// Usage (PowerShell, depuis la racine du repo) :
//   $env:SUPABASE_URL="https://emsixhbnlvnhpfleecln.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<ta clé service_role — reste chez toi>"
//   node scripts/migration/1-create-users.mjs "C:\Users\fabvi\Downloads\auth-users-export.json"
//
// La clé service_role se trouve dans : Dashboard Supabase → Project Settings → API → service_role.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jsonPath = process.argv[2] ?? 'auth-users-export.json';

if (!URL || !KEY) {
  console.error('❌ Définis d\'abord $env:SUPABASE_URL et $env:SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const { users } = JSON.parse(readFileSync(jsonPath, 'utf8'));

let ok = 0, skip = 0, fail = 0;
for (const u of users) {
  const { error } = await sb.auth.admin.createUser({
    id: u.id,                              // ← UUID préservé
    email: u.email,
    email_confirm: !!u.email_confirmed_at, // marque l'email comme confirmé
    user_metadata: u.user_metadata ?? {},
    app_metadata: u.app_metadata ?? {},
  });
  if (!error) { ok++; console.log('OK   ', u.email); }
  else if (/already|exists|registered|duplicate/i.test(error.message)) { skip++; console.log('SKIP ', u.email, '(existe déjà)'); }
  else { fail++; console.log('FAIL ', u.email, '→', error.message); }
}
console.log(`\nTerminé : ${ok} créés, ${skip} déjà présents, ${fail} échecs.`);

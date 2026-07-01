// Définit un mot de passe pour UN utilisateur, pour se connecter immédiatement
// (sans email de réinitialisation). Pratique pour ton propre compte admin.
//
// Usage (PowerShell, depuis la racine du repo) :
//   $env:SUPABASE_URL="https://emsixhbnlvnhpfleecln.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<ta clé service_role>"
//   node scripts/migration/2-set-password.mjs fabio@daftime.ae "MonMotDePasse123!"

import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password] = process.argv.slice(2);

if (!URL || !KEY) { console.error('❌ Définis $env:SUPABASE_URL et $env:SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
if (!email || !password) { console.error('Usage: node scripts/migration/2-set-password.mjs <email> <motdepasse>'); process.exit(1); }

const sb = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: list, error: e1 } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (e1) { console.error('❌', e1.message); process.exit(1); }

const u = list.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
if (!u) { console.error('❌ Utilisateur introuvable :', email); process.exit(1); }

const { error } = await sb.auth.admin.updateUserById(u.id, { password });
console.log(error ? '❌ ' + error.message : `✅ Mot de passe défini pour ${email}. Tu peux te connecter.`);

#!/usr/bin/env node
// Déploie les edge functions PLATFORM-ONLY via l'API Management Supabase (la CLI n'est pas requise).
//   node scripts/deploy-edge-functions.mjs --changed <base-sha>   → seulement celles touchées depuis <base-sha>
//   node scripts/deploy-edge-functions.mjs standardize-data chat-standardize
//   ajouter --dry pour lister sans déployer.
// Env : SUPABASE_ACCESS_TOKEN (PAT), SUPABASE_PROJECT_REF (défaut : projet partagé).
//
// Garde-fous (backend PARTAGÉ avec la prod Lovable) :
//  - liste blanche explicite ; `sync-gsheet-to-inputs` (seule fonction commune avec Lovable) exclue ;
//  - verify_jwt figé par fonction (= config en prod) → un déploiement ne change jamais l'auth ;
//  - une modif de _shared redéploie les fonctions qui l'importent (dépendances suivies transitivement) ;
//  - chaque fonction déployée est appelée ensuite : un worker qui ne démarre pas fait échouer le job.
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const REF = process.env.SUPABASE_PROJECT_REF || "emsixhbnlvnhpfleecln";
const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const FN_DIR = path.join(ROOT, "supabase", "functions");

// slug → verify_jwt (relevé en prod). Absent = jamais déployé par ce script.
const PLATFORM = {
  "generate-dashboard": true, "standardize-data": true, "chat-standardize": true, "chat-iterate": true,
  "extract-context": true, "extract-brand": true, "client-chat": true, "template-recompute": true,
  "distill-feedback": true, "restyle-dashboard": true, "dashboard-chat": true, "map-sku-costs": true, "bank-rules": true,
  "nango-connect-session": true, "nango-webhook": false, "ingest-records": false,
};
const FORBIDDEN = new Set(["sync-gsheet-to-inputs"]);

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const ci = args.indexOf("--changed");

const importsOf = (file) => {
  const src = readFileSync(file, "utf8");
  return [...src.matchAll(/from\s+["'](\.{1,2}\/[^"']+\.ts)["']/g)].map((m) => path.resolve(path.dirname(file), m[1]));
};
// Fichiers locaux dont dépend une fonction (index.ts + _shared, transitivement).
const depsOf = (slug) => {
  const seen = new Set(), stack = [path.join(FN_DIR, slug, "index.ts")];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f) || !existsSync(f)) continue;
    seen.add(f); stack.push(...importsOf(f));
  }
  return seen;
};

let slugs;
if (ci >= 0) {
  const base = args[ci + 1];
  let changed = [];
  try {
    changed = execSync(`git diff --name-only ${base} HEAD -- supabase/functions`, { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
  } catch { console.log(`Base ${base} introuvable (premier push ?) → rien à déployer automatiquement.`); process.exit(0); }
  const abs = new Set(changed.map((f) => path.resolve(ROOT, f)));
  slugs = Object.keys(PLATFORM).filter((s) => existsSync(path.join(FN_DIR, s, "index.ts")) && [...depsOf(s)].some((f) => abs.has(f)));
  console.log(`Fichiers modifiés : ${changed.length} → fonctions à déployer : ${slugs.join(", ") || "aucune"}`);
} else {
  slugs = args.filter((a) => !a.startsWith("--"));
}
for (const s of slugs) {
  if (FORBIDDEN.has(s)) { console.error(`REFUS : ${s} est partagée avec la prod Lovable.`); process.exit(1); }
  if (!(s in PLATFORM)) { console.error(`REFUS : ${s} n'est pas dans la liste blanche platform-only.`); process.exit(1); }
}
if (!slugs.length) process.exit(0);
if (dry) { console.log("--dry : aucun déploiement."); process.exit(0); }
if (!PAT) { console.log("SUPABASE_ACCESS_TOKEN absent → déploiement ignoré."); process.exit(0); }

const api = (p, init = {}) => fetch(`https://api.supabase.com/v1/projects/${REF}${p}`, { ...init, headers: { Authorization: `Bearer ${PAT}`, ...(init.headers ?? {}) } });
const sharedFiles = readdirSync(path.join(FN_DIR, "_shared")).filter((f) => f.endsWith(".ts"));
const keys = await (await api("/api-keys")).json();
const anon = keys.find((k) => k.name === "anon")?.api_key;

let failed = 0;
for (const slug of slugs) {
  const fd = new FormData();
  fd.append("metadata", new Blob([JSON.stringify({ entrypoint_path: `supabase/functions/${slug}/index.ts`, name: slug, verify_jwt: PLATFORM[slug] })], { type: "application/json" }));
  const add = (rel) => fd.append("file", new Blob([readFileSync(path.join(ROOT, rel))], { type: "application/typescript" }), rel.replace(/\\/g, "/"));
  for (const f of readdirSync(path.join(FN_DIR, slug)).filter((f) => f.endsWith(".ts"))) add(`supabase/functions/${slug}/${f}`);
  for (const f of sharedFiles) add(`supabase/functions/_shared/${f}`);
  const r = await api(`/functions/deploy?slug=${slug}`, { method: "POST", body: fd });
  const body = await r.text();
  if (!r.ok) { console.error(`✗ ${slug} : déploiement ${r.status} ${body.slice(0, 300)}`); failed++; continue; }
  // Démarrage du worker : un 401/400 de NOTRE code = OK ; 5xx / BOOT_ERROR = code cassé.
  let boot = "non vérifié";
  if (anon) {
    const t = await fetch(`https://${REF}.supabase.co/functions/v1/${slug}`, { method: "POST", headers: { Authorization: `Bearer ${anon}`, apikey: anon, "Content-Type": "application/json" }, body: "{}" });
    const tb = await t.text();
    if (t.status >= 500 || /BOOT_ERROR|WORKER_ERROR/.test(tb)) { console.error(`✗ ${slug} : déployé mais ne démarre pas (${t.status} ${tb.slice(0, 200)})`); failed++; continue; }
    boot = `${t.status}`;
  }
  console.log(`✓ ${slug} déployé (démarrage : ${boot})`);
}
process.exit(failed ? 1 : 0);

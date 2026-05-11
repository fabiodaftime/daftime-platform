#!/usr/bin/env bun
/**
 * Audit anti double-comptage SPY / Comment.
 *
 * Contexte : `digitFacts` (et tout ce qui dérive de Digit Solution) intègre déjà
 * SPY et Comment/Trustpilot. Les ré-additionner ailleurs cause un double comptage
 * dans les totaux (CA Groupe, Marge Brute Groupe, P&L consolidé, etc.).
 *
 * Ce script :
 *  1. Scanne tout `src/` à la recherche d'expressions où SPY et/ou Comment
 *     sont additionnés (`+ spy`, `+ comment`, `spy + comment`, etc.).
 *  2. Classe chaque occurrence par niveau de risque :
 *       - HIGH    : addition à un total/groupe (CA, marge, total, group, sum…)
 *       - MEDIUM  : addition isolée à inspecter manuellement
 *       - SAFE    : ligne explicitement marquée informative
 *                   (commentaires `↳ dont`, drill-down, sub-component, info-only…)
 *  3. Sort un rapport lisible + code de sortie != 0 si HIGH détecté.
 *
 * Usage :  bun scripts/audit-spy-comment-double-counting.ts
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const EXTS = new Set(['.ts', '.tsx']);

type Risk = 'HIGH' | 'MEDIUM' | 'SAFE';
interface Hit {
  file: string;
  line: number;
  text: string;
  matched: string;
  risk: Risk;
  reason: string;
}

// Patterns d'addition impliquant SPY et/ou Comment.
// On capture des variantes camelCase : spyCa, spyMargeNette, commentCA, cmt.ca…
const ADDITION_PATTERNS: RegExp[] = [
  /\+\s*[a-zA-Z_.]*spy[A-Za-z_.]*\b/,
  /\+\s*[a-zA-Z_.]*comment[A-Za-z_.]*\b/i,
  /\+\s*[a-zA-Z_.]*cmt[A-Za-z_.]*\b/,
  /\bspy[A-Za-z_.]*\s*\+\s*[a-zA-Z_.]*comment/i,
  /\bspy[A-Za-z_.]*\s*\+\s*[a-zA-Z_.]*cmt/,
];

// Mots qui indiquent qu'on construit un total/groupe (=> HIGH si addition trouvée).
const TOTAL_KEYWORDS = [
  'total', 'group', 'groupe', 'sum', 'aggregate', 'consolidated',
  'consolide', 'caGroupe', 'margeBrute', 'margeGroupe', 'overview',
  'hero', 'kpi',
];

// Mots qui indiquent une présentation purement informative (=> SAFE).
const INFO_MARKERS = [
  '↳ dont', 'dont spy', 'dont comment', 'dont cmt',
  'sub-component', 'sub component', 'info-only', 'informative',
  'breakdown', 'drill-down', 'drilldown', 'display only', 'display-only',
];

// Fichiers à ignorer (tests, fixtures, ce script lui-même).
const IGNORE_PATH_PARTS = ['__tests__', '.test.', '.spec.', 'audit-spy-comment'];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXTS.has(p.slice(p.lastIndexOf('.')))) yield p;
  }
}

function classify(line: string, surrounding: string): { risk: Risk; reason: string } {
  const lower = (line + '\n' + surrounding).toLowerCase();

  for (const marker of INFO_MARKERS) {
    if (lower.includes(marker)) {
      return { risk: 'SAFE', reason: `marqueur informatif "${marker}"` };
    }
  }

  // Affectation à une variable / propriété qui ressemble à un total ?
  const assignMatch = line.match(/(?:const|let|var|return|:|=)\s*([a-zA-Z_][\w.]*)/);
  const target = assignMatch?.[1]?.toLowerCase() ?? '';
  for (const kw of TOTAL_KEYWORDS) {
    if (target.includes(kw.toLowerCase()) || lower.includes(kw.toLowerCase() + ' =')) {
      return { risk: 'HIGH', reason: `addition vers un total ("${kw}")` };
    }
  }

  // Addition dans une expression de réduction (reduce/map+sum) sans marqueur informatif.
  if (/\breduce\b|\bsum\b|\btotal\b/i.test(surrounding)) {
    return { risk: 'HIGH', reason: 'addition dans un contexte reduce/sum/total' };
  }

  return { risk: 'MEDIUM', reason: 'addition à inspecter manuellement' };
}

function scanFile(file: string): Hit[] {
  const hits: Hit[] = [];
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

    for (const pattern of ADDITION_PATTERNS) {
      const m = line.match(pattern);
      if (!m) continue;

      const surrounding = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n');
      const { risk, reason } = classify(line, surrounding);

      hits.push({
        file: relative(process.cwd(), file),
        line: i + 1,
        text: line.trim(),
        matched: m[0],
        risk,
        reason,
      });
      break; // 1 hit par ligne suffit
    }
  }
  return hits;
}

function main() {
  const allHits: Hit[] = [];
  for (const file of walk(ROOT)) {
    if (IGNORE_PATH_PARTS.some((p) => file.includes(p))) continue;
    allHits.push(...scanFile(file));
  }

  const grouped: Record<Risk, Hit[]> = { HIGH: [], MEDIUM: [], SAFE: [] };
  allHits.forEach((h) => grouped[h.risk].push(h));

  const ICON: Record<Risk, string> = { HIGH: '🚨', MEDIUM: '⚠️ ', SAFE: '✅' };
  const ORDER: Risk[] = ['HIGH', 'MEDIUM', 'SAFE'];

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(' Audit double-comptage SPY / Comment dans les totaux Digit');
  console.log('══════════════════════════════════════════════════════════════\n');

  for (const risk of ORDER) {
    const hits = grouped[risk];
    console.log(`${ICON[risk]} ${risk}  —  ${hits.length} occurrence(s)`);
    console.log('─'.repeat(64));
    if (hits.length === 0) {
      console.log('  (aucune)\n');
      continue;
    }
    for (const h of hits) {
      console.log(`  ${h.file}:${h.line}`);
      console.log(`    » ${h.text}`);
      console.log(`    motif    : ${h.matched.trim()}`);
      console.log(`    raison   : ${h.reason}\n`);
    }
  }

  console.log('══════════════════════════════════════════════════════════════');
  console.log(` Résumé : ${grouped.HIGH.length} HIGH · ${grouped.MEDIUM.length} MEDIUM · ${grouped.SAFE.length} SAFE`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (grouped.HIGH.length > 0) {
    console.error('❌ Double-comptage potentiel détecté (HIGH). Vérifier ces lignes.');
    process.exit(1);
  }
  if (grouped.MEDIUM.length > 0) {
    console.warn('⚠️  Quelques additions à inspecter manuellement (MEDIUM).');
  } else {
    console.log('✅ Aucun double-comptage détecté.');
  }
}

main();

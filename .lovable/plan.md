## Objectif

Déplacer la configuration PCGroup actuellement hardcodée en TypeScript vers Supabase, avec une interface d'administration complète. Le dashboard et son en-tête se mettront à jour automatiquement à chaque modification, sans redéploiement.

## Périmètre confirmé

1. **ENTITY_META** : entités consolidées (nom, badge, gradient, ordre, actif)
2. **Mois disponibles** : libellés et activation par mois
3. **Règles intercos** : % réserves (10%), % remontée (90%), distribution dirigeants (37.5/37.5/25)
4. **Données manuelles** : blocs SPY, Comment, Holding, intercos cash par mois (`manual/2026-XX.ts`)

Comportement par défaut : si la BDD est vide → état vide avec CTA "Configurer les entités". Pas de fallback hardcodé.

## Schéma Supabase (5 tables)

```text
pcgroup_entities
  id, code (agency|structuring|digit|spy|comment), name, badge,
  gradient, css_class, display_order, is_active, source_type
  (dashboard|manual), created_at, updated_at

pcgroup_months
  id, month_id (jan-2026...), label, year, month_num,
  is_active, display_order

pcgroup_rules
  id, month_id (FK ou NULL=défaut global),
  reserves_pct, remontee_pct,
  maxence_pct, thibault_pct, florian_pct, will_amount

pcgroup_manual_facts (1 ligne par entité × mois pour SPY/Comment)
  id, month_id, entity_code, ca, charges, contribution,
  margin_pct, deals, ticket_moyen, raw_breakdown jsonb

pcgroup_holding_facts (1 ligne par mois)
  id, month_id, frais_compta_cfo, frais_assistante,
  frais_sales, frais_total, apport_maxence

pcgroup_intercos_cash (1 ligne par entité × mois)
  id, month_id, entity_code, amount_received
```

RLS : `is_super_admin` = ALL ; `has_company_access(company_id PCGroup)` = SELECT.

## Architecture front

```text
src/components/dashboard/pcgroup/
  config/
    pcgroupConfigClient.ts   ← fetch + cache React Query
    types.ts                 ← types miroirs des tables
    usePCGroupConfig.ts      ← hook unique (entities, months, rules, manual)
    EmptyConfigState.tsx     ← écran vide avec CTA
  sources/
    normalizedAdapters.ts    ← lit depuis usePCGroupConfig au lieu de manual/
  pcGroupAggregator.ts       ← prend la config en argument (pure)
  
src/pages/admin/
  PCGroupConfigPage.tsx      ← /admin/pcgroup-config
  
src/components/dashboard/pcgroup/admin/
  EntitiesEditor.tsx         ← CRUD ENTITY_META
  MonthsEditor.tsx           ← CRUD mois
  RulesEditor.tsx            ← CRUD règles intercos
  ManualFactsEditor.tsx      ← CRUD SPY/Comment/Holding/cash par mois
  PCGroupConfigTab.tsx       ← onglet 'Configuration' visible super_admin
```

## Refactoring clé

- `pcGroupAggregator.computeConsolidatedFacts()` devient **pur** : prend `(month, config)` au lieu de lire les modules statiques
- `DashboardPCGroup.tsx` enveloppe l'arbre dans `<PCGroupConfigProvider>` (React Query)
- `PCG_AVAILABLE_MONTHS` = intersection calculée depuis les données BDD
- Tous les fichiers `manual/2026-XX.ts` et `manualEntities.ts` sont **supprimés** (Supabase = unique source de vérité)

## Plan d'exécution (4 étapes incrémentales)

### Étape 1 — Schéma + seed
- Migration : créer les 6 tables + RLS
- Seeder Jan/Fév/Mars/Avril 2026 depuis les valeurs actuelles de `manual/*.ts` pour ne rien perdre
- Vérification : `pcGroupRegression.test.ts` doit passer après bascule

### Étape 2 — Couche config + adapters
- `pcgroupConfigClient.ts` + `usePCGroupConfig` (React Query, staleTime 30s)
- `normalizedAdapters.ts` lit depuis la config (les sources Agency/Structuring/Digit restent hardcodées — hors périmètre)
- `aggregatePCGroup()` accepte la config en paramètre

### Étape 3 — Dashboard réactif
- `DashboardPCGroup.tsx` : remplacer imports statiques par hook
- État vide si `entities.length === 0` ou `months.length === 0`
- Header dynamique déjà en place (calculé depuis `entities.length` et `months.length`)

### Étape 4 — UI admin
- Page `/admin/pcgroup-config` (route protégée super_admin)
- Onglet `Configuration` dans `DashboardPCGroup` (visible uniquement super_admin)
- 4 éditeurs : EntitiesEditor, MonthsEditor, RulesEditor, ManualFactsEditor
- Invalidation React Query après chaque mutation → dashboard se met à jour en live

## Hors périmètre (à confirmer plus tard)

- Données Agency/Structuring/Digit (restent dans leurs dashboards source)
- Audit log des modifications de config
- Versioning / historique
- Multi-utilisateurs concurrents (verrou optimiste)
- Tests E2E de l'UI admin (les tests de régression existants couvrent la cohérence des calculs)

## Risques

- **Suppression du fallback hardcodé** : si la migration de seed échoue, le dashboard est vide. Mitigation : seed inclus dans la migration SQL (transactionnel).
- **Refactor `aggregatePCGroup`** : casse temporairement les tests. Mitigation : adapter les tests pour passer un mock config.
- **Volumétrie** : ~50 lignes en BDD au total → négligeable.

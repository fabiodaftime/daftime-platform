## Objectif

Transformer `PCGroupData.ts` (1018 lignes de données figées par mois) en un **agrégateur calculé** : dès qu'un mois est ajouté dans Agency, Structuring ou Digit, le consolidé se met à jour automatiquement. Seules la **Holding**, **SPY** et **Comment** (qui n'ont pas de dashboard standalone) restent en saisie manuelle.

## Architecture cible

```text
src/components/dashboard/pcgroup/
├── sources/
│   ├── agencyAdapter.ts      ← lit PrimeCircleAgencyData → forme normalisée
│   ├── structuringAdapter.ts ← lit PrimeCircleData       → forme normalisée
│   └── digitAdapter.ts       ← lit DigitData             → forme normalisée
├── manual/
│   ├── holdingManual.ts      ← frais holding + dirigeants par mois
│   ├── spyManual.ts          ← KPIs SPY par mois
│   ├── commentManual.ts      ← KPIs Comment par mois
│   └── intercosManual.ts     ← règles & encaissements réels
├── pcGroupAggregator.ts      ← assemble tout → PCGroupMonthData
├── pcGroupFormatters.ts      ← helpers $X,XXX / +X.X% / variations
└── PCGroupData.ts            ← API publique : getMonthData(monthId), AVAILABLE_MONTHS
```

## Source de vérité par champ

| Champ PCGroupData | Source |
|---|---|
| `agencyKPIs`, `agencyComparison`, `agencyWaterfall`, `agencyRisks` | Agency (calculé) |
| `structuringKPIs`, `structuringComparison`, `structuringWaterfall`, `structuringServices` | Structuring (calculé) |
| `digitKPIs`, `digitComparison`, `digitWaterfall`, `digitRevenueBreakdown` | Digit (calculé) |
| `entityCards`, `pieData`, `consolidatedPL` (lignes marges) | Σ adapters (calculé) |
| `overviewHero`, `overviewComparison*` | Σ adapters + variation MoM (calculé) |
| `ytdHero`, `ytdMonthlyTable`, `ytdEntityTable`, `ytdTrendData`, `reservesHero`, `reservesEntityTable`, `reservesCards` | Cumul des mois disponibles (calculé) |
| `spyKPIs`, `spyWaterfall` | spyManual.ts |
| `commentKPIs`, `commentWaterfall`, `commentWarning` | commentManual.ts |
| `holdingKPIs`, `holdingComparison`, `holdingSynthese`, `holdingPieData`, `directors`, `holdingNetResult`, `holdingManagementFees` | holdingManual.ts (frais + répartition %) + calcul dérivé |
| `consolidatedPL` (frais holding + management) | holdingManual.ts |
| `intercos` | intercosManual.ts (rules de remontée 90% + encaissements réels saisis) |
| `AVAILABLE_MONTHS` | intersection des mois Agency ∩ Structuring ∩ Digit |

## Étapes d'implémentation

1. **Adapter Agency** (`agencyAdapter.ts`)
   - Fonction `getAgencyForMonth(monthId)` → retourne `{ caBrut, margeNette, partPCA, charges[], waterfall[], comparison[], risks[], kpis[] }` formatés.
   - Calcule la variation Mois N vs N-1 automatiquement.

2. **Adapter Structuring** (idem depuis `PrimeCircleData.ts`).

3. **Adapter Digit** (idem depuis `DigitData.ts`, en réutilisant éventuellement `digitYTDValidation`).

4. **Manual files** : extraire les valeurs actuelles (holding, spy, comment, intercos) de `PCGroupData.ts` vers les fichiers `manual/*.ts`. Format minimal : un objet par mois.

5. **Aggregator** (`pcGroupAggregator.ts`)
   - `aggregateMonth(monthId)` : appelle les 3 adapters + lit les manuals → assemble `PCGroupMonthData`.
   - Calcule : `margeBruteGroupe = Σ marges nettes`, `reserves = 10% margeBrute`, `remonteeHolding = 90%`, `resultatNet = remontee - fraisHolding`, répartition dirigeants.
   - YTD : itère sur tous les mois ≤ monthId.

6. **Formatters** (`pcGroupFormatters.ts`) : `fmtUSD(n)`, `fmtPct(n)`, `fmtVar(curr, prev)`, `cell(v)`.

7. **Refactor `PCGroupData.ts`**
   - Ne contient plus que les types + `export const AVAILABLE_MONTHS = computeAvailableMonths()` + `export const getMonthData = aggregateMonth`.
   - Garde la signature `PCGroupMonthData` actuelle pour ne casser aucun composant `PCGroup*Tab.tsx`.

8. **Tests de régression**
   - Ajouter `pcGroupAggregator.test.ts` : pour Jan/Fév/Mars 2026, snapshot des KPIs principaux et vérifier qu'ils correspondent aux valeurs actuellement affichées.
   - Étendre le CI gate (`scripts/validate-digit-ytd.ts` style) avec `validate-pcgroup-consistency.ts` qui vérifie : Σ marges entités = margeBruteGroupe.

9. **Vérification visuelle**
   - Lancer le dashboard `/dashboard-pc-group/...` sur Jan, Fév, Mars : tous les onglets doivent afficher exactement les mêmes valeurs qu'aujourd'hui.

## Hors scope (volontaire)

- Pas de changement UI (`PCGroup*Tab.tsx` non touchés).
- Pas de migration DB.
- Pas de refactor des dashboards source (Agency/Structuring/Digit restent inchangés).
- Pas de gestion d'Avril 2026 dans ce refactor : sera ajouté ensuite (Avril manque dans Structuring/Agency/Digit mois courant — voir note ci-dessous).

## Note sur Avril 2026

Aujourd'hui : Agency, Structuring, Digit ont Avril ; PCGroup n'a que Jan/Fév/Mars. Après ce refactor, ajouter Avril = remplir `holdingManual['apr-2026']`, `spyManual['apr-2026']`, `commentManual['apr-2026']`, `intercosManual['apr-2026']` → Avril apparaît automatiquement dans le consolidé. Je peux enchaîner avec ça après validation du refactor si tu veux.

## Détails techniques

- Tous les composants `PCGroup*Tab.tsx` consomment `PCGroupMonthData` : on **conserve l'interface exacte** pour zéro régression UI.
- Les valeurs numériques manipulées en `number` dans les adapters/aggregator, formatées en `string` (`$X,XXX`) seulement à la sortie via `pcGroupFormatters.ts`.
- L'aggregator est **pur** (pas d'effet de bord) → memoization triviale + testable unitairement.
- Volume estimé : ~600 lignes nouvelles (adapters + aggregator + manuals) pour ~1000 lignes supprimées dans `PCGroupData.ts`.

## Estimation effort

Gros refactor cohérent : ~1 itération de build. Les snapshots actuels Jan/Fév/Mars servent d'oracle pour valider que le résultat est strictement identique avant/après.

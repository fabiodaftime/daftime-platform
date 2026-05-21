
## Objectif

Refondre le tab **Flux Intercos** du dashboard PC Group pour refléter la réalité métier : MaxScale jusqu'à février (tout mélangé), puis bascule sur DG Solutions à partir de mars (DG + CommentTrust uniquement), avec SPY systématiquement isolé.

## Changements

### 1. Logique de calcul (`pcGroupIntercosCompute.ts`)

Découper la période YTD en deux phases au lieu d'une boucle uniforme :

- **Phase MaxScale** = `jan-2026`, `feb-2026`
  - Agréger en UN SEUL bloc : DG activity + CommentTrust + SPY + (Agency + Structuring si pertinent — à confirmer, défaut = inclus car flux MaxScale historique)
  - Sortir 4 chiffres : Total résultat MaxScale, Théorique à remonter (× 90%), Réellement remonté, Écart
  - Pas de séparation par entité dans cette phase

- **Phase DG Solutions** = `mar-2026`, `apr-2026`, ...
  - Bloc DG remontable = (Digit core + Comment) × 90%
  - SPY exclu du calcul automatique
  - Agency et Structuring restent avec leur règle propre (non concernés par la bascule)

- **Bloc SPY isolé** (Mars+) : Revenue, Costs, Profit (depuis `MANUAL_ENTITIES[m].spy`), cash remonté `INTERCOS_CASH[m].received.spy`. Affiché à part, jamais agrégé dans le total DG.

### 2. UI (`PCGroupIntercosTab.tsx`)

Remplacer le tableau monolithique « Détail des Remontées par Filiale » par 3 sections visuelles :

```text
┌─────────────────────────────────────────────┐
│ A — HISTORIQUE / TRANSITION MaxScale        │
│     (visible si jan ou fév dans la période) │
│  • Total résultat MaxScale                  │
│  • Théorique à remonter (90%)               │
│  • Réellement remonté                       │
│  • Écart / régularisation                   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ B — DG SOLUTIONS (Mars+)                    │
│  • DG activity      $X                      │
│  • CommentTrust     $Y                      │
│  • Total DG remontable = (X+Y) × 90%        │
│  • Reçu / Solde                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ C — SPY (Mars+) — ISOLÉ                     │
│  • Revenue / Costs / Profit                 │
│  • Flux remonté (info uniquement)           │
│  • Badge : "Hors périmètre calcul DG"       │
└─────────────────────────────────────────────┘
```

Garder Agency et Structuring (PCA, structuring) dans leur propre section comme aujourd'hui — elles ne sont pas concernées par la transition MaxScale→DG.

### 3. KPI Hero

Garder les 3 cards mais ajuster les libellés :
- « Somme à Remonter » = MaxScale théorique (Jan+Fév) + DG Solutions théorique (Mars+) + Agency/Structuring théorique
- « Somme Remontée » = total reçu toutes périodes
- « Solde » = différence
- **SPY exclu** de ces 3 KPI dès qu'on est ≥ mars.

### 4. Tests

Mettre à jour `pcGroupIntercosReceivedParity.test.ts` :
- Vérifier qu'à partir de mars, le calcul DG remontable n'inclut PAS la marge SPY
- Vérifier que le total MaxScale Jan+Fév = somme des marges DG+Comment+SPY de ces mois
- Conserver la parité KPI/table sur la part non-SPY

## Points à confirmer

1. **Périmètre MaxScale Jan/Fév** : Agency (PCA) et Structuring étaient-ils déjà sur leur propre structure dès janvier, ou faisaient-ils aussi partie du « pot MaxScale » à régulariser ? Mon hypothèse par défaut : Agency et Structuring sont indépendants et restent dans leur propre bloc (comme aujourd'hui). Seul le trio DG+Comment+SPY constitue le « pot MaxScale » à régulariser.

2. **SPY avant mars** : Le SPY de Jan/Fév est-il considéré « remonté via MaxScale » (donc inclus dans le pot régularisation) ou déjà isolé ? Mon hypothèse : inclus dans MaxScale Jan/Fév, isolé dès Mars.

Si ces hypothèses sont OK je code directement ; sinon dis-moi ce qui change.

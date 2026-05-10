## Constat : pourquoi aujourd'hui rien ne cascade

Les dashboards entités (Digit, Prime Circle Structuring, Prime Circle Agency, Bocuse, Hotel X, Skalis…) sont aujourd'hui des **pages statiques** : les chiffres affichés sont des **chaînes pré-formatées écrites à la main** dans des fichiers TS (`DigitData.ts`, `PrimeCircleData.ts`, `PrimeCircleAgencyData.ts`…). Exemple : `value: "$134,212"`, `value: "34.3%"`. Il n'existe **aucun moteur de calcul** : la marge n'est pas dérivée du CA, c'est juste une autre chaîne.

Conséquences directes :
- Modifier le CA ne peut **rien** propager (rien n'est lié).
- Les chiffres et les % peuvent **diverger** silencieusement (déjà arrivé : `digitNumericFacts.ts` est un fichier doublon maintenu en parallèle pour le consolidé).
- Le flux actuel (Excel compta → import Cloud → HTML → copier-coller) est **non fiabilisable**, exactement ce que tu décris.

Seul le **consolidé PCGroup** est aujourd'hui dérivé (adapters → facts normalisés → agrégateur qui calcule marges, réserves 10 %, remontée 90 %, frais holding) et déjà éditable pour les blocs manuels (SPY, Comment, Holding, règles) via les tables `pcgroup_manual_facts`, `pcgroup_holding_facts`, `pcgroup_rules`. C'est exactement le pattern à généraliser.

## Proposition : « Inputs canoniques en base + tout est dérivé »

Pour chaque entité, on définit un **petit modèle d'inputs canoniques** (10 à 20 champs numériques par mois) qui devient la **seule source de vérité**. Tout le reste (KPI, %, sous-totaux par produit, YTD, comparatifs M-1, parts dans le pie, et le consolidé) est **recalculé** à partir de ces inputs.

Exemple pour Digit (mois) :
```
ca_core, marge_core, ca_spy, marge_spy, ca_comment, marge_comment,
provider_cost, salary_cost, tools, fees, refunds, sales_commissions,
deals_setup, deals_ad_account, ...
```
→ Tout le reste se calcule : CA total = somme, marge % = marge/CA, ticket moyen = CA/deals, YTD = somme des mois, comparatif Fév-Jan = (fév-jan)/jan, etc.

### Bénéfices
- **Saisie unique** d'une donnée → cascade automatique partout (entité + consolidé) via React Query invalidate, exactement comme déjà fait pour SPY/Comment/Holding.
- **Audit** : chaque modification tracée (utilisateur, date, valeur avant/après) dans `data_edits_audit`.
- **Validation Zod** côté client + contraintes en base + RLS Super Admin pour les écritures.
- **Fin du fichier doublon** `digitNumericFacts.ts` (le fact devient la table).
- **Inline edit (crayon)** possible sur les cartes mappées 1:1 à un input.

### Trade-off honnête
- Refactor borné mais réel : il faut faire **une entité à la fois**, définir son modèle d'inputs, et réécrire le fichier `*Data.ts` correspondant en fonction pure `compute(inputs) → displayData`. Compter ~½ journée par entité une fois le pattern établi.
- Les KPI vraiment qualitatifs (commentaires, libellés textuels, logos clients) restent en config statique — seuls les **chiffres** passent en DB.

## Plan d'exécution proposé (par phases)

### Phase 1 — Pilote sur Digit (entité la plus simple, déjà à moitié normalisée)
1. Créer la table `entity_monthly_inputs` (clé `(company_id, entity_layout, month_id)`, payload `jsonb` validé par schéma Zod côté client).
2. Migrer les 4 mois de Digit (jan/fév/mars/avr 2026) depuis `DigitData.ts` + `digitNumericFacts.ts` → DB.
3. Réécrire `DigitData.ts` : il devient un **calculateur pur** `computeDigitMonthData(inputs)` qui génère tout (overviewKPIs, costsKPIs, products, YTD, comparatifs).
4. Ajouter un hook `useEntityInputs('digit', monthId)` (React Query) lu par `DashboardDigit`.
5. Brancher le consolidé : `digitFacts()` lit la même DB au lieu de `DIGIT_NUMERIC_FACTS`.
6. UI Super Admin : page « Saisie mensuelle Digit » (formulaire grille mois × champs), bouton « Enregistrer », toast + invalidation, audit log automatique.
7. Phase 1.b : ajouter le **petit crayon inline** sur les cartes CA / Marge / Charges → drawer d'édition rapide du champ source (mêmes endpoints).

### Phase 2 — Étendre à Structuring + Agency
- Même recette, modèles d'inputs spécifiques.
- Une fois les 3 sources dynamiques, le consolidé devient **100 % live** (plus aucun fact figé).

### Phase 3 — Généralisation aux autres entités (Bocuse, Hotel X, Skalis, Nowmade, Labarile, Richissime, CW Partners…)
- Au cas par cas selon les besoins client. Pattern identique.

### Garde-fous transverses
- **RLS** : seul Super Admin peut écrire ; tous les rôles avec accès à la company peuvent lire.
- **Validation Zod** sur chaque champ (bornes min/max, NaN interdit, signes).
- **Audit complet** : table `entity_input_edits_log` avec acteur, champ, ancienne/nouvelle valeur, mois, entité.
- **Fallback** : si la DB ne renvoie rien pour un mois, on garde un seed initial (snapshot de l'existant) pour ne pas casser l'affichage.
- **Realtime** : `supabase_realtime` sur la table → tous les clients ouverts voient la modif en quelques secondes (déjà la norme PCGroup).

## Choix à valider avant que je détaille la migration / le code

1. **Quelle entité pilote ?** Digit est techniquement le plus simple (numerics déjà extraits). Mais tu peux préférer Structuring (plus utilisé) ou Agency (la plus complexe — bon stress test).
2. **UI d'édition** :
   - **A.** Page dédiée « Saisie mensuelle » par entité (formulaire grille) — rapide à shipper, un seul écran à maîtriser.
   - **B.** Crayon inline sur chaque carte du dashboard — UX plus fluide mais N points d'édition à gérer.
   - **C.** Les deux (A pour saisie initiale, B pour corrections express). C'est ce que je recommande.
3. **Périmètre** : on garde la possibilité d'**importer un Excel** (drop CSV → mapping AI → pré-remplissage du formulaire), ou on enterre l'import et on saisit toujours à la main ?

Réponds-moi sur ces 3 points et je te livre le plan technique détaillé (schéma de table exact, migration SQL, modules à créer/modifier, ordre des PR).
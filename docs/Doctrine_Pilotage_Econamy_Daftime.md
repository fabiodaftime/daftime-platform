# DOCTRINE ECONAMY × DAFTIME ADVISORY
## Méthode complète de pilotage financier e-commerce — base d'analyse de la plateforme

> Ce document définit la philosophie, les définitions, les formules, les seuils et les règles d'interprétation que la plateforme applique pour produire ses dashboards, ses analyses et ses opinions de gestion. Il fait autorité : toute analyse produite doit être cohérente avec ce qui suit.

---

## 0. Mission et posture de l'analyse

**La plateforme est le « deuxième étage » du pilotage.** Le founder voit peu mais voit juste ; la plateforme regarde tout, en détail, et fait remonter uniquement ce qui compte. Sa valeur n'est ni dans les données ni dans le dashboard : elle est dans le **filtre** — savoir ce qui mérite l'attention du founder ce mois-ci — et dans l'**interprétation** — transformer des chiffres en lecture, puis en décision possible.

Règles de posture :

- **Produire une opinion, pas seulement des chiffres.** Chaque constat doit être accompagné d'une lecture (« ce que ça veut dire ») et, quand c'est pertinent, d'une décision possible ou d'une question à trancher.
- **Toujours contextualiser.** Aucun chiffre n'est bon ou mauvais dans l'absolu : tout dépend du modèle (one-shot, réachat, gros catalogue), de la saison, du stade du shop et de la situation globale. Un signal isolé est une question, pas un verdict.
- **Distinguer fait, hypothèse et recommandation.** Un fait se constate dans les données. Une hypothèse s'énonce comme telle (« probablement lié à… »). Une recommandation s'assume (« nous recommandons de… »), avec sa justification chiffrée.
- **Jamais de posture anti-outils.** Shopify est une mine d'or de données ; Ads Manager est efficace bien configuré. Le problème n'est jamais l'outil : c'est l'assemblage (ventes réelles + coûts réels + timing du cash) et l'interprétation financière que personne ne fait. C'est précisément le travail de la plateforme.
- **La hiérarchie des questions, toujours dans cet ordre :** (1) Est-ce que le shop gagne de l'argent, et où ? (2) L'acquisition est-elle rentable ? (3) À quelle vitesse le shop peut-il grandir ? (4) Que doit regarder le founder ce mois-ci ? Ne jamais répondre à la question 3 avant d'avoir répondu aux questions 1 et 2.

---

## 1. Principe fondateur : le CA raconte une histoire, la marge dit la vérité

Le chiffre d'affaires est un **vanity metric**. Un shop peut faire 100 k€/mois et perdre de l'argent ; c'est même courant. Un produit margé x3 (acheté 12 €, vendu 40 €) peut être non rentable une fois livraison, frais de paiement et pub déduits. La plupart des e-commerçants gardent environ 3 % en net ; les marges fines sont la norme, pas l'exception.

Conséquences pour l'analyse :

- **Aucune conclusion ne se tire du CA seul.** La croissance du CA ne prouve rien : un shop peut croître de +30 % par an et détruire de la valeur à chaque commande.
- **Toute analyse part de la marge réelle**, jamais du CA, jamais du ROAS affiché, jamais du solde bancaire.
- Le CA reste affiché et suivi (c'est un repère de volume et de tendance), mais il n'est **jamais** l'axe de jugement de la santé du shop.

---

## 2. La cascade de marges : le cœur analytique

### 2.1 Définitions (à appliquer strictement)

- **CM1 — marge produit** = ventes nettes − coût des marchandises (produit + packaging + transport amont).
  Question : le produit et le pricing tiennent-ils la route ?
- **CM2 — marge opérationnelle** = CM1 − livraison sortante − pick & pack / fulfillment − frais de paiement − SAV/refunds/litiges.
  Question : les opérations laissent-elles vivre la marge ? C'est la base de calcul des breakevens publicitaires.
- **CM3 — marge après acquisition** = CM2 − coûts d'acquisition (pub toutes plateformes + fees d'agence + créa + outils d'attribution + influence).
  Question : la croissance est-elle rentable ? **C'est LE chiffre de pilotage du e-commerce.**

**Ventes nettes** = CA encaissé − refunds − remises réellement accordées. Jamais le CA brut.

### 2.2 Règle de classification des coûts

Un coût qui **varie avec le volume de commandes** est un coût variable : il appartient à la cascade, pas aux frais généraux. Sont donc variables : produit, livraison, pick & pack, frais de paiement (y compris la part fixe par transaction), refunds et gestes commerciaux, chargebacks, frais de plateforme/marketplace, remises, pub attribuée. Sont fixes : salaires, outils au forfait, loyers, comptabilité. En cas de doute, tester : « si les commandes doublent, ce coût double-t-il ? »

### 2.3 Retraitement en engagement (obligatoire)

Tous les calculs de marge se font en **comptabilité d'engagement** : chaque coût est remis en face des ventes qu'il a servies. Le coût des marchandises des commandes de mars appartient au P&L de mars, même si le stock a été payé en décembre. La pub prépayée est rattachée aux mois qu'elle sert. C'est la seule façon de connaître la vraie marge mensuelle et de comparer les mois entre eux.

### 2.4 Les coûts que l'analyse ne doit jamais oublier

- **Frais de paiement réels** : 2,9 % + 0,30 € par transaction finit à 3–5 % du CA une fois petits paniers et chargebacks comptés.
- **SAV, remboursements, litiges** : typiquement 1–3 % du CA, davantage si le produit ou la livraison déçoit. Ligne à suivre explicitement.
- **Frais de plateforme** : Amazon all-in (referral + FBA + ads) atteint 30–40 %. Le canal « facile » est souvent le plus cher en marge.
- **Remises empilées** : code promo + livraison offerte + prix barré = érosion silencieuse de la CM2, surtout pendant les pics (BFCM, soldes). L'outil doit suivre la remise moyenne par commande dans le temps.

### 2.5 Benchmarks de référence (repères, jamais cibles absolues)

| Indicateur | Plage typique | Lecture |
|---|---|---|
| CM1 (marge produit) | Dropshipping 65–80 % · marque DTC 50–70 % | Sous 50 % en vente en ligne pure : modèle très difficile à financer |
| CM2 | Dropshipping 45–60 % · marque avec stock/3PL 35–55 % | Le poids du produit et la promesse de livraison font la différence |
| CM3 | Saine 15–30 % · très bons opérateurs 28 %+ | Sous 10 % : acquisition structurellement non rentable |
| Marge nette | Plupart des shops 0–10 % · bons opérateurs 10–20 % | Les marges fines sont la norme, d'où le pilotage |

Règle d'usage : un benchmark sert à **poser la bonne question** (« pourquoi la CM2 est 15 points sous la plage du modèle ? »), pas à rassurer. **La trajectoire compte plus que le niveau** : une CM2 à 40 % en érosion régulière est plus préoccupante qu'une CM2 stable à 35 %.

### 2.6 Décisions associées à chaque niveau

- Problème de **CM1** → décisions produit/pricing : sourcing, négociation fournisseur, prix de vente, bundles.
- Problème de **CM2** → décisions opérations/offre : seuil de livraison offerte, renégociation 3PL/transporteur, politique de remises, réduction refunds.
- Problème de **CM3** → décisions acquisition : budgets, canaux, créas, ciblage — mais **jamais avant d'avoir vérifié que CM1 et CM2 sont sains**. Ordre de réparation : marge d'abord, mix d'acquisition ensuite, rétention enfin.

---

## 3. Les métriques publicitaires : hiérarchie et interprétation

### 3.1 Le ROAS : un outil tactique, à interpréter

Le ROAS (CA attribué / dépense d'une plateforme) est **utile et légitime** pour comparer des campagnes, couper ou scaler un adset au quotidien. Mais il ne dit pas : la marge réelle, la part de clients existants recapturés en retargeting, les remises, les fees, la santé globale du business. « Bon ROAS » ≠ « je gagne de l'argent ».

**Règle absolue : un ROAS s'interprète toujours par rapport à la marge.**

- **ROAS breakeven = 1 / CM2 (en %).**
  CM2 = 20 % → breakeven 5,0x. CM2 = 30 % → 3,3x. CM2 = 50 % → 2,0x.
- Il n'existe pas de « bon ROAS » universel : un 3x sur 30 % de marge est à peine l'équilibre ; un 2,5x sur 50 % de marge est confortablement rentable.
- L'outil doit **calculer et afficher le breakeven propre au shop** et juger tout ROAS/MER par rapport à lui (avec une marge de sécurité pour couvrir les fixes et le profit — recommander de viser sensiblement au-dessus du breakeven, pas de le frôler).

### 3.2 Le MER : la boussole business

- **MER = CA total / dépenses marketing totales.** Deux chiffres infalsifiables (CA réel, factures réelles), aucune attribution nécessaire. Repères usuels : 3x à 5x. MER breakeven = 1 / CM2, comme le ROAS.
- **nMER = CA nouveaux clients / budget acquisition.** Le raffinement indispensable : un bon réachat/email peut masquer une acquisition qui perd de l'argent. **MER stable + nMER en baisse = le moteur d'acquisition se dégrade en silence** — signal à remonter.
- L'attribution des plateformes est imparfaite par nature (chaque outil s'attribue des ventes, les doublons s'additionnent, tout dépend de la qualité du tracking). D'où la primauté du MER pour le jugement business. Ne pas blâmer les plateformes : rappeler que la qualité de configuration (pixel, événements de conversion, fenêtres d'attribution) conditionne la fiabilité des chiffres tactiques.

### 3.3 Hiérarchie des métriques (chaque métrique à son étage)

1. **ROAS par campagne** → tactique quotidienne (media buying).
2. **MER / nMER** → pilotage hebdomadaire et mensuel du business.
3. **CM3** → la vérité du P&L, le juge final.

Erreur classique à détecter et signaler : piloter le business au ROAS (inverser les étages).

---

## 4. L'acquisition rentable

### 4.1 Le CAC : définitions

- **CAC blended** = toutes dépenses marketing / tous clients (nouveaux + existants). Utile en vue d'ensemble, mais il masque tout : un bon réachat peut cacher une acquisition qui dérape depuis des mois.
- **CAC nouveau client** = budget acquisition / nouveaux clients uniquement. **C'est le chiffre de vérité** : le prochain euro de pub achète-t-il encore un client à un prix tolérable ? L'outil suit les deux mais **décide sur le CAC nouveau client**.
- **CAC complet** : inclure au numérateur les fees d'agence, coûts créa, outils d'attribution, influence, échantillons. Un CAC « pub seule » sous-estime le vrai coût de 20 à 40 %.
- Le CAC varie énormément selon produit et marché (10–30 € en achat d'impulsion, 100 €+ en marque premium) : le juger par rapport à la marge du shop, jamais par rapport à une norme externe.

### 4.2 Le test de base (valable pour TOUS les shops) : rentable à la commande ?

**Ratio = CM2 par commande / CAC nouveau client.**

- **> 1,0** : rentable dès la première commande. Chaque client s'autofinance → feu vert pour scaler ; le réachat éventuel devient du profit pur.
- **0,7 – 1,0** : perte à la première commande, récupérable au réachat. Acceptable **uniquement si** les trois conditions sont réunies : (a) cohortes qui **prouvent** le réachat (pas un réachat espéré), (b) payback < 6–9 mois, (c) trésorerie capable de financer le décalage. S'il manque une condition, ce n'est pas un pari, c'est de l'espoir → signal.
- **< 0,7** : stop. Le trou ne sera probablement jamais rebouché. Recommandation : arrêter de scaler et réparer l'économie unitaire (cascade) d'abord.

**Produit one-shot (pas de réachat réel) : obligation d'être > 1,0. Point final.** Le raisonnement LTV ne s'applique pas.

### 4.3 La LTV : uniquement si le produit se rachète

La LTV n'est un concept de pilotage **que** pour les modèles à réachat (consommables, beauté, compléments, accessoires récurrents, abonnement). Trois règles strictes :

1. **En marge, jamais en CA.** LTV de 180 € de CA à 40 % de CM2 = 72 € de valeur réelle. C'est ce chiffre qu'on compare au CAC.
2. **Par cohortes observées.** LTV 60 j et 90 j mesurées sur les clients réellement acquis chaque mois — jamais une extrapolation 12 mois d'un tableur optimiste. Pour les décisions de pub du mois, utiliser la **LTV 60 jours** (celle que la trésorerie du mois peut financer).
3. **Adossée au réachat réel.** Réachat sain pour un produit récurrent : 25–30 %+ ; consommables/abonnement : 35–55 %. **Sous 20 % de réachat : le shop vit de l'acquisition → piloter à la commande, pas à la LTV** (bascule automatique du cadre d'analyse).

### 4.4 Ratio LTV:CAC (modèles à réachat uniquement)

Calculé en marge, avec le CAC nouveau client complet :

- **< 2:1** : zone rouge — pas assez de marge pour financer la croissance. Stop scaling, retour à la cascade.
- **3:1 – 5:1** : zone saine — le modèle finance sa croissance ; scaler en surveillant le payback.
- **> 6:1** : sous-investissement probable — parts de marché laissées sur la table ; tester plus de budget, de nouveaux canaux.

**Le ratio est une moyenne qui peut mentir** : le calculer par canal et par cohorte. Un 4:1 global peut cacher un canal à 1,8:1 subventionné par l'organique.

### 4.5 Le payback : le garde-fou trésorerie

**Payback = CAC / marge de contribution générée par client et par mois.**

- **< 90 jours** : excellent — l'acquisition s'autofinance quasiment, réinvestissement rapide possible.
- **< 12 mois** : acceptable pour un modèle à réachat, mais chaque mois de payback immobilise du cash.
- **> 18 mois** : danger — besoin de financement permanent (à 1 000 clients/mois et 6 mois de payback, des centaines de k€ immobilisés).

**Ratio = rentabilité ; payback = survie.** Un modèle à 5:1 avec 16 mois de payback peut casser en trésorerie avant d'atteindre la rentabilité promise. Les deux se lisent toujours ensemble.

---

## 5. La croissance : ni dogme, ni peur — un calcul

### 5.1 Les deux écoles (à respecter, pas à caricaturer)

- **Croissance d'abord** — logique réelle : les fenêtres de marché ne durent pas (créas qui fatiguent, copies, coûts pub qui montent) ; le volume améliore les prix d'achat et dilue les fixes. Angle mort : scaler des commandes qui perdent de l'argent amplifie les pertes, et la croissance immobilise du cash avant d'en rapporter — on peut mourir en pleine accélération.
- **Rentabilité d'abord** — logique réelle : indépendance des levées et de la dette, résilience, culture fonds propres. Angle mort : le sous-investissement ; refuser de scaler un produit qui marche, c'est laisser la place à un concurrent, et les fenêtres ratées ne se rouvrent pas.

**Position de la maison : trancher avec des chiffres, pas avec un tempérament.** L'outil ne doit jamais recommander « scale » ou « prudence » par principe : il calcule.

### 5.2 Le calcul de la croissance finançable

- **Ce que le shop dégage** : la marge après pub (CM3) en euros chaque mois — le carburant réel, pas le CA ni le ROAS.
- **Ce que la croissance bloque** : plus de stock payé d'avance, plus de pub débitée aujourd'hui, des encaissements différés (payouts), le CAC des nouveaux clients en attente de payback.
- **L'arbitrage** : si (dégagé) > (bloqué) → accélérer. Sinon, trois leviers, dans cet ordre d'examen : raccourcir les délais (négociation fournisseurs, payouts), améliorer la marge (cascade), ou financer le décalage **en connaissance de cause** (en chiffrant le coût).

### 5.3 Le cash conversion cycle (usage interne analyste)

**CCC = jours de stock + jours d'encaissement − jours fournisseurs.** Repère e-commerce : 60–120 jours ; < 60 très bon ; négatif = les clients financent le stock. Ordres de grandeur : ~164 k$ immobilisés par M$ de coût marchandises à 60 jours de cycle ; chaque jour gagné libère du cash sans toucher ni au CA ni aux marges — souvent le levier le plus sous-estimé. **Côté client, traduire systématiquement en langage simple** : « X jours entre payer le fournisseur et encaisser les ventes », « X jours de stock devant toi ». Ne pas exposer les acronymes BFR/DIO/DSO/DPO dans les livrables.

### 5.4 La mécanique de casse du scaling (grille de détection)

Séquence classique à surveiller : (1) budget pub scalé — cash sorti aujourd'hui → (2) stock commandé plus gros — acomptes, minimums plus hauts → (3) encaissements qui traînent — payouts décalés, réserves PSP, refunds à provisionner → (4) l'écart sorties/entrées se creuse chaque semaine → (5) rupture de trésorerie **alors que le shop est rentable sur le papier**. Rien d'inévitable : le prévisionnel 13 semaines montre l'écart des semaines à l'avance. La plupart des morts e-commerce sont des morts de trésorerie, pas de rentabilité.

Contexte payouts (à intégrer dans les projections) : les délais varient fortement selon le PSP, le pays d'incorporation et l'ancienneté du compte — un Stripe US récent peut retenir 2–3 semaines pour provisionner les refunds ; marketplaces à 14 jours ; réserves et gels possibles.

---

## 6. Les deux lectures financières : engagement et trésorerie

**Les deux, en parallèle, toujours.** L'une sans l'autre rend aveugle d'un œil.

### 6.1 L'engagement — « est-ce que je gagne de l'argent ? »

P&L mensuel en engagement : coûts remis en face des ventes qu'ils ont servies, cascade CM1 → CM2 → CM3, comparaison M-1 et même mois N-1. Produit entre J+2 et J+5 après la fin du mois. C'est la lecture de la **rentabilité**.

### 6.2 La trésorerie — « est-ce que je survis ? »

Le compte bancaire ment par construction : un achat de stock déforme un trimestre ; les payouts décalent le cash du CA ; la pub et les abonnements prépayés sortent avant les mois qu'ils servent ; **la TVA collectée dort sur le compte et semble être « son » argent jusqu'à la déclaration** (grand classique de la fausse trésorerie confortable).

**Le prévisionnel 13 semaines** : entrées datées (payouts avec leurs vrais délais, virements, précommandes) ; sorties datées (fournisseurs — acomptes et soldes —, pub, logistique, outils, salaires, TVA et taxes à leurs échéances réelles) ; solde projeté semaine par semaine. **La ligne qui compte : le point bas — quand, et à combien ?** La bonne question n'est jamais « combien j'ai en banque ? » mais « où sera mon point bas dans les 13 prochaines semaines ? ». Mis à jour chaque semaine. Ce qu'il change : décider des réappros et du budget pub en connaissance de cause, anticiper un besoin de financement, négocier avant d'être au pied du mur.

---

## 7. Le stock : une décision d'offre, pas un dogme

« Le stock c'est du cash gelé » et « le stock c'est de la disponibilité » sont tous les deux vrais. L'analyse ne prescrit jamais une politique de stock dans l'absolu : elle la juge **par rapport à ce que l'offre promet**.

Facteurs d'arbitrage :

1. **Le produit** : péremption, saisonnalité, risque de démodé vs evergreen. Périssable/saisonnier → surstock interdit ; permanent → tolérable.
2. **La chaîne logistique** : délai de réappro ET délai de livraison client. Stock local = livraison rapide mais cash immobilisé ; flux tendu/dropshipping = cash léger mais délais longs, plus de SAV et de refunds. MOQ et coûts 3PL entrent dans l'équation.
3. **Les règles qui bougent** : depuis juillet 2026, l'UE applique 3 € de droit de douane par catégorie d'article sur les colis importés ≤ 150 € (fin de la franchise) ; une redevance de gestion européenne arrive en novembre 2026. Le coût réel d'un produit importé évolue — recalculer régulièrement le coût de revient et l'impact marge.
4. **L'objectif business** : si le modèle vise la récurrence, disponibilité et délai de livraison sont des investissements dans la rétention. **Une rupture sur un best-seller pendant que les campagnes tournent = budget pub brûlé** → alerte prioritaire.

Les quatre questions permanentes du pilotage de stock :

- **Combien de jours de vente devant moi ?** Produit par produit, sur la base des ventes récentes — jamais un montant global en euros. C'est ce chiffre qui déclenche (ou pas) un réappro.
- **Quels produits méritent un buffer ?** Les quelques références qui font l'essentiel du CA : une rupture sur elles coûte plus cher que leur stock de sécurité.
- **Qu'est-ce qui dort ?** Stock qui ne tourne plus = cash gelé + coût de stockage. Identifier, recommander le déstockage, réinvestir.
- **Sur quoi se basent les réappros ?** Sur la vitesse de vente des dernières semaines et la saison qui vient — jamais sur l'historique annuel ni l'intuition. Détecter et signaler les réappros « calqués sur l'an dernier ».

Exemples de politiques opposées, toutes deux correctes : un best-seller à réachat avec promesse 48 h justifie un buffer généreux (le stock est un investissement dans la rétention) ; une édition limitée saisonnière sans réachat justifie une production à 80 % de la prévision en acceptant de rater le haut (l'invendu post-saison vaut zéro).

---

## 8. Le pilotage à deux étages : l'organisation de l'attention

### 8.1 L'étage founder — peu de chiffres, mais les bons

**Il n'existe pas de liste universelle.** Les chiffres du founder dépendent du shop, du modèle et du profil. Ils doivent tenir sur une page. La plateforme les configure par shop :

- **Socle commun (quasi tous les shops)** : CA net (de refunds et remises), marge après pub en % et en euros, cash disponible et point bas à venir.
- **Selon le modèle** : one-shot/dropshipping → marge par commande, coût par achat, taux de refund · marque à réachat → CAC vs valeur client, taux de réachat par cohorte · gros catalogue → marge des best-sellers, stock dormant.
- **Selon le profil du founder** : media buyer dans l'âme → MER/nMER en quotidien · profil produit/ops → coûts logistiques et niveaux de stock en hebdo · founder qui délègue → point mensuel structuré + alertes entre deux.
- **Une north star, une seule** — souvent la marge après pub en euros — qui tranche quand deux décisions se contredisent. Si tout est prioritaire, rien ne l'est.

### 8.2 L'étage analyste — la granularité qui casse les moyennes

Les moyennes mentent ; l'étage analyste croise les KPI e-commerce classiques et la lecture financière. Chantiers permanents :

1. **Marge par canal** (Meta, Google, TikTok, influence) : un blended correct peut cacher un canal qui perd et se faire subventionner en silence.
2. **Marge par produit** : un best-seller en promo au coût logistique élevé peut être le moins rentable du catalogue.
3. **Panier moyen & conversion** (AOV, taux de conversion, abandon panier) : reliés au seuil de livraison offerte et aux bundles, ce sont des leviers de marge.
4. **Tunnel d'acquisition** (CPM, CPC, CTR, ROAS par campagne) : les indicateurs du media buying, rapprochés du coût réel par nouveau client.
5. **Cohortes & réachat** (60/90 jours par mois d'acquisition) : la qualité des clients acquis se voit ici, bien avant le CA.
6. **Coûts qui dérivent** (livraison par commande, refunds, remise moyenne, frais PSP) : les érosions lentes, invisibles sans suivi dédié.

### 8.3 Le filtre : les 3 points du mois

Livrable central de l'étage analyste : **3 points d'attention par mois, une ligne chacun** — pas un rapport de 40 pages. Critères de sélection d'un point : (a) impact marge ou cash significatif, (b) invisible dans les chiffres que le founder regarde déjà, (c) actionnable ou nécessitant une décision. Chaque point = constat chiffré + lecture + décision possible ou question à trancher. La granularité sert à filtrer, pas à noyer.

---

## 9. Le rituel et les livrables

**Philosophie : quelques KPI au quotidien pour garder la main — un point global détaillé et du conseil chaque mois pour décider. La régularité bat l'intelligence.**

- **Quotidien (2 minutes)** : les chiffres définis pour le shop (ventes, dépense pub, marge estimée, cash). Un coup d'œil, pas une analyse.
- **J+2 à J+5** : dashboard produit — mois consolidé, ventes nettes, coûts réels, cascade de marges, cash ; comparaison M-1 et même mois N-1.
- **J+6 à J+8** : présentation et lecture détaillée — chiffres clés, les 3 points d'attention, du conseil, 1 à 2 décisions actées avec responsable et échéance.
- **Trimestre** : recalibrage — les coûts ont bougé ? Marge réelle recalculée, ROAS/MER breakeven mis à jour, cibles ajustées. (Les breakevens ne sont jamais figés : tarifs transporteurs, coûts produit, mix de vente et taxes évoluent.)

**Structure du dashboard (hiérarchie de lecture, de haut en bas) :**

1. **Hero** — les chiffres clés du shop (adaptés au modèle et au profil), variations vs M-1 colorées.
2. **La cascade de marges du mois** — CA → CM1 → CM2 → CM3 en waterfall, postes qui ont bougé mis en évidence.
3. **Acquisition & rétention** — CAC par canal, nMER, cohortes de réachat.
4. **Cash & stock** — prévisionnel 13 semaines, jours de vente par produit, alertes stock dormant / rupture best-seller.
5. **Les 3 points du mois** — la synthèse rédigée de l'étage analyste.

**Test de qualité d'un dashboard : le founder peut le lire seul en 10 minutes et savoir quoi décider.** La revue mensuelle sert à aller plus loin — pas à décoder.

---

## 10. Les signaux d'attention (tempérés, contextuels)

Aucun signal n'est une alarme absolue — tout dépend du shop, de la saison et du contexte. Mais quand l'un s'installe, il mérite une vraie question ce mois-ci. L'outil les détecte, les contextualise, et les formule comme des questions ou des vérifications, pas comme des verdicts :

1. **CAC nouveau client en hausse plusieurs mois** — peut venir d'une créa qui fatigue, d'une saison, d'enchères plus chères ; si ça s'installe, vérifier avant que ça se cumule.
2. **nMER qui se dégrade alors que le MER reste stable** — souvent le réachat qui masque une acquisition moins efficace ; à comprendre.
3. **Jours de stock qui gonflent** — parfois un choix assumé (buffer avant un pic), parfois des réappros trop optimistes ou un produit qui ralentit ; la différence se vérifie.
4. **Refunds en dérive durable** — pointe vers la qualité, le délai de livraison ou la promesse produit ; chaque point de refund se paie en marge.
5. **Marge érodée en période promo** — remises + coûts pub plus chers = double compression ; à mesurer pour que BFCM reste un bon mois en marge, pas seulement en CA.
6. **Point bas de trésorerie qui se rapproche** — le prévisionnel montre le mur des mois à l'avance ; toute la différence entre négocier et subir.

Règle de formulation : signal = constat chiffré + hypothèses plausibles + vérification proposée. Jamais d'alarmisme, jamais de conclusion sans contexte.

---

## 11. Ton, vocabulaire et style des livrables

- **Tutoiement**, direct, sans condescendance.
- **Langage e-commerce nouvelle génération** : shop, marque DTC, dropshipping, media buying, créas, adset, payouts, refunds, best-seller, BFCM, bundles, AOV.
- **Jargon comptable proscrit côté client** : pas de BFR, DIO, DSO, DPO, CCC dans les livrables — traduire en langage simple (« jours entre payer le fournisseur et encaisser », « jours de vente devant toi »). CM1/CM2/CM3, CAC, LTV, MER, ROAS, payback sont acceptés car enseignés dans le module.
- **Exemples chiffrés concrets** à l'appui de chaque explication (le produit à 12 €/40 €, la commande de 80 €, le breakeven à 1/CM2).
- **Jamais de posture anti-outils** (Shopify, Ads Manager) ni de moralisation des choix passés du founder : constater, expliquer, proposer.
- Formules signature utilisables : « Ton CA raconte une histoire. Ta marge dit la vérité. » · « Un ROAS s'interprète toujours par rapport à ta marge. » · « Rentable et liquide sont deux états différents. » · « Le founder voit peu, mais voit juste. » · « La régularité bat l'intelligence. » · « Piloter, pas constater. »

---

## 12. Garde-fous analytiques (checklist avant toute conclusion)

1. Les ventes sont-elles **nettes** (refunds, remises déduits) ?
2. Les coûts sont-ils **en engagement**, remis en face des ventes qu'ils ont servies ?
3. Le jugement publicitaire est-il rapporté au **breakeven du shop** (1/CM2) et non à une norme externe ?
4. La décision d'acquisition repose-t-elle sur le **CAC nouveau client complet**, pas le blended ni la pub seule ?
5. Si la LTV est invoquée : le **réachat est-il prouvé par cohortes** ? En marge ? Sinon, basculer sur le test à la commande.
6. La moyenne cache-t-elle une dispersion (par canal, par produit, par cohorte) ?
7. Le contexte est-il pris en compte (saison, promo, lancement, changement de mix, changement réglementaire) ?
8. La lecture rentabilité est-elle doublée d'une lecture **trésorerie** (point bas 13 semaines) ?
9. La conclusion est-elle formulée en **fait / hypothèse / recommandation** clairement distingués ?
10. Le livrable final tient-il le test des « 3 points, une ligne chacun, actionnables » ?

---

*Fin de la doctrine. Toute évolution de méthode (nouveaux seuils, nouvelles règles fiscales ou douanières, nouveaux benchmarks) doit être intégrée à ce document pour rester la source unique de vérité de la plateforme.*

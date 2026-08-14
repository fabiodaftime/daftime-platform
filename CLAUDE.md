# CLAUDE.md — Daftime Advisory (plateforme)

## Doctrine = source de vérité du moteur d'analyse
La méthode d'analyse financière de la plateforme est définie dans **`docs/Doctrine_Pilotage_Econamy_Daftime.md`**.
Elle **fait autorité** : toute extraction, tout calcul, tout seuil et toute rédaction produits par le moteur
(`standardize-data`, `generate-dashboard`, `dashboardRender`, `chat-*`) doivent être cohérents avec elle.
Elle **prime sur toute convention générale** de finance ou d'e-commerce.

Points structurants à respecter :
- **Cascade CM1 → CM2 → CM3** au cœur (pas la marge brute ni l'EBITDA). Un coût mal classé dans la cascade rend l'analyse fausse.
- **Marge-first** : le CA n'est jamais l'axe de jugement ; toute conclusion part de la marge réelle.
- **Breakeven publicitaire = 1 / CM2**, calculé par shop et recalculé chaque période (jamais une norme externe).
- **Double lecture toujours** : engagement (« je gagne de l'argent ? ») + trésorerie (« je survis ? », point bas 13 semaines).
- **Livrable central = « 3 points du mois »**, une ligne chacun (filtre > exhaustivité).
- **Ordre de raisonnement contraint** : (1) le shop gagne-t-il et où ? (2) acquisition rentable ? (3) vitesse de croissance ? (4) à regarder ce mois-ci ? — jamais (3) avant (1) et (2).
- **Ton normé** (section 11) : tutoiement, langage e-commerce, jargon comptable (BFR/DIO/DSO/DPO/CCC) proscrit côté client.
- Retraitement **en engagement** obligatoire ; distinction explicite **fait / hypothèse / recommandation**.

## Backend partagé avec la prod Lovable
Supabase `emsixhbnlvnhpfleecln` **partagé** avec la prod Lovable. Déployer uniquement les edge functions
platform-only ; migrations **additives** ; ne jamais pousser sur `origin/main` (= Lovable). Détail : mémoire de session `daftime-lovable-platform-couplage`.

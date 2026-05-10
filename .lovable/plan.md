# Automatisation des données : Google Sheets → Dashboards

## Pourquoi c'est faisable maintenant

On vient de poser la table `entity_monthly_inputs` (Phase 1 Digit) qui sert de **source de vérité unique**. Tout dashboard lit depuis cette table → il suffit donc d'**alimenter cette table automatiquement** depuis une source externe pour que tous les dashboards se mettent à jour en cascade (KPIs entité + consolidé PCGroup).

C'est le bon moment : on n'a qu'**une seule porte d'entrée à automatiser**, pas 10 dashboards à refactorer.

## Architecture proposée

```text
┌──────────────────┐      ┌──────────────────┐      ┌────────────────────┐
│  Google Sheet    │─────▶│  Edge Function   │─────▶│ entity_monthly_    │
│  (source live)   │ pull │  sync-gsheet     │ write│ inputs (DB)        │
└──────────────────┘      └──────────────────┘      └────────────────────┘
        │                          ▲                          │
        │ webhook (Apps Script)    │ cron pg_cron             │ Realtime
        │ ou trigger onEdit        │ (toutes les 15 min)      ▼
        └──────────────────────────┘                  Dashboards refresh
                                                      automatique
```

Trois mécanismes de déclenchement, cumulables :
1. **Push instantané** : Apps Script dans le Sheet → POST vers une edge function dès qu'une cellule change (latence ~2 sec)
2. **Pull périodique** : `pg_cron` toutes les 15 min appelle l'edge function (filet de sécurité)
3. **Bouton "Synchroniser maintenant"** dans l'écran Super Admin

## Sources supportées

| Source | Statut | Mécanisme |
|---|---|---|
| **Google Sheets** | Phase 1 (priorité) | Connector Google Sheets déjà disponible dans Lovable Cloud |
| **Excel** (OneDrive/SharePoint) | Phase 2 | Connector Microsoft Excel |
| **Zoho Books / CRM** | Phase 3 | API Zoho directe (pas de connector natif → secret OAuth) |
| **CSV upload manuel** | déjà existant | Garde le fallback actuel |

## Mapping configurable (clé du système)

Une nouvelle table `entity_data_mappings` qui décrit, **par entité**, comment lire le fichier source :

```
entity_layout: 'digit'
source_type: 'google_sheets'
source_ref: 'sheet_id_xxx' / 'tab=Janvier 2026'
field_map: {
  "ca_total":   { cell: "B5",  type: "number" },
  "marge":      { cell: "B12", type: "number" },
  "deals":      { cell: "B20", type: "integer" },
  "produits":   { range: "A30:D40", type: "table", schema: [...] }
}
month_detection: { column: "A", format: "YYYY-MM" }
```

L'écran Super Admin permet de :
- Coller l'URL du Google Sheet
- Voir un aperçu des cellules
- Mapper visuellement chaque champ (clic sur la cellule du preview → assignation au champ Digit)
- Tester le mapping (mode dry-run qui montre ce qui serait écrit)
- Activer la synchro

## Phase 1 — Pilote Google Sheets sur Digit (~1 jour)

1. Connecter le **connector Google Sheets** (OAuth via Lovable)
2. Créer la table `entity_data_mappings` + RLS Super Admin
3. Edge function `sync-gsheet-to-inputs` :
   - Lit le mapping pour `digit`
   - Appelle gateway Google Sheets API
   - Valide via le schéma Zod existant (`entityInputs/schema.ts`)
   - Upsert dans `entity_monthly_inputs`
   - Log dans `entity_input_edits_log` (actor = "auto-sync")
4. Écran Super Admin **`/admin/data-sources`** :
   - Liste des entités, colonne "Source" (manuel / Google Sheets / dernière synchro)
   - Modal de mapping avec preview du Sheet
   - Bouton "Synchroniser maintenant"
   - Toggle "Auto-sync activé"
5. Apps Script template (collable dans le Sheet par l'utilisateur) qui POST vers l'edge function sur `onEdit`
6. Optionnel : `pg_cron` 15 min comme filet

## Phase 2 — Étendre

- Ajouter Excel (même pattern, autre connector)
- Étendre le mapping aux autres entités (Structuring, Agency, Bocuse...)
- Tableau de bord "Santé des syncs" : dernière exécution, erreurs, écarts détectés

## Phase 3 — Zoho

- OAuth Zoho (secret à ajouter, pas de connector natif)
- Mapping orienté "compte comptable" plutôt que "cellule"
- Reprise du même pipeline d'écriture

## Garde-fous

- **Validation Zod stricte** avant écriture (un mauvais format Sheet ne corrompt pas la DB)
- **Audit trail** complet : qui a sync, quand, quelles valeurs ont changé
- **Mode "draft"** : la sync écrit dans une zone de staging, un Super Admin valide avant publication (optionnel, à activer par entité)
- **Verrouillage manuel** : si un Super Admin a édité une cellule manuellement, la sync ne l'écrase pas sans confirmation
- **Alertes** : si la sync échoue 3x ou si un écart > X% est détecté → toast + entrée dans le journal

## Questions avant de partir

1. **Source prioritaire** : on commence par Google Sheets (le plus simple, OAuth déjà géré) ou tu veux directement Zoho ?
2. **Granularité du Sheet** : un Sheet par entité (plus simple à mapper) ou un Sheet maître consolidé (un seul mapping mais plus complexe) ?
3. **Mode strict ou tolérant** : la sync écrase toujours les valeurs manuelles, ou demande confirmation quand il y a conflit ?

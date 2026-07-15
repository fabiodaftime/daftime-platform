# Daftime Advisory — Plateforme

Application de pilotage financier e-commerce (dashboards + espace client).

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Storage, Edge Functions)

## Développement

```sh
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:8080`.

## Build

```sh
npm run build
```

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner les clés Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

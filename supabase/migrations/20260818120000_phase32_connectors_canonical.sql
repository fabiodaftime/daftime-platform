-- Phase 32 — Couche connecteurs : tables canoniques (secteur ecommerce d'abord)
--
-- ADDITIF & PLATFORM-ONLY. Backend Supabase partage avec la prod Lovable :
--   * uniquement des CREATE (aucun ALTER sur une table existante) ;
--   * prefixe `src_` sur tout le sous-systeme pour eviter toute collision de nom
--     avec une table Lovable non presente dans ce repo (ex. un eventuel public.orders).
--
-- Modele : une ligne = une chose reelle (connexion / commande / ligne de depense pub),
-- independant de la source. `raw jsonb` conserve le payload d'origine pour re-derivation.
-- Idempotence : cle UNIQUE (source, external_id...) -> les upserts ne dupliquent jamais.
-- Les tokens OAuth ne sont PAS stockes ici : ils vivent chez Nango, on ne garde que le pointeur.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. src_connections : une par (client, provider)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.src_connections (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    provider            text NOT NULL,                 -- 'shopify' | 'meta' | 'google_ads' | 'tiktok'
    nango_connection_id text,                          -- pointeur cote Nango (pas de token chez nous)
    external_account_id text,                          -- domaine .myshopify.com / ad_account_id
    scopes              text[] NOT NULL DEFAULT '{}',
    status              text NOT NULL DEFAULT 'pending',-- 'pending' | 'active' | 'error' | 'revoked'
    last_synced_at      timestamptz,
    last_error          text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, provider, external_account_id)
);
CREATE INDEX IF NOT EXISTS idx_src_connections_client ON public.src_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_src_connections_nango  ON public.src_connections(nango_connection_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. src_orders : canonique commerce (Shopify d'abord)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.src_orders (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    connection_id    uuid REFERENCES public.src_connections(id) ON DELETE SET NULL,
    source           text NOT NULL,                    -- 'shopify'
    external_id      text NOT NULL,                    -- order id cote source
    occurred_at      timestamptz,                      -- date de commande
    currency         text,
    gross            numeric,                          -- avant remises
    discounts        numeric,
    refunds          numeric,
    tax              numeric,
    shipping         numeric,
    net              numeric,                          -- CA net (aligne sur la logique ventes nettes)
    financial_status text,                             -- paid / refunded / partially_refunded
    customer_type    text,                             -- 'new' | 'returning'
    country          text,
    raw              jsonb,
    synced_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, source, external_id)
);
CREATE INDEX IF NOT EXISTS idx_src_orders_client_period ON public.src_orders(client_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_src_orders_connection    ON public.src_orders(connection_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. src_ad_spend : canonique pub (Meta / Google / TikTok — meme table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.src_ad_spend (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    connection_id    uuid REFERENCES public.src_connections(id) ON DELETE SET NULL,
    source           text NOT NULL,                    -- 'meta' | 'google_ads' | 'tiktok'
    external_id      text NOT NULL,                    -- id de la ligne d'insight cote source
    spend_date       date NOT NULL,                    -- grain journalier
    level            text NOT NULL DEFAULT 'campaign', -- 'campaign' | 'adset' | 'ad'
    campaign_id      text,
    campaign_name    text,
    spend            numeric,
    impressions      bigint,
    clicks           bigint,
    conversions      numeric,
    conversion_value numeric,
    currency         text,
    raw              jsonb,
    synced_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, source, external_id, spend_date, level)
);
CREATE INDEX IF NOT EXISTS idx_src_ad_spend_client_date ON public.src_ad_spend(client_id, spend_date);
CREATE INDEX IF NOT EXISTS idx_src_ad_spend_connection  ON public.src_ad_spend(connection_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers updated_at (fonction existante partagee)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER update_src_connections_updated_at
    BEFORE UPDATE ON public.src_connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS : lecture si acces au client (staff = tout, client = le sien via has_client_access) ;
--       ecritures reservees au staff cote RLS — les edge functions ecrivent en service_role
--       (qui contourne le RLS). Meme modele que files/dashboards.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.src_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.src_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.src_ad_spend    ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.src_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.src_orders      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.src_ad_spend    TO authenticated;
GRANT ALL ON public.src_connections TO service_role;
GRANT ALL ON public.src_orders      TO service_role;
GRANT ALL ON public.src_ad_spend    TO service_role;

CREATE POLICY "src_connections selectable by access"
    ON public.src_connections FOR SELECT TO authenticated
    USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "src_connections managed by staff"
    ON public.src_connections FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "src_orders selectable by access"
    ON public.src_orders FOR SELECT TO authenticated
    USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "src_orders managed by staff"
    ON public.src_orders FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "src_ad_spend selectable by access"
    ON public.src_ad_spend FOR SELECT TO authenticated
    USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "src_ad_spend managed by staff"
    ON public.src_ad_spend FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Note : src_bank_transactions volontairement non cree ici (banque = phase ulterieure).

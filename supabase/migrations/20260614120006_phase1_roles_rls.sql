-- Phase 1 — Lien user->client, fonctions helper des nouveaux roles, et policies RLS

-- Rattachement d'un user a un client (additif : on garde company_id pour le legacy)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_user_roles_client ON public.user_roles(client_id);

-- ============ Fonctions helper (memes conventions SECURITY DEFINER que le legacy) ============

-- Personnel Daftime (voit tous les clients)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'manager', 'collaborateur')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'manager');
$$;

-- Acces a un client : staff (tous) OU client rattache a ce client_id
CREATE OR REPLACE FUNCTION public.has_client_access(_user_id uuid, _client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.is_staff(_user_id) OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND client_id = _client_id
    );
$$;

-- ============ Policies RLS ============

-- activity_types : lisible par tout authentifie, gere par le staff
CREATE POLICY "activity_types readable by authenticated"
    ON public.activity_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_types managed by staff"
    ON public.activity_types FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- clients : visible si acces, gere par le staff
CREATE POLICY "clients selectable by access"
    ON public.clients FOR SELECT TO authenticated
    USING (public.has_client_access(auth.uid(), id));
CREATE POLICY "clients managed by staff"
    ON public.clients FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- files : lecture si acces ; le client PEUT deposer (INSERT) sur son client_id ;
-- modification/suppression reservees au staff
CREATE POLICY "files selectable by access"
    ON public.files FOR SELECT TO authenticated
    USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "files insertable by access"
    ON public.files FOR INSERT TO authenticated
    WITH CHECK (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "files updatable by staff"
    ON public.files FOR UPDATE TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "files deletable by staff"
    ON public.files FOR DELETE TO authenticated
    USING (public.is_staff(auth.uid()));

-- contexts : interne, staff uniquement
CREATE POLICY "contexts managed by staff"
    ON public.contexts FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- standardized_data : source de verite interne, staff uniquement
CREATE POLICY "standardized_data managed by staff"
    ON public.standardized_data FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- dashboards : staff voit tout ; le client ne voit QUE ses dashboards publies
CREATE POLICY "dashboards selectable by staff or published to client"
    ON public.dashboards FOR SELECT TO authenticated
    USING (
        public.is_staff(auth.uid())
        OR (public.has_client_access(auth.uid(), client_id) AND status = 'publie')
    );
CREATE POLICY "dashboards managed by staff"
    ON public.dashboards FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- dashboard_status_history : trace interne, staff uniquement
CREATE POLICY "dashboard_status_history managed by staff"
    ON public.dashboard_status_history FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- activity_log : lecture si acces au client (client_id NULL => staff seulement) ;
-- chacun ne peut inserer que des lignes a son propre nom
CREATE POLICY "activity_log selectable by access"
    ON public.activity_log FOR SELECT TO authenticated
    USING (public.has_client_access(auth.uid(), client_id));
CREATE POLICY "activity_log insert self"
    ON public.activity_log FOR INSERT TO authenticated
    WITH CHECK (actor_user_id = auth.uid());

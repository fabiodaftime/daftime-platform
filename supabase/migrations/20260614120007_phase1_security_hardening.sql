-- Phase 1 — Durcissement : reduire l'exposition des fonctions SECURITY DEFINER (advisor lint 0028/0029)

-- handle_new_user est un trigger sur auth.users : jamais appele en RPC -> on retire EXECUTE partout
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Les helpers RLS doivent rester appelables par "authenticated" (le RLS les evalue),
-- mais "anon" n'en a aucun usage legitime -> on retire EXECUTE a anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_company_access(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_revision_file_access(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_manager(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_client_access(uuid, uuid) FROM anon;

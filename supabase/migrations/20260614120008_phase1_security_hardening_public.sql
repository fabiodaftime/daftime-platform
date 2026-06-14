-- Phase 1 — Durcissement (correctif) : neutraliser le grant EXECUTE par defaut a PUBLIC
--
-- En Postgres, une fonction recoit par defaut EXECUTE pour PUBLIC (dont anon herite).
-- Le REVOKE ... FROM anon de la migration precedente etait donc sans effet.
-- On retire ici le grant PUBLIC, puis on re-accorde explicitement a authenticated.
--
-- NB : on ne touche PAS aux helpers LEGACY (has_role, is_super_admin, has_company_access,
-- has_revision_file_access) car des policies legacy sans clause TO s'appliquent aussi a anon
-- et les appellent -> les verrouiller casserait la coexistence. WARN herites assumes.

-- handle_new_user : trigger sur auth.users, jamais appele en RPC -> aucun EXECUTE necessaire
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Nos nouveaux helpers : toutes nos policies sont TO authenticated, anon n'en a aucun besoin
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_manager(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_manager(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_client_access(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_client_access(uuid, uuid) TO authenticated, service_role;

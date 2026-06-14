// Garde de sécurité commune : exige un utilisateur connecté ayant un rôle "staff".
// Accepte les nouveaux rôles (admin/manager/collaborateur) ET le legacy super_admin
// le temps de la coexistence.

import type { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { serviceClient, userClient } from "./supabaseClients.ts";

const STAFF_ROLES = ["admin", "manager", "collaborateur", "super_admin"];

export type GuardResult =
  | { ok: false; error: string; status: number }
  | { ok: true; user: User; admin: SupabaseClient };

export async function requireStaff(req: Request): Promise<GuardResult> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return { ok: false, error: "Not authenticated", status: 401 };

  const { data: userData, error } = await userClient(authHeader).auth.getUser();
  if (error || !userData?.user) return { ok: false, error: "Not authenticated", status: 401 };

  const admin = serviceClient();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const isStaff = (roles ?? []).some((r: { role: string }) => STAFF_ROLES.includes(r.role));
  if (!isStaff) return { ok: false, error: "Staff role required", status: 403 };

  return { ok: true, user: userData.user, admin };
}

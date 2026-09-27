// ⑩ client-access — accès d'un CLIENT à son espace (/client/:id). Staff uniquement.
//   list   : personnes ayant accès au dossier ;
//   invite : crée le compte si besoin + rôle « client » sur le dossier, et renvoie un LIEN D'ACCÈS que le
//            conseiller envoie lui-même (aucun e-mail automatique). Le lien pointe sur /bienvenue de la
//            plateforme, qui valide le jeton côté navigateur (verifyOtp) : pas de dépendance à la liste
//            d'URL de redirection de l'authentification (partagée avec la prod Lovable).
//   revoke : retire l'accès au dossier (le compte reste).
// Body: { action, client_id, email?, user_id?, origin }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";

const ORIGINS = ["https://daftime-advisory-platform.com", "https://www.daftime-advisory-platform.com", "https://daftime-platform.vercel.app"];
const isLocal = (o: string) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin } = guard;
    const body = await req.json().catch(() => ({}));
    const { action, client_id } = body as { action?: string; client_id?: string };
    if (!client_id) return json({ error: "client_id requis" }, 400);

    if (action === "list") {
      const { data: roles } = await admin.from("user_roles").select("id, user_id, created_at").eq("client_id", client_id).eq("role", "client");
      const people = [];
      for (const r of (roles ?? []) as { id: string; user_id: string; created_at: string }[]) {
        const { data } = await admin.auth.admin.getUserById(r.user_id);
        people.push({ role_id: r.id, user_id: r.user_id, email: data.user?.email ?? "?", since: r.created_at, last_sign_in_at: data.user?.last_sign_in_at ?? null });
      }
      return json({ people });
    }

    if (action === "revoke") {
      const { user_id } = body as { user_id?: string };
      if (!user_id) return json({ error: "user_id requis" }, 400);
      await admin.from("user_roles").delete().eq("client_id", client_id).eq("user_id", user_id).eq("role", "client");
      return json({ ok: true });
    }

    if (action === "invite") {
      const email = String((body as { email?: string }).email ?? "").trim().toLowerCase();
      const origin = String((body as { origin?: string }).origin ?? "");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "E-mail invalide." }, 400);
      if (!ORIGINS.includes(origin) && !isLocal(origin)) return json({ error: "Origine non autorisée." }, 400);

      // Nouveau compte → lien d'invitation (le client choisira son mot de passe) ; compte existant → lien de connexion.
      let type: "invite" | "magiclink" = "invite";
      let res = await admin.auth.admin.generateLink({ type: "invite", email });
      if (res.error && /already|registered|exists/i.test(res.error.message)) { type = "magiclink"; res = await admin.auth.admin.generateLink({ type: "magiclink", email }); }
      if (res.error || !res.data?.user || !res.data.properties?.hashed_token) return json({ error: res.error?.message ?? "Lien impossible à générer." }, 500);
      const user = res.data.user;

      // Un compte du staff ne devient jamais « client » (sécurité : pas de mélange des rôles).
      const { data: staffRole } = await admin.from("user_roles").select("id").eq("user_id", user.id).in("role", ["admin", "manager", "collaborateur", "super_admin"]).limit(1);
      if (staffRole?.length) return json({ error: "Cet e-mail est un compte de l'équipe Daftime." }, 400);
      const { data: has } = await admin.from("user_roles").select("id").eq("user_id", user.id).eq("client_id", client_id).eq("role", "client").maybeSingle();
      if (!has) { const { error } = await admin.from("user_roles").insert({ user_id: user.id, role: "client", client_id }); if (error) throw error; }

      const link = `${origin}/bienvenue?token_hash=${encodeURIComponent(res.data.properties.hashed_token)}&type=${type}`;
      return json({ ok: true, email, link, type, expires_in_minutes: 60 });
    }
    return json({ error: "action inconnue" }, 400);
  } catch (e) {
    console.error("client-access:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

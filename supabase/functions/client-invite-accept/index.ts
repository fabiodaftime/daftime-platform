// client-invite-accept — utilise une INVITATION DAFTIME (lien envoyé par le conseiller, valable 7 jours).
// Appelée par /bienvenue SANS session (la personne n'est pas encore connectée) : la sécurité repose sur le jeton
// (256 bits aléatoires, stocké haché, usage unique, expiration, annulé si l'accès est retiré).
// Renvoie un lien de connexion Supabase à consommer immédiatement (verifyOtp dans le navigateur) ; la durée de
// ces liens (1 h) est un réglage partagé avec la prod Lovable, auquel on ne touche pas.
// Body: { token }

import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabaseClients.ts";

const sha256 = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const EXPIRED = "Ce lien a expiré ou a déjà servi. Demande un nouveau lien à ton conseiller Daftime.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  try {
    const { token } = (await req.json().catch(() => ({}))) as { token?: string };
    if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return json({ error: EXPIRED }, 400);
    const admin = serviceClient();
    const { data: inv } = await admin.from("client_invitations").select("id, client_id, email, expires_at, used_at, revoked_at")
      .eq("token_hash", await sha256(token)).maybeSingle();
    if (!inv || inv.used_at || inv.revoked_at || new Date(inv.expires_at).getTime() < Date.now()) return json({ error: EXPIRED }, 400);

    // Usage unique : on marque l'invitation AVANT de générer le lien (deux clics simultanés → un seul passe).
    const { data: claimed } = await admin.from("client_invitations").update({ used_at: new Date().toISOString() })
      .eq("id", inv.id).is("used_at", null).select("id");
    if (!claimed?.length) return json({ error: EXPIRED }, 400);

    // Compte existant → lien de connexion ; compte jamais confirmé que Supabase refuserait → lien d'invitation.
    let type: "magiclink" | "invite" = "magiclink";
    let res = await admin.auth.admin.generateLink({ type: "magiclink", email: inv.email });
    if (res.error) { type = "invite"; res = await admin.auth.admin.generateLink({ type: "invite", email: inv.email }); }
    if (res.error || !res.data?.user || !res.data.properties?.hashed_token) {
      await admin.from("client_invitations").update({ used_at: null }).eq("id", inv.id); // l'invitation reste utilisable
      return json({ error: "Connexion impossible pour le moment — réessaie dans une minute." }, 500);
    }
    // L'accès au dossier doit toujours exister (retiré entre-temps → refus).
    const { data: role } = await admin.from("user_roles").select("id").eq("user_id", res.data.user.id).eq("client_id", inv.client_id).eq("role", "client").maybeSingle();
    if (!role) return json({ error: EXPIRED }, 400);

    // Première connexion → la personne choisit son mot de passe sur /bienvenue.
    const needsPassword = !res.data.user.last_sign_in_at;
    return json({ ok: true, token_hash: res.data.properties.hashed_token, type, needs_password: needsPassword || type === "invite" });
  } catch (e) {
    console.error("client-invite-accept:", e);
    return json({ error: "Connexion impossible pour le moment — réessaie dans une minute." }, 500);
  }
});

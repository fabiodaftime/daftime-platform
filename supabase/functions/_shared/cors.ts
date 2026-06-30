// CORS + helper de réponse JSON, partagés par les edge functions du pipeline IA.
// En prod, définir le secret ALLOWED_ORIGIN = l'origine de l'app (ex. https://app.daftime.ae)
// pour épingler CORS ; à défaut "*" (pratique en dev). L'auth reste portée par le header Bearer,
// donc le wildcard n'expose pas de session par cookie — c'est surtout du durcissement.

export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Vérifications de signature Shopify (clé = Client Secret de l'app publique, secret SHOPIFY_API_SECRET).
//  - WEBHOOKS (dont conformité RGPD) : en-tête X-Shopify-Hmac-Sha256 = base64(HMAC-SHA256(corps brut)).
//  - LANCEMENT DE L'APP (App URL ?shop=…&hmac=…) : hmac = hex(HMAC-SHA256(paramètres triés sans « hmac »)).
// Comparaisons en temps constant. Module pur (Web Crypto) : identique en Deno et en Node (tests).

const enc = new TextEncoder();
async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}
const safeEqual = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const toHex = (u: Uint8Array) => [...u].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function verifyWebhook(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header || !secret) return false;
  return safeEqual(toB64(await hmac(secret, rawBody)), header.trim());
}

export async function verifyLaunchQuery(params: URLSearchParams, secret: string): Promise<boolean> {
  const given = params.get("hmac");
  if (!given || !secret) return false;
  const message = [...params.entries()].filter(([k]) => k !== "hmac" && k !== "signature").sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`).join("&");
  return safeEqual(toHex(await hmac(secret, message)), given);
}

// Domaine de boutique valide (évite toute injection dans les appels Nango / Shopify).
export const isShopDomain = (s: string | null | undefined): s is string => !!s && /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(s);

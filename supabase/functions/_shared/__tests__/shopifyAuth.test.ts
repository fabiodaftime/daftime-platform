// @vitest-environment node
// Signatures Shopify : webhooks (base64) et lancement de l'app (hex, paramètres triés).
import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { isShopDomain, verifyLaunchQuery, verifyWebhook } from "../shopifyAuth.ts";

const SECRET = "shpss_test_secret";

describe("signatures Shopify", () => {
  it("webhook : HMAC base64 du corps brut ; corps modifié → refus", async () => {
    const body = JSON.stringify({ shop_domain: "x.myshopify.com", customer: { id: 1 } });
    const h = createHmac("sha256", SECRET).update(body).digest("base64");
    expect(await verifyWebhook(body, h, SECRET)).toBe(true);
    expect(await verifyWebhook(body + " ", h, SECRET)).toBe(false);
    expect(await verifyWebhook(body, null, SECRET)).toBe(false);
  });
  it("lancement : HMAC hex des paramètres triés, sans « hmac »", async () => {
    const p = new URLSearchParams({ shop: "x.myshopify.com", timestamp: "1790000000", host: "YWRtaW4" });
    const msg = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("&");
    p.set("hmac", createHmac("sha256", SECRET).update(msg).digest("hex"));
    expect(await verifyLaunchQuery(p, SECRET)).toBe(true);
    p.set("shop", "autre.myshopify.com");
    expect(await verifyLaunchQuery(p, SECRET)).toBe(false);
  });
  it("domaine de boutique", () => {
    expect(isShopDomain("83fbdb-2.myshopify.com")).toBe(true);
    expect(isShopDomain("evil.com/x.myshopify.com")).toBe(false);
  });
});

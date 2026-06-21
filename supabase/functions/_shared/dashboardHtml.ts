// Injection (anti-hallucination) des données validées dans un dashboard HTML :
// le HTML lit window.DASHBOARD_DATA, il ne réinvente pas les chiffres. On retire une
// éventuelle injection précédente avant de réinjecter.
export function injectDashboardData(html: string, data: unknown): string {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const cleaned = html.replace(/<script>\s*window\.DASHBOARD_DATA\s*=[\s\S]*?<\/script>/i, "");
  const tag = `<script>window.DASHBOARD_DATA = ${json};</script>`;
  return /<head[^>]*>/i.test(cleaned)
    ? cleaned.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`)
    : `${tag}\n${cleaned}`;
}

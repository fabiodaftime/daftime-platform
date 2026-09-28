// Wrapper minimal pour l'API Messages d'Anthropic + extraction de JSON robuste.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Paliers de modèle : Sonnet pour l'extraction/standardisation (éco, rapide), Opus pour la
// génération de dashboard / chat / analyse de charte (qualité).
export const MODELS = {
  fast: "claude-sonnet-5",
  quality: "claude-opus-5-5",
} as const;

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

// Réglages par modèle (génération 5) :
//  - Opus 5.5 réfléchit TOUJOURS (thinking non désactivable) : on règle la profondeur par l'effort (défaut
//    « medium ») et on ajoute une MARGE à max_tokens, car la réflexion est décomptée du même plafond — sinon
//    une réponse courte (900 jetons) serait tronquée. Il refuse aussi l'appel d'outil forcé (tool_choice « tool »).
//  - Sonnet 5 : réflexion coupée (latence d'extraction inchangée, et compatible avec l'appel d'outil forcé).
const THINKING_HEADROOM: Record<Effort, number> = { low: 2000, medium: 6000, high: 12000, xhigh: 20000, max: 32000 };
const alwaysThinks = (model: string) => /^claude-(opus-5-5|fable-5)/.test(model);
function modelParams(model: string, maxTokens: number, effort?: Effort): Record<string, unknown> {
  if (alwaysThinks(model)) {
    const e = effort ?? "medium";
    return { max_tokens: maxTokens + THINKING_HEADROOM[e], output_config: { effort: e } };
  }
  if (/^claude-sonnet-5/.test(model)) return { max_tokens: maxTokens, thinking: { type: "disabled" } };
  return { max_tokens: maxTokens };
}
// Refus des filtres de sécurité (HTTP 200, stop_reason « refusal ») → erreur explicite : les appelants
// ont tous un repli (texte déterministe, structure par défaut…).
function checkStop(data: { stop_reason?: string; stop_details?: { category?: string | null } | null }) {
  if (data.stop_reason === "refusal") throw new Error(`Anthropic refus (${data.stop_details?.category ?? "sans catégorie"})`);
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | unknown[]; // texte simple, ou blocs (image/document/text) pour le multimodal
}

export async function callAnthropic(opts: {
  model: string;
  system: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  temperature?: number;
  effort?: Effort;
  signal?: AbortSignal;
}): Promise<{ text: string; usage: unknown }> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquante — la définir via `supabase secrets set ANTHROPIC_API_KEY=...`");
  }
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      ...modelParams(opts.model, opts.max_tokens ?? 4096, opts.effort),
      // `temperature` n'est pas envoyé : refusé par les modèles récents. Paramètre conservé pour compat.
      system: opts.system,
      messages: opts.messages,
    }),
    signal: opts.signal,
  });
  const raw = await resp.text();
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${raw}`);
  const data = JSON.parse(raw);
  checkStop(data);
  const text = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
  return { text, usage: data.usage };
}

// Appel OUTILLÉ : réponse via un outil au schéma imposé (JSON Schema) → sortie structurée.
// Modèles qui acceptent l'appel forcé : tool_choice « tool ». Opus 5.5 (appel forcé refusé) : tool_choice
// « auto » + consigne explicite ; s'il répond en texte, on relit le JSON du texte.
export async function callAnthropicTool<T = Record<string, unknown>>(opts: {
  model: string;
  system: string;
  messages: AnthropicMessage[];
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
  max_tokens?: number;
  effort?: Effort;
  signal?: AbortSignal;
}): Promise<{ input: T | null; usage: unknown }> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  const forced = !alwaysThinks(opts.model);
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      ...modelParams(opts.model, opts.max_tokens ?? 1500, opts.effort),
      system: forced ? opts.system : `${opts.system}\n\nRéponds UNIQUEMENT en appelant l'outil « ${opts.tool.name} » (un seul appel, aucun texte).`,
      messages: opts.messages,
      tools: [opts.tool],
      tool_choice: forced ? { type: "tool", name: opts.tool.name } : { type: "auto" },
    }),
    signal: opts.signal,
  });
  const raw = await resp.text();
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${raw}`);
  const data = JSON.parse(raw);
  checkStop(data);
  const block = (data.content ?? []).find((b: { type: string; name?: string }) => b.type === "tool_use" && b.name === opts.tool.name);
  if (block) return { input: (block.input ?? null) as T | null, usage: data.usage };
  const text = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  try { return { input: extractJson<T>(text), usage: data.usage }; } catch { return { input: null, usage: data.usage }; }
}

// Retire d'éventuelles balises de code ```html ... ``` autour d'une sortie HTML brute.
export function stripCodeFences(s: string): string {
  const m = s.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : s).trim();
}

// Récupère le 1er objet JSON d'une sortie modèle (gère les fences ```json).
export function extractJson<T = Record<string, unknown>>(s: string): T {
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : s;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Aucun objet JSON dans la sortie du modèle");
  return JSON.parse(body.slice(start, end + 1)) as T;
}

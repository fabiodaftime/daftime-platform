// Wrapper minimal pour l'API Messages d'Anthropic + extraction de JSON robuste.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Paliers de modèle : Sonnet pour l'extraction/standardisation (éco), Opus pour la
// génération de dashboard / chat / analyse de charte (qualité). Le palier Anthropic
// de l'org a été relevé → Opus de nouveau disponible.
export const MODELS = {
  fast: "claude-sonnet-4-6",
  quality: "claude-opus-4-8",
} as const;

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | unknown[]; // texte simple, ou blocs (image/document/text) pour le multimodal
}

export async function callAnthropic(opts: {
  model: string;
  system: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
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
      max_tokens: opts.max_tokens ?? 4096,
      system: opts.system,
      messages: opts.messages,
    }),
    signal: opts.signal,
  });
  const raw = await resp.text();
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${raw}`);
  const data = JSON.parse(raw);
  const text = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
  return { text, usage: data.usage };
}

// Appel OUTILLÉ : force le modèle à répondre via un outil au schéma imposé (JSON Schema).
// Garantit une sortie structurée et validée par l'API (pas de parsing approximatif).
export async function callAnthropicTool<T = Record<string, unknown>>(opts: {
  model: string;
  system: string;
  messages: AnthropicMessage[];
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
  max_tokens?: number;
  signal?: AbortSignal;
}): Promise<{ input: T | null; usage: unknown }> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.max_tokens ?? 1500,
      system: opts.system,
      messages: opts.messages,
      tools: [opts.tool],
      tool_choice: { type: "tool", name: opts.tool.name },
    }),
    signal: opts.signal,
  });
  const raw = await resp.text();
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${raw}`);
  const data = JSON.parse(raw);
  const block = (data.content ?? []).find((b: { type: string; name?: string }) => b.type === "tool_use" && b.name === opts.tool.name);
  return { input: (block?.input ?? null) as T | null, usage: data.usage };
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

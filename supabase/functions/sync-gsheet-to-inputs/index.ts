// Sync Google Sheets → entity_monthly_inputs
// Reads entity_data_mappings for a given entity_layout, fetches values via the
// Lovable connector gateway, validates with the canonical Zod schema, and
// upserts into entity_monthly_inputs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

// Mirror of digit schema (kept here intentionally - edge functions are isolated)
const digitSchema = z.object({
  ca_total: z.number().nonnegative(),
  marge_total: z.number(),
  deals_total: z.number().int().nonnegative(),
  ca_core: z.number().nonnegative().default(0),
  marge_core: z.number().default(0),
  ca_spy: z.number().nonnegative().default(0),
  marge_spy: z.number().default(0),
  ca_comment: z.number().nonnegative().default(0),
  marge_comment: z.number().default(0),
});

const SCHEMAS: Record<string, z.ZodTypeAny> = {
  digit: digitSchema,
};

const BodySchema = z.object({
  entity_layout: z.string().min(1),
  dry_run: z.boolean().optional().default(false),
});

interface FieldMapEntry {
  cell: string; // e.g. "B5"
  type?: "number" | "integer";
}
interface MonthMap {
  [month_id: string]: { tab?: string; offset?: { row?: number; col?: number } };
}

function toNumber(raw: unknown): number {
  if (raw === null || raw === undefined || raw === "") return 0;
  if (typeof raw === "number") return raw;
  const s = String(raw).replace(/\s/g, "").replace(/,/g, ".").replace(/[^\d.\-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

async function fetchRange(spreadsheetId: string, range: string, lovableKey: string, gsheetsKey: string) {
  const url = `${GATEWAY}/spreadsheets/${spreadsheetId}/values/${range}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gsheetsKey,
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Sheets API ${r.status}: ${text}`);
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY missing — connect the Google Sheets connector");

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { entity_layout, dry_run } = parsed.data;

    // Auth: require a logged-in super admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Super admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const schema = SCHEMAS[entity_layout];
    if (!schema) throw new Error(`No schema for entity_layout="${entity_layout}"`);

    // Load mapping
    const { data: mapping, error: mapErr } = await admin
      .from("entity_data_mappings")
      .select("*")
      .eq("entity_layout", entity_layout)
      .maybeSingle();
    if (mapErr) throw mapErr;
    if (!mapping) throw new Error(`No mapping for ${entity_layout}`);

    const fieldMap = mapping.field_map as Record<string, FieldMapEntry>;
    const monthMap = mapping.month_map as MonthMap;
    const months = Object.keys(monthMap);
    if (months.length === 0) throw new Error("month_map is empty");

    const results: Array<{ month_id: string; status: string; error?: string; values?: unknown }> = [];

    for (const month_id of months) {
      try {
        const tab = monthMap[month_id]?.tab ?? mapping.sheet_tab ?? "Sheet1";
        // Fetch all unique cells mapped for this entity in one batch per month
        const inputs: Record<string, number> = {};
        for (const [field, entry] of Object.entries(fieldMap)) {
          const range = `'${tab}'!${entry.cell}`;
          const json = await fetchRange(mapping.source_ref, range, LOVABLE_API_KEY, GOOGLE_SHEETS_API_KEY);
          const raw = json?.values?.[0]?.[0];
          inputs[field] = entry.type === "integer" ? Math.round(toNumber(raw)) : toNumber(raw);
        }
        const validated = schema.parse(inputs);

        if (!dry_run) {
          // Upsert
          const { data: existing } = await admin
            .from("entity_monthly_inputs")
            .select("id, inputs")
            .eq("entity_layout", entity_layout)
            .eq("month_id", month_id)
            .is("company_id", null)
            .maybeSingle();

          if (existing) {
            await admin
              .from("entity_monthly_inputs")
              .update({ inputs: validated, updated_by: userData.user.id, notes: "auto-sync gsheet" })
              .eq("id", existing.id);
          } else {
            await admin.from("entity_monthly_inputs").insert({
              entity_layout,
              month_id,
              inputs: validated,
              updated_by: userData.user.id,
              notes: "auto-sync gsheet",
            });
          }

          await admin.from("entity_input_edits_log").insert({
            actor_id: userData.user.id,
            actor_name: "auto-sync (gsheet)",
            entity_layout,
            month_id,
            field_path: "$",
            old_value: existing?.inputs ?? null,
            new_value: validated,
          });
        }
        results.push({ month_id, status: "ok", values: validated });
      } catch (e) {
        results.push({ month_id, status: "error", error: e instanceof Error ? e.message : String(e) });
      }
    }

    const anyError = results.some((r) => r.status === "error");
    if (!dry_run) {
      await admin
        .from("entity_data_mappings")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: anyError ? "partial" : "ok",
          last_sync_error: anyError ? results.find((r) => r.error)?.error ?? null : null,
        })
        .eq("id", mapping.id);
    }

    return new Response(JSON.stringify({ ok: !anyError, dry_run, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-gsheet-to-inputs error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

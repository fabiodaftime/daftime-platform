-- Phase 9 — Pont WhatsApp : liaison entre un message WhatsApp envoyé au conseiller
-- et la conversation client concernée, pour router sa réponse (citation) vers le bon client.

CREATE TABLE IF NOT EXISTS public.wa_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_msg_id text NOT NULL,                                   -- id du message WhatsApp (SID Twilio) envoyé au conseiller
  client_id       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  advisor_id      uuid REFERENCES public.advisors(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_links_msg ON public.wa_links(provider_msg_id);
CREATE INDEX IF NOT EXISTS idx_wa_links_advisor ON public.wa_links(advisor_id, created_at);

ALTER TABLE public.wa_links ENABLE ROW LEVEL SECURITY;

-- Réservé au staff (les edge functions utilisent le service role et contournent le RLS).
DROP POLICY IF EXISTS "wa_links staff only" ON public.wa_links;
CREATE POLICY "wa_links staff only"
  ON public.wa_links FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Phase 8 — Messagerie client ↔ conseiller (une conversation par client).
-- Isolation : mêmes règles que le reste (has_client_access) — un client ne voit que SA
-- conversation, le staff voit tout.

CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_kind text NOT NULL CHECK (sender_kind IN ('client', 'staff')),
  body        text NOT NULL CHECK (length(trim(body)) > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_client ON public.messages(client_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Lecture : client rattaché OU staff.
DROP POLICY IF EXISTS "messages selectable by access" ON public.messages;
CREATE POLICY "messages selectable by access"
  ON public.messages FOR SELECT TO authenticated
  USING (public.has_client_access(auth.uid(), client_id));

-- Écriture : on n'écrit que pour un client auquel on a accès, en tant que soi-même,
-- et le sender_kind doit correspondre à son statut (staff/client).
DROP POLICY IF EXISTS "messages insertable by access" ON public.messages;
CREATE POLICY "messages insertable by access"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    public.has_client_access(auth.uid(), client_id)
    AND sender_id = auth.uid()
    AND (
      (public.is_staff(auth.uid()) AND sender_kind = 'staff')
      OR (NOT public.is_staff(auth.uid()) AND sender_kind = 'client')
    )
  );

-- Diffusion temps réel (pour voir les réponses arriver en direct).
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

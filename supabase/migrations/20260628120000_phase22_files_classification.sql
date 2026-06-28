-- phase22 : triage manuel des documents par l'équipe.
-- doc_role = rôle comptable IMPOSÉ par le collaborateur (prime sur la détection auto) :
--   revenue | payment | bank | expense | internal | ignore | null(=auto)
-- doc_note = commentaire de contexte par fichier (alimente l'IA et l'analyste).
alter table files add column if not exists doc_role text;
alter table files add column if not exists doc_note text;

comment on column files.doc_role is 'Rôle comptable imposé (revenue/payment/bank/expense/internal/ignore). NULL = détection automatique.';
comment on column files.doc_note is 'Commentaire de contexte sur le document (ex. "compte perso, à ignorer").';

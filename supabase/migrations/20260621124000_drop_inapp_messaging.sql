-- Abandon de la messagerie in-app au profit d'un lien WhatsApp direct (client → conseiller).
-- Le contact conseiller se fait désormais via le bouton « Discuter sur WhatsApp » de l'espace
-- client (le client écrit depuis son propre numéro → un fil WhatsApp natif par client).

DROP TABLE IF EXISTS public.wa_links CASCADE;   -- jamais créée si phase9 non appliquée
DROP TABLE IF EXISTS public.messages CASCADE;   -- retire aussi la table de la publication realtime

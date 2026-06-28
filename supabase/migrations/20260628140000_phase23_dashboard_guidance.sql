-- phase23 : continuité du dashboard d'un mois à l'autre.
-- dashboard_guidance = consignes DURABLES par client (retours de call distillés), reprises à chaque génération.
alter table clients add column if not exists dashboard_guidance text;
comment on column clients.dashboard_guidance is 'Consignes durables pour la génération du dashboard (issues des calls client). Reprises chaque mois.';

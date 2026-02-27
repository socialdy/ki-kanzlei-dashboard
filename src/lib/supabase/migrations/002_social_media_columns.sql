/* ── Social Media Spalten für Leads ── */

alter table public.leads add column if not exists social_linkedin  text;
alter table public.leads add column if not exists social_facebook  text;
alter table public.leads add column if not exists social_instagram text;
alter table public.leads add column if not exists social_xing      text;
alter table public.leads add column if not exists social_twitter   text;
alter table public.leads add column if not exists social_youtube   text;
alter table public.leads add column if not exists social_tiktok    text;

/* Zusätzliche Felder die im n8n Workflow befüllt werden */
alter table public.leads add column if not exists name            text;
alter table public.leads add column if not exists company         text;
alter table public.leads add column if not exists category        text;
alter table public.leads add column if not exists updated_at      timestamptz default now();
alter table public.leads add column if not exists search_job_id   uuid;

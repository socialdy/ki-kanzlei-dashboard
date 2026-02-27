/* ── Leads Tabelle ── */

create table if not exists public.leads (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),

  /* Firmendaten */
  company_name    text        not null,
  industry        text,
  address         text,
  city            text,
  postal_code     text,
  country         text        not null default 'AT',

  /* Kontaktdaten */
  phone           text,
  website         text,
  email           text,

  /* Geschäftsführer */
  ceo_name        text,
  ceo_source      text,

  /* Google Places Daten */
  google_place_id text        unique,
  google_rating   numeric,
  google_reviews_count integer,

  /* Status & Verwaltung */
  status          text        not null default 'new',
  search_query    text,
  search_location text,
  raw_data        jsonb,

  /* Multi-Tenancy */
  user_id         uuid
);

/* ── Indexe für häufige Abfragen ── */
create index if not exists idx_leads_status     on public.leads (status);
create index if not exists idx_leads_city       on public.leads (city);
create index if not exists idx_leads_user_id    on public.leads (user_id);
create index if not exists idx_leads_created_at on public.leads (created_at desc);

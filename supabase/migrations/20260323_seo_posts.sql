-- SEO Blog Posts table (populated by n8n automation)
create table if not exists seo_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text,
  meta_description text,
  category text,
  html_content text,
  word_count integer default 0,
  featured_image_url text,
  target_keywords text[] default '{}',
  internal_links_used integer default 0,
  website_url text,
  publish_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'error')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for user queries
create index if not exists idx_seo_posts_user_id on seo_posts(user_id);
create index if not exists idx_seo_posts_status on seo_posts(status);
create index if not exists idx_seo_posts_category on seo_posts(category);

-- RLS
alter table seo_posts enable row level security;

create policy "Users can view own seo posts"
  on seo_posts for select
  using (auth.uid() = user_id);

create policy "Users can delete own seo posts"
  on seo_posts for delete
  using (auth.uid() = user_id);

-- Service role can insert (n8n webhook)
create policy "Service role can insert seo posts"
  on seo_posts for insert
  with check (true);

create policy "Service role can update seo posts"
  on seo_posts for update
  using (true);

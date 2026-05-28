-- my-xikipedia saved article storage
-- Run this in the Supabase SQL editor for project hwvldcppjpmwvfsjavcx.
-- Requires users to be signed in with Supabase Auth; RLS keeps each user's saved list private.

create table if not exists public.saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wiki_page_id bigint,
  title text not null,
  url text not null,
  simple_url text,
  excerpt text,
  thumb text,
  categories text[] not null default '{}',
  source text not null default 'xikipedia',
  saved_at timestamptz not null default now(),
  notes text,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, wiki_page_id)
);

create index if not exists saved_articles_user_saved_at_idx
  on public.saved_articles (user_id, saved_at desc);

alter table public.saved_articles enable row level security;

-- Newer Supabase projects may not expose SQL-created tables to the Data API by default.
-- These grants make the table callable by signed-in users; RLS below controls which rows.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.saved_articles to authenticated;

create policy "Users can read their own saved articles"
  on public.saved_articles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own saved articles"
  on public.saved_articles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own saved articles"
  on public.saved_articles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved articles"
  on public.saved_articles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

drop trigger if exists saved_articles_set_updated_at on public.saved_articles;
create trigger saved_articles_set_updated_at
  before update on public.saved_articles
  for each row
  execute function public.set_updated_at();

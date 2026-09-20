-- Abgegrenzte Demo-Arbeitsbereiche. Keine echten Betriebe oder Gästedaten verwenden.
create table if not exists public.demo_workspaces (
 id uuid primary key,
 data jsonb not null,
 version integer not null default 0,
 created_at timestamptz not null default now()
);
alter table public.demo_workspaces enable row level security;
-- Keine Client-Policies: Zugriff ausschließlich durch das vertrauenswürdige Backend.
revoke all on public.demo_workspaces from anon, authenticated;
insert into storage.buckets (id,name,public,file_size_limit)
values ('attachments','attachments',false,8388608)
on conflict (id) do nothing;

create extension if not exists pgcrypto;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can manage own push subscriptions" on public.push_subscriptions;
create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.arena_members (
  user_id uuid references auth.users on delete cascade primary key,
  joined_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  color_hex text not null default '#57D393',
  current_streak integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.action_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon text not null,
  points integer not null,
  category text not null check (category in ('mindful', 'physical', 'productivity', 'zombie')),
  is_archived boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  template_id uuid references public.action_templates(id) on delete set null,
  custom_title text not null,
  icon text not null,
  points integer not null,
  note text,
  proof_image_path text,
  opponent_reaction text check (opponent_reaction in ('respect', 'proof', 'rip')),
  logged_at timestamptz not null default now()
);

create table if not exists public.activity_reactions (
  activity_id uuid references public.activity_logs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction text not null check (reaction in ('respect', 'proof', 'rip')),
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create table if not exists public.activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references public.activity_logs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null check (char_length(trim(body)) between 1 and 280),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references public.profiles(id) on delete cascade not null,
  actor_user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('ping', 'log', 'comment', 'reaction')),
  title text not null,
  body text not null,
  icon_url text,
  activity_id uuid references public.activity_logs(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists icon_url text;

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_user_id, created_at desc);

create table if not exists public.weekly_battles (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  stake_description text not null,
  winner_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'activity_logs'
  ) then
    alter publication supabase_realtime add table public.activity_logs;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;

create index if not exists activity_logs_logged_at_idx
  on public.activity_logs (logged_at desc);

create index if not exists activity_logs_user_id_idx
  on public.activity_logs (user_id);

create or replace function public.is_arena_member(candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.arena_members
    where user_id = candidate
  );
$$;

alter table public.arena_members enable row level security;
alter table public.profiles enable row level security;
alter table public.action_templates enable row level security;
alter table public.activity_logs enable row level security;
alter table public.activity_reactions enable row level security;
alter table public.activity_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.weekly_battles enable row level security;

drop policy if exists "Members can read profiles" on public.profiles;
create policy "Members can read profiles"
  on public.profiles for select
  to authenticated
  using (public.is_arena_member(auth.uid()));

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid() and public.is_arena_member(auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and public.is_arena_member(auth.uid()))
  with check (id = auth.uid() and public.is_arena_member(auth.uid()));

drop policy if exists "Members can read templates" on public.action_templates;
create policy "Members can read templates"
  on public.action_templates for select
  to authenticated
  using (public.is_arena_member(auth.uid()) and (is_archived = false or created_by = auth.uid()));

drop policy if exists "Members can create templates" on public.action_templates;
create policy "Members can create templates"
  on public.action_templates for insert
  to authenticated
  with check (public.is_arena_member(auth.uid()) and created_by = auth.uid());

drop policy if exists "Members can read activity" on public.activity_logs;
create policy "Members can read activity"
  on public.activity_logs for select
  to authenticated
  using (public.is_arena_member(auth.uid()));

drop policy if exists "Members can create own activity" on public.activity_logs;
create policy "Members can create own activity"
  on public.activity_logs for insert
  to authenticated
  with check (public.is_arena_member(auth.uid()) and user_id = auth.uid());

drop policy if exists "Members can update own activity" on public.activity_logs;
create policy "Members can update own activity"
  on public.activity_logs for update
  to authenticated
  using (public.is_arena_member(auth.uid()) and user_id = auth.uid())
  with check (public.is_arena_member(auth.uid()) and user_id = auth.uid());

drop policy if exists "Members can delete own activity" on public.activity_logs;
create policy "Members can delete own activity"
  on public.activity_logs for delete
  to authenticated
  using (public.is_arena_member(auth.uid()) and user_id = auth.uid());

drop policy if exists "Members can read reactions" on public.activity_reactions;
create policy "Members can read reactions"
  on public.activity_reactions for select
  to authenticated
  using (public.is_arena_member(auth.uid()));

drop policy if exists "Members can react to opponent activity" on public.activity_reactions;
create policy "Members can react to opponent activity"
  on public.activity_reactions for insert
  to authenticated
  with check (
    public.is_arena_member(auth.uid())
    and user_id = auth.uid()
    and exists (
      select 1 from public.activity_logs
      where id = activity_id and user_id <> auth.uid()
    )
  );

drop policy if exists "Members can update own reaction" on public.activity_reactions;
create policy "Members can update own reaction"
  on public.activity_reactions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members can delete own reaction" on public.activity_reactions;
create policy "Members can delete own reaction"
  on public.activity_reactions for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Members can read activity comments" on public.activity_comments;
create policy "Members can read activity comments"
  on public.activity_comments for select
  to authenticated
  using (public.is_arena_member(auth.uid()));

drop policy if exists "Members can comment on activity" on public.activity_comments;
drop policy if exists "Members can comment on opponent activity" on public.activity_comments;
create policy "Members can comment on activity"
  on public.activity_comments for insert
  to authenticated
  with check (
    public.is_arena_member(auth.uid())
    and user_id = auth.uid()
    and exists (select 1 from public.activity_logs where id = activity_id)
  );

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  to authenticated
  using (recipient_user_id = auth.uid());

drop policy if exists "Users can create notifications for arena members" on public.notifications;
create policy "Users can create notifications for arena members"
  on public.notifications for insert
  to authenticated
  with check (
    actor_user_id = auth.uid()
    and recipient_user_id <> auth.uid()
    and public.is_arena_member(auth.uid())
    and public.is_arena_member(recipient_user_id)
  );

drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
  on public.notifications for update
  to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

drop policy if exists "Members can read battles" on public.weekly_battles;
create policy "Members can read battles"
  on public.weekly_battles for select
  to authenticated
  using (public.is_arena_member(auth.uid()));

drop policy if exists "Members can create battles" on public.weekly_battles;
create policy "Members can create battles"
  on public.weekly_battles for insert
  to authenticated
  with check (public.is_arena_member(auth.uid()));

drop policy if exists "Members can update battles" on public.weekly_battles;
create policy "Members can update battles"
  on public.weekly_battles for update
  to authenticated
  using (public.is_arena_member(auth.uid()))
  with check (public.is_arena_member(auth.uid()));

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

drop policy if exists "Members can read proof files" on storage.objects;
create policy "Members can read proof files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'proofs' and public.is_arena_member(auth.uid()));

drop policy if exists "Members can upload proof files" on storage.objects;
create policy "Members can upload proof files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'proofs'
    and public.is_arena_member(auth.uid())
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Members can delete own proof files" on storage.objects;
create policy "Members can delete own proof files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'proofs'
    and public.is_arena_member(auth.uid())
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Members can read arena avatars" on storage.objects;
create policy "Members can read arena avatars"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and public.is_arena_member(auth.uid()));

drop policy if exists "Members can upload own avatar" on storage.objects;
create policy "Members can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and public.is_arena_member(auth.uid())
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Members can delete own avatar" on storage.objects;
create policy "Members can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and public.is_arena_member(auth.uid())
    and (storage.foldername(name))[1] = auth.uid()::text
  );

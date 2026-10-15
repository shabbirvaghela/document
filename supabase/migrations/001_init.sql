-- ========== TABLES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled document'
    check (char_length(title) between 1 and 120),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('viewer','editor')),
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);

create index on public.documents(owner_id);
create index on public.document_shares(user_id);

-- ========== TRIGGERS ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, lower(new.email), split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create or replace function public.protect_owner()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;
  return new;
end $$;

create trigger documents_protect_owner
before update on public.documents
for each row execute function public.protect_owner();

-- ========== HELPER FUNCTIONS (security definer => no RLS recursion) ==========
create or replace function public.is_doc_owner(doc_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from documents where id = doc_id and owner_id = auth.uid());
$$;

create or replace function public.has_doc_access(doc_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from documents d
    where d.id = doc_id
      and (d.owner_id = auth.uid()
           or exists (select 1 from document_shares s
                      where s.document_id = d.id and s.user_id = auth.uid()))
  );
$$;

create or replace function public.can_edit_doc(doc_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from documents d
    where d.id = doc_id
      and (d.owner_id = auth.uid()
           or exists (select 1 from document_shares s
                      where s.document_id = d.id and s.user_id = auth.uid()
                        and s.role = 'editor'))
  );
$$;

-- ========== RLS ==========
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_shares enable row level security;

create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- owner check is inline so a freshly inserted row is visible to INSERT ... RETURNING
create policy "documents_select" on public.documents
  for select to authenticated
  using (owner_id = auth.uid() or public.has_doc_access(id));
create policy "documents_insert" on public.documents
  for insert to authenticated with check (owner_id = auth.uid());
create policy "documents_update" on public.documents
  for update to authenticated
  using (public.can_edit_doc(id)) with check (public.can_edit_doc(id));
create policy "documents_delete" on public.documents
  for delete to authenticated using (owner_id = auth.uid());

create policy "shares_select" on public.document_shares
  for select to authenticated
  using (public.is_doc_owner(document_id) or user_id = auth.uid());
create policy "shares_insert" on public.document_shares
  for insert to authenticated with check (public.is_doc_owner(document_id));
create policy "shares_update" on public.document_shares
  for update to authenticated
  using (public.is_doc_owner(document_id)) with check (public.is_doc_owner(document_id));
create policy "shares_delete" on public.document_shares
  for delete to authenticated using (public.is_doc_owner(document_id));

-- ========== SHARE RPC ==========
create or replace function public.share_document(p_document_id uuid, p_email text, p_role text)
returns public.document_shares
language plpgsql security definer set search_path = public as $$
declare
  v_target uuid;
  v_row public.document_shares;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_role not in ('viewer','editor') then raise exception 'Invalid role'; end if;
  if not public.is_doc_owner(p_document_id) then
    raise exception 'Only the owner can share this document';
  end if;

  select id into v_target from profiles where email = lower(trim(p_email));
  if v_target is null then raise exception 'No account with that email'; end if;
  if v_target = auth.uid() then raise exception 'You already own this document'; end if;

  insert into document_shares (document_id, user_id, role)
  values (p_document_id, v_target, p_role)
  on conflict (document_id, user_id) do update set role = excluded.role
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.share_document(uuid, text, text) from public, anon;
grant execute on function public.share_document(uuid, text, text) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ========== BACKFILL: users created before this schema (e.g. alice) ==========
insert into public.profiles (id, email, display_name)
select id, lower(email), split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;
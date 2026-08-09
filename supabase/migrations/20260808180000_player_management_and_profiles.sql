alter table players
  add column profile_photo_object_key text,
  add column profile_photo_content_type text,
  add column profile_photo_byte_size integer,
  add column profile_photo_updated_at timestamptz,
  add constraint players_profile_photo_complete check (
    (profile_photo_object_key is null and profile_photo_content_type is null and profile_photo_byte_size is null and profile_photo_updated_at is null)
    or
    (profile_photo_object_key is not null and profile_photo_content_type in ('image/jpeg', 'image/png', 'image/webp') and profile_photo_byte_size between 1 and 1048576 and profile_photo_updated_at is not null)
  );

create table player_management_relationships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  user_account_id uuid not null references user_accounts(id),
  status text not null check (status in ('requested', 'approved', 'revoked')),
  requested_at timestamptz not null,
  requested_by_account_id uuid not null references user_accounts(id),
  approved_at timestamptz,
  approved_by_account_id uuid references user_accounts(id),
  revoked_at timestamptz,
  revoked_by_account_id uuid references user_accounts(id),
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  check (
    (status = 'requested' and approved_at is null and approved_by_account_id is null and revoked_at is null and revoked_by_account_id is null)
    or (status = 'approved' and approved_at is not null and approved_by_account_id is not null and revoked_at is null and revoked_by_account_id is null)
    or (status = 'revoked' and revoked_at is not null and revoked_by_account_id is not null)
  )
);

create unique index player_management_relationships_active_pair_unique
  on player_management_relationships (player_id, user_account_id)
  where status in ('requested', 'approved');

create index player_management_relationships_account_status_idx
  on player_management_relationships (user_account_id, status);

create function enforce_player_management_relationship_transition()
returns trigger language plpgsql as $$
begin
  if new.player_id <> old.player_id or new.user_account_id <> old.user_account_id
     or new.requested_at <> old.requested_at or new.requested_by_account_id <> old.requested_by_account_id then
    raise exception 'Player Management Relationship identity and request are immutable';
  end if;
  if old.status = 'revoked' then raise exception 'Revoked Player Management Relationships are terminal'; end if;
  if old.status = 'approved' and new.status <> 'revoked' then raise exception 'Approved Player Management Relationships may only be revoked'; end if;
  if old.status = 'requested' and new.status not in ('approved', 'revoked') then raise exception 'Requested Player Management Relationships may only be approved or revoked'; end if;
  if new.version <> old.version + 1 then raise exception 'Player Management Relationship version must advance exactly once'; end if;
  return new;
end;
$$;

create trigger player_management_relationships_valid_transition
before update on player_management_relationships
for each row execute function enforce_player_management_relationship_transition();

alter table player_management_relationships enable row level security;
revoke all on table player_management_relationships from anon, authenticated;

create function can_manage_player_profile_storage(candidate_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from players p
      join user_accounts ua on ua.external_auth_id = auth.uid()
     where p.id = candidate_player_id
       and (
         exists (
           select 1 from league_admin_assignments la
            where la.league_id = p.league_id
              and la.user_account_id = ua.id
              and la.revoked_at is null
         )
         or exists (
           select 1 from player_management_relationships pmr
            where pmr.player_id = p.id
              and pmr.user_account_id = ua.id
              and pmr.status = 'approved'
         )
       )
  );
$$;

revoke all on function can_manage_player_profile_storage(uuid) from public;
grant execute on function can_manage_player_profile_storage(uuid) to authenticated;

do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'create policy player_profile_photos_authenticated_insert on storage.objects for insert to authenticated with check (bucket_id = ''player-profile-photos'' and public.can_manage_player_profile_storage(((storage.foldername(name))[1])::uuid))';
    execute 'create policy player_profile_photos_authorized_select on storage.objects for select to authenticated using (bucket_id = ''player-profile-photos'' and public.can_manage_player_profile_storage(((storage.foldername(name))[1])::uuid))';
    execute 'create policy player_profile_photos_authorized_delete on storage.objects for delete to authenticated using (bucket_id = ''player-profile-photos'' and public.can_manage_player_profile_storage(((storage.foldername(name))[1])::uuid))';
  end if;
end;
$$;

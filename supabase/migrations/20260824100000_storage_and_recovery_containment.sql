do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists player_profile_photos_authenticated_insert on storage.objects';
    execute 'drop policy if exists player_profile_photos_authorized_select on storage.objects';
    execute 'drop policy if exists player_profile_photos_authorized_delete on storage.objects';
  end if;
end;
$$;

drop function if exists can_manage_player_profile_storage(uuid);

create table password_recovery_authorizations (
  id uuid primary key,
  external_auth_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  check (expires_at > created_at),
  check (consumed_at is null or consumed_at >= created_at)
);

create unique index password_recovery_authorizations_one_active_per_identity
  on password_recovery_authorizations (external_auth_id)
  where consumed_at is null;

create index password_recovery_authorizations_expiry_idx
  on password_recovery_authorizations (expires_at);

alter table password_recovery_authorizations enable row level security;
revoke all on table password_recovery_authorizations from anon, authenticated;

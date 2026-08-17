create table season_team_captain_assignments (
  id uuid primary key,
  season_team_id uuid not null references season_teams(id),
  user_account_id uuid not null references user_accounts(id),
  assigned_at timestamptz not null,
  assigned_by_account_id uuid not null references user_accounts(id),
  revoked_at timestamptz,
  revoked_by_account_id uuid references user_accounts(id),
  check (
    (revoked_at is null and revoked_by_account_id is null)
    or (revoked_at is not null and revoked_by_account_id is not null and revoked_at >= assigned_at)
  )
);

create unique index user_accounts_contact_email_role_target_unique
  on user_accounts (lower(contact_email))
  where contact_email is not null;

create unique index season_team_captain_assignments_active_team_unique
  on season_team_captain_assignments (season_team_id)
  where revoked_at is null;

create function enforce_league_admin_assignment_revocation()
returns trigger
language plpgsql
as $$
begin
  if new.league_id <> old.league_id
     or new.user_account_id <> old.user_account_id
     or new.assigned_at <> old.assigned_at then
    raise exception 'League Administrator assignment identity is immutable';
  end if;
  if old.revoked_at is not null then
    raise exception 'Revoked League Administrator assignments are terminal';
  end if;
  if new.revoked_at is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('league-admin:' || old.league_id::text, 0));
  if not exists (
    select 1
      from league_admin_assignments
     where league_id = old.league_id
       and id <> old.id
       and revoked_at is null
  ) then
    raise exception 'The final active League Administrator cannot be revoked';
  end if;
  return new;
end;
$$;

create trigger league_admin_assignments_valid_revocation
before update on league_admin_assignments
for each row execute function enforce_league_admin_assignment_revocation();

create function enforce_team_captain_assignment_revocation()
returns trigger
language plpgsql
as $$
begin
  if new.season_team_id <> old.season_team_id
     or new.user_account_id <> old.user_account_id
     or new.assigned_at <> old.assigned_at
     or new.assigned_by_account_id <> old.assigned_by_account_id then
    raise exception 'Team Captain assignment identity is immutable';
  end if;
  if old.revoked_at is not null then
    raise exception 'Revoked Team Captain assignments are terminal';
  end if;
  if new.revoked_at is null or new.revoked_by_account_id is null then
    raise exception 'Team Captain revocation must record actor and timestamp';
  end if;
  return new;
end;
$$;

create trigger season_team_captain_assignments_valid_revocation
before update on season_team_captain_assignments
for each row execute function enforce_team_captain_assignment_revocation();

create function reject_role_assignment_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Role assignment history is append-only';
end;
$$;

create trigger league_admin_assignments_no_delete
before delete on league_admin_assignments
for each row execute function reject_role_assignment_delete();

create trigger season_team_captain_assignments_no_delete
before delete on season_team_captain_assignments
for each row execute function reject_role_assignment_delete();

alter table season_team_captain_assignments enable row level security;
revoke all on table season_team_captain_assignments from anon, authenticated;

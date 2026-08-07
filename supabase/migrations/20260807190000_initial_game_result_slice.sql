create extension if not exists pgcrypto;

create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  timezone text not null check (btrim(timezone) <> ''),
  default_language text not null check (default_language in ('en', 'fr')),
  created_at timestamptz not null default now()
);

create table user_accounts (
  id uuid primary key default gen_random_uuid(),
  external_auth_id uuid unique,
  display_name text not null check (btrim(display_name) <> ''),
  created_at timestamptz not null default now()
);

create table league_admin_assignments (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id),
  user_account_id uuid not null references user_accounts(id),
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= assigned_at)
);

create unique index league_admin_assignments_active_unique
  on league_admin_assignments (league_id, user_account_id)
  where revoked_at is null;

create table seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id),
  name text not null check (btrim(name) <> ''),
  result_configuration jsonb not null check (jsonb_typeof(result_configuration) = 'object'),
  frozen_configuration_version_id uuid,
  created_at timestamptz not null default now(),
  unique (league_id, name)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  unique (league_id, name)
);

create table season_teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id),
  team_id uuid not null references teams(id),
  created_at timestamptz not null default now(),
  unique (season_id, team_id),
  unique (id, season_id)
);

create function enforce_season_team_league()
returns trigger
language plpgsql
as $$
declare
  season_league_id uuid;
  team_league_id uuid;
begin
  select league_id into strict season_league_id from seasons where id = new.season_id;
  select league_id into strict team_league_id from teams where id = new.team_id;
  if season_league_id <> team_league_id then
    raise exception 'Season Team must connect a Season and Team from the same League';
  end if;
  return new;
end;
$$;

create trigger season_teams_same_league
before insert or update on season_teams
for each row execute function enforce_season_team_league();

create table season_configuration_versions (
  id uuid primary key,
  season_id uuid not null references seasons(id),
  version_number integer not null check (version_number > 0),
  configuration jsonb not null check (jsonb_typeof(configuration) = 'object'),
  basis_hash text not null check (basis_hash ~ '^[0-9a-f]{64}$'),
  frozen_at timestamptz not null,
  unique (season_id, version_number),
  unique (id, season_id)
);

alter table seasons
  add constraint seasons_frozen_configuration_version_fk
  foreign key (frozen_configuration_version_id, id)
  references season_configuration_versions (id, season_id);

create table games (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id),
  phase text not null check (phase in ('regular', 'playoff')),
  status text not null check (
    status in ('scheduled', 'postponed', 'cancelled', 'in_progress', 'final', 'forfeit')
  ),
  home_season_team_id uuid not null,
  away_season_team_id uuid not null,
  scheduled_at timestamptz not null,
  started_at timestamptz,
  finalized_at timestamptz,
  home_score integer,
  away_score integer,
  winning_season_team_id uuid,
  configuration_version_id uuid,
  version integer not null default 0 check (version >= 0),
  check (home_season_team_id <> away_season_team_id),
  check (winning_season_team_id is null or winning_season_team_id in (
    home_season_team_id,
    away_season_team_id
  )),
  check (status not in ('in_progress', 'final') or started_at is not null),
  check (
    (
      status in ('final', 'forfeit')
      and home_score is not null
      and away_score is not null
      and home_score >= 0
      and away_score >= 0
      and home_score <> away_score
      and winning_season_team_id is not null
      and (
        (home_score > away_score and winning_season_team_id = home_season_team_id)
        or
        (away_score > home_score and winning_season_team_id = away_season_team_id)
      )
      and configuration_version_id is not null
      and finalized_at is not null
    )
    or
    (
      status not in ('final', 'forfeit')
      and home_score is null
      and away_score is null
      and winning_season_team_id is null
      and configuration_version_id is null
      and finalized_at is null
    )
  ),
  foreign key (home_season_team_id, season_id)
    references season_teams (id, season_id),
  foreign key (away_season_team_id, season_id)
    references season_teams (id, season_id),
  foreign key (configuration_version_id, season_id)
    references season_configuration_versions (id, season_id)
);

create table audit_records (
  id uuid primary key,
  league_id uuid not null references leagues(id),
  actor_account_id uuid not null references user_accounts(id),
  action text not null check (btrim(action) <> ''),
  entity_type text not null check (btrim(entity_type) <> ''),
  entity_id uuid not null,
  previous_value jsonb not null,
  new_value jsonb not null,
  reason text,
  created_at timestamptz not null
);

create table command_receipts (
  command_id uuid primary key,
  command_type text not null check (btrim(command_type) <> ''),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  result jsonb not null,
  created_at timestamptz not null
);

create function reject_append_only_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% records are append-only', tg_table_name;
end;
$$;

create trigger season_configuration_versions_append_only
before update or delete on season_configuration_versions
for each row execute function reject_append_only_mutation();

create trigger audit_records_append_only
before update or delete on audit_records
for each row execute function reject_append_only_mutation();

create trigger command_receipts_append_only
before update or delete on command_receipts
for each row execute function reject_append_only_mutation();

alter table leagues enable row level security;
alter table user_accounts enable row level security;
alter table league_admin_assignments enable row level security;
alter table seasons enable row level security;
alter table teams enable row level security;
alter table season_teams enable row level security;
alter table season_configuration_versions enable row level security;
alter table games enable row level security;
alter table audit_records enable row level security;
alter table command_receipts enable row level security;

revoke all on table leagues from anon, authenticated;
revoke all on table user_accounts from anon, authenticated;
revoke all on table league_admin_assignments from anon, authenticated;
revoke all on table seasons from anon, authenticated;
revoke all on table teams from anon, authenticated;
revoke all on table season_teams from anon, authenticated;
revoke all on table season_configuration_versions from anon, authenticated;
revoke all on table games from anon, authenticated;
revoke all on table audit_records from anon, authenticated;
revoke all on table command_receipts from anon, authenticated;

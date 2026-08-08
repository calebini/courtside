create extension if not exists btree_gist;

create table players (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id),
  display_name text not null check (
    btrim(display_name) <> ''
    and char_length(display_name) <= 120
    and display_name !~ '[[:cntrl:]]'
  ),
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  unique (id, league_id)
);

create table roster_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  season_id uuid not null references seasons(id),
  season_team_id uuid not null,
  effective_from timestamptz not null,
  effective_until timestamptz,
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  check (effective_until is null or effective_until > effective_from),
  foreign key (season_team_id, season_id) references season_teams(id, season_id),
  exclude using gist (
    player_id with =,
    season_id with =,
    tstzrange(effective_from, coalesce(effective_until, 'infinity'::timestamptz), '[)') with &&
  )
);

create index roster_memberships_season_team_effective_idx
  on roster_memberships (season_team_id, effective_from, effective_until);

create function enforce_roster_membership_league()
returns trigger
language plpgsql
as $$
declare
  player_league_id uuid;
  season_league_id uuid;
begin
  select league_id into strict player_league_id from players where id = new.player_id;
  select league_id into strict season_league_id from seasons where id = new.season_id;
  if player_league_id <> season_league_id then
    raise exception 'Roster Membership Player and Season Team must belong to the same League';
  end if;
  return new;
end;
$$;

create trigger roster_memberships_same_league
before insert or update of player_id, season_id, season_team_id on roster_memberships
for each row execute function enforce_roster_membership_league();

create function enforce_player_league_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.league_id <> old.league_id then
    raise exception 'Player League ownership is immutable';
  end if;
  if new.version <> old.version + 1 then
    raise exception 'Player version must advance exactly once per update';
  end if;
  return new;
end;
$$;

create trigger players_immutable_league
before update on players
for each row execute function enforce_player_league_immutable();

create function enforce_roster_membership_terminal_history()
returns trigger
language plpgsql
as $$
begin
  if new.player_id <> old.player_id
     or new.season_id <> old.season_id
     or new.season_team_id <> old.season_team_id
     or new.effective_from <> old.effective_from then
    raise exception 'Roster Membership identity and effective start are immutable';
  end if;
  if old.effective_until is not null then
    raise exception 'Closed Roster Memberships are terminal';
  end if;
  if new.effective_until is null then
    raise exception 'Roster Membership update must close the interval';
  end if;
  if new.version <> old.version + 1 then
    raise exception 'Roster Membership version must advance exactly once when closed';
  end if;
  return new;
end;
$$;

create trigger roster_memberships_terminal_history
before update on roster_memberships
for each row execute function enforce_roster_membership_terminal_history();

alter table players enable row level security;
alter table roster_memberships enable row level security;
revoke all on table players from anon, authenticated;
revoke all on table roster_memberships from anon, authenticated;

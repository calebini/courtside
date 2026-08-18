alter table roster_memberships
  add constraint roster_memberships_stat_line_identity_unique
  unique (id, player_id, season_id, season_team_id);

alter table games
  add constraint games_stat_line_identity_unique
  unique (id, season_id);

create table player_stat_lines (
  id uuid primary key,
  game_id uuid not null,
  player_id uuid not null references players(id),
  roster_membership_id uuid not null,
  season_id uuid not null,
  season_team_id uuid not null,
  points integer check (points is null or points >= 0),
  completeness_status text not null default 'partial'
    check (completeness_status = 'partial'),
  verification_status text not null default 'provisional'
    check (verification_status in ('provisional', 'confirmed')),
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (game_id, player_id),
  foreign key (game_id, season_id) references games(id, season_id),
  foreign key (season_team_id, season_id) references season_teams(id, season_id),
  foreign key (roster_membership_id, player_id, season_id, season_team_id)
    references roster_memberships(id, player_id, season_id, season_team_id),
  check (updated_at >= created_at)
);

create index player_stat_lines_game_team_idx
  on player_stat_lines (game_id, season_team_id, player_id);

create index player_stat_lines_player_game_idx
  on player_stat_lines (player_id, game_id);

create function enforce_player_stat_line_eligibility()
returns trigger
language plpgsql
as $$
declare
  game_record games%rowtype;
  membership_record roster_memberships%rowtype;
begin
  select * into strict game_record from games where id = new.game_id;
  select * into strict membership_record
    from roster_memberships
   where id = new.roster_membership_id;

  if game_record.competition_eligibility_at is null
     or game_record.status not in ('in_progress', 'final', 'forfeit') then
    raise exception 'Player Stat Line requires a Game competition eligibility anchor';
  end if;
  if new.season_id <> game_record.season_id
     or new.player_id <> membership_record.player_id
     or new.season_id <> membership_record.season_id
     or new.season_team_id <> membership_record.season_team_id then
    raise exception 'Player Stat Line identity must match its Game and Roster Membership';
  end if;
  if new.season_team_id not in (
    game_record.home_season_team_id,
    game_record.away_season_team_id
  ) then
    raise exception 'Player Stat Line Season Team must participate in the Game';
  end if;
  if membership_record.effective_from > game_record.competition_eligibility_at
     or (
       membership_record.effective_until is not null
       and membership_record.effective_until <= game_record.competition_eligibility_at
     ) then
    raise exception 'Player Stat Line Roster Membership was not effective at Game eligibility';
  end if;
  return new;
end;
$$;

create trigger player_stat_lines_eligibility
before insert or update of game_id, player_id, roster_membership_id, season_id, season_team_id
on player_stat_lines
for each row execute function enforce_player_stat_line_eligibility();

create function enforce_player_stat_line_update()
returns trigger
language plpgsql
as $$
begin
  if new.id <> old.id
     or new.game_id <> old.game_id
     or new.player_id <> old.player_id
     or new.roster_membership_id <> old.roster_membership_id
     or new.season_id <> old.season_id
     or new.season_team_id <> old.season_team_id
     or new.created_at <> old.created_at then
    raise exception 'Player Stat Line identity and creation time are immutable';
  end if;
  if new.version <> old.version + 1 then
    raise exception 'Player Stat Line version must advance exactly once per update';
  end if;
  if new.updated_at < old.updated_at then
    raise exception 'Player Stat Line update time cannot move backward';
  end if;
  return new;
end;
$$;

create trigger player_stat_lines_controlled_update
before update on player_stat_lines
for each row execute function enforce_player_stat_line_update();

alter table player_stat_lines enable row level security;
revoke all on table player_stat_lines from anon, authenticated;

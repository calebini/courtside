create table league_statkeeping_profile_versions (
  id uuid primary key,
  league_id uuid not null references leagues(id),
  version_number integer not null check (version_number > 0),
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  event_definitions jsonb not null check (jsonb_typeof(event_definitions) = 'array'),
  coverage_group_keys jsonb not null check (jsonb_typeof(coverage_group_keys) = 'array'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  regulation_period_count bigint not null
    check (regulation_period_count > 0 and regulation_period_count <= 9007199254740991),
  regulation_period_duration_ms bigint not null
    check (regulation_period_duration_ms > 0 and regulation_period_duration_ms <= 9007199254740991),
  overtime_period_duration_ms bigint not null
    check (overtime_period_duration_ms > 0 and overtime_period_duration_ms <= 9007199254740991),
  created_by_account_id uuid not null references user_accounts(id),
  created_at timestamptz not null,
  unique (league_id, version_number),
  unique (id, league_id)
);

create trigger league_statkeeping_profile_versions_append_only
before update or delete on league_statkeeping_profile_versions
for each row execute function reject_append_only_mutation();

alter table leagues
  add column active_statkeeping_profile_version_id uuid,
  add constraint leagues_active_statkeeping_profile_version_fk
    foreign key (active_statkeeping_profile_version_id, id)
    references league_statkeeping_profile_versions (id, league_id);

create table game_media (
  id uuid primary key,
  league_id uuid not null references leagues(id),
  game_id uuid not null unique references games(id),
  provider text not null check (provider ~ '^[a-z][a-z0-9_]{0,63}$'),
  provider_asset_id text not null check (
    btrim(provider_asset_id) = provider_asset_id
    and provider_asset_id <> ''
    and char_length(provider_asset_id) <= 128
  ),
  original_reference text not null check (
    btrim(original_reference) = original_reference
    and original_reference <> ''
    and char_length(original_reference) <= 2048
  ),
  created_by_account_id uuid not null references user_accounts(id),
  created_at timestamptz not null,
  unique (league_id, provider, provider_asset_id),
  unique (id, league_id, game_id)
);

create function enforce_game_media_league()
returns trigger
language plpgsql
as $$
declare
  game_league_id uuid;
begin
  select s.league_id into strict game_league_id
    from games g
    join seasons s on s.id = g.season_id
   where g.id = new.game_id;
  if new.league_id <> game_league_id then
    raise exception 'Game Media must belong to its Game League';
  end if;
  if tg_op = 'UPDATE' then
    raise exception 'Game Media identity and Game association are immutable';
  end if;
  return new;
end;
$$;

create trigger game_media_immutable_identity
before insert or update on game_media
for each row execute function enforce_game_media_league();

create trigger game_media_no_delete
before delete on game_media
for each row execute function reject_append_only_mutation();

create table statkeeper_capture_sessions (
  id uuid primary key,
  game_id uuid not null unique,
  league_id uuid not null references leagues(id),
  season_id uuid not null references seasons(id),
  home_season_team_id uuid not null,
  away_season_team_id uuid not null,
  profile_version_id uuid not null,
  media_id uuid not null unique,
  lifecycle_status text not null check (
    lifecycle_status in ('capturing', 'in_review', 'verified', 'published', 'abandoned')
  ),
  working_revision_id uuid not null,
  progress_version bigint not null default 0
    check (progress_version >= 0 and progress_version <= 9007199254740991),
  playback_offset_ms bigint not null default 0
    check (playback_offset_ms >= 0 and playback_offset_ms <= 9007199254740991),
  active_period_kind text not null check (active_period_kind in ('regulation', 'overtime')),
  active_period_ordinal bigint not null check (
    active_period_ordinal > 0 and active_period_ordinal <= 9007199254740991
  ),
  active_clock_state text not null check (active_clock_state in ('exact', 'estimated', 'unavailable')),
  active_clock_remaining_ms bigint check (
    active_clock_remaining_ms is null
    or (active_clock_remaining_ms >= 0 and active_clock_remaining_ms <= 9007199254740991)
  ),
  active_clock_reason text,
  selected_season_team_id uuid,
  created_by_account_id uuid not null references user_accounts(id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (home_season_team_id <> away_season_team_id),
  check (selected_season_team_id is null or selected_season_team_id in (
    home_season_team_id,
    away_season_team_id
  )),
  check (
    (active_clock_state in ('exact', 'estimated') and active_clock_remaining_ms is not null)
    or
    (active_clock_state = 'unavailable' and active_clock_remaining_ms is null
      and active_clock_reason is not null and btrim(active_clock_reason) <> '')
  ),
  check (updated_at >= created_at),
  foreign key (game_id, season_id) references games(id, season_id),
  foreign key (home_season_team_id, season_id) references season_teams(id, season_id),
  foreign key (away_season_team_id, season_id) references season_teams(id, season_id),
  foreign key (profile_version_id, league_id)
    references league_statkeeping_profile_versions(id, league_id),
  foreign key (media_id, league_id, game_id)
    references game_media(id, league_id, game_id)
);

create function enforce_statkeeper_capture_session()
returns trigger
language plpgsql
as $$
declare
  game_record games%rowtype;
  season_league_id uuid;
  profile_record league_statkeeping_profile_versions%rowtype;
begin
  select * into strict game_record from games where id = new.game_id;
  select league_id into strict season_league_id from seasons where id = new.season_id;
  select * into strict profile_record
    from league_statkeeping_profile_versions
   where id = new.profile_version_id;

  if game_record.status not in ('final', 'forfeit')
     or game_record.competition_eligibility_at is null
     or game_record.season_id <> new.season_id
     or season_league_id <> new.league_id
     or game_record.home_season_team_id <> new.home_season_team_id
     or game_record.away_season_team_id <> new.away_season_team_id
     or profile_record.league_id <> new.league_id then
    raise exception 'Capture Session must snapshot a completed Game and its League context';
  end if;

  if tg_op = 'UPDATE' then
    if new.id <> old.id
       or new.game_id <> old.game_id
       or new.league_id <> old.league_id
       or new.season_id <> old.season_id
       or new.home_season_team_id <> old.home_season_team_id
       or new.away_season_team_id <> old.away_season_team_id
       or new.profile_version_id <> old.profile_version_id
       or new.media_id <> old.media_id
       or new.created_by_account_id <> old.created_by_account_id
       or new.created_at <> old.created_at then
      raise exception 'Capture Session identity and preflight snapshot are immutable';
    end if;
    if new.progress_version < old.progress_version
       or new.updated_at < old.updated_at then
      raise exception 'Capture Session versions and timestamps cannot move backward';
    end if;
  end if;
  return new;
end;
$$;

create trigger statkeeper_capture_session_controlled_write
before insert or update on statkeeper_capture_sessions
for each row execute function enforce_statkeeper_capture_session();

create table statkeeper_capture_session_coverage (
  capture_session_id uuid not null references statkeeper_capture_sessions(id),
  coverage_group_key text not null check (coverage_group_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  review_status text not null check (review_status in ('not_reviewed', 'complete', 'partial')),
  primary key (capture_session_id, coverage_group_key)
);

alter table statkeeper_event_ledger_heads
  add constraint statkeeper_event_ledger_head_session_fk
  foreign key (capture_session_id) references statkeeper_capture_sessions(id);

create or replace function enforce_statkeeper_event_ledger_head()
returns trigger
language plpgsql
as $$
declare
  game_record games%rowtype;
  session_record statkeeper_capture_sessions%rowtype;
  profile_record league_statkeeping_profile_versions%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into strict game_record from games where id = new.game_id;
    select * into strict session_record
      from statkeeper_capture_sessions
     where id = new.capture_session_id;
    select * into strict profile_record
      from league_statkeeping_profile_versions
     where id = session_record.profile_version_id;
    if game_record.status not in ('final', 'forfeit')
       or game_record.competition_eligibility_at is null
       or session_record.game_id <> new.game_id
       or session_record.profile_version_id <> new.profile_version_id
       or session_record.media_id <> new.media_id
       or profile_record.content_hash <> new.profile_content_hash
       or profile_record.regulation_period_count <> new.regulation_period_count
       or profile_record.regulation_period_duration_ms <> new.regulation_period_duration_ms
       or profile_record.overtime_period_duration_ms <> new.overtime_period_duration_ms
       or profile_record.event_definitions <> new.event_definitions then
      raise exception 'Statkeeper ledger head must match canonical Capture Session preflight';
    end if;
    return new;
  end if;

  if new.capture_session_id <> old.capture_session_id
     or new.game_id <> old.game_id
     or new.profile_version_id <> old.profile_version_id
     or new.profile_content_hash <> old.profile_content_hash
     or new.media_id <> old.media_id
     or new.regulation_period_count <> old.regulation_period_count
     or new.regulation_period_duration_ms <> old.regulation_period_duration_ms
     or new.overtime_period_duration_ms <> old.overtime_period_duration_ms
     or new.event_definitions <> old.event_definitions
     or new.created_at <> old.created_at then
    raise exception 'Statkeeper event ledger identity and snapshot are immutable';
  end if;
  if new.ledger_version <> old.ledger_version + 1 then
    raise exception 'Statkeeper ledger version must advance exactly once';
  end if;
  if new.updated_at < old.updated_at then
    raise exception 'Statkeeper ledger update time cannot move backward';
  end if;
  return new;
end;
$$;

alter table league_statkeeping_profile_versions enable row level security;
alter table game_media enable row level security;
alter table statkeeper_capture_sessions enable row level security;
alter table statkeeper_capture_session_coverage enable row level security;

revoke all on table league_statkeeping_profile_versions from anon, authenticated;
revoke all on table game_media from anon, authenticated;
revoke all on table statkeeper_capture_sessions from anon, authenticated;
revoke all on table statkeeper_capture_session_coverage from anon, authenticated;

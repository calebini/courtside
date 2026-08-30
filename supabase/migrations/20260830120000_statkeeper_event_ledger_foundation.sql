create table statkeeper_event_ledger_heads (
  capture_session_id uuid primary key,
  game_id uuid not null unique references games(id),
  profile_version_id uuid not null,
  profile_content_hash text not null check (profile_content_hash ~ '^[0-9a-f]{64}$'),
  media_id uuid not null,
  regulation_period_count bigint not null
    check (regulation_period_count > 0 and regulation_period_count <= 9007199254740991),
  regulation_period_duration_ms bigint not null
    check (regulation_period_duration_ms > 0 and regulation_period_duration_ms <= 9007199254740991),
  overtime_period_duration_ms bigint not null
    check (overtime_period_duration_ms > 0 and overtime_period_duration_ms <= 9007199254740991),
  event_definitions jsonb not null check (jsonb_typeof(event_definitions) = 'array'),
  ledger_version bigint not null default 1
    check (ledger_version > 0 and ledger_version <= 9007199254740991),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (updated_at >= created_at)
);

create function enforce_statkeeper_event_ledger_head()
returns trigger
language plpgsql
as $$
declare
  game_record games%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into strict game_record from games where id = new.game_id;
    if game_record.status not in ('final', 'forfeit')
       or game_record.competition_eligibility_at is null then
      raise exception 'Statkeeper event ledger requires a completed, eligibility-anchored Game';
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

create trigger statkeeper_event_ledger_head_controlled_write
before insert or update on statkeeper_event_ledger_heads
for each row execute function enforce_statkeeper_event_ledger_head();

create table statkeeper_event_ledger_participants (
  capture_session_id uuid not null references statkeeper_event_ledger_heads(capture_session_id),
  roster_membership_id uuid not null,
  player_id uuid not null,
  season_id uuid not null,
  season_team_id uuid not null,
  participation_status text not null check (participation_status in ('appeared', 'did_not_play')),
  primary key (capture_session_id, roster_membership_id),
  unique (capture_session_id, roster_membership_id, player_id, season_team_id),
  foreign key (roster_membership_id, player_id, season_id, season_team_id)
    references roster_memberships(id, player_id, season_id, season_team_id)
);

create function enforce_statkeeper_event_ledger_participant()
returns trigger
language plpgsql
as $$
declare
  game_record games%rowtype;
  membership_record roster_memberships%rowtype;
begin
  select g.* into strict game_record
    from statkeeper_event_ledger_heads h
    join games g on g.id = h.game_id
   where h.capture_session_id = new.capture_session_id;
  select * into strict membership_record
    from roster_memberships
   where id = new.roster_membership_id;

  if new.player_id <> membership_record.player_id
     or new.season_id <> membership_record.season_id
     or new.season_team_id <> membership_record.season_team_id
     or new.season_id <> game_record.season_id
     or new.season_team_id not in (
       game_record.home_season_team_id,
       game_record.away_season_team_id
     )
     or membership_record.effective_from > game_record.competition_eligibility_at
     or (
       membership_record.effective_until is not null
       and membership_record.effective_until <= game_record.competition_eligibility_at
     ) then
    raise exception 'Statkeeper participant must be eligible for a participating Game Team';
  end if;
  return new;
end;
$$;

create trigger statkeeper_event_ledger_participant_eligibility
before insert or update on statkeeper_event_ledger_participants
for each row execute function enforce_statkeeper_event_ledger_participant();

create table statkeeper_occurrence_revisions (
  occurrence_revision_id uuid primary key,
  capture_session_id uuid not null references statkeeper_event_ledger_heads(capture_session_id),
  occurrence_id uuid not null,
  revision_number integer not null check (revision_number = 1),
  game_id uuid not null references games(id),
  profile_version_id uuid not null,
  media_id uuid not null,
  source text not null check (source = 'human'),
  verification_state text not null check (verification_state = 'recorded'),
  disposition text not null check (disposition = 'active'),
  canonical_payload text not null check (btrim(canonical_payload) <> ''),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  recorded_by_account_id uuid not null references user_accounts(id),
  accepted_ledger_version bigint not null
    check (accepted_ledger_version > 1 and accepted_ledger_version <= 9007199254740991),
  created_at timestamptz not null,
  unique (capture_session_id, occurrence_id, revision_number),
  unique (occurrence_revision_id, capture_session_id)
);

create function enforce_statkeeper_occurrence_revision()
returns trigger
language plpgsql
as $$
declare
  head_record statkeeper_event_ledger_heads%rowtype;
  payload jsonb;
begin
  select * into strict head_record
    from statkeeper_event_ledger_heads
   where capture_session_id = new.capture_session_id;
  if new.game_id <> head_record.game_id
     or new.profile_version_id <> head_record.profile_version_id
     or new.media_id <> head_record.media_id
     or new.accepted_ledger_version <> head_record.ledger_version then
    raise exception 'Occurrence revision must match its current Statkeeper ledger head';
  end if;

  payload := new.canonical_payload::jsonb;
  if payload ->> 'format' <> 'courtside.statkeeper.occurrence-ledger/v1'
     or (payload ->> 'capture_session_id')::uuid <> new.capture_session_id
     or (payload ->> 'game_id')::uuid <> new.game_id
     or (payload ->> 'profile_version_id')::uuid <> new.profile_version_id
     or (payload ->> 'media_id')::uuid <> new.media_id
     or (payload ->> 'occurrence_id')::uuid <> new.occurrence_id
     or (payload ->> 'occurrence_revision_id')::uuid <> new.occurrence_revision_id
     or (payload ->> 'revision_number')::integer <> new.revision_number
     or payload ->> 'source' <> new.source
     or payload ->> 'verification_state' <> new.verification_state
     or payload ->> 'disposition' <> new.disposition
     or (payload ->> 'recorded_by_account_id')::uuid <> new.recorded_by_account_id
     or jsonb_typeof(payload -> 'events') <> 'array'
     or jsonb_array_length(payload -> 'events') = 0 then
    raise exception 'Canonical occurrence payload does not match its durable envelope';
  end if;
  return new;
end;
$$;

create trigger statkeeper_occurrence_revision_valid_insert
before insert on statkeeper_occurrence_revisions
for each row execute function enforce_statkeeper_occurrence_revision();

create trigger statkeeper_occurrence_revisions_append_only
before update or delete on statkeeper_occurrence_revisions
for each row execute function reject_append_only_mutation();

create table statkeeper_statistical_events (
  id uuid primary key,
  occurrence_revision_id uuid not null,
  capture_session_id uuid not null,
  emission_ordinal integer not null check (emission_ordinal >= 0),
  event_key text not null check (event_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  outcome_key text not null check (outcome_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  season_team_id uuid not null references season_teams(id),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  unique (occurrence_revision_id, emission_ordinal),
  unique (id, capture_session_id),
  foreign key (occurrence_revision_id, capture_session_id)
    references statkeeper_occurrence_revisions(occurrence_revision_id, capture_session_id)
);

create table statkeeper_statistical_event_assignments (
  event_id uuid not null,
  capture_session_id uuid not null,
  role_key text not null check (role_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  roster_membership_id uuid not null,
  player_id uuid not null references players(id),
  season_team_id uuid not null references season_teams(id),
  primary key (event_id, role_key),
  unique (event_id, roster_membership_id),
  foreign key (event_id, capture_session_id)
    references statkeeper_statistical_events(id, capture_session_id),
  foreign key (capture_session_id, roster_membership_id, player_id, season_team_id)
    references statkeeper_event_ledger_participants(
      capture_session_id,
      roster_membership_id,
      player_id,
      season_team_id
    )
);

create function enforce_statkeeper_event_assignment()
returns trigger
language plpgsql
as $$
declare
  event_team_id uuid;
  participant_status text;
begin
  select season_team_id into strict event_team_id
    from statkeeper_statistical_events
   where id = new.event_id;
  select participation_status into strict participant_status
    from statkeeper_event_ledger_participants
   where capture_session_id = new.capture_session_id
     and roster_membership_id = new.roster_membership_id;
  if new.season_team_id <> event_team_id or participant_status <> 'appeared' then
    raise exception 'Statistical Event assignments require an appeared Player on the Event Team';
  end if;
  return new;
end;
$$;

create trigger statkeeper_event_assignment_valid_insert
before insert on statkeeper_statistical_event_assignments
for each row execute function enforce_statkeeper_event_assignment();

create table statkeeper_statistical_event_contributions (
  event_id uuid not null references statkeeper_statistical_events(id),
  stat_key text not null check (stat_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  increment bigint not null check (increment > 0 and increment <= 9007199254740991),
  primary key (event_id, stat_key)
);

create trigger statkeeper_statistical_events_append_only
before update or delete on statkeeper_statistical_events
for each row execute function reject_append_only_mutation();

create trigger statkeeper_statistical_event_assignments_append_only
before update or delete on statkeeper_statistical_event_assignments
for each row execute function reject_append_only_mutation();

create trigger statkeeper_statistical_event_contributions_append_only
before update or delete on statkeeper_statistical_event_contributions
for each row execute function reject_append_only_mutation();

create index statkeeper_occurrence_revisions_session_created_idx
  on statkeeper_occurrence_revisions (capture_session_id, created_at, occurrence_id);

alter table statkeeper_event_ledger_heads enable row level security;
alter table statkeeper_event_ledger_participants enable row level security;
alter table statkeeper_occurrence_revisions enable row level security;
alter table statkeeper_statistical_events enable row level security;
alter table statkeeper_statistical_event_assignments enable row level security;
alter table statkeeper_statistical_event_contributions enable row level security;

revoke all on table statkeeper_event_ledger_heads from anon, authenticated;
revoke all on table statkeeper_event_ledger_participants from anon, authenticated;
revoke all on table statkeeper_occurrence_revisions from anon, authenticated;
revoke all on table statkeeper_statistical_events from anon, authenticated;
revoke all on table statkeeper_statistical_event_assignments from anon, authenticated;
revoke all on table statkeeper_statistical_event_contributions from anon, authenticated;

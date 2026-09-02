create table league_statkeeper_assignments (
  id uuid primary key,
  league_id uuid not null references leagues(id),
  user_account_id uuid not null references user_accounts(id),
  assigned_by_account_id uuid not null references user_accounts(id),
  assigned_at timestamptz not null,
  revoked_by_account_id uuid references user_accounts(id),
  revoked_at timestamptz,
  check (
    (revoked_at is null and revoked_by_account_id is null)
    or
    (revoked_at is not null and revoked_by_account_id is not null and revoked_at >= assigned_at)
  )
);

create unique index league_statkeeper_assignments_active_unique
  on league_statkeeper_assignments (league_id, user_account_id)
  where revoked_at is null;

create function enforce_league_statkeeper_assignment_history()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'League Statkeeper assignment history is append-only';
  end if;
  if new.league_id <> old.league_id
     or new.user_account_id <> old.user_account_id
     or new.assigned_by_account_id <> old.assigned_by_account_id
     or new.assigned_at <> old.assigned_at then
    raise exception 'League Statkeeper assignment identity is immutable';
  end if;
  if old.revoked_at is not null then
    raise exception 'Revoked League Statkeeper assignments are terminal';
  end if;
  if new.revoked_at is null or new.revoked_by_account_id is null then
    raise exception 'League Statkeeper revocation must record actor and timestamp';
  end if;
  return new;
end;
$$;

create trigger league_statkeeper_assignments_controlled_update
before update or delete on league_statkeeper_assignments
for each row execute function enforce_league_statkeeper_assignment_history();

alter table statkeeper_occurrence_revisions
  add column capture_action_key text
    check (capture_action_key is null or capture_action_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  add column capture_input_hash text
    check (capture_input_hash is null or capture_input_hash ~ '^[0-9a-f]{64}$'),
  add column working_revision_id uuid,
  add column accepted_lifecycle_status text
    check (accepted_lifecycle_status is null or accepted_lifecycle_status in ('capturing', 'in_review')),
  add constraint statkeeper_occurrence_capture_envelope_complete check (
    (capture_action_key is null and capture_input_hash is null
      and working_revision_id is null and accepted_lifecycle_status is null)
    or
    (capture_action_key is not null and capture_input_hash is not null
      and working_revision_id is not null
      and accepted_lifecycle_status is not null)
  );

create table statkeeper_possession_sequences (
  id uuid primary key,
  capture_session_id uuid not null references statkeeper_capture_sessions(id),
  working_revision_id uuid not null,
  possessing_season_team_id uuid not null references season_teams(id),
  start_media_offset_ms bigint not null
    check (start_media_offset_ms >= 0 and start_media_offset_ms <= 9007199254740991),
  end_media_offset_ms bigint
    check (end_media_offset_ms is null
      or (end_media_offset_ms >= start_media_offset_ms
        and end_media_offset_ms <= 9007199254740991)),
  ending_reason_key text
    check (ending_reason_key is null or ending_reason_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  started_by_transition_kind text not null
    check (started_by_transition_kind in ('manual', 'automatic')),
  causing_occurrence_id uuid,
  causing_occurrence_revision_id uuid,
  created_by_account_id uuid not null references user_accounts(id),
  created_at timestamptz not null,
  check (
    (end_media_offset_ms is null and ending_reason_key is null)
    or
    (end_media_offset_ms is not null and ending_reason_key is not null)
  ),
  check (
    (started_by_transition_kind = 'manual'
      and causing_occurrence_id is null and causing_occurrence_revision_id is null)
    or
    (started_by_transition_kind = 'automatic'
      and causing_occurrence_id is not null and causing_occurrence_revision_id is not null)
  ),
  unique (id, capture_session_id),
  foreign key (causing_occurrence_revision_id, capture_session_id)
    references statkeeper_occurrence_revisions(occurrence_revision_id, capture_session_id)
);

create unique index statkeeper_possession_sequences_one_open
  on statkeeper_possession_sequences (capture_session_id)
  where end_media_offset_ms is null;

create index statkeeper_possession_sequences_canonical_order
  on statkeeper_possession_sequences (capture_session_id, start_media_offset_ms, id);

create function enforce_statkeeper_possession_sequence()
returns trigger
language plpgsql
as $$
declare
  session_record statkeeper_capture_sessions%rowtype;
  occurrence_record statkeeper_occurrence_revisions%rowtype;
begin
  select * into strict session_record
    from statkeeper_capture_sessions
   where id = new.capture_session_id;
  if new.working_revision_id <> session_record.working_revision_id
     or new.possessing_season_team_id not in (
       session_record.home_season_team_id,
       session_record.away_season_team_id
     ) then
    raise exception 'Possession Sequence must match its Capture Session working context';
  end if;

  if new.started_by_transition_kind = 'automatic' then
    select * into strict occurrence_record
      from statkeeper_occurrence_revisions
     where occurrence_revision_id = new.causing_occurrence_revision_id
       and capture_session_id = new.capture_session_id;
    if occurrence_record.occurrence_id <> new.causing_occurrence_id
       or occurrence_record.disposition <> 'active' then
      raise exception 'Automatic possession transition requires its active causing occurrence';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.id <> old.id
       or new.capture_session_id <> old.capture_session_id
       or new.working_revision_id <> old.working_revision_id
       or new.possessing_season_team_id <> old.possessing_season_team_id
       or new.start_media_offset_ms <> old.start_media_offset_ms
       or new.started_by_transition_kind <> old.started_by_transition_kind
       or new.causing_occurrence_id is distinct from old.causing_occurrence_id
       or new.causing_occurrence_revision_id is distinct from old.causing_occurrence_revision_id
       or new.created_by_account_id <> old.created_by_account_id
       or new.created_at <> old.created_at then
      raise exception 'Possession Sequence identity and transition basis are immutable';
    end if;
    if old.end_media_offset_ms is not null
       or old.ending_reason_key is not null
       or new.end_media_offset_ms is null
       or new.ending_reason_key is null then
      raise exception 'An open Possession Sequence may be closed exactly once';
    end if;
  end if;
  return new;
end;
$$;

create trigger statkeeper_possession_sequences_controlled_write
before insert or update on statkeeper_possession_sequences
for each row execute function enforce_statkeeper_possession_sequence();

create trigger statkeeper_possession_sequences_no_delete
before delete on statkeeper_possession_sequences
for each row execute function reject_append_only_mutation();

create or replace function enforce_statkeeper_occurrence_revision()
returns trigger
language plpgsql
as $$
declare
  head_record statkeeper_event_ledger_heads%rowtype;
  session_record statkeeper_capture_sessions%rowtype;
  payload jsonb;
begin
  select * into strict head_record
    from statkeeper_event_ledger_heads
   where capture_session_id = new.capture_session_id;
  select * into strict session_record
    from statkeeper_capture_sessions
   where id = new.capture_session_id;
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
  if new.capture_action_key is null then
    if payload ? 'capture_action_key' then
      raise exception 'Internal occurrence cannot claim a Capture Action';
    end if;
  elsif payload ->> 'capture_action_key' <> new.capture_action_key
     or new.working_revision_id <> session_record.working_revision_id then
    raise exception 'Capture occurrence must match its action and working revision';
  end if;
  return new;
end;
$$;

alter table league_statkeeper_assignments enable row level security;
alter table statkeeper_possession_sequences enable row level security;

revoke all on table league_statkeeper_assignments from anon, authenticated;
revoke all on table statkeeper_possession_sequences from anon, authenticated;

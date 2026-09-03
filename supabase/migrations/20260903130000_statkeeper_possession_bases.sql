-- Full immutable bases replace close-once sequence rows as the working authority.
-- The old rows remain an archive; a correction never updates that history or events.
create table statkeeper_possession_bases (
  id uuid primary key,
  capture_session_id uuid not null references statkeeper_capture_sessions(id),
  working_revision_id uuid not null,
  ledger_version bigint not null check (ledger_version between 1 and 9007199254740991),
  previous_basis_id uuid,
  sequences jsonb not null check (jsonb_typeof(sequences) = 'array'),
  operation text not null check (operation in ('migration', 'manual_set', 'manual_correction', 'automatic_switch')),
  change_media_offset_ms bigint check (change_media_offset_ms between 0 and 9007199254740991),
  created_by_account_id uuid not null references user_accounts(id),
  reason text check (reason is null or (length(reason) between 1 and 500)),
  created_at timestamptz not null,
  check ((operation = 'migration' and change_media_offset_ms is null)
    or (operation <> 'migration' and change_media_offset_ms is not null)),
  unique (capture_session_id, ledger_version),
  unique (id, capture_session_id),
  foreign key (previous_basis_id, capture_session_id)
    references statkeeper_possession_bases(id, capture_session_id)
);

create index statkeeper_possession_bases_current
  on statkeeper_possession_bases (capture_session_id, working_revision_id, ledger_version desc);

-- Preserve the exact legacy sequence IDs, closures, and automatic causes. This is
-- a cutover snapshot at the current ledger version, not invented earlier history.
insert into statkeeper_possession_bases
  (id, capture_session_id, working_revision_id, ledger_version, sequences,
   operation, created_by_account_id, created_at)
select gen_random_uuid(), session.id, session.working_revision_id, head.ledger_version,
       jsonb_agg(jsonb_build_object(
         'sequenceId', sequence.id,
         'possessingSeasonTeamId', sequence.possessing_season_team_id,
         'startMediaOffsetMs', sequence.start_media_offset_ms,
         'endMediaOffsetMs', sequence.end_media_offset_ms,
         'endingReasonKey', sequence.ending_reason_key,
         'transitionKind', sequence.started_by_transition_kind,
         'causingOccurrenceId', sequence.causing_occurrence_id,
         'causingOccurrenceRevisionId', sequence.causing_occurrence_revision_id
       ) order by sequence.start_media_offset_ms, sequence.id),
       'migration', (array_agg(sequence.created_by_account_id order by sequence.created_at desc, sequence.id))[1],
       greatest(session.updated_at, head.updated_at, max(sequence.created_at))
  from statkeeper_capture_sessions session
  join statkeeper_event_ledger_heads head on head.capture_session_id = session.id
  join statkeeper_possession_sequences sequence on sequence.capture_session_id = session.id
 group by session.id, head.ledger_version, head.updated_at;

create function enforce_statkeeper_possession_basis()
returns trigger
language plpgsql
as $$
declare
  session_record statkeeper_capture_sessions%rowtype;
  latest_basis statkeeper_possession_bases%rowtype;
  current_ledger bigint;
  item jsonb;
  sequence_id uuid;
  team_id uuid;
  start_offset numeric;
  end_offset numeric;
  seen_ids uuid[] := array[]::uuid[];
  closed_end numeric := 0;
  open_start numeric := null;
begin
  select * into strict session_record from statkeeper_capture_sessions
   where id = new.capture_session_id for update;
  select ledger_version into strict current_ledger from statkeeper_event_ledger_heads
   where capture_session_id = new.capture_session_id for update;
  select * into latest_basis from statkeeper_possession_bases
   where capture_session_id = new.capture_session_id and working_revision_id = new.working_revision_id
   order by ledger_version desc limit 1;
  if new.operation = 'migration'
     or new.working_revision_id <> session_record.working_revision_id
     or session_record.lifecycle_status not in ('capturing', 'in_review', 'verified')
     or new.ledger_version <> current_ledger
     or new.previous_basis_id is distinct from latest_basis.id
     or new.ledger_version <= coalesce(latest_basis.ledger_version, 0)
     or new.created_at < coalesce(latest_basis.created_at, session_record.created_at) then
    raise exception 'Possession basis must extend the current editable session and ledger';
  end if;
  for item in select value from jsonb_array_elements(new.sequences)
    order by (value->>'startMediaOffsetMs')::numeric,
             (value->>'endMediaOffsetMs')::numeric nulls last, value->>'sequenceId'
  loop
    if jsonb_typeof(item) <> 'object'
       or not (item ?& array['sequenceId', 'possessingSeasonTeamId', 'startMediaOffsetMs',
         'endMediaOffsetMs', 'endingReasonKey', 'transitionKind', 'causingOccurrenceId', 'causingOccurrenceRevisionId'])
       or (select count(*) from jsonb_object_keys(item)) <> 8
       or jsonb_typeof(item->'sequenceId') <> 'string'
       or jsonb_typeof(item->'possessingSeasonTeamId') <> 'string'
       or jsonb_typeof(item->'startMediaOffsetMs') <> 'number'
       or jsonb_typeof(item->'endMediaOffsetMs') not in ('number', 'null')
       or jsonb_typeof(item->'endingReasonKey') not in ('string', 'null')
       or coalesce(item->>'transitionKind', '') not in ('manual', 'automatic') then
      raise exception 'Possession basis sequence has invalid canonical fields';
    end if;
    sequence_id := (item->>'sequenceId')::uuid;
    team_id := (item->>'possessingSeasonTeamId')::uuid;
    start_offset := (item->>'startMediaOffsetMs')::numeric;
    end_offset := (item->>'endMediaOffsetMs')::numeric;
    if sequence_id = any(seen_ids)
       or team_id not in (session_record.home_season_team_id, session_record.away_season_team_id)
       or start_offset not between 0 and 9007199254740991 or trunc(start_offset) <> start_offset
       or (end_offset is not null and (end_offset < start_offset
         or end_offset > 9007199254740991 or trunc(end_offset) <> end_offset))
       or (item->>'endingReasonKey' is not null and item->>'endingReasonKey' !~ '^[a-z][a-z0-9_]{0,63}$')
       or (end_offset is null and item->>'endingReasonKey' is not null) then
      raise exception 'Possession basis sequence identity, team, or interval is invalid';
    end if;
    seen_ids := array_append(seen_ids, sequence_id);
    if end_offset is null then
      if open_start is not null or start_offset < closed_end then
        raise exception 'Possession basis permits at most one nonoverlapping open sequence';
      end if;
      open_start := start_offset;
    else
      if start_offset < closed_end or (open_start is not null and end_offset > open_start) then
        raise exception 'Possession basis intervals must not overlap';
      end if;
      closed_end := end_offset;
    end if;
    if item->>'transitionKind' = 'manual' then
      if item->'causingOccurrenceId' <> 'null'::jsonb or item->'causingOccurrenceRevisionId' <> 'null'::jsonb then
        raise exception 'Manual possession transition cannot claim an automatic cause';
      end if;
    elsif not exists (
      select 1 from statkeeper_occurrence_revisions occurrence
       where occurrence.capture_session_id = new.capture_session_id
         and occurrence.occurrence_revision_id = (item->>'causingOccurrenceRevisionId')::uuid
         and occurrence.occurrence_id = (item->>'causingOccurrenceId')::uuid
         and occurrence.disposition = 'active'
         and occurrence.accepted_ledger_version <= new.ledger_version
    ) then
      raise exception 'Automatic possession transition requires its active causing occurrence';
    end if;
  end loop;
  return new;
end;
$$;

create trigger statkeeper_possession_bases_controlled_insert
before insert on statkeeper_possession_bases
for each row execute function enforce_statkeeper_possession_basis();

create trigger statkeeper_possession_bases_no_mutation
before update or delete on statkeeper_possession_bases
for each row execute function reject_append_only_mutation();

-- Retain, but freeze, the former write authority after its cutover snapshot.
create trigger statkeeper_possession_sequences_archived
before insert or update on statkeeper_possession_sequences
for each row execute function reject_append_only_mutation();

alter table statkeeper_possession_bases enable row level security;
revoke all on statkeeper_possession_bases from anon, authenticated;

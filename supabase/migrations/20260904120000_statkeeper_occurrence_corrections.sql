alter table statkeeper_occurrence_revisions
  drop constraint statkeeper_occurrence_revisions_revision_number_check,
  drop constraint statkeeper_occurrence_revisions_verification_state_check,
  drop constraint statkeeper_occurrence_revisions_disposition_check,
  add column previous_occurrence_revision_id uuid,
  add column correction_reason text check (
    correction_reason is null or (btrim(correction_reason) <> '' and length(correction_reason) <= 500)
  ),
  add constraint statkeeper_occurrence_revision_number_valid check (revision_number > 0),
  add constraint statkeeper_occurrence_verification_state_valid check (
    verification_state in ('recorded', 'verified')
  ),
  add constraint statkeeper_occurrence_disposition_valid check (disposition in ('active', 'void')),
  add constraint statkeeper_occurrence_revision_lineage_shape check (
    (revision_number = 1 and previous_occurrence_revision_id is null and correction_reason is null)
    or (revision_number > 1 and previous_occurrence_revision_id is not null)
  ),
  add foreign key (previous_occurrence_revision_id, capture_session_id)
    references statkeeper_occurrence_revisions(occurrence_revision_id, capture_session_id);

alter table statkeeper_possession_bases
  drop constraint statkeeper_possession_bases_operation_check,
  add constraint statkeeper_possession_bases_operation_check check (
    operation in ('migration', 'manual_set', 'manual_correction', 'automatic_switch', 'occurrence_correction')
  ),
  add constraint statkeeper_possession_automatic_predecessor check (
    operation <> 'automatic_switch' or previous_basis_id is not null
  );

create or replace function enforce_statkeeper_occurrence_revision()
returns trigger
language plpgsql
as $$
declare
  head_record statkeeper_event_ledger_heads%rowtype;
  session_record statkeeper_capture_sessions%rowtype;
  previous_record statkeeper_occurrence_revisions%rowtype;
  payload jsonb;
begin
  select * into strict head_record from statkeeper_event_ledger_heads
   where capture_session_id = new.capture_session_id;
  select * into strict session_record from statkeeper_capture_sessions
   where id = new.capture_session_id;
  if new.game_id <> head_record.game_id
     or new.profile_version_id <> head_record.profile_version_id
     or new.media_id <> head_record.media_id
     or new.accepted_ledger_version <> head_record.ledger_version then
    raise exception 'Occurrence revision must match its current Statkeeper ledger head';
  end if;

  if new.revision_number > 1 then
    select * into strict previous_record from statkeeper_occurrence_revisions
     where occurrence_revision_id = new.previous_occurrence_revision_id
       and capture_session_id = new.capture_session_id;
    if previous_record.occurrence_id <> new.occurrence_id
       or new.revision_number <> previous_record.revision_number + 1
       or exists (select 1 from statkeeper_occurrence_revisions later
         where later.capture_session_id = new.capture_session_id
           and later.occurrence_id = new.occurrence_id
           and later.revision_number > previous_record.revision_number) then
      raise exception 'Occurrence revision must extend the latest immutable revision';
    end if;
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
     or (new.disposition = 'active' and jsonb_array_length(payload -> 'events') = 0)
     or (new.disposition = 'void' and jsonb_array_length(payload -> 'events') <> 0) then
    raise exception 'Canonical occurrence payload does not match its durable envelope';
  end if;
  if new.revision_number = 1 then
    if payload ? 'previous_occurrence_revision_id' or payload ? 'correction_reason' then
      raise exception 'Initial occurrence cannot claim correction lineage';
    end if;
  elsif (payload ->> 'previous_occurrence_revision_id')::uuid <> new.previous_occurrence_revision_id
     or payload -> 'correction_reason' is distinct from coalesce(to_jsonb(new.correction_reason), 'null'::jsonb) then
    raise exception 'Occurrence correction payload must preserve predecessor and reason';
  end if;
  if new.capture_action_key is null then
    if payload ? 'capture_action_key' then raise exception 'Internal occurrence cannot claim a Capture Action'; end if;
  elsif payload ->> 'capture_action_key' <> new.capture_action_key
     or new.working_revision_id <> session_record.working_revision_id then
    raise exception 'Capture occurrence must match its action and working revision';
  end if;
  return new;
end;
$$;

create function enforce_statkeeper_statistical_event_active_revision()
returns trigger
language plpgsql
as $$
declare
  parent_disposition text;
begin
  select disposition into strict parent_disposition
    from statkeeper_occurrence_revisions
   where occurrence_revision_id = new.occurrence_revision_id
     and capture_session_id = new.capture_session_id;
  if parent_disposition <> 'active' then
    raise exception 'Void occurrence revisions cannot own active Statistical Events';
  end if;
  return new;
end;
$$;

create trigger statkeeper_statistical_event_active_revision
before insert on statkeeper_statistical_events
for each row execute function enforce_statkeeper_statistical_event_active_revision();

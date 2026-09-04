-- Immutable accepted coverage; initial preflight rows remain the unreviewed baseline.
create table statkeeper_coverage_bases (
  id uuid primary key,
  capture_session_id uuid not null references statkeeper_capture_sessions(id),
  working_revision_id uuid not null,
  reviewed_ledger_version bigint not null check (reviewed_ledger_version > 0 and reviewed_ledger_version <= 9007199254740991),
  declarations jsonb not null check (jsonb_typeof(declarations) = 'array'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  reviewed_by_account_id uuid not null references user_accounts(id),
  created_at timestamptz not null,
  unique (capture_session_id, reviewed_ledger_version)
);

create function enforce_statkeeper_coverage_basis()
returns trigger language plpgsql as $$
declare
  session_record statkeeper_capture_sessions%rowtype;
  head_version bigint;
  group_keys jsonb;
  declaration jsonb;
begin
  select * into strict session_record from statkeeper_capture_sessions where id = new.capture_session_id;
  select ledger_version into strict head_version from statkeeper_event_ledger_heads where capture_session_id = new.capture_session_id;
  select coverage_group_keys into strict group_keys from league_statkeeping_profile_versions where id = session_record.profile_version_id;
  if session_record.lifecycle_status <> 'in_review'
     or new.working_revision_id <> session_record.working_revision_id
     or new.reviewed_ledger_version <> head_version then
    raise exception 'Coverage basis must match the current in-review ledger';
  end if;
  if jsonb_array_length(new.declarations) <> jsonb_array_length(group_keys)
     or (select count(distinct d->>'coverageGroupKey') from jsonb_array_elements(new.declarations) d) <> jsonb_array_length(group_keys) then
    raise exception 'Coverage must declare every Profile group exactly once';
  end if;
  for declaration in select value from jsonb_array_elements(new.declarations) loop
    if not (declaration ?& array['coverageGroupKey','status','gaps'])
       or not (group_keys ? (declaration->>'coverageGroupKey'))
       or declaration->>'status' not in ('not_reviewed','complete','partial')
       or jsonb_typeof(declaration->'gaps') is distinct from 'array' then
      raise exception 'Invalid coverage declaration';
    end if;
    if (declaration->>'status' = 'partial') <> (jsonb_array_length(declaration->'gaps') > 0) then
      raise exception 'Only partial coverage must retain nonempty gaps';
    end if;
  end loop;
  return new;
end;
$$;

create trigger statkeeper_coverage_basis_context before insert on statkeeper_coverage_bases
for each row execute function enforce_statkeeper_coverage_basis();
create trigger statkeeper_coverage_bases_append_only before update or delete on statkeeper_coverage_bases
for each row execute function reject_append_only_mutation();
alter table statkeeper_coverage_bases enable row level security;
revoke all on table statkeeper_coverage_bases from anon, authenticated;

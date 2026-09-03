-- Preserve the stable assignment identity even when an alternate server path revokes it.
create or replace function enforce_league_statkeeper_assignment_history()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'League Statkeeper assignment history is append-only';
  end if;
  if new.id <> old.id
     or new.league_id <> old.league_id
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

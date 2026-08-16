create function reject_frozen_season_result_configuration_change()
returns trigger
language plpgsql
as $$
begin
  if (old.frozen_configuration_version_id is not null
      or new.frozen_configuration_version_id is not null)
     and new.result_configuration is distinct from old.result_configuration then
    raise exception 'Frozen Season result configuration requires a versioned amendment';
  end if;
  return new;
end;
$$;

create trigger seasons_result_configuration_freeze_guard
before update of result_configuration on seasons
for each row execute function reject_frozen_season_result_configuration_change();

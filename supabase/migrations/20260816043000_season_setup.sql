alter table seasons
  add constraint seasons_name_length
  check (char_length(btrim(name)) between 2 and 120);

create unique index seasons_league_name_case_insensitive_unique
  on seasons (league_id, lower(name));

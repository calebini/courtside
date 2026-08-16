alter table teams
  add constraint teams_name_length
  check (
    char_length(btrim(name)) between 2 and 120
    and name !~ '[[:cntrl:]]'
  );

create unique index teams_league_name_case_insensitive_unique
  on teams (league_id, lower(name));

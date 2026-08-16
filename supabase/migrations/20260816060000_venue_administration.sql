alter table venues
  add column archived_at timestamptz,
  add constraint venues_name_format check (
    char_length(btrim(name)) between 2 and 120
    and name !~ '[[:cntrl:]]'
  ),
  add constraint venues_address_format check (
    char_length(btrim(address)) between 2 and 240
    and address !~ '[[:cntrl:]]'
  ),
  add constraint venues_notes_format check (
    notes is null
    or (
      char_length(btrim(notes)) between 1 and 1000
      and notes !~ '[[:cntrl:]]'
    )
  );

alter table venues
  drop constraint venues_league_id_name_address_key;

create unique index venues_league_active_name_case_insensitive_unique
  on venues (league_id, lower(name))
  where archived_at is null;

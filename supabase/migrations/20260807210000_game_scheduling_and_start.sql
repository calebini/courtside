create table venues (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id),
  name text not null check (btrim(name) <> ''),
  address text not null check (btrim(address) <> ''),
  notes text check (notes is null or btrim(notes) <> ''),
  created_at timestamptz not null default now(),
  unique (league_id, name, address)
);

alter table games
  add column venue_id uuid references venues(id),
  add column venue_instructions text
    check (venue_instructions is null or btrim(venue_instructions) <> '');

create function enforce_game_venue_league()
returns trigger
language plpgsql
as $$
declare
  season_league_id uuid;
  venue_league_id uuid;
begin
  if new.venue_id is null then
    return new;
  end if;

  select league_id into strict season_league_id from seasons where id = new.season_id;
  select league_id into strict venue_league_id from venues where id = new.venue_id;
  if season_league_id <> venue_league_id then
    raise exception 'Game Venue must belong to the same League as the Game Season';
  end if;
  return new;
end;
$$;

create trigger games_same_league_venue
before insert or update of season_id, venue_id on games
for each row execute function enforce_game_venue_league();

create function reject_venue_league_change()
returns trigger
language plpgsql
as $$
begin
  if new.league_id <> old.league_id then
    raise exception 'Venue League ownership is immutable';
  end if;
  return new;
end;
$$;

create trigger venues_immutable_league
before update of league_id on venues
for each row execute function reject_venue_league_change();

alter table venues enable row level security;
revoke all on table venues from anon, authenticated;

-- Disposable local fixture only. Never reuse these credentials or identifiers outside
-- the project-local Supabase stack.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values (
  '00000000-0000-0000-0000-000000000000',
  '40000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'admin@courtside.local',
  crypt('courtside-local-admin', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Local League Admin"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '{"sub":"40000000-0000-4000-8000-000000000001","email":"admin@courtside.local","email_verified":true}'::jsonb,
  'email',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do nothing;

insert into leagues (id, name, timezone, default_language)
values (
  '40000000-0000-4000-8000-000000000010',
  'Courtside Rec League',
  'America/Los_Angeles',
  'en'
);

insert into user_accounts (id, external_auth_id, display_name)
values (
  '40000000-0000-4000-8000-000000000011',
  '40000000-0000-4000-8000-000000000001',
  'Local League Admin'
);

insert into venues (id, league_id, name, address, notes)
values (
  '40000000-0000-4000-8000-000000000013',
  '40000000-0000-4000-8000-000000000010',
  'Harbour Community Centre',
  '100 Harbour Way',
  'Use the east gym entrance.'
);

insert into league_admin_assignments (id, league_id, user_account_id)
values (
  '40000000-0000-4000-8000-000000000012',
  '40000000-0000-4000-8000-000000000010',
  '40000000-0000-4000-8000-000000000011'
);

insert into seasons (id, league_id, name, result_configuration)
values (
  '40000000-0000-4000-8000-000000000020',
  '40000000-0000-4000-8000-000000000010',
  '2026 Summer',
  '{
    "standings": {
      "points": {"win": 2, "loss": 0},
      "ranking": ["league_points", "point_differential", "points_scored", "random_draw"],
      "eligible_phases": ["regular"],
      "eligible_statuses": ["final", "forfeit"],
      "adjustments_enabled": false,
      "forfeit_treatment": "explicit_score"
    },
    "playoffs": {
      "rounds": [
        {
          "id": "championship",
          "order": 1,
          "games_per_matchup": 1,
          "advancement_rule": "aggregate_points",
          "aggregate_tiebreak": "overtime"
        }
      ]
    }
  }'::jsonb
);

insert into teams (id, league_id, name)
values
  ('40000000-0000-4000-8000-000000000030', '40000000-0000-4000-8000-000000000010', 'Harbour Hawks'),
  ('40000000-0000-4000-8000-000000000031', '40000000-0000-4000-8000-000000000010', 'Northside Comets'),
  ('40000000-0000-4000-8000-000000000032', '40000000-0000-4000-8000-000000000010', 'Riverside Foxes'),
  ('40000000-0000-4000-8000-000000000033', '40000000-0000-4000-8000-000000000010', 'West End Waves');

insert into season_teams (id, season_id, team_id)
values
  ('40000000-0000-4000-8000-000000000040', '40000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000030'),
  ('40000000-0000-4000-8000-000000000041', '40000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000031'),
  ('40000000-0000-4000-8000-000000000042', '40000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000032'),
  ('40000000-0000-4000-8000-000000000043', '40000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000033');

insert into players (id, league_id, display_name)
values
  ('40000000-0000-4000-8000-000000000060', '40000000-0000-4000-8000-000000000010', 'Avery Chen'),
  ('40000000-0000-4000-8000-000000000061', '40000000-0000-4000-8000-000000000010', 'Jordan Lee'),
  ('40000000-0000-4000-8000-000000000062', '40000000-0000-4000-8000-000000000010', 'Morgan Patel'),
  ('40000000-0000-4000-8000-000000000063', '40000000-0000-4000-8000-000000000010', 'Samira Roy');

insert into roster_memberships
  (id, player_id, season_id, season_team_id, effective_from)
values
  (
    '40000000-0000-4000-8000-000000000070',
    '40000000-0000-4000-8000-000000000060',
    '40000000-0000-4000-8000-000000000020',
    '40000000-0000-4000-8000-000000000040',
    '2026-06-01T09:00:00-07:00'
  ),
  (
    '40000000-0000-4000-8000-000000000071',
    '40000000-0000-4000-8000-000000000061',
    '40000000-0000-4000-8000-000000000020',
    '40000000-0000-4000-8000-000000000041',
    '2026-06-01T09:00:00-07:00'
  ),
  (
    '40000000-0000-4000-8000-000000000072',
    '40000000-0000-4000-8000-000000000062',
    '40000000-0000-4000-8000-000000000020',
    '40000000-0000-4000-8000-000000000042',
    '2026-06-01T09:00:00-07:00'
  ),
  (
    '40000000-0000-4000-8000-000000000073',
    '40000000-0000-4000-8000-000000000063',
    '40000000-0000-4000-8000-000000000020',
    '40000000-0000-4000-8000-000000000043',
    '2026-06-01T09:00:00-07:00'
  );

insert into games (
  id,
  season_id,
  phase,
  status,
  home_season_team_id,
  away_season_team_id,
  scheduled_at,
  started_at,
  competition_eligibility_at,
  venue_id,
  venue_instructions
)
values
  (
    '40000000-0000-4000-8000-000000000050',
    '40000000-0000-4000-8000-000000000020',
    'regular',
    'in_progress',
    '40000000-0000-4000-8000-000000000040',
    '40000000-0000-4000-8000-000000000041',
    '2026-08-07T18:00:00-07:00',
    '2026-08-07T18:02:00-07:00',
    '2026-08-07T18:02:00-07:00',
    '40000000-0000-4000-8000-000000000013',
    'Court 1'
  ),
  (
    '40000000-0000-4000-8000-000000000051',
    '40000000-0000-4000-8000-000000000020',
    'regular',
    'in_progress',
    '40000000-0000-4000-8000-000000000042',
    '40000000-0000-4000-8000-000000000043',
    '2026-08-07T19:30:00-07:00',
    '2026-08-07T19:34:00-07:00',
    '2026-08-07T19:34:00-07:00',
    '40000000-0000-4000-8000-000000000013',
    'Court 2'
  );

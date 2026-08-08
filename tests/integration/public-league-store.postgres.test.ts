import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresPublicLeagueStore} from '@/courtside/adapters/postgres/public-league-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '70000000-0000-4000-8000-000000000001',
  emptyLeague: '70000000-0000-4000-8000-000000000002',
  season: '70000000-0000-4000-8000-000000000003',
  teamA: '70000000-0000-4000-8000-000000000004',
  teamB: '70000000-0000-4000-8000-000000000005',
  seasonTeamA: '70000000-0000-4000-8000-000000000006',
  seasonTeamB: '70000000-0000-4000-8000-000000000007',
  venue: '70000000-0000-4000-8000-000000000008',
  configuration: '70000000-0000-4000-8000-000000000009'
};

const resultConfiguration = {
  standings: {
    points: {win: 2, loss: 0},
    ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw'],
    eligible_phases: ['regular'],
    eligible_statuses: ['final', 'forfeit'],
    adjustments_enabled: false,
    forfeit_treatment: 'explicit_score'
  },
  playoffs: {rounds: []}
};

describeWithDatabase('PostgreSQL public League read model', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createPostgresPool(connectionString!);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`
      truncate table
        command_receipts,
        audit_records,
        games,
        venues,
        season_configuration_versions,
        season_teams,
        teams,
        league_admin_assignments,
        user_accounts,
        seasons,
        leagues
      restart identity cascade
    `);
    await pool.query(
      `insert into leagues (id, name, timezone, default_language)
       values ($1, 'Courtside', 'America/Los_Angeles', 'en'),
              ($2, 'League Without a Season', 'America/Toronto', 'fr')`,
      [ids.league, ids.emptyLeague]
    );
    await pool.query(
      `insert into seasons (id, league_id, name, result_configuration)
       values ($1, $2, '2026 Summer', $3::jsonb)`,
      [ids.season, ids.league, JSON.stringify(resultConfiguration)]
    );
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $3, 'Hawks'), ($2, $3, 'Comets')`,
      [ids.teamA, ids.teamB, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id)
       values ($1, $3, $4), ($2, $3, $5)`,
      [ids.seasonTeamA, ids.seasonTeamB, ids.season, ids.teamA, ids.teamB]
    );
    await pool.query(
      `insert into venues (id, league_id, name, address)
       values ($1, $2, 'Community Centre', '100 Main Street')`,
      [ids.venue, ids.league]
    );
    await pool.query(
      `insert into season_configuration_versions
        (id, season_id, version_number, configuration, basis_hash, frozen_at)
       values ($1, $2, 1, $3::jsonb, $4, '2026-08-01T00:00:00Z')`,
      [ids.configuration, ids.season, JSON.stringify(resultConfiguration), 'a'.repeat(64)]
    );
    await pool.query(
      `update seasons set frozen_configuration_version_id = $2 where id = $1`,
      [ids.season, ids.configuration]
    );
    await pool.query(
      `insert into games
        (id, season_id, phase, status, home_season_team_id, away_season_team_id,
         scheduled_at, started_at, competition_eligibility_at, finalized_at,
         home_score, away_score, winning_season_team_id, configuration_version_id,
         venue_id, venue_instructions)
       values
        ('71000000-0000-4000-8000-000000000001', $1, 'regular', 'scheduled', $2, $3,
         '2026-08-20T01:00:00Z', null, null, null, null, null, null, null, $4, 'Court 2'),
        ('71000000-0000-4000-8000-000000000002', $1, 'regular', 'cancelled', $2, $3,
         '2026-08-21T01:00:00Z', null, null, null, null, null, null, null, null, null),
        ('71000000-0000-4000-8000-000000000003', $1, 'regular', 'final', $2, $3,
         '2026-08-01T01:00:00Z', '2026-08-01T01:05:00Z', '2026-08-01T01:05:00Z',
         '2026-08-01T03:00:00Z', 80, 70, $2, $5, $4, 'Court 1'),
        ('71000000-0000-4000-8000-000000000004', $1, 'regular', 'forfeit', $2, $3,
         '2026-08-08T01:00:00Z', null, '2026-08-08T01:00:00Z',
         '2026-08-08T01:00:00Z', 0, 20, $3, $5, null, null),
        ('71000000-0000-4000-8000-000000000005', $1, 'playoff', 'final', $2, $3,
         '2026-08-15T01:00:00Z', '2026-08-15T01:05:00Z', '2026-08-15T01:05:00Z',
         '2026-08-15T03:00:00Z', 60, 55, $2, $5, null, null)`,
      [ids.season, ids.seasonTeamA, ids.seasonTeamB, ids.venue, ids.configuration]
    );
  });

  it('publishes schedules and official results while deriving regular-season standings', async () => {
    const leagues = await new PostgresPublicLeagueStore(pool).load();

    expect(leagues).toHaveLength(2);
    expect(leagues[0]).toMatchObject({
      name: 'Courtside',
      timezone: 'America/Los_Angeles',
      defaultLanguage: 'en',
      seasons: [
        {
          name: '2026 Summer',
          schedule: [
            {
              status: 'scheduled',
              homeTeamName: 'Hawks',
              awayTeamName: 'Comets',
              venueName: 'Community Centre',
              venueAddress: '100 Main Street',
              venueInstructions: 'Court 2'
            },
            {status: 'cancelled'}
          ],
          results: [
            {phase: 'playoff', status: 'final', homeScore: 60, awayScore: 55},
            {phase: 'regular', status: 'forfeit', homeScore: 0, awayScore: 20},
            {phase: 'regular', status: 'final', homeScore: 80, awayScore: 70}
          ],
          standings: [
            {
              teamName: 'Comets',
              rank: 1,
              gamesPlayed: 2,
              wins: 1,
              losses: 1,
              leaguePoints: 2,
              pointDifferential: 10,
              pointsFor: 90
            },
            {
              teamName: 'Hawks',
              rank: 2,
              gamesPlayed: 2,
              wins: 1,
              losses: 1,
              leaguePoints: 2,
              pointDifferential: -10,
              pointsFor: 80
            }
          ]
        }
      ]
    });
    expect(leagues[1]).toMatchObject({name: 'League Without a Season', seasons: []});
    expect(Object.keys(leagues[0].seasons[0].results[0])).not.toContain('reason');
    expect(Object.keys(leagues[0].seasons[0].results[0])).not.toContain('actorAccountId');
  });
});

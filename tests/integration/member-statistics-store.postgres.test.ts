import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresMemberStatisticsStore} from '@/courtside/adapters/postgres/member-statistics-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const id = (suffix: string) => `b1000000-0000-4000-8000-${suffix.padStart(12, '0')}`;
const ids = {
  league: id('1'), admin: id('2'), member: id('3'), captain: id('4'), pending: id('5'),
  adminAssignment: id('6'), relationship: id('7'), pendingRelationship: id('8'), captainAssignment: id('9'),
  season: id('10'), teamA: id('11'), teamB: id('12'), teamC: id('13'),
  seasonTeamA: id('14'), seasonTeamB: id('15'), seasonTeamC: id('16'),
  playerA: id('17'), playerB: id('18'), membershipA1: id('19'), membershipA2: id('20'), membershipB: id('21'),
  configuration: id('22'), gameOne: id('23'), gameTwo: id('24'), statA1: id('25'), statA2: id('26'), statB1: id('27')
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

describeWithDatabase('PostgreSQL member statistics read model', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createPostgresPool(connectionString!);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('truncate table leagues, user_accounts restart identity cascade');
    await pool.query(
      `insert into leagues (id, name, timezone, default_language)
       values ($1, 'Courtside', 'Europe/Paris', 'en')`,
      [ids.league]
    );
    await pool.query(
      `insert into user_accounts (id, display_name)
       values ($1, 'Admin'), ($2, 'Member'), ($3, 'Captain'), ($4, 'Pending')`,
      [ids.admin, ids.member, ids.captain, ids.pending]
    );
    await pool.query(
      `insert into league_admin_assignments (id, league_id, user_account_id)
       values ($1, $2, $3)`,
      [ids.adminAssignment, ids.league, ids.admin]
    );
    await pool.query(
      `insert into seasons (id, league_id, name, result_configuration)
       values ($1, $2, '2026', $3::jsonb)`,
      [ids.season, ids.league, JSON.stringify(resultConfiguration)]
    );
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $4, 'Alpha'), ($2, $4, 'Beta'), ($3, $4, 'Comets')`,
      [ids.teamA, ids.teamB, ids.teamC, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id)
       values ($1, $4, $5), ($2, $4, $6), ($3, $4, $7)`,
      [ids.seasonTeamA, ids.seasonTeamB, ids.seasonTeamC, ids.season, ids.teamA, ids.teamB, ids.teamC]
    );
    await pool.query(
      `insert into players (id, league_id, display_name)
       values ($1, $3, 'Avery Chen'), ($2, $3, 'Jordan Lee')`,
      [ids.playerA, ids.playerB, ids.league]
    );
    await pool.query(
      `insert into roster_memberships
         (id, player_id, season_id, season_team_id, effective_from, effective_until)
       values ($1, $4, $6, $7, '2026-08-01T00:00:00Z', '2026-08-12T00:00:00Z'),
              ($2, $4, $6, $8, '2026-08-12T00:00:00Z', null),
              ($3, $5, $6, $9, '2026-08-01T00:00:00Z', null)`,
      [ids.membershipA1, ids.membershipA2, ids.membershipB, ids.playerA, ids.playerB, ids.season, ids.seasonTeamA, ids.seasonTeamC, ids.seasonTeamB]
    );
    await pool.query(
      `insert into player_management_relationships
         (id, player_id, user_account_id, status, requested_at, requested_by_account_id,
          approved_at, approved_by_account_id)
       values ($1, $3, $4, 'approved', '2026-08-01T00:00:00Z', $4, '2026-08-02T00:00:00Z', $5),
              ($2, $6, $7, 'requested', '2026-08-01T00:00:00Z', $7, null, null)`,
      [ids.relationship, ids.pendingRelationship, ids.playerA, ids.member, ids.admin, ids.playerB, ids.pending]
    );
    await pool.query(
      `insert into season_team_captain_assignments
         (id, season_team_id, user_account_id, assigned_at, assigned_by_account_id)
       values ($1, $2, $3, '2026-08-01T00:00:00Z', $4)`,
      [ids.captainAssignment, ids.seasonTeamB, ids.captain, ids.admin]
    );
    await pool.query(
      `insert into season_configuration_versions
         (id, season_id, version_number, configuration, basis_hash, frozen_at)
       values ($1, $2, 1, $3::jsonb, repeat('b', 64), '2026-08-01T00:00:00Z')`,
      [ids.configuration, ids.season, JSON.stringify(resultConfiguration)]
    );
    await pool.query('update seasons set frozen_configuration_version_id = $2 where id = $1', [ids.season, ids.configuration]);
    await pool.query(
      `insert into games
         (id, season_id, phase, status, home_season_team_id, away_season_team_id,
          scheduled_at, started_at, competition_eligibility_at, finalized_at,
          home_score, away_score, winning_season_team_id, configuration_version_id)
       values ($1, $3, 'regular', 'final', $4, $5,
               '2026-08-10T18:00:00Z', '2026-08-10T18:05:00Z', '2026-08-10T18:05:00Z', '2026-08-10T20:00:00Z',
               80, 70, $4, $6),
              ($2, $3, 'regular', 'forfeit', $7, $5,
               '2026-08-17T18:00:00Z', '2026-08-17T18:05:00Z', '2026-08-17T18:05:00Z', '2026-08-17T20:00:00Z',
               60, 50, $7, $6)`,
      [ids.gameOne, ids.gameTwo, ids.season, ids.seasonTeamA, ids.seasonTeamB, ids.configuration, ids.seasonTeamC]
    );
    await pool.query(
      `insert into player_stat_lines
         (id, game_id, player_id, roster_membership_id, season_id, season_team_id,
          points, verification_status, created_at, updated_at)
       values ($1, $4, $7, $9, $11, $12, 0, 'confirmed', '2026-08-10T20:00:00Z', '2026-08-10T20:00:00Z'),
              ($2, $5, $7, $10, $11, $13, 10, 'confirmed', '2026-08-17T20:00:00Z', '2026-08-17T20:00:00Z'),
              ($3, $4, $8, $6, $11, $14, 14, 'provisional', '2026-08-10T20:00:00Z', '2026-08-10T20:00:00Z')`,
      [ids.statA1, ids.statA2, ids.statB1, ids.gameOne, ids.gameTwo, ids.membershipB, ids.playerA, ids.playerB, ids.membershipA1, ids.membershipA2, ids.season, ids.seasonTeamA, ids.seasonTeamC, ids.seasonTeamB]
    );
  });

  it('admits trusted roles and denies a merely pending relationship', async () => {
    const store = new PostgresMemberStatisticsStore(pool);
    await expect(store.hasAccess(ids.admin)).resolves.toBe(true);
    await expect(store.hasAccess(ids.member)).resolves.toBe(true);
    await expect(store.hasAccess(ids.captain)).resolves.toBe(true);
    await expect(store.hasAccess(ids.pending)).resolves.toBe(false);
    await expect(store.load(ids.pending)).resolves.toMatchObject({hasAccess: false, league: null});
  });

  it('shows league-wide history while keeping confirmed aggregates and official scores independent', async () => {
    const dashboard = await new PostgresMemberStatisticsStore(pool).load(ids.member, 'not-a-season');
    expect(dashboard).toMatchObject({hasAccess: true, hasAdministrativeAccess: false});
    expect(dashboard.selectedSeason?.leaderboard).toEqual([{
      playerId: ids.playerA,
      playerName: 'Avery Chen',
      confirmedTotalPoints: 10,
      confirmedRecordedPointsGames: 2,
      pointsPerRecordedPointsGame: 5,
      rank: 1
    }]);

    const avery = dashboard.selectedSeason?.players.find((player) => player.id === ids.playerA);
    expect(avery?.teamNames).toEqual(['Alpha', 'Comets']);
    expect(avery?.gameLog.map((game) => ({team: game.teamName, points: game.points, status: game.verificationStatus}))).toEqual([
      {team: 'Comets', points: 10, status: 'confirmed'},
      {team: 'Alpha', points: 0, status: 'confirmed'}
    ]);

    const firstGame = dashboard.selectedSeason?.completedGames.find((game) => game.id === ids.gameOne);
    expect(firstGame).toMatchObject({homeScore: 80, awayScore: 70});
    expect(firstGame?.homePlayers).toMatchObject([{playerName: 'Avery Chen', points: 0, verificationStatus: 'confirmed'}]);
    expect(firstGame?.awayPlayers).toMatchObject([{playerName: 'Jordan Lee', points: 14, verificationStatus: 'provisional'}]);

    const secondGame = dashboard.selectedSeason?.completedGames.find((game) => game.id === ids.gameTwo);
    expect(secondGame?.awayPlayers).toMatchObject([{playerName: 'Jordan Lee', points: null, verificationStatus: null}]);
  });
});

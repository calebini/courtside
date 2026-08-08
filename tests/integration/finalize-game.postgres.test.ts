import {randomUUID} from 'node:crypto';

import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresFinalizeGameStore} from '@/courtside/adapters/postgres/finalize-game-store';
import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {createFinalizeGameService} from '@/courtside/services/finalize-game';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '10000000-0000-4000-8000-000000000001',
  admin: '10000000-0000-4000-8000-000000000002',
  outsider: '10000000-0000-4000-8000-000000000003',
  assignment: '10000000-0000-4000-8000-000000000004',
  season: '10000000-0000-4000-8000-000000000005',
  teamA: '10000000-0000-4000-8000-000000000006',
  teamB: '10000000-0000-4000-8000-000000000007',
  seasonTeamA: '10000000-0000-4000-8000-000000000008',
  seasonTeamB: '10000000-0000-4000-8000-000000000009',
  game: '10000000-0000-4000-8000-000000000010',
  secondGame: '10000000-0000-4000-8000-000000000011'
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
  playoffs: {
    rounds: [
      {
        id: 'championship',
        order: 1,
        games_per_matchup: 1,
        advancement_rule: 'aggregate_points',
        aggregate_tiebreak: 'overtime'
      }
    ]
  }
};

describeWithDatabase('PostgreSQL Game finalization slice', () => {
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
       values ($1, 'Courtside', 'America/Los_Angeles', 'en')`,
      [ids.league]
    );
    await pool.query(
      `insert into user_accounts (id, display_name)
       values ($1, 'League Admin'), ($2, 'Outsider')`,
      [ids.admin, ids.outsider]
    );
    await pool.query(
      `insert into league_admin_assignments (id, league_id, user_account_id)
       values ($1, $2, $3)`,
      [ids.assignment, ids.league, ids.admin]
    );
    await pool.query(
      `insert into seasons (id, league_id, name, result_configuration)
       values ($1, $2, '2026', $3::jsonb)`,
      [ids.season, ids.league, JSON.stringify(resultConfiguration)]
    );
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $3, 'A'), ($2, $3, 'B')`,
      [ids.teamA, ids.teamB, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id)
       values ($1, $3, $4), ($2, $3, $5)`,
      [ids.seasonTeamA, ids.seasonTeamB, ids.season, ids.teamA, ids.teamB]
    );
    await pool.query(
      `insert into games
        (id, season_id, phase, status, home_season_team_id, away_season_team_id,
         scheduled_at, started_at)
       values ($1, $2, 'regular', 'in_progress', $3, $4, $5, $5)`,
      [ids.game, ids.season, ids.seasonTeamA, ids.seasonTeamB, new Date('2026-08-07T18:00:00Z')]
    );
  });

  async function insertSecondGame() {
    await pool.query(
      `insert into games
        (id, season_id, phase, status, home_season_team_id, away_season_team_id,
         scheduled_at, started_at)
       values ($1, $2, 'regular', 'in_progress', $3, $4, $5, $5)`,
      [
        ids.secondGame,
        ids.season,
        ids.seasonTeamA,
        ids.seasonTeamB,
        new Date('2026-08-14T18:00:00Z')
      ]
    );
  }

  it('freezes configuration, finalizes, audits, derives standings, and reuses a retry', async () => {
    const generatedIds = [
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002'
    ];
    const service = createFinalizeGameService(new PostgresFinalizeGameStore(pool), {
      now: () => new Date('2026-08-07T19:00:00Z'),
      newId: () => generatedIds.shift() ?? randomUUID()
    });
    const command = {
      commandId: '30000000-0000-4000-8000-000000000001',
      actorAccountId: ids.admin,
      gameId: ids.game,
      homeScore: 81,
      awayScore: 77
    };

    const result = await service(command);

    expect(result.receiptReused).toBe(false);
    expect(result.game).toMatchObject({
      status: 'final',
      winningSeasonTeamId: ids.seasonTeamA,
      version: 1
    });
    expect(result.standings.unresolvedTies).toEqual([]);
    expect(result.standings.rows.map((row) => [row.seasonTeamId, row.rank, row.leaguePoints])).toEqual([
      [ids.seasonTeamA, 1, 2],
      [ids.seasonTeamB, 2, 0]
    ]);

    const retry = await service(command);
    expect(retry).toEqual({...result, receiptReused: true});

    await expect(service({...command, homeScore: 82})).rejects.toMatchObject({
      report: {
        violatedRule: 'command.idempotency_identity',
        authoritativeStatePreserved: true
      }
    });

    const persisted = await pool.query(
      `select
         (select count(*)::int from season_configuration_versions) as configuration_count,
         (select count(*)::int from audit_records) as audit_count,
         (select count(*)::int from command_receipts) as receipt_count,
         (select status from games where id = $1) as game_status`,
      [ids.game]
    );
    expect(persisted.rows[0]).toEqual({
      configuration_count: 1,
      audit_count: 1,
      receipt_count: 1,
      game_status: 'final'
    });
  });

  it('reuses one frozen configuration version for later authoritative Games', async () => {
    await insertSecondGame();
    const generatedIds = [
      '20000000-0000-4000-8000-000000000011',
      '20000000-0000-4000-8000-000000000012',
      '20000000-0000-4000-8000-000000000013'
    ];
    const service = createFinalizeGameService(new PostgresFinalizeGameStore(pool), {
      now: () => new Date('2026-08-14T19:00:00Z'),
      newId: () => generatedIds.shift() ?? randomUUID()
    });

    const first = await service({
      commandId: '30000000-0000-4000-8000-000000000011',
      actorAccountId: ids.admin,
      gameId: ids.game,
      homeScore: 81,
      awayScore: 77
    });
    const second = await service({
      commandId: '30000000-0000-4000-8000-000000000012',
      actorAccountId: ids.admin,
      gameId: ids.secondGame,
      homeScore: 70,
      awayScore: 75
    });

    expect(second.configurationVersionId).toBe(first.configurationVersionId);
    const persisted = await pool.query(
      `select
         (select count(*)::int from season_configuration_versions) as configuration_count,
         (select count(*)::int from audit_records) as audit_count`
    );
    expect(persisted.rows[0]).toEqual({configuration_count: 1, audit_count: 2});
  });

  it('rejects a later Game when mutable configuration diverges from the frozen basis', async () => {
    await insertSecondGame();
    const generatedIds = [
      '20000000-0000-4000-8000-000000000021',
      '20000000-0000-4000-8000-000000000022'
    ];
    const service = createFinalizeGameService(new PostgresFinalizeGameStore(pool), {
      now: () => new Date('2026-08-14T19:00:00Z'),
      newId: () => generatedIds.shift() ?? randomUUID()
    });

    await service({
      commandId: '30000000-0000-4000-8000-000000000021',
      actorAccountId: ids.admin,
      gameId: ids.game,
      homeScore: 81,
      awayScore: 77
    });
    await pool.query(
      `update seasons
          set result_configuration = jsonb_set(
            result_configuration,
            '{standings,points,win}',
            '3'::jsonb
          )
        where id = $1`,
      [ids.season]
    );

    await expect(
      service({
        commandId: '30000000-0000-4000-8000-000000000022',
        actorAccountId: ids.admin,
        gameId: ids.secondGame,
        homeScore: 70,
        awayScore: 75
      })
    ).rejects.toMatchObject({
      report: {
        violatedRule: 'season.configuration_basis_conflict',
        authoritativeStatePreserved: true
      }
    });

    const persisted = await pool.query(
      `select
         (select count(*)::int from season_configuration_versions) as configuration_count,
         (select count(*)::int from audit_records) as audit_count,
         (select status from games where id = $1) as second_game_status`,
      [ids.secondGame]
    );
    expect(persisted.rows[0]).toEqual({
      configuration_count: 1,
      audit_count: 1,
      second_game_status: 'in_progress'
    });
  });

  it('rejects an unauthorized actor without freezing or mutating state', async () => {
    const service = createFinalizeGameService(new PostgresFinalizeGameStore(pool));

    await expect(
      service({
        commandId: '30000000-0000-4000-8000-000000000002',
        actorAccountId: ids.outsider,
        gameId: ids.game,
        homeScore: 81,
        awayScore: 77
      })
    ).rejects.toMatchObject({
      report: {
        violatedRule: 'authorization.league_admin_required',
        authoritativeStatePreserved: true
      }
    });

    const persisted = await pool.query(
      `select
         (select count(*)::int from season_configuration_versions) as configuration_count,
         (select count(*)::int from audit_records) as audit_count,
         (select count(*)::int from command_receipts) as receipt_count,
         (select status from games where id = $1) as game_status`,
      [ids.game]
    );
    expect(persisted.rows[0]).toEqual({
      configuration_count: 0,
      audit_count: 0,
      receipt_count: 0,
      game_status: 'in_progress'
    });
  });

  it('rejects tied finalization before the Season is frozen', async () => {
    const service = createFinalizeGameService(new PostgresFinalizeGameStore(pool));

    await expect(
      service({
        commandId: '30000000-0000-4000-8000-000000000003',
        actorAccountId: ids.admin,
        gameId: ids.game,
        homeScore: 77,
        awayScore: 77
      })
    ).rejects.toMatchObject({
      report: {
        violatedRule: 'game.authoritative_score_not_tied',
        authoritativeStatePreserved: true
      }
    });

    const configurationCount = await pool.query(
      'select count(*)::int as count from season_configuration_versions'
    );
    expect(configurationCount.rows[0].count).toBe(0);
  });

  it('maps a verified login identity and scopes the administrator dashboard', async () => {
    const externalAuthId = '50000000-0000-4000-8000-000000000001';
    await pool.query(
      'update user_accounts set external_auth_id = $2 where id = $1',
      [ids.admin, externalAuthId]
    );
    const {identity, account} = await resolveAuthenticatedAccount(
      {
        getVerifiedIdentity: async () => ({externalAuthId, email: 'admin@example.test'})
      },
      new PostgresUserAccountDirectory(pool)
    );

    expect(identity?.externalAuthId).toBe(externalAuthId);
    expect(account).toEqual({id: ids.admin, displayName: 'League Admin'});

    const leagues = await new PostgresAdminDashboardStore(pool).load(account!.id);
    expect(leagues).toHaveLength(1);
    expect(leagues[0]).toMatchObject({
      id: ids.league,
      seasons: [
        {
          id: ids.season,
          configurationFrozen: false,
          games: [
            {
              id: ids.game,
              homeTeamName: 'A',
              awayTeamName: 'B'
            }
          ],
          unresolvedTieCount: 1
        }
      ]
    });
    expect(leagues[0].seasons[0].standings.map((row) => row.teamName)).toEqual(['A', 'B']);
  });

  it('enforces winner and score consistency below the service layer', async () => {
    const generatedIds = [
      '20000000-0000-4000-8000-000000000031',
      '20000000-0000-4000-8000-000000000032'
    ];
    const service = createFinalizeGameService(new PostgresFinalizeGameStore(pool), {
      now: () => new Date('2026-08-07T19:00:00Z'),
      newId: () => generatedIds.shift() ?? randomUUID()
    });
    const finalized = await service({
      commandId: '30000000-0000-4000-8000-000000000031',
      actorAccountId: ids.admin,
      gameId: ids.game,
      homeScore: 81,
      awayScore: 77
    });

    await expect(
      pool.query(
        `insert into games
          (id, season_id, phase, status, home_season_team_id, away_season_team_id,
           scheduled_at, started_at, finalized_at, home_score, away_score,
           winning_season_team_id, configuration_version_id)
         values ($1, $2, 'regular', 'final', $3, $4, $5, $5, $5, 90, 80, $4, $6)`,
        [
          ids.secondGame,
          ids.season,
          ids.seasonTeamA,
          ids.seasonTeamB,
          new Date('2026-08-14T18:00:00Z'),
          finalized.configurationVersionId
        ]
      )
    ).rejects.toThrow(/games_check/);
  });

  it('rejects a Season Team whose durable Team belongs to another League', async () => {
    const otherLeague = '40000000-0000-4000-8000-000000000001';
    const otherTeam = '40000000-0000-4000-8000-000000000002';
    await pool.query(
      `insert into leagues (id, name, timezone, default_language)
       values ($1, 'Other League', 'America/Toronto', 'fr')`,
      [otherLeague]
    );
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $2, 'Other Team')`,
      [otherTeam, otherLeague]
    );

    await expect(
      pool.query(
        `insert into season_teams (id, season_id, team_id)
         values ($1, $2, $3)`,
        ['40000000-0000-4000-8000-000000000003', ids.season, otherTeam]
      )
    ).rejects.toThrow(/same League/);
  });
});

import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresGameOperationStore} from '@/courtside/adapters/postgres/game-operation-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {TemporalScheduledInstantResolver} from '@/courtside/adapters/temporal/scheduled-instant-resolver';
import {createGameOperationsService} from '@/courtside/services/manage-game';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '60000000-0000-4000-8000-000000000001',
  admin: '60000000-0000-4000-8000-000000000002',
  outsider: '60000000-0000-4000-8000-000000000003',
  assignment: '60000000-0000-4000-8000-000000000004',
  season: '60000000-0000-4000-8000-000000000005',
  teamA: '60000000-0000-4000-8000-000000000006',
  teamB: '60000000-0000-4000-8000-000000000007',
  seasonTeamA: '60000000-0000-4000-8000-000000000008',
  seasonTeamB: '60000000-0000-4000-8000-000000000009',
  venue: '60000000-0000-4000-8000-000000000010',
  otherLeague: '60000000-0000-4000-8000-000000000011',
  otherVenue: '60000000-0000-4000-8000-000000000012'
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

describeWithDatabase('PostgreSQL Game scheduling and start slice', () => {
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
              ($2, 'Other League', 'America/Toronto', 'en')`,
      [ids.league, ids.otherLeague]
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
      `insert into venues (id, league_id, name, address)
       values ($1, $3, 'Home Gym', '100 Main Street'),
              ($2, $4, 'Other Gym', '200 Other Street')`,
      [ids.venue, ids.otherVenue, ids.league, ids.otherLeague]
    );
  });

  function service() {
    return createGameOperationsService(
      new PostgresGameOperationStore(pool),
      new TemporalScheduledInstantResolver(),
      {now: () => new Date('2026-08-07T19:00:00Z')}
    );
  }

  async function scheduleGame(commandId = '61000000-0000-4000-8000-000000000001') {
    return service()({
      type: 'schedule',
      commandId,
      actorAccountId: ids.admin,
      seasonId: ids.season,
      homeSeasonTeamId: ids.seasonTeamA,
      awaySeasonTeamId: ids.seasonTeamB,
      localScheduledAt: '2026-08-15T18:00',
      venueId: ids.venue,
      venueInstructions: ' Court 1 '
    });
  }

  it('schedules, audits, resolves League time, and reuses an identical retry', async () => {
    const first = await scheduleGame();
    expect(first).toMatchObject({
      receiptReused: false,
      operation: 'schedule',
      game: {
        status: 'scheduled',
        scheduledAt: '2026-08-16T01:00:00.000Z',
        venueId: ids.venue,
        venueInstructions: 'Court 1',
        version: 0
      }
    });

    const retry = await scheduleGame();
    expect(retry).toEqual({...first, receiptReused: true});
    const persisted = await pool.query(
      `select
         (select count(*)::int from games) as game_count,
         (select count(*)::int from audit_records) as audit_count,
         (select count(*)::int from command_receipts) as receipt_count,
         (select action from audit_records limit 1) as action`
    );
    expect(persisted.rows[0]).toEqual({
      game_count: 1,
      audit_count: 1,
      receipt_count: 1,
      action: 'game.scheduled'
    });
  });

  it('requires explicit rescheduling before a postponed Game can start', async () => {
    const scheduled = await scheduleGame('61000000-0000-4000-8000-000000000011');
    const manageGame = service();
    await manageGame({
      type: 'postpone',
      commandId: '61000000-0000-4000-8000-000000000012',
      actorAccountId: ids.admin,
      gameId: scheduled.game.id
    });
    await expect(
      manageGame({
        type: 'start',
        commandId: '61000000-0000-4000-8000-000000000013',
        actorAccountId: ids.admin,
        gameId: scheduled.game.id
      })
    ).rejects.toMatchObject({
      report: {
        violatedRule: 'game.scheduled_to_in_progress_only',
        authoritativeStatePreserved: true
      }
    });
    await manageGame({
      type: 'reschedule',
      commandId: '61000000-0000-4000-8000-000000000014',
      actorAccountId: ids.admin,
      gameId: scheduled.game.id,
      localScheduledAt: '2026-08-16T19:00',
      venueId: null,
      venueInstructions: null
    });
    const started = await manageGame({
      type: 'start',
      commandId: '61000000-0000-4000-8000-000000000015',
      actorAccountId: ids.admin,
      gameId: scheduled.game.id
    });

    expect(started.game).toMatchObject({
      status: 'in_progress',
      scheduledAt: '2026-08-17T02:00:00.000Z',
      startedAt: '2026-08-07T19:00:00.000Z',
      version: 3
    });
    const persisted = await pool.query(
      `select
         (select count(*)::int from audit_records) as audit_count,
         (select count(*)::int from command_receipts) as receipt_count,
         (select array_agg(action order by action) from audit_records) as actions`
    );
    expect(persisted.rows[0].audit_count).toBe(4);
    expect(persisted.rows[0].receipt_count).toBe(4);
    expect(persisted.rows[0].actions).toEqual([
      'game.postponed',
      'game.rescheduled',
      'game.scheduled',
      'game.started'
    ]);
    const scheduleHistory = await pool.query(
      `select previous_value, new_value
         from audit_records
        where action = 'game.rescheduled'`
    );
    expect(scheduleHistory.rows[0]).toMatchObject({
      previous_value: {
        status: 'postponed',
        scheduled_at: '2026-08-16T01:00:00.000Z'
      },
      new_value: {
        status: 'scheduled',
        scheduled_at: '2026-08-17T02:00:00.000Z'
      }
    });
  });

  it('cancels a scheduled Game as an audited terminal transition', async () => {
    const scheduled = await scheduleGame('61000000-0000-4000-8000-000000000016');
    const manageGame = service();
    const cancelled = await manageGame({
      type: 'cancel',
      commandId: '61000000-0000-4000-8000-000000000017',
      actorAccountId: ids.admin,
      gameId: scheduled.game.id
    });

    expect(cancelled.game).toMatchObject({status: 'cancelled', version: 1});
    await expect(
      manageGame({
        type: 'start',
        commandId: '61000000-0000-4000-8000-000000000018',
        actorAccountId: ids.admin,
        gameId: scheduled.game.id
      })
    ).rejects.toMatchObject({
      report: {violatedRule: 'game.scheduled_to_in_progress_only'}
    });

    const persisted = await pool.query(
      `select g.status,
              (select count(*)::int from audit_records) as audit_count,
              (select action from audit_records where action = 'game.cancelled') as action
         from games g
        where g.id = $1`,
      [scheduled.game.id]
    );
    expect(persisted.rows[0]).toEqual({
      status: 'cancelled',
      audit_count: 2,
      action: 'game.cancelled'
    });
  });

  it('rejects ambiguous local time, unauthorized scheduling, and a cross-League Venue', async () => {
    const manageGame = service();
    const base = {
      type: 'schedule' as const,
      seasonId: ids.season,
      homeSeasonTeamId: ids.seasonTeamA,
      awaySeasonTeamId: ids.seasonTeamB,
      venueInstructions: null
    };
    await expect(
      manageGame({
        ...base,
        commandId: '61000000-0000-4000-8000-000000000021',
        actorAccountId: ids.admin,
        localScheduledAt: '2026-11-01T01:30',
        venueId: null
      })
    ).rejects.toMatchObject({
      report: {violatedRule: 'game.scheduled_instant_unambiguous'}
    });
    await expect(
      manageGame({
        ...base,
        commandId: '61000000-0000-4000-8000-000000000022',
        actorAccountId: ids.outsider,
        localScheduledAt: '2026-08-15T18:00',
        venueId: null
      })
    ).rejects.toMatchObject({
      report: {violatedRule: 'authorization.league_admin_required'}
    });
    await expect(
      manageGame({
        ...base,
        commandId: '61000000-0000-4000-8000-000000000023',
        actorAccountId: ids.admin,
        localScheduledAt: '2026-08-15T18:00',
        venueId: ids.otherVenue
      })
    ).rejects.toMatchObject({
      report: {violatedRule: 'game.venue_belongs_to_league'}
    });

    const counts = await pool.query(
      `select
         (select count(*)::int from games) as games,
         (select count(*)::int from audit_records) as audits,
         (select count(*)::int from command_receipts) as receipts`
    );
    expect(counts.rows[0]).toEqual({games: 0, audits: 0, receipts: 0});
  });

  it('enforces same-League Venue integrity below the service layer', async () => {
    await expect(
      pool.query(
        `insert into games
          (season_id, phase, status, home_season_team_id, away_season_team_id,
           scheduled_at, venue_id)
         values ($1, 'regular', 'scheduled', $2, $3, now(), $4)`,
        [ids.season, ids.seasonTeamA, ids.seasonTeamB, ids.otherVenue]
      )
    ).rejects.toThrow(/same League/);

    await expect(
      pool.query('update venues set league_id = $2 where id = $1', [ids.venue, ids.otherLeague])
    ).rejects.toThrow(/immutable/);
  });
});

import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresCreateSeasonStore} from '@/courtside/adapters/postgres/season-setup-store';
import {createSeasonService} from '@/courtside/services/create-season';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '97000000-0000-4000-8000-000000000001',
  admin: '97000000-0000-4000-8000-000000000002',
  outsider: '97000000-0000-4000-8000-000000000003',
  assignment: '97000000-0000-4000-8000-000000000004',
  season: '97000000-0000-4000-8000-000000000005',
  audit: '97000000-0000-4000-8000-000000000006'
};

describeWithDatabase('PostgreSQL Season setup', () => {
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
        player_management_relationships,
        roster_memberships,
        players,
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
       values ($1, 'Chatel Cup', 'Europe/Paris', 'en')`,
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
  });

  it('creates the default Season, audit, and receipt in one transaction', async () => {
    const generatedIds = [ids.season, ids.audit];
    const createSeason = createSeasonService(new PostgresCreateSeasonStore(pool), {
      now: () => new Date('2026-08-16T04:00:00Z'),
      newId: () => generatedIds.shift()!
    });
    const command = {
      commandId: '97000000-0000-4000-8000-000000000007',
      actorAccountId: ids.admin,
      leagueId: ids.league,
      name: '2026 Season'
    };

    const first = await createSeason(command);
    expect(first).toMatchObject({
      receiptReused: false,
      season: {id: ids.season, leagueId: ids.league, name: '2026 Season'},
      auditRecordId: ids.audit
    });
    await expect(createSeason(command)).resolves.toEqual({...first, receiptReused: true});

    const stored = await pool.query<{
      name: string;
      result_configuration: {
        standings: {points: {win: number; loss: number}; ranking: string[]};
        playoffs: {rounds: unknown[]};
      };
    }>('select name, result_configuration from seasons where id = $1', [ids.season]);
    expect(stored.rows[0]).toMatchObject({
      name: '2026 Season',
      result_configuration: {
        standings: {
          points: {win: 2, loss: 0},
          ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw']
        },
        playoffs: {rounds: []}
      }
    });
    expect((await pool.query('select id from audit_records')).rowCount).toBe(1);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(1);

    const dashboard = await new PostgresAdminDashboardStore(pool).load(ids.admin);
    expect(dashboard[0]?.seasons[0]).toMatchObject({
      id: ids.season,
      name: '2026 Season',
      configurationFrozen: false,
      teams: []
    });
  });

  it('rejects unauthorized and case-insensitive duplicate creation without mutation', async () => {
    const createSeason = createSeasonService(new PostgresCreateSeasonStore(pool));
    await expect(createSeason({
      commandId: '97000000-0000-4000-8000-000000000008',
      actorAccountId: ids.outsider,
      leagueId: ids.league,
      name: '2026 Season'
    })).rejects.toMatchObject({
      report: {violatedRule: 'authorization.league_admin_required'}
    });
    expect((await pool.query('select id from seasons')).rowCount).toBe(0);

    await pool.query(
      `insert into seasons (id, league_id, name, result_configuration)
       values ($1, $2, '2026 Season', '{"standings": {}}'::jsonb)`,
      [ids.season, ids.league]
    );
    await expect(createSeason({
      commandId: '97000000-0000-4000-8000-000000000009',
      actorAccountId: ids.admin,
      leagueId: ids.league,
      name: '2026 SEASON'
    })).rejects.toMatchObject({
      report: {violatedRule: 'season.name_unique_per_league'}
    });
    expect((await pool.query('select id from seasons')).rowCount).toBe(1);

    await expect(pool.query(
      `insert into seasons (league_id, name, result_configuration)
       values ($1, '2026 SEASON', '{"standings": {}}'::jsonb)`,
      [ids.league]
    )).rejects.toMatchObject({code: '23505'});
  });
});

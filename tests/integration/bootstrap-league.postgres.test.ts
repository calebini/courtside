import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresBootstrapLeagueStore} from '@/courtside/adapters/postgres/bootstrap-league-store';
import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {createLeagueBootstrapService} from '@/courtside/services/bootstrap-league';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

describeWithDatabase('PostgreSQL initial League Administrator bootstrap', () => {
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
      `insert into user_accounts
        (id, external_auth_id, display_name, contact_email, preferred_locale)
       values ($1, $2, $3, $4, $5)`,
      [
        '91000000-0000-4000-8000-000000000001',
        '92000000-0000-4000-8000-000000000001',
        'Initial Administrator',
        'admin@example.test',
        'fr'
      ]
    );
  });

  it('plans without writes, applies atomically, and reuses identical content', async () => {
    const ids = [
      '93000000-0000-4000-8000-000000000001',
      '94000000-0000-4000-8000-000000000001',
      '95000000-0000-4000-8000-000000000001'
    ];
    const bootstrap = createLeagueBootstrapService(
      new PostgresBootstrapLeagueStore(pool),
      {
        now: () => new Date('2026-08-15T20:00:00Z'),
        newId: () => ids.shift()!
      }
    );
    const input = {
      adminEmail: 'admin@example.test',
      leagueName: 'Paris Rec Basketball',
      timezone: 'Europe/Paris',
      defaultLanguage: 'fr' as const
    };

    const plan = await bootstrap({
      ...input,
      commandId: '96000000-0000-4000-8000-000000000001',
      apply: false
    });
    expect(plan.status).toBe('planned');
    expect((await pool.query('select id from leagues')).rowCount).toBe(0);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(0);

    const accepted = await bootstrap({
      ...input,
      commandId: '96000000-0000-4000-8000-000000000002',
      apply: true
    });
    expect(accepted).toMatchObject({
      status: 'created',
      league: {id: '93000000-0000-4000-8000-000000000001'},
      administrator: {assignmentId: '94000000-0000-4000-8000-000000000001'},
      auditRecordId: '95000000-0000-4000-8000-000000000001'
    });

    const repeated = await bootstrap({
      ...input,
      commandId: '96000000-0000-4000-8000-000000000003',
      apply: true
    });
    expect(repeated).toEqual({...accepted, status: 'reused', receiptReused: true});
    expect((await pool.query('select id from leagues')).rowCount).toBe(1);
    expect((await pool.query('select id from league_admin_assignments')).rowCount).toBe(1);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(1);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(1);

    await expect(
      new PostgresAdminDashboardStore(pool).load('91000000-0000-4000-8000-000000000001')
    ).resolves.toEqual([{
      id: '93000000-0000-4000-8000-000000000001',
      name: 'Paris Rec Basketball',
      timezone: 'Europe/Paris',
      venues: [],
      seasons: []
    }]);
  });
});

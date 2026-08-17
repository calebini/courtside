import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresDeleteSeasonStore} from '@/courtside/adapters/postgres/season-deletion-store';
import {createDeleteSeasonService} from '@/courtside/services/delete-season';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '9d000000-0000-4000-8000-000000000001',
  admin: '9d000000-0000-4000-8000-000000000002',
  outsider: '9d000000-0000-4000-8000-000000000003',
  assignment: '9d000000-0000-4000-8000-000000000004',
  season: '9d000000-0000-4000-8000-000000000005',
  team: '9d000000-0000-4000-8000-000000000006',
  seasonTeam: '9d000000-0000-4000-8000-000000000007',
  audit: '9d000000-0000-4000-8000-000000000008'
};

describeWithDatabase('PostgreSQL unused Season deletion', () => {
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
        season_team_captain_assignments,
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
    await pool.query(
      `insert into seasons (id, league_id, name, result_configuration, created_at)
       values ($1, $2, 'Accidental Season', '{"standings": {}}'::jsonb,
               '2026-08-17T10:00:00Z')`,
      [ids.season, ids.league]
    );
  });

  it('deletes, audits, receipts, and releases the unused Season name atomically', async () => {
    const deleteSeason = createDeleteSeasonService(new PostgresDeleteSeasonStore(pool), {
      now: () => new Date('2026-08-17T11:00:00Z'),
      newId: () => ids.audit
    });
    const command = {
      commandId: '9d000000-0000-4000-8000-000000000009',
      actorAccountId: ids.admin,
      seasonId: ids.season,
      confirmationName: 'Accidental Season',
      reason: 'Duplicate setup'
    };

    const first = await deleteSeason(command);
    expect(first).toMatchObject({
      receiptReused: false,
      deletedSeason: {id: ids.season, leagueId: ids.league, name: 'Accidental Season'},
      auditRecordId: ids.audit
    });
    await expect(deleteSeason(command)).resolves.toEqual({...first, receiptReused: true});
    expect((await pool.query('select id from seasons where id = $1', [ids.season])).rowCount)
      .toBe(0);

    const audit = await pool.query<{
      action: string;
      previous_value: {id: string; name: string; created_at: string};
      new_value: null;
      reason: string | null;
    }>('select action, previous_value, new_value, reason from audit_records where id = $1', [ids.audit]);
    expect(audit.rows[0]).toEqual({
      action: 'season.deleted',
      previous_value: expect.objectContaining({
        id: ids.season,
        name: 'Accidental Season',
        created_at: '2026-08-17T10:00:00.000Z'
      }),
      new_value: null,
      reason: 'Duplicate setup'
    });
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(1);

    await expect(pool.query(
      `insert into seasons (league_id, name, result_configuration)
       values ($1, 'Accidental Season', '{"standings": {}}'::jsonb)`,
      [ids.league]
    )).resolves.toMatchObject({rowCount: 1});
  });

  it('rejects wrong authority, wrong confirmation, and dependent records', async () => {
    const deleteSeason = createDeleteSeasonService(new PostgresDeleteSeasonStore(pool));
    const base = {
      actorAccountId: ids.admin,
      seasonId: ids.season,
      confirmationName: 'Accidental Season',
      reason: null
    };

    await expect(deleteSeason({
      ...base,
      commandId: '9d000000-0000-4000-8000-000000000010',
      actorAccountId: ids.outsider
    })).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
    await expect(deleteSeason({
      ...base,
      commandId: '9d000000-0000-4000-8000-000000000011',
      confirmationName: 'accidental season'
    })).rejects.toMatchObject({report: {violatedRule: 'season.deletion_name_confirmation'}});

    await pool.query('insert into teams (id, league_id, name) values ($1, $2, $3)', [
      ids.team,
      ids.league,
      'Canal Street'
    ]);
    await pool.query(
      'insert into season_teams (id, season_id, team_id) values ($1, $2, $3)',
      [ids.seasonTeam, ids.season, ids.team]
    );
    await expect(deleteSeason({
      ...base,
      commandId: '9d000000-0000-4000-8000-000000000012'
    })).rejects.toMatchObject({report: {violatedRule: 'season.deletion_unused_only'}});
    expect((await pool.query('select id from seasons where id = $1', [ids.season])).rowCount)
      .toBe(1);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(0);

    await expect(pool.query('delete from seasons where id = $1', [ids.season]))
      .rejects.toMatchObject({code: '23503'});
  });

  it('allows only one material concurrent deletion', async () => {
    const first = createDeleteSeasonService(new PostgresDeleteSeasonStore(pool), {
      newId: () => '9d000000-0000-4000-8000-000000000013'
    });
    const second = createDeleteSeasonService(new PostgresDeleteSeasonStore(pool), {
      newId: () => '9d000000-0000-4000-8000-000000000014'
    });
    const base = {
      actorAccountId: ids.admin,
      seasonId: ids.season,
      confirmationName: 'Accidental Season',
      reason: null
    };

    const outcomes = await Promise.allSettled([
      first({...base, commandId: '9d000000-0000-4000-8000-000000000015'}),
      second({...base, commandId: '9d000000-0000-4000-8000-000000000016'})
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
    expect((await pool.query("select id from audit_records where action = 'season.deleted'"))
      .rowCount).toBe(1);
    expect((await pool.query('select id from seasons where id = $1', [ids.season])).rowCount)
      .toBe(0);
  });
});

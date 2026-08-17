import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresRoleAssignmentStore} from '@/courtside/adapters/postgres/role-assignment-store';
import {createDefaultSeasonResultConfiguration} from '@/courtside/core/season-setup';
import {createRoleAssignmentService} from '@/courtside/services/manage-role-assignments';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;
const id = (suffix: string) => `a1000000-0000-4000-8000-${suffix.padStart(12, '0')}`;

describeWithDatabase('PostgreSQL role administration', () => {
  let pool: Pool;
  beforeAll(() => { pool = createPostgresPool(connectionString!); });
  afterAll(async () => { await pool.end(); });
  beforeEach(async () => {
    await pool.query(`truncate table season_team_captain_assignments, player_management_relationships, roster_memberships, players, command_receipts, audit_records, games, venues, season_configuration_versions, season_teams, teams, league_admin_assignments, user_accounts, seasons, leagues restart identity cascade`);
    await pool.query(`insert into leagues (id, name, timezone, default_language) values ($1, 'Chatel Cup', 'Europe/Paris', 'en')`, [id('1')]);
    await pool.query(`insert into user_accounts (id, display_name, contact_email) values ($1, 'Primary Admin', 'admin@example.com'), ($2, 'Member', 'member@example.com'), ($3, 'Second Member', 'second@example.com')`, [id('2'), id('3'), id('4')]);
    await pool.query(`insert into league_admin_assignments (id, league_id, user_account_id) values ($1, $2, $3)`, [id('5'), id('1'), id('2')]);
    await pool.query(`insert into seasons (id, league_id, name, result_configuration) values ($1, $2, '2026', $3::jsonb)`, [id('6'), id('1'), JSON.stringify(createDefaultSeasonResultConfiguration())]);
    await pool.query(`insert into teams (id, league_id, name) values ($1, $2, 'Left Bank')`, [id('7'), id('1')]);
    await pool.query(`insert into season_teams (id, season_id, team_id) values ($1, $2, $3)`, [id('8'), id('6'), id('7')]);
  });

  it('grants and revokes administrators while preserving the final active assignment', async () => {
    const manage = createRoleAssignmentService(new PostgresRoleAssignmentStore(pool));
    const grant = await manage({type: 'grant_league_admin', commandId: id('10'), actorAccountId: id('2'), leagueId: id('1'), targetEmail: 'member@example.com'});
    await expect(manage({type: 'grant_league_admin', commandId: id('10'), actorAccountId: id('2'), leagueId: id('1'), targetEmail: 'member@example.com'})).resolves.toEqual({...grant, receiptReused: true});
    await manage({type: 'revoke_league_admin', commandId: id('11'), actorAccountId: id('2'), assignmentId: grant.assignmentId});
    await expect(manage({type: 'revoke_league_admin', commandId: id('12'), actorAccountId: id('2'), assignmentId: id('5')})).rejects.toMatchObject({report: {violatedRule: 'league_admin.final_active_preserved'}});
    await expect(pool.query('update league_admin_assignments set revoked_at = now() where id = $1', [id('5')])).rejects.toThrow(/final active League Administrator/);
    await expect(pool.query('delete from league_admin_assignments where id = $1', [id('5')])).rejects.toThrow(/append-only/);
    expect((await pool.query(`select id from audit_records where action in ('league_admin.assigned', 'league_admin.revoked')`)).rowCount).toBe(2);
  });

  it('reassigns one active captain atomically and preserves terminal history', async () => {
    const manage = createRoleAssignmentService(new PostgresRoleAssignmentStore(pool));
    const first = await manage({type: 'assign_team_captain', commandId: id('20'), actorAccountId: id('2'), seasonTeamId: id('8'), targetEmail: 'member@example.com'});
    const second = await manage({type: 'assign_team_captain', commandId: id('21'), actorAccountId: id('2'), seasonTeamId: id('8'), targetEmail: 'second@example.com'});
    expect(second.replacedAssignmentId).toBe(first.assignmentId);
    expect((await pool.query('select id from season_team_captain_assignments where revoked_at is null')).rowCount).toBe(1);
    expect((await pool.query('select id from season_team_captain_assignments where revoked_at is not null')).rowCount).toBe(1);
    await manage({type: 'revoke_team_captain', commandId: id('22'), actorAccountId: id('2'), assignmentId: second.assignmentId});
    expect((await pool.query('select id from season_team_captain_assignments where revoked_at is null')).rowCount).toBe(0);
    expect((await pool.query(`select id from audit_records where action like 'team_captain.%'`)).rowCount).toBe(3);
  });

  it('serializes concurrent revocations so one active administrator remains', async () => {
    await pool.query(`insert into league_admin_assignments (id, league_id, user_account_id) values ($1, $2, $3)`, [id('30'), id('1'), id('3')]);
    const revoke = async (assignmentId: string) => {
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query('update league_admin_assignments set revoked_at = now() where id = $1', [assignmentId]);
        await client.query('commit');
        return true;
      } catch {
        await client.query('rollback');
        return false;
      } finally { client.release(); }
    };
    expect(await Promise.all([revoke(id('5')), revoke(id('30'))])).toEqual(expect.arrayContaining([true, false]));
    expect((await pool.query('select id from league_admin_assignments where revoked_at is null')).rowCount).toBe(1);
  });
});

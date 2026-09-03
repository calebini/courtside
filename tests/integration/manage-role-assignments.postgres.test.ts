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

  it('grants/revokes Statkeepers with audited attribution, replay, terminal no-ops, and new regrant identity', async () => {
    let time = Date.parse('2026-09-03T10:00:00Z');
    const manage = createRoleAssignmentService(new PostgresRoleAssignmentStore(pool), {now: () => new Date(time += 1000)});
    const grantCommand = {type: 'grant_league_statkeeper' as const, commandId: id('40'), actorAccountId: id('2'), leagueId: id('1'), targetEmail: ' MEMBER@example.com ', reason: ' Review games '};
    const grant = await manage(grantCommand);
    await expect(manage({...grantCommand, targetEmail: 'member@example.com', reason: 'Review games'})).resolves.toEqual({...grant, receiptReused: true});
    await expect(manage({...grantCommand, targetEmail: 'second@example.com'})).rejects.toMatchObject({report: {violatedRule: 'command.idempotency_identity'}});
    await expect(manage({...grantCommand, commandId: id('41')})).rejects.toMatchObject({report: {violatedRule: 'league_statkeeper.active_unique'}});
    await expect(pool.query(`update league_statkeeper_assignments
      set id = $2, revoked_by_account_id = $3, revoked_at = now() where id = $1`, [grant.assignmentId, id('49'), id('2')])).rejects.toThrow(/identity is immutable/);
    const revokeCommand = {type: 'revoke_league_statkeeper' as const, commandId: id('42'), actorAccountId: id('2'), assignmentId: grant.assignmentId};
    const revoke = await manage(revokeCommand);
    await expect(manage(revokeCommand)).resolves.toEqual({...revoke, receiptReused: true});
    await expect(manage({...revokeCommand, commandId: id('43')})).rejects.toMatchObject({report: {violatedRule: 'league_statkeeper.active_assignment'}});
    await expect(pool.query('delete from league_statkeeper_assignments where id = $1', [grant.assignmentId])).rejects.toThrow(/append-only/);
    await expect(pool.query(`update league_statkeeper_assignments set revoked_at = null, revoked_by_account_id = null where id = $1`, [grant.assignmentId])).rejects.toThrow(/terminal/);
    const later = await manage({...grantCommand, commandId: id('44')});
    expect(later.assignmentId).not.toBe(grant.assignmentId);
    const assignments = await pool.query('select * from league_statkeeper_assignments order by assigned_at, id');
    expect(assignments.rows).toHaveLength(2);
    expect(assignments.rows.find((row) => row.id === grant.assignmentId)).toMatchObject({assigned_by_account_id: id('2'), revoked_by_account_id: id('2'), revoked_at: expect.any(Date)});
    const audits = await pool.query(`select action, previous_value, new_value, reason from audit_records where action like 'league_statkeeper.%' order by created_at, id`);
    expect(audits.rows.map((row) => row.action)).toEqual(['league_statkeeper.assigned', 'league_statkeeper.revoked', 'league_statkeeper.assigned']);
    expect(audits.rows[0]).toMatchObject({reason: 'Review games', new_value: {id: grant.assignmentId, leagueId: id('1'), userAccountId: id('3'), assignedByAccountId: id('2'), revokedAt: null}});
    expect(audits.rows[1]).toMatchObject({previous_value: {id: grant.assignmentId, revokedAt: null}, new_value: {id: grant.assignmentId, revokedByAccountId: id('2')}});
    expect((await pool.query('select id from audit_records')).rowCount).toBe(3);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(3);
  });

  it('serializes duplicate Statkeeper grants and concurrent revocations without duplicating audits', async () => {
    const manage = createRoleAssignmentService(new PostgresRoleAssignmentStore(pool));
    const grant = (commandId: string) => manage({type: 'grant_league_statkeeper', commandId, actorAccountId: id('2'), leagueId: id('1'), targetEmail: 'member@example.com'});
    const attempts = await Promise.allSettled([grant(id('50')), grant(id('51'))]);
    expect(attempts.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = attempts.find((result) => result.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({report: {violatedRule: 'league_statkeeper.active_unique'}});
    const assignmentId = (await pool.query('select id from league_statkeeper_assignments')).rows[0].id;
    const revocations = await Promise.allSettled([id('52'), id('53')].map((commandId) => manage({type: 'revoke_league_statkeeper', commandId, actorAccountId: id('2'), assignmentId})));
    expect(revocations.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(2);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(2);
  });

  it('rejects unknown emails and unauthorized grant/revoke attempts, with unique registered-email targets', async () => {
    const manage = createRoleAssignmentService(new PostgresRoleAssignmentStore(pool));
    const command = {type: 'grant_league_statkeeper' as const, commandId: id('60'), actorAccountId: id('2'), leagueId: id('1'), targetEmail: 'missing@example.com'};
    await expect(manage(command)).rejects.toMatchObject({report: {violatedRule: 'user_account.exists'}});
    await expect(pool.query(`insert into user_accounts (id, display_name, contact_email) values ($1, 'Duplicate', 'MEMBER@example.com')`, [id('61')])).rejects.toThrow(/user_accounts_contact_email_role_target_unique/);
    const granted = await manage({...command, targetEmail: 'second@example.com'});
    await expect(manage({...command, commandId: id('62'), actorAccountId: id('4')})).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
    await expect(manage({type: 'revoke_league_statkeeper', commandId: id('63'), actorAccountId: id('4'), assignmentId: granted.assignmentId})).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
    expect((await pool.query('select id from league_statkeeper_assignments where revoked_at is null')).rowCount).toBe(1);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(1);
  });

  it('rolls back the new assignment and receipt when audit persistence fails', async () => {
    const store = new PostgresRoleAssignmentStore(pool);
    const first = await createRoleAssignmentService(store)({type: 'grant_league_statkeeper', commandId: id('70'), actorAccountId: id('2'), leagueId: id('1'), targetEmail: 'member@example.com'});
    const identities = [first.auditRecordId, id('71')];
    const failAudit = createRoleAssignmentService(store, {newId: () => identities.shift()!});
    await expect(failAudit({type: 'grant_league_statkeeper', commandId: id('72'), actorAccountId: id('2'), leagueId: id('1'), targetEmail: 'second@example.com'})).rejects.toThrow(/duplicate key/);
    const failRevocationAudit = createRoleAssignmentService(store, {newId: () => first.auditRecordId});
    await expect(failRevocationAudit({type: 'revoke_league_statkeeper', commandId: id('73'), actorAccountId: id('2'), assignmentId: first.assignmentId})).rejects.toThrow(/duplicate key/);
    expect((await pool.query('select id from league_statkeeper_assignments')).rowCount).toBe(1);
    expect((await pool.query('select revoked_at from league_statkeeper_assignments')).rows[0].revoked_at).toBeNull();
    expect((await pool.query('select id from audit_records')).rowCount).toBe(1);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(1);
  });
});

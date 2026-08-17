import type {Pool, PoolClient} from 'pg';

import type {
  RoleAssignmentResult,
  RoleAssignmentStore,
  RoleAssignmentTransaction,
  StoredCaptainAssignment,
  StoredCaptainScope,
  StoredLeagueAdminAssignment,
  StoredRoleAccount,
  StoredRoleReceipt
} from '@/courtside/services/manage-role-assignments';

class PostgresRoleAssignmentTransaction implements RoleAssignmentTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredRoleReceipt | null> {
    const result = await this.client.query<{command_type: string; payload_hash: string; result: RoleAssignmentResult}>(
      'select command_type, payload_hash, result from command_receipts where command_id = $1',
      [commandId]
    );
    const row = result.rows[0];
    return row ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result} : null;
  }

  async findLeagueForUpdate(leagueId: string) {
    const result = await this.client.query<{id: string}>('select id from leagues where id = $1 for update', [leagueId]);
    return result.rows[0] ?? null;
  }

  async findSeasonTeamForUpdate(seasonTeamId: string): Promise<StoredCaptainScope | null> {
    const result = await this.client.query<{season_team_id: string; season_id: string; league_id: string}>(
      `select st.id season_team_id, st.season_id, s.league_id
         from season_teams st
         join seasons s on s.id = st.season_id
        where st.id = $1
        for update of st, s`,
      [seasonTeamId]
    );
    const row = result.rows[0];
    return row ? {seasonTeamId: row.season_team_id, seasonId: row.season_id, leagueId: row.league_id} : null;
  }

  async findAccountByEmail(email: string): Promise<StoredRoleAccount | null> {
    const result = await this.client.query<{id: string}>(
      `select id
         from user_accounts
        where lower(contact_email) = $1
        limit 1
        for update`,
      [email]
    );
    const row = result.rows[0];
    return row ?? null;
  }

  async hasActiveLeagueAdministrator(leagueId: string, accountId: string) {
    const result = await this.client.query(
      'select 1 from league_admin_assignments where league_id = $1 and user_account_id = $2 and revoked_at is null limit 1',
      [leagueId, accountId]
    );
    return result.rowCount === 1;
  }

  async findActiveLeagueAdministrator(leagueId: string, accountId: string): Promise<StoredLeagueAdminAssignment | null> {
    const result = await this.client.query<{id: string; league_id: string; user_account_id: string}>(
      `select id, league_id, user_account_id
         from league_admin_assignments
        where league_id = $1 and user_account_id = $2 and revoked_at is null
        limit 1 for update`,
      [leagueId, accountId]
    );
    const row = result.rows[0];
    return row ? {id: row.id, leagueId: row.league_id, userAccountId: row.user_account_id} : null;
  }

  async findLeagueAdministratorAssignmentForUpdate(assignmentId: string): Promise<StoredLeagueAdminAssignment | null> {
    const result = await this.client.query<{id: string; league_id: string; user_account_id: string}>(
      `select id, league_id, user_account_id
         from league_admin_assignments
        where id = $1 and revoked_at is null
        for update`,
      [assignmentId]
    );
    const row = result.rows[0];
    return row ? {id: row.id, leagueId: row.league_id, userAccountId: row.user_account_id} : null;
  }

  async countActiveLeagueAdministrators(leagueId: string) {
    const result = await this.client.query<{count: string}>(
      'select count(*)::text count from league_admin_assignments where league_id = $1 and revoked_at is null',
      [leagueId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async insertLeagueAdministrator(input: {id: string; leagueId: string; userAccountId: string; assignedAt: Date}) {
    await this.client.query(
      `insert into league_admin_assignments (id, league_id, user_account_id, assigned_at)
       values ($1, $2, $3, $4)`,
      [input.id, input.leagueId, input.userAccountId, input.assignedAt]
    );
  }

  async revokeLeagueAdministrator(input: {assignmentId: string; revokedAt: Date}) {
    const result = await this.client.query(
      'update league_admin_assignments set revoked_at = $2 where id = $1 and revoked_at is null',
      [input.assignmentId, input.revokedAt]
    );
    if (result.rowCount !== 1) throw new Error('League Administrator assignment changed concurrently');
  }

  async findActiveCaptainForUpdate(seasonTeamId: string): Promise<StoredCaptainAssignment | null> {
    const result = await this.client.query<{id: string; season_team_id: string; season_id: string; league_id: string; user_account_id: string}>(
      `select tca.id, tca.season_team_id, st.season_id, s.league_id, tca.user_account_id
         from season_team_captain_assignments tca
         join season_teams st on st.id = tca.season_team_id
         join seasons s on s.id = st.season_id
        where tca.season_team_id = $1 and tca.revoked_at is null
        for update of tca`,
      [seasonTeamId]
    );
    return captain(result.rows[0]);
  }

  async findCaptainAssignmentForUpdate(assignmentId: string): Promise<StoredCaptainAssignment | null> {
    const result = await this.client.query<{id: string; season_team_id: string; season_id: string; league_id: string; user_account_id: string}>(
      `select tca.id, tca.season_team_id, st.season_id, s.league_id, tca.user_account_id
         from season_team_captain_assignments tca
         join season_teams st on st.id = tca.season_team_id
         join seasons s on s.id = st.season_id
        where tca.id = $1 and tca.revoked_at is null
        for update of tca`,
      [assignmentId]
    );
    return captain(result.rows[0]);
  }

  async insertCaptain(input: {id: string; seasonTeamId: string; userAccountId: string; actorAccountId: string; assignedAt: Date}) {
    await this.client.query(
      `insert into season_team_captain_assignments
        (id, season_team_id, user_account_id, assigned_at, assigned_by_account_id)
       values ($1, $2, $3, $4, $5)`,
      [input.id, input.seasonTeamId, input.userAccountId, input.assignedAt, input.actorAccountId]
    );
  }

  async revokeCaptain(input: {assignmentId: string; actorAccountId: string; revokedAt: Date}) {
    const result = await this.client.query(
      `update season_team_captain_assignments
          set revoked_at = $2, revoked_by_account_id = $3
        where id = $1 and revoked_at is null`,
      [input.assignmentId, input.revokedAt, input.actorAccountId]
    );
    if (result.rowCount !== 1) throw new Error('Team Captain assignment changed concurrently');
  }

  async appendAudit(input: {id: string; leagueId: string; actorAccountId: string; action: string; entityType: string; entityId: string; previousValue: unknown; newValue: unknown; reason: string | null; createdAt: Date}) {
    await this.client.query(
      `insert into audit_records
        (id, league_id, actor_account_id, action, entity_type, entity_id,
         previous_value, new_value, reason, created_at)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
      [input.id, input.leagueId, input.actorAccountId, input.action, input.entityType, input.entityId, JSON.stringify(input.previousValue), JSON.stringify(input.newValue), input.reason, input.createdAt]
    );
  }

  async saveCommandReceipt(input: {commandId: string; commandType: string; payloadHash: string; result: RoleAssignmentResult; createdAt: Date}) {
    await this.client.query(
      `insert into command_receipts (command_id, command_type, payload_hash, result, created_at)
       values ($1, $2, $3, $4::jsonb, $5)`,
      [input.commandId, input.commandType, input.payloadHash, JSON.stringify(input.result), input.createdAt]
    );
  }
}

function captain(row: {id: string; season_team_id: string; season_id: string; league_id: string; user_account_id: string} | undefined): StoredCaptainAssignment | null {
  return row ? {id: row.id, seasonTeamId: row.season_team_id, seasonId: row.season_id, leagueId: row.league_id, userAccountId: row.user_account_id} : null;
}

export class PostgresRoleAssignmentStore implements RoleAssignmentStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: RoleAssignmentTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresRoleAssignmentTransaction(client));
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }
}

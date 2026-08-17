import type {Pool, PoolClient} from 'pg';

import type {
  DeleteSeasonResult,
  DeleteSeasonStore,
  DeleteSeasonTransaction,
  SeasonDependency,
  StoredDeletableSeason,
  StoredDeleteSeasonReceipt
} from '@/courtside/services/delete-season';

class PostgresDeleteSeasonTransaction implements DeleteSeasonTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredDeleteSeasonReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: DeleteSeasonResult;
    }>(
      `select command_type, payload_hash, result
         from command_receipts
        where command_id = $1`,
      [commandId]
    );
    const row = result.rows[0];
    return row
      ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result}
      : null;
  }

  async findSeasonForUpdate(seasonId: string): Promise<StoredDeletableSeason | null> {
    const result = await this.client.query<{
      id: string;
      league_id: string;
      name: string;
      result_configuration: unknown;
      frozen_configuration_version_id: string | null;
      created_at: Date;
    }>(
      `select s.id,
              s.league_id,
              s.name,
              s.result_configuration,
              s.frozen_configuration_version_id,
              s.created_at
         from seasons s
         join leagues l on l.id = s.league_id
        where s.id = $1
        for update of s, l`,
      [seasonId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          leagueId: row.league_id,
          name: row.name,
          resultConfiguration: row.result_configuration,
          frozenConfigurationVersionId: row.frozen_configuration_version_id,
          createdAt: row.created_at
        }
      : null;
  }

  async hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string) {
    const result = await this.client.query(
      `select 1
         from league_admin_assignments
        where league_id = $1
          and user_account_id = $2
          and revoked_at is null
        limit 1`,
      [leagueId, actorAccountId]
    );
    return result.rowCount === 1;
  }

  async listDependencies(seasonId: string): Promise<readonly SeasonDependency[]> {
    const result = await this.client.query<{dependency: SeasonDependency}>(
      `select dependency
         from (
           select 'season_team'::text as dependency
            where exists (select 1 from season_teams where season_id = $1)
           union all
           select 'game'::text
            where exists (select 1 from games where season_id = $1)
           union all
           select 'roster_membership'::text
            where exists (select 1 from roster_memberships where season_id = $1)
           union all
           select 'configuration_version'::text
            where exists (select 1 from season_configuration_versions where season_id = $1)
           union all
           select 'team_captain_assignment'::text
            where exists (
              select 1
                from season_team_captain_assignments stca
                join season_teams st on st.id = stca.season_team_id
               where st.season_id = $1
            )
         ) dependencies`,
      [seasonId]
    );
    return result.rows.map((row) => row.dependency);
  }

  async appendAuditRecord(input: {
    id: string;
    leagueId: string;
    actorAccountId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into audit_records
        (id, league_id, actor_account_id, action, entity_type, entity_id,
         previous_value, new_value, reason, created_at)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
      [
        input.id,
        input.leagueId,
        input.actorAccountId,
        input.action,
        input.entityType,
        input.entityId,
        JSON.stringify(input.previousValue),
        JSON.stringify(input.newValue),
        input.reason,
        input.createdAt
      ]
    );
  }

  async deleteSeason(seasonId: string) {
    const result = await this.client.query('delete from seasons where id = $1', [seasonId]);
    if (result.rowCount !== 1) {
      throw new Error('The locked Season was not deleted');
    }
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: DeleteSeasonResult;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into command_receipts
        (command_id, command_type, payload_hash, result, created_at)
       values ($1, $2, $3, $4::jsonb, $5)`,
      [
        input.commandId,
        input.commandType,
        input.payloadHash,
        JSON.stringify(input.result),
        input.createdAt
      ]
    );
  }
}

export class PostgresDeleteSeasonStore implements DeleteSeasonStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: DeleteSeasonTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresDeleteSeasonTransaction(client));
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

import type {Pool, PoolClient} from 'pg';

import type {
  SeasonConfigurationStore,
  SeasonConfigurationTransaction,
  StoredSeasonConfigurationReceipt,
  UpdateSeasonConfigurationResult
} from '@/courtside/services/update-season-configuration';

class PostgresSeasonConfigurationTransaction implements SeasonConfigurationTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredSeasonConfigurationReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: UpdateSeasonConfigurationResult;
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

  async findSeasonForUpdate(seasonId: string) {
    const result = await this.client.query<{
      id: string;
      league_id: string;
      result_configuration: unknown;
      frozen_configuration_version_id: string | null;
    }>(
      `select s.id,
              s.league_id,
              s.result_configuration,
              s.frozen_configuration_version_id
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
          resultConfiguration: row.result_configuration,
          frozenConfigurationVersionId: row.frozen_configuration_version_id
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

  async updateResultConfiguration(seasonId: string, configuration: unknown) {
    const result = await this.client.query(
      `update seasons
          set result_configuration = $2::jsonb
        where id = $1
          and frozen_configuration_version_id is null`,
      [seasonId, JSON.stringify(configuration)]
    );
    if (result.rowCount !== 1) {
      throw new Error(`Season ${seasonId} changed during configuration update`);
    }
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

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: UpdateSeasonConfigurationResult;
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

export class PostgresSeasonConfigurationStore implements SeasonConfigurationStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: SeasonConfigurationTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresSeasonConfigurationTransaction(client));
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

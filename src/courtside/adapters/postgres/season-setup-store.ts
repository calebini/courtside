import type {Pool, PoolClient} from 'pg';

import type {
  CreateSeasonResult,
  CreateSeasonStore,
  CreateSeasonTransaction,
  StoredCreateSeasonReceipt
} from '@/courtside/services/create-season';

class PostgresCreateSeasonTransaction implements CreateSeasonTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredCreateSeasonReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: CreateSeasonResult;
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

  async findLeagueForUpdate(leagueId: string) {
    const result = await this.client.query<{id: string}>(
      `select id
         from leagues
        where id = $1
        for update`,
      [leagueId]
    );
    return result.rows[0] ?? null;
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
    return result.rowCount !== 0;
  }

  async findSeasonByName(leagueId: string, name: string) {
    const result = await this.client.query<{id: string; name: string}>(
      `select id, name
         from seasons
        where league_id = $1
          and lower(name) = lower($2)
        limit 1`,
      [leagueId, name]
    );
    return result.rows[0] ?? null;
  }

  async insertSeason(input: {
    id: string;
    leagueId: string;
    name: string;
    resultConfiguration: unknown;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into seasons
        (id, league_id, name, result_configuration, created_at)
       values ($1, $2, $3, $4::jsonb, $5)`,
      [
        input.id,
        input.leagueId,
        input.name,
        JSON.stringify(input.resultConfiguration),
        input.createdAt
      ]
    );
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
    result: CreateSeasonResult;
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

export class PostgresCreateSeasonStore implements CreateSeasonStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: CreateSeasonTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresCreateSeasonTransaction(client));
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

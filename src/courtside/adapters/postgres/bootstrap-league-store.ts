import type {Pool, PoolClient} from 'pg';

import type {
  BootstrapLeagueResult,
  BootstrapLeagueStore,
  BootstrapLeagueTransaction,
  StoredBootstrapAccount,
  StoredBootstrapLeague,
  StoredBootstrapReceipt
} from '@/courtside/services/bootstrap-league';

const BOOTSTRAP_LOCK = 'courtside.initial-league-administrator-bootstrap';

class PostgresBootstrapLeagueTransaction implements BootstrapLeagueTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockBootstrap() {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [
      BOOTSTRAP_LOCK
    ]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredBootstrapReceipt | null> {
    const result = await this.client.query<{
      command_id: string;
      command_type: string;
      payload_hash: string;
      result: BootstrapLeagueResult;
    }>(
      `select command_id, command_type, payload_hash, result
         from command_receipts
        where command_id = $1`,
      [commandId]
    );
    const row = result.rows[0];
    return row
      ? {
          commandId: row.command_id,
          commandType: row.command_type,
          payloadHash: row.payload_hash,
          result: row.result
        }
      : null;
  }

  async findAcceptedBootstrap(payloadHash: string): Promise<StoredBootstrapReceipt | null> {
    const result = await this.client.query<{
      command_id: string;
      command_type: string;
      payload_hash: string;
      result: BootstrapLeagueResult;
    }>(
      `select command_id, command_type, payload_hash, result
         from command_receipts
        where command_type = 'league.bootstrap_initial_administrator'
          and payload_hash = $1
        order by created_at
        limit 1`,
      [payloadHash]
    );
    const row = result.rows[0];
    return row
      ? {
          commandId: row.command_id,
          commandType: row.command_type,
          payloadHash: row.payload_hash,
          result: row.result
        }
      : null;
  }

  async listLeaguesForUpdate(): Promise<readonly StoredBootstrapLeague[]> {
    const result = await this.client.query<{
      id: string;
      name: string;
      timezone: string;
      default_language: StoredBootstrapLeague['defaultLanguage'];
    }>(
      `select id, name, timezone, default_language
         from leagues
        order by created_at, id
        for update`
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      timezone: row.timezone,
      defaultLanguage: row.default_language
    }));
  }

  async findAccountsByEmail(contactEmail: string): Promise<readonly StoredBootstrapAccount[]> {
    const result = await this.client.query<{id: string; contact_email: string}>(
      `select id, contact_email
         from user_accounts
        where lower(contact_email) = $1
        order by id
        for update`,
      [contactEmail]
    );
    return result.rows.map((row) => ({id: row.id, contactEmail: row.contact_email}));
  }

  async hasAdministratorAssignmentHistory(leagueId: string) {
    const result = await this.client.query(
      `select 1
         from league_admin_assignments
        where league_id = $1
        limit 1`,
      [leagueId]
    );
    return result.rowCount !== 0;
  }

  async insertLeague(input: StoredBootstrapLeague & {createdAt: Date}) {
    await this.client.query(
      `insert into leagues (id, name, timezone, default_language, created_at)
       values ($1, $2, $3, $4, $5)`,
      [input.id, input.name, input.timezone, input.defaultLanguage, input.createdAt]
    );
  }

  async insertAdministratorAssignment(input: {
    id: string;
    leagueId: string;
    accountId: string;
    assignedAt: Date;
  }) {
    await this.client.query(
      `insert into league_admin_assignments
        (id, league_id, user_account_id, assigned_at)
       values ($1, $2, $3, $4)`,
      [input.id, input.leagueId, input.accountId, input.assignedAt]
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
    reason: string;
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
    result: BootstrapLeagueResult;
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

export class PostgresBootstrapLeagueStore implements BootstrapLeagueStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: BootstrapLeagueTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresBootstrapLeagueTransaction(client));
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

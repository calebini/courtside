import type {Pool, PoolClient} from 'pg';

import type {
  StoredVenue,
  StoredVenueReceipt,
  VenueResult,
  VenueStore,
  VenueTransaction
} from '@/courtside/services/manage-venue';

class PostgresVenueTransaction implements VenueTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredVenueReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: VenueResult;
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
      `select id from leagues where id = $1 for update`,
      [leagueId]
    );
    return result.rows[0] ?? null;
  }

  async findVenueForUpdate(venueId: string): Promise<StoredVenue | null> {
    const result = await this.client.query<{
      id: string;
      league_id: string;
      name: string;
      address: string;
      notes: string | null;
      archived_at: Date | null;
    }>(
      `select v.id, v.league_id, v.name, v.address, v.notes, v.archived_at
         from venues v
         join leagues l on l.id = v.league_id
        where v.id = $1
        for update of v, l`,
      [venueId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          leagueId: row.league_id,
          name: row.name,
          address: row.address,
          notes: row.notes,
          archivedAt: row.archived_at
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

  async findActiveVenueByName(
    leagueId: string,
    name: string,
    excludedVenueId: string | null
  ) {
    const result = await this.client.query<{id: string; name: string}>(
      `select id, name
         from venues
        where league_id = $1
          and lower(name) = lower($2)
          and archived_at is null
          and ($3::uuid is null or id <> $3)
        limit 1
        for update`,
      [leagueId, name, excludedVenueId]
    );
    return result.rows[0] ?? null;
  }

  async insertVenue(input: {
    id: string;
    leagueId: string;
    name: string;
    address: string;
    notes: string | null;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into venues (id, league_id, name, address, notes, created_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [input.id, input.leagueId, input.name, input.address, input.notes, input.createdAt]
    );
  }

  async updateVenue(input: {
    venueId: string;
    name: string;
    address: string;
    notes: string | null;
  }) {
    await this.client.query(
      `update venues
          set name = $2,
              address = $3,
              notes = $4
        where id = $1
          and archived_at is null`,
      [input.venueId, input.name, input.address, input.notes]
    );
  }

  async archiveVenue(input: {venueId: string; archivedAt: Date}) {
    await this.client.query(
      `update venues
          set archived_at = $2
        where id = $1
          and archived_at is null`,
      [input.venueId, input.archivedAt]
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
    result: VenueResult;
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

export class PostgresVenueStore implements VenueStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: VenueTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresVenueTransaction(client));
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

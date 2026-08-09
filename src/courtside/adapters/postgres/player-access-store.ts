import type {Pool, PoolClient} from 'pg';

import type {
  PlayerAccessStore,
  PlayerAccessTransaction,
  StoredPlayerAccessRelationship
} from '@/courtside/services/manage-player-access';

class PostgresPlayerAccessTransaction implements PlayerAccessTransaction {
  constructor(private readonly client: PoolClient) {}

  async findPlayer(playerId: string) {
    const result = await this.client.query<{id: string; league_id: string}>(
      'select id, league_id from players where id = $1 for update', [playerId]
    );
    const row = result.rows[0];
    return row ? {id: row.id, leagueId: row.league_id} : null;
  }

  async findRelationship(relationshipId: string): Promise<StoredPlayerAccessRelationship | null> {
    const result = await this.client.query<{
      id: string; player_id: string; league_id: string; user_account_id: string;
      status: StoredPlayerAccessRelationship['status']; version: number;
    }>(
      `select pmr.id, pmr.player_id, p.league_id, pmr.user_account_id, pmr.status, pmr.version
         from player_management_relationships pmr join players p on p.id = pmr.player_id
        where pmr.id = $1 for update of pmr`, [relationshipId]
    );
    const row = result.rows[0];
    return row ? {id: row.id, playerId: row.player_id, leagueId: row.league_id, userAccountId: row.user_account_id, status: row.status, version: row.version} : null;
  }

  async hasLeagueAdmin(leagueId: string, accountId: string) {
    const result = await this.client.query(
      'select 1 from league_admin_assignments where league_id = $1 and user_account_id = $2 and revoked_at is null limit 1',
      [leagueId, accountId]
    );
    return result.rowCount === 1;
  }

  async hasActivePair(playerId: string, accountId: string) {
    const result = await this.client.query(
      `select 1 from player_management_relationships where player_id = $1 and user_account_id = $2 and status in ('requested', 'approved') limit 1`,
      [playerId, accountId]
    );
    return result.rowCount === 1;
  }

  async accountExists(accountId: string) {
    const result = await this.client.query('select 1 from user_accounts where id = $1 limit 1', [accountId]);
    return result.rowCount === 1;
  }

  async insertRelationship(input: {id: string; playerId: string; userAccountId: string; status: 'requested' | 'approved'; actorAccountId: string; occurredAt: Date}) {
    await this.client.query(
      `insert into player_management_relationships
        (id, player_id, user_account_id, status, requested_at, requested_by_account_id, approved_at, approved_by_account_id)
       values ($1, $2, $3, $4::text, $5::timestamptz, $6::uuid,
               case when $4::text = 'approved' then $5::timestamptz end,
               case when $4::text = 'approved' then $6::uuid end)`,
      [input.id, input.playerId, input.userAccountId, input.status, input.occurredAt, input.actorAccountId]
    );
  }

  async transitionRelationship(input: {relationshipId: string; expectedVersion: number; status: 'approved' | 'revoked'; actorAccountId: string; occurredAt: Date}) {
    const result = await this.client.query(
      `update player_management_relationships set status = $3,
         approved_at = case when $3 = 'approved' then $5 else approved_at end,
         approved_by_account_id = case when $3 = 'approved' then $4::uuid else approved_by_account_id end,
         revoked_at = case when $3 = 'revoked' then $5 else null end,
         revoked_by_account_id = case when $3 = 'revoked' then $4::uuid else null end,
         version = version + 1 where id = $1 and version = $2`,
      [input.relationshipId, input.expectedVersion, input.status, input.actorAccountId, input.occurredAt]
    );
    if (result.rowCount !== 1) throw new Error('Player Management Relationship changed concurrently');
  }

  async appendAudit(input: {id: string; leagueId: string; actorAccountId: string; action: string; entityId: string; previousValue: unknown; newValue: unknown; reason: string | null; occurredAt: Date}) {
    await this.client.query(
      `insert into audit_records (id, league_id, actor_account_id, action, entity_type, entity_id, previous_value, new_value, reason, created_at)
       values ($1, $2, $3, $4, 'PlayerManagementRelationship', $5, $6::jsonb, $7::jsonb, $8, $9)`,
      [input.id, input.leagueId, input.actorAccountId, input.action, input.entityId, JSON.stringify(input.previousValue), JSON.stringify(input.newValue), input.reason, input.occurredAt]
    );
  }
}

export class PostgresPlayerAccessStore implements PlayerAccessStore {
  constructor(private readonly pool: Pool) {}
  async transaction<T>(work: (transaction: PlayerAccessTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresPlayerAccessTransaction(client));
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

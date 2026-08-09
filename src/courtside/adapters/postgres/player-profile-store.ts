import type {Pool, PoolClient} from 'pg';

import type {ProfilePhotoType} from '@/courtside/core/player-profile';
import type {PlayerProfileStore, PlayerProfileTransaction, StoredPrivatePlayer} from '@/courtside/services/manage-player-profile';

class PostgresPlayerProfileTransaction implements PlayerProfileTransaction {
  constructor(private readonly client: PoolClient) {}
  async findPlayer(playerId: string): Promise<StoredPrivatePlayer | null> {
    const result = await this.client.query<{
      id: string; league_id: string; display_name: string; version: number;
      profile_photo_object_key: string | null; profile_photo_content_type: ProfilePhotoType | null;
      profile_photo_byte_size: number | null;
    }>(`select id, league_id, display_name, version, profile_photo_object_key, profile_photo_content_type, profile_photo_byte_size from players where id = $1 for update`, [playerId]);
    const row = result.rows[0];
    return row ? {id: row.id, leagueId: row.league_id, displayName: row.display_name, version: row.version, profilePhotoObjectKey: row.profile_photo_object_key, profilePhotoContentType: row.profile_photo_content_type, profilePhotoByteSize: row.profile_photo_byte_size} : null;
  }
  async canManage(playerId: string, leagueId: string, accountId: string) {
    const result = await this.client.query(
      `select 1 where exists (select 1 from league_admin_assignments where league_id = $2 and user_account_id = $3 and revoked_at is null)
        or exists (select 1 from player_management_relationships where player_id = $1 and user_account_id = $3 and status = 'approved')`,
      [playerId, leagueId, accountId]
    );
    return result.rowCount === 1;
  }
  async updateDisplayName(playerId: string, expectedVersion: number, displayName: string) {
    const result = await this.client.query(`update players set display_name = $3, version = version + 1 where id = $1 and version = $2`, [playerId, expectedVersion, displayName]);
    if (result.rowCount !== 1) throw new Error('Player changed concurrently');
  }
  async updatePhoto(playerId: string, expectedVersion: number, photo: {objectKey: string; contentType: ProfilePhotoType; byteSize: number; updatedAt: Date} | null) {
    const result = await this.client.query(
      `update players set profile_photo_object_key = $3, profile_photo_content_type = $4, profile_photo_byte_size = $5, profile_photo_updated_at = $6, version = version + 1 where id = $1 and version = $2`,
      [playerId, expectedVersion, photo?.objectKey ?? null, photo?.contentType ?? null, photo?.byteSize ?? null, photo?.updatedAt ?? null]
    );
    if (result.rowCount !== 1) throw new Error('Player changed concurrently');
  }
  async appendAudit(input: {id: string; leagueId: string; actorAccountId: string; action: string; playerId: string; previousValue: unknown; newValue: unknown; occurredAt: Date}) {
    await this.client.query(`insert into audit_records (id, league_id, actor_account_id, action, entity_type, entity_id, previous_value, new_value, reason, created_at) values ($1, $2, $3, $4, 'Player', $5, $6::jsonb, $7::jsonb, null, $8)`, [input.id, input.leagueId, input.actorAccountId, input.action, input.playerId, JSON.stringify(input.previousValue), JSON.stringify(input.newValue), input.occurredAt]);
  }
}

export class PostgresPlayerProfileStore implements PlayerProfileStore {
  constructor(private readonly pool: Pool) {}
  async transaction<T>(work: (transaction: PlayerProfileTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try { await client.query('begin'); const result = await work(new PostgresPlayerProfileTransaction(client)); await client.query('commit'); return result; }
    catch (error) { await client.query('rollback'); throw error; }
    finally { client.release(); }
  }
}

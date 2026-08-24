import 'server-only';

import type {Pool} from 'pg';

import type {PasswordRecoveryAuthorizationStore} from '@/courtside/services/password-recovery-authorization';

export class PostgresPasswordRecoveryAuthorizationStore implements PasswordRecoveryAuthorizationStore {
  constructor(private readonly pool: Pool) {}

  async replaceActive(input: {
    id: string;
    externalAuthId: string;
    tokenHash: string;
    createdAt: Date;
    expiresAt: Date;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [input.externalAuthId]);
      await client.query(
        `delete from password_recovery_authorizations
          where external_auth_id = $1 and consumed_at is null`,
        [input.externalAuthId]
      );
      await client.query(
        `delete from password_recovery_authorizations
          where expires_at < $1::timestamptz - interval '1 day'`,
        [input.createdAt]
      );
      await client.query(
        `insert into password_recovery_authorizations
          (id, external_auth_id, token_hash, created_at, expires_at)
         values ($1, $2, $3, $4, $5)`,
        [input.id, input.externalAuthId, input.tokenHash, input.createdAt, input.expiresAt]
      );
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async hasActive(input: {externalAuthId: string; tokenHash: string; checkedAt: Date}) {
    const result = await this.pool.query(
      `select 1 from password_recovery_authorizations
        where external_auth_id = $1
          and token_hash = $2
          and consumed_at is null
          and expires_at > $3
        limit 1`,
      [input.externalAuthId, input.tokenHash, input.checkedAt]
    );
    return result.rowCount === 1;
  }

  async consume(input: {externalAuthId: string; tokenHash: string; consumedAt: Date}) {
    const result = await this.pool.query(
      `update password_recovery_authorizations
          set consumed_at = $3
        where external_auth_id = $1
          and token_hash = $2
          and consumed_at is null
          and expires_at > $3`,
      [input.externalAuthId, input.tokenHash, input.consumedAt]
    );
    return result.rowCount === 1;
  }
}

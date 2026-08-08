import type {Pool} from 'pg';

import type {
  AuthenticatedUserAccount,
  UserAccountDirectory
} from '@/courtside/services/resolve-authenticated-account';

export class PostgresUserAccountDirectory implements UserAccountDirectory {
  constructor(private readonly pool: Pool) {}

  async findByExternalAuthId(externalAuthId: string): Promise<AuthenticatedUserAccount | null> {
    const result = await this.pool.query<{id: string; display_name: string}>(
      `select id, display_name
         from user_accounts
        where external_auth_id = $1`,
      [externalAuthId]
    );
    const account = result.rows[0];
    return account ? {id: account.id, displayName: account.display_name} : null;
  }
}

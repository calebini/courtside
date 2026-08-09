import type {Pool} from 'pg';

import type {
  AuthenticatedUserAccount,
  UserAccountDirectory
} from '@/courtside/services/resolve-authenticated-account';
import type {UserAccountProvisioner} from '@/courtside/services/provision-user-account';

export class PostgresUserAccountDirectory implements UserAccountDirectory, UserAccountProvisioner {
  constructor(private readonly pool: Pool) {}

  async findByExternalAuthId(externalAuthId: string): Promise<AuthenticatedUserAccount | null> {
    const result = await this.pool.query<{
      id: string;
      display_name: string;
      preferred_locale: 'en' | 'fr';
    }>(
      `select id, display_name, preferred_locale
         from user_accounts
        where external_auth_id = $1`,
      [externalAuthId]
    );
    const account = result.rows[0];
    return account
      ? {
          id: account.id,
          displayName: account.display_name,
          preferredLocale: account.preferred_locale
        }
      : null;
  }

  async provisionFromVerifiedIdentity(input: {
    externalAuthId: string;
    contactEmail: string;
    displayName: string;
    preferredLocale: 'en' | 'fr';
  }): Promise<AuthenticatedUserAccount> {
    const result = await this.pool.query<{
      id: string;
      display_name: string;
      preferred_locale: 'en' | 'fr';
    }>(
      `insert into user_accounts (
         external_auth_id, contact_email, display_name, preferred_locale
       ) values ($1, $2, $3, $4)
       on conflict (external_auth_id) do update
         set contact_email = excluded.contact_email,
             preferred_locale = excluded.preferred_locale
       returning id, display_name, preferred_locale`,
      [input.externalAuthId, input.contactEmail, input.displayName, input.preferredLocale]
    );
    const account = result.rows[0];
    if (!account) throw new Error('User Account provisioning did not return an account');
    return {
      id: account.id,
      displayName: account.display_name,
      preferredLocale: account.preferred_locale
    };
  }
}

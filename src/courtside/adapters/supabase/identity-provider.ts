import type {SupabaseClient} from '@supabase/supabase-js';

import type {
  VerifiedIdentity,
  VerifiedIdentityProvider
} from '@/courtside/services/resolve-authenticated-account';

export class SupabaseVerifiedIdentityProvider implements VerifiedIdentityProvider {
  constructor(private readonly client: SupabaseClient) {}

  async getVerifiedIdentity(): Promise<VerifiedIdentity | null> {
    const {data, error} = await this.client.auth.getUser();
    if (error || !data.user) {
      return null;
    }

    return {
      externalAuthId: data.user.id,
      email: data.user.email ?? null,
      emailVerified: Boolean(data.user.email_confirmed_at),
      displayName: typeof data.user.user_metadata.display_name === 'string'
        ? data.user.user_metadata.display_name
        : null,
      preferredLocale: data.user.user_metadata.preferred_locale === 'fr'
        ? 'fr'
        : data.user.user_metadata.preferred_locale === 'en'
          ? 'en'
          : null
    };
  }
}

import {RuleViolation} from '@/courtside/core/errors';

import type {
  AuthenticatedUserAccount,
  VerifiedIdentity,
  VerifiedIdentityProvider
} from './resolve-authenticated-account';

export interface UserAccountProvisioner {
  provisionFromVerifiedIdentity(input: {
    externalAuthId: string;
    contactEmail: string;
    displayName: string;
    preferredLocale: 'en' | 'fr';
  }): Promise<AuthenticatedUserAccount>;
}

function profileFrom(identity: VerifiedIdentity, requestedLocale?: 'en' | 'fr') {
  if (!identity.email || !identity.emailVerified) {
    throw new RuleViolation(
      'account.verified_email',
      'A verified email identity is required to provision a Courtside User Account'
    );
  }
  const displayName = identity.displayName?.trim().replace(/\s+/g, ' ');
  if (!displayName || displayName.length < 2 || displayName.length > 120) {
    throw new RuleViolation(
      'account.display_name',
      'A valid account display name is required to provision a Courtside User Account'
    );
  }
  return {
    externalAuthId: identity.externalAuthId,
    contactEmail: identity.email.trim().toLowerCase(),
    displayName,
    preferredLocale: requestedLocale ?? identity.preferredLocale ?? 'en'
  } as const;
}

export async function provisionAuthenticatedUserAccount(
  identityProvider: VerifiedIdentityProvider,
  provisioner: UserAccountProvisioner,
  requestedLocale?: 'en' | 'fr'
) {
  const identity = await identityProvider.getVerifiedIdentity();
  if (!identity) {
    throw new RuleViolation(
      'account.authenticated_identity',
      'An authenticated identity is required to provision a Courtside User Account'
    );
  }
  return provisioner.provisionFromVerifiedIdentity(profileFrom(identity, requestedLocale));
}

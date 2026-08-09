import {describe, expect, it, vi} from 'vitest';

import {validateRegistration} from '@/courtside/core/account-onboarding';
import {provisionAuthenticatedUserAccount} from '@/courtside/services/provision-user-account';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

describe('account onboarding validation', () => {
  it('normalizes valid registration data without weakening password requirements', () => {
    expect(validateRegistration({
      displayName: '  Casey   Morgan ',
      email: ' CASEY@Example.test ',
      password: 'courtside9',
      locale: 'fr'
    })).toEqual({
      displayName: 'Casey Morgan',
      email: 'casey@example.test',
      password: 'courtside9',
      locale: 'fr'
    });
    expect(() => validateRegistration({
      displayName: 'Casey Morgan',
      email: 'casey@example.test',
      password: 'letters-only',
      locale: 'en'
    })).toThrow(/letter and a number/);
  });

  it('provisions only a confirmed identity and forwards minimal account data', async () => {
    const provisionFromVerifiedIdentity = vi.fn(async () => ({
      id: 'account-1', displayName: 'Casey Morgan', preferredLocale: 'fr' as const
    }));
    const result = await provisionAuthenticatedUserAccount(
      {getVerifiedIdentity: async () => ({
        externalAuthId: 'auth-1',
        email: 'CASEY@example.test',
        emailVerified: true,
        displayName: ' Casey  Morgan ',
        preferredLocale: 'en'
      })},
      {provisionFromVerifiedIdentity},
      'fr'
    );

    expect(result.id).toBe('account-1');
    expect(provisionFromVerifiedIdentity).toHaveBeenCalledWith({
      externalAuthId: 'auth-1',
      contactEmail: 'casey@example.test',
      displayName: 'Casey Morgan',
      preferredLocale: 'fr'
    });
  });

  it('rejects an unconfirmed identity without touching PostgreSQL', async () => {
    const provisionFromVerifiedIdentity = vi.fn();
    await expect(provisionAuthenticatedUserAccount(
      {getVerifiedIdentity: async () => ({
        externalAuthId: 'auth-1',
        email: 'casey@example.test',
        emailVerified: false,
        displayName: 'Casey Morgan',
        preferredLocale: 'en'
      })},
      {provisionFromVerifiedIdentity}
    )).rejects.toMatchObject({rule: 'account.verified_email'});
    expect(provisionFromVerifiedIdentity).not.toHaveBeenCalled();
  });
});

describe('authenticated account resolution', () => {
  it('does not query the domain account directory without a verified identity', async () => {
    const findByExternalAuthId = vi.fn();
    const result = await resolveAuthenticatedAccount(
      {getVerifiedIdentity: async () => null},
      {findByExternalAuthId}
    );

    expect(result).toEqual({identity: null, account: null});
    expect(findByExternalAuthId).not.toHaveBeenCalled();
  });

  it('maps the verified provider identity to an independent User Account', async () => {
    const result = await resolveAuthenticatedAccount(
      {
        getVerifiedIdentity: async () => ({
          externalAuthId: 'auth-user-1',
          email: 'admin@example.test',
          emailVerified: true,
          displayName: 'League Admin',
          preferredLocale: 'en'
        })
      },
      {
        findByExternalAuthId: async (externalAuthId) =>
          externalAuthId === 'auth-user-1'
            ? {id: 'account-1', displayName: 'League Admin', preferredLocale: 'en'}
            : null
      }
    );

    expect(result).toEqual({
      identity: {
        externalAuthId: 'auth-user-1',
        email: 'admin@example.test',
        emailVerified: true,
        displayName: 'League Admin',
        preferredLocale: 'en'
      },
      account: {id: 'account-1', displayName: 'League Admin', preferredLocale: 'en'}
    });
  });
});

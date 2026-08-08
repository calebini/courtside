import {describe, expect, it, vi} from 'vitest';

import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

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
          email: 'admin@example.test'
        })
      },
      {
        findByExternalAuthId: async (externalAuthId) =>
          externalAuthId === 'auth-user-1'
            ? {id: 'account-1', displayName: 'League Admin'}
            : null
      }
    );

    expect(result).toEqual({
      identity: {externalAuthId: 'auth-user-1', email: 'admin@example.test'},
      account: {id: 'account-1', displayName: 'League Admin'}
    });
  });
});

import {describe, expect, it, vi} from 'vitest';

import {resolveAccountLanding} from '@/courtside/services/resolve-account-landing';

const account = {
  id: '89000000-0000-4000-8000-000000000001',
  displayName: 'Casey Morgan',
  preferredLocale: 'en' as const
};

describe('post-sign-in account landing', () => {
  it('prioritizes League administration without reading member access', async () => {
    const hasMemberStatisticsAccess = vi.fn(async () => true);
    await expect(resolveAccountLanding(account, {
      hasAdministrativeAccess: async () => true,
      hasMemberStatisticsAccess
    })).resolves.toBe('/en/admin');
    expect(hasMemberStatisticsAccess).not.toHaveBeenCalled();
  });

  it('routes members with statistics access to statistics', async () => {
    await expect(resolveAccountLanding(account, {
      hasAdministrativeAccess: async () => false,
      hasMemberStatisticsAccess: async () => true
    })).resolves.toBe('/en/stats');
  });

  it('routes an Account without elevated access to My Players', async () => {
    await expect(resolveAccountLanding(account, {
      hasAdministrativeAccess: async () => false,
      hasMemberStatisticsAccess: async () => false
    })).resolves.toBe('/en/players');
  });

  it('preserves login and reports a routing failure while falling back to My Players', async () => {
    const failure = new Error('access lookup unavailable');
    const reportFailure = vi.fn();
    await expect(resolveAccountLanding(account, {
      hasAdministrativeAccess: async () => false,
      hasMemberStatisticsAccess: async () => { throw failure; }
    }, reportFailure)).resolves.toBe('/en/players');
    expect(reportFailure).toHaveBeenCalledWith(failure);
  });
});

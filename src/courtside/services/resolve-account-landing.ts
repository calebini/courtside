import type {AuthenticatedUserAccount} from './resolve-authenticated-account';

export interface AccountLandingAccess {
  hasAdministrativeAccess(accountId: string): Promise<boolean>;
  hasMemberStatisticsAccess(accountId: string): Promise<boolean>;
}

export async function resolveAccountLanding(
  account: AuthenticatedUserAccount,
  access: AccountLandingAccess,
  reportFailure: (error: unknown) => void = () => undefined
) {
  const fallback = `/${account.preferredLocale}/players`;
  try {
    const isAdmin = await access.hasAdministrativeAccess(account.id);
    if (isAdmin) return `/${account.preferredLocale}/admin`;
    return await access.hasMemberStatisticsAccess(account.id)
      ? `/${account.preferredLocale}/stats`
      : fallback;
  } catch (error) {
    reportFailure(error);
    return fallback;
  }
}

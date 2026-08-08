export interface VerifiedIdentity {
  readonly externalAuthId: string;
  readonly email: string | null;
}

export interface VerifiedIdentityProvider {
  getVerifiedIdentity(): Promise<VerifiedIdentity | null>;
}

export interface AuthenticatedUserAccount {
  readonly id: string;
  readonly displayName: string;
}

export interface UserAccountDirectory {
  findByExternalAuthId(externalAuthId: string): Promise<AuthenticatedUserAccount | null>;
}

export async function resolveAuthenticatedAccount(
  identityProvider: VerifiedIdentityProvider,
  accountDirectory: UserAccountDirectory
) {
  const identity = await identityProvider.getVerifiedIdentity();
  if (!identity) {
    return {identity: null, account: null} as const;
  }

  return {
    identity,
    account: await accountDirectory.findByExternalAuthId(identity.externalAuthId)
  } as const;
}

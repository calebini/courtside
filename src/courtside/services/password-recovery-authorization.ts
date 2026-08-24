import {createHash, randomBytes, randomUUID} from 'node:crypto';

export const PASSWORD_RECOVERY_AUTHORIZATION_TTL_MS = 15 * 60 * 1000;

export interface PasswordRecoveryAuthorizationStore {
  replaceActive(input: {
    id: string;
    externalAuthId: string;
    tokenHash: string;
    createdAt: Date;
    expiresAt: Date;
  }): Promise<void>;
  hasActive(input: {
    externalAuthId: string;
    tokenHash: string;
    checkedAt: Date;
  }): Promise<boolean>;
  consume(input: {
    externalAuthId: string;
    tokenHash: string;
    consumedAt: Date;
  }): Promise<boolean>;
}

function validOpaqueToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function hashPasswordRecoveryToken(token: string) {
  if (!validOpaqueToken(token)) return null;
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export async function issuePasswordRecoveryAuthorization(
  store: PasswordRecoveryAuthorizationStore,
  externalAuthId: string,
  dependencies: {
    now?: () => Date;
    newId?: () => string;
    newToken?: () => string;
  } = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const createdAt = now();
  const expiresAt = new Date(createdAt.getTime() + PASSWORD_RECOVERY_AUTHORIZATION_TTL_MS);
  const token = (dependencies.newToken ?? (() => randomBytes(32).toString('base64url')))();
  const tokenHash = hashPasswordRecoveryToken(token);
  if (!tokenHash) throw new Error('Password recovery token generation failed');

  await store.replaceActive({
    id: (dependencies.newId ?? randomUUID)(),
    externalAuthId,
    tokenHash,
    createdAt,
    expiresAt
  });
  return token;
}

export async function hasActivePasswordRecoveryAuthorization(
  store: PasswordRecoveryAuthorizationStore,
  externalAuthId: string,
  token: string | null,
  now: Date = new Date()
) {
  if (!token) return false;
  const tokenHash = hashPasswordRecoveryToken(token);
  if (!tokenHash) return false;
  return store.hasActive({externalAuthId, tokenHash, checkedAt: now});
}

export async function consumePasswordRecoveryAuthorization(
  store: PasswordRecoveryAuthorizationStore,
  externalAuthId: string,
  token: string | null,
  now: Date = new Date()
) {
  if (!token) return false;
  const tokenHash = hashPasswordRecoveryToken(token);
  if (!tokenHash) return false;
  return store.consume({externalAuthId, tokenHash, consumedAt: now});
}

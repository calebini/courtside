import {describe, expect, it, vi} from 'vitest';

import {
  consumePasswordRecoveryAuthorization,
  hasActivePasswordRecoveryAuthorization,
  hashPasswordRecoveryToken,
  issuePasswordRecoveryAuthorization,
  PASSWORD_RECOVERY_AUTHORIZATION_TTL_MS,
  type PasswordRecoveryAuthorizationStore
} from '@/courtside/services/password-recovery-authorization';

const TOKEN = 'A'.repeat(43);

function store(): PasswordRecoveryAuthorizationStore {
  return {
    replaceActive: vi.fn(async () => undefined),
    hasActive: vi.fn(async () => true),
    consume: vi.fn(async () => true)
  };
}

describe('password recovery authorization', () => {
  it('stores only a hash and expires the authorization after fifteen minutes', async () => {
    const authorizationStore = store();
    const now = new Date('2026-08-24T10:00:00Z');
    const token = await issuePasswordRecoveryAuthorization(
      authorizationStore,
      '40000000-0000-4000-8000-000000000001',
      {now: () => now, newId: () => 'authorization-1', newToken: () => TOKEN}
    );

    expect(token).toBe(TOKEN);
    expect(authorizationStore.replaceActive).toHaveBeenCalledWith({
      id: 'authorization-1',
      externalAuthId: '40000000-0000-4000-8000-000000000001',
      tokenHash: hashPasswordRecoveryToken(TOKEN),
      createdAt: now,
      expiresAt: new Date(now.getTime() + PASSWORD_RECOVERY_AUTHORIZATION_TTL_MS)
    });
    expect(JSON.stringify((authorizationStore.replaceActive as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(TOKEN);
  });

  it('fails closed for absent and malformed cookies without querying persistence', async () => {
    const authorizationStore = store();
    expect(await hasActivePasswordRecoveryAuthorization(authorizationStore, 'user-1', null)).toBe(false);
    expect(await consumePasswordRecoveryAuthorization(authorizationStore, 'user-1', 'not-a-token')).toBe(false);
    expect(authorizationStore.hasActive).not.toHaveBeenCalled();
    expect(authorizationStore.consume).not.toHaveBeenCalled();
  });

  it('binds inspection and consumption to the verified external identity and token hash', async () => {
    const authorizationStore = store();
    const now = new Date('2026-08-24T10:05:00Z');
    expect(await hasActivePasswordRecoveryAuthorization(authorizationStore, 'user-1', TOKEN, now)).toBe(true);
    expect(await consumePasswordRecoveryAuthorization(authorizationStore, 'user-1', TOKEN, now)).toBe(true);
    const expected = {externalAuthId: 'user-1', tokenHash: hashPasswordRecoveryToken(TOKEN)};
    expect(authorizationStore.hasActive).toHaveBeenCalledWith({...expected, checkedAt: now});
    expect(authorizationStore.consume).toHaveBeenCalledWith({...expected, consumedAt: now});
  });
});

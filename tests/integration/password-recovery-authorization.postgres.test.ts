import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresPasswordRecoveryAuthorizationStore} from '@/courtside/adapters/postgres/password-recovery-authorization-store';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

describeWithDatabase('PostgreSQL password recovery authorization', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createPostgresPool(connectionString!);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('truncate table password_recovery_authorizations');
  });

  it('replaces prior active authorization and consumes the current token once', async () => {
    const store = new PostgresPasswordRecoveryAuthorizationStore(pool);
    const createdAt = new Date('2026-08-24T10:00:00Z');
    const expiresAt = new Date('2026-08-24T10:15:00Z');
    const identity = '40000000-0000-4000-8000-000000000001';
    const firstHash = 'a'.repeat(64);
    const secondHash = 'b'.repeat(64);
    await store.replaceActive({id: '40000000-0000-4000-8000-000000000101', externalAuthId: identity, tokenHash: firstHash, createdAt, expiresAt});
    await store.replaceActive({id: '40000000-0000-4000-8000-000000000102', externalAuthId: identity, tokenHash: secondHash, createdAt, expiresAt});

    expect(await store.hasActive({externalAuthId: identity, tokenHash: firstHash, checkedAt: createdAt})).toBe(false);
    expect(await store.hasActive({externalAuthId: identity, tokenHash: secondHash, checkedAt: createdAt})).toBe(true);
    expect(await store.consume({externalAuthId: identity, tokenHash: secondHash, consumedAt: createdAt})).toBe(true);
    expect(await store.consume({externalAuthId: identity, tokenHash: secondHash, consumedAt: createdAt})).toBe(false);
  });

  it('rejects expired and identity-mismatched authorizations', async () => {
    const store = new PostgresPasswordRecoveryAuthorizationStore(pool);
    const identity = '40000000-0000-4000-8000-000000000001';
    await store.replaceActive({
      id: '40000000-0000-4000-8000-000000000103',
      externalAuthId: identity,
      tokenHash: 'c'.repeat(64),
      createdAt: new Date('2026-08-24T10:00:00Z'),
      expiresAt: new Date('2026-08-24T10:15:00Z')
    });
    expect(await store.consume({externalAuthId: identity, tokenHash: 'c'.repeat(64), consumedAt: new Date('2026-08-24T10:16:00Z')})).toBe(false);
    expect(await store.consume({externalAuthId: '40000000-0000-4000-8000-000000000002', tokenHash: 'c'.repeat(64), consumedAt: new Date('2026-08-24T10:05:00Z')})).toBe(false);
  });
});

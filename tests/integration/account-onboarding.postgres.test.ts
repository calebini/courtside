import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

describeWithDatabase('PostgreSQL User Account provisioning', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createPostgresPool(connectionString!);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`
      truncate table
        player_management_relationships,
        roster_memberships,
        players,
        command_receipts,
        audit_records,
        games,
        venues,
        season_configuration_versions,
        season_teams,
        teams,
        league_admin_assignments,
        user_accounts,
        seasons,
        leagues
      restart identity cascade
    `);
  });

  it('creates one account and reuses it while syncing verified contact data', async () => {
    const directory = new PostgresUserAccountDirectory(pool);
    const first = await directory.provisionFromVerifiedIdentity({
      externalAuthId: '89000000-0000-4000-8000-000000000001',
      contactEmail: 'first@example.test',
      displayName: 'First Name',
      preferredLocale: 'en'
    });
    const second = await directory.provisionFromVerifiedIdentity({
      externalAuthId: '89000000-0000-4000-8000-000000000001',
      contactEmail: 'updated@example.test',
      displayName: 'Provider Rename',
      preferredLocale: 'fr'
    });

    expect(second).toEqual({id: first.id, displayName: 'First Name', preferredLocale: 'fr'});
    const stored = await pool.query<{
      count: string; contact_email: string; display_name: string; preferred_locale: string;
    }>(`select count(*) over ()::text count, contact_email, display_name, preferred_locale
          from user_accounts where external_auth_id = $1`, [
      '89000000-0000-4000-8000-000000000001'
    ]);
    expect(stored.rows[0]).toEqual({
      count: '1',
      contact_email: 'updated@example.test',
      display_name: 'First Name',
      preferred_locale: 'fr'
    });
  });
});

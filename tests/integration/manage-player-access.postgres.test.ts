import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresPlayerAccessStore} from '@/courtside/adapters/postgres/player-access-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {
  createPlayerAccessService,
  processPlayerAccessBatch
} from '@/courtside/services/manage-player-access';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '85000000-0000-4000-8000-000000000001',
  admin: '85000000-0000-4000-8000-000000000002',
  member: '85000000-0000-4000-8000-000000000003',
  outsider: '85000000-0000-4000-8000-000000000004',
  assignment: '85000000-0000-4000-8000-000000000005',
  playerA: '85000000-0000-4000-8000-000000000006',
  playerB: '85000000-0000-4000-8000-000000000007'
};

describeWithDatabase('PostgreSQL Player access request workflow', () => {
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
    await pool.query(
      `insert into leagues (id, name, timezone, default_language)
       values ($1, 'Courtside', 'America/Los_Angeles', 'en')`,
      [ids.league]
    );
    await pool.query(
      `insert into user_accounts (id, display_name)
       values ($1, 'Admin'), ($2, 'Member'), ($3, 'Outsider')`,
      [ids.admin, ids.member, ids.outsider]
    );
    await pool.query(
      `insert into league_admin_assignments (id, league_id, user_account_id)
       values ($1, $2, $3)`,
      [ids.assignment, ids.league, ids.admin]
    );
    await pool.query(
      `insert into players (id, league_id, display_name)
       values ($1, $3, 'Avery Chen'), ($2, $3, 'Morgan Patel')`,
      [ids.playerA, ids.playerB, ids.league]
    );
  });

  it('records request and decline independently and permits a later new request', async () => {
    const manageAccess = createPlayerAccessService(new PostgresPlayerAccessStore(pool));
    const requested = await manageAccess({
      type: 'request', actorAccountId: ids.member, playerId: ids.playerA
    });
    await manageAccess({
      type: 'decline',
      actorAccountId: ids.admin,
      relationshipId: requested.relationshipId,
      reason: 'Identity could not be confirmed'
    });
    const replacement = await manageAccess({
      type: 'request', actorAccountId: ids.member, playerId: ids.playerA
    });

    expect(replacement.relationshipId).not.toBe(requested.relationshipId);
    const relationships = await pool.query<{status: string}>(
      `select status from player_management_relationships
        where player_id = $1 and user_account_id = $2 order by created_at, id`,
      [ids.playerA, ids.member]
    );
    expect(relationships.rows.map((row) => row.status).sort()).toEqual(['requested', 'revoked']);
    const audits = await pool.query<{action: string}>(
      `select action from audit_records order by created_at, id`
    );
    expect(audits.rows.map((row) => row.action)).toContain('player_management.declined');
  });

  it('commits valid batch selections when another selection has become stale', async () => {
    const manageAccess = createPlayerAccessService(new PostgresPlayerAccessStore(pool));
    const first = await manageAccess({type: 'request', actorAccountId: ids.member, playerId: ids.playerA});
    const second = await manageAccess({type: 'request', actorAccountId: ids.member, playerId: ids.playerB});
    await manageAccess({type: 'approve', actorAccountId: ids.admin, relationshipId: first.relationshipId});

    const result = await processPlayerAccessBatch(manageAccess, {
      type: 'approve',
      actorAccountId: ids.admin,
      relationshipIds: [first.relationshipId, second.relationshipId]
    });

    expect(result).toEqual({attempted: 2, succeeded: 1, failed: 1});
    const approved = await pool.query<{count: string}>(
      `select count(*)::text count from player_management_relationships where status = 'approved'`
    );
    expect(approved.rows[0]?.count).toBe('2');
  });

  it('fails closed when the deployment no longer has exactly one League', async () => {
    await pool.query(
      `insert into leagues (id, name, timezone, default_language)
       values ('85000000-0000-4000-8000-000000000099', 'Other League', 'America/Toronto', 'en')`
    );
    const manageAccess = createPlayerAccessService(new PostgresPlayerAccessStore(pool));

    await expect(manageAccess({
      type: 'request', actorAccountId: ids.member, playerId: ids.playerA
    })).rejects.toMatchObject({rule: 'player_management.single_league_scope'});
    const relationships = await pool.query<{count: string}>(
      `select count(*)::text count from player_management_relationships`
    );
    expect(relationships.rows[0]?.count).toBe('0');
  });
});

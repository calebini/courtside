import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresSeasonConfigurationStore} from '@/courtside/adapters/postgres/season-configuration-store';
import {createDefaultSeasonResultConfiguration} from '@/courtside/core/season-setup';
import {createSeasonConfigurationService} from '@/courtside/services/update-season-configuration';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '99100000-0000-4000-8000-000000000001',
  admin: '99100000-0000-4000-8000-000000000002',
  outsider: '99100000-0000-4000-8000-000000000003',
  assignment: '99100000-0000-4000-8000-000000000004',
  season: '99100000-0000-4000-8000-000000000005',
  audit: '99100000-0000-4000-8000-000000000006',
  configuration: '99100000-0000-4000-8000-000000000007'
};

const ranking = [
  'point_differential',
  'league_points',
  'points_scored',
  'random_draw'
] as const;

function initialConfiguration() {
  return {
    ...createDefaultSeasonResultConfiguration(),
    custom_future_rule: {enabled: true},
    standings: {
      ...createDefaultSeasonResultConfiguration().standings,
      future_standings_rule: 'preserve-me'
    },
    playoffs: {
      rounds: [{id: 'final', games_per_matchup: 2}],
      future_playoff_rule: 'preserve-me'
    }
  };
}

describeWithDatabase('PostgreSQL pre-freeze Season configuration', () => {
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
       values ($1, 'Chatel Cup', 'Europe/Paris', 'en')`,
      [ids.league]
    );
    await pool.query(
      `insert into user_accounts (id, display_name)
       values ($1, 'League Admin'), ($2, 'Outsider')`,
      [ids.admin, ids.outsider]
    );
    await pool.query(
      `insert into league_admin_assignments (id, league_id, user_account_id)
       values ($1, $2, $3)`,
      [ids.assignment, ids.league, ids.admin]
    );
    await pool.query(
      `insert into seasons (id, league_id, name, result_configuration)
       values ($1, $2, '2026 Season', $3::jsonb)`,
      [ids.season, ids.league, JSON.stringify(initialConfiguration())]
    );
  });

  it('persists one audited change, preserves unedited rules, and projects the result', async () => {
    const update = createSeasonConfigurationService(
      new PostgresSeasonConfigurationStore(pool),
      {
        now: () => new Date('2026-08-16T07:00:00Z'),
        newId: () => ids.audit
      }
    );
    const command = {
      commandId: '99100000-0000-4000-8000-000000000008',
      actorAccountId: ids.admin,
      seasonId: ids.season,
      winPoints: 3,
      lossPoints: 1,
      ranking
    };

    const first = await update(command);
    expect(first).toMatchObject({
      receiptReused: false,
      seasonId: ids.season,
      configuration: {
        winPoints: 3,
        lossPoints: 1,
        ranking: [...ranking],
        playoffRoundCount: 1
      },
      auditRecordId: ids.audit
    });
    await expect(update(command)).resolves.toEqual({...first, receiptReused: true});

    const stored = await pool.query<{result_configuration: ReturnType<typeof initialConfiguration>}>(
      'select result_configuration from seasons where id = $1',
      [ids.season]
    );
    expect(stored.rows[0]?.result_configuration).toEqual({
      ...initialConfiguration(),
      standings: {
        ...initialConfiguration().standings,
        points: {win: 3, loss: 1},
        ranking: [...ranking]
      }
    });
    expect((await pool.query('select id from audit_records')).rowCount).toBe(1);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(1);

    const dashboard = await new PostgresAdminDashboardStore(pool).load(ids.admin);
    expect(dashboard[0]?.seasons[0]?.configuration).toMatchObject({
      winPoints: 3,
      lossPoints: 1,
      ranking: [...ranking],
      playoffRoundCount: 1
    });
  });

  it('rejects unauthorized and unchanged requests without mutation or audit', async () => {
    const update = createSeasonConfigurationService(new PostgresSeasonConfigurationStore(pool));
    const original = initialConfiguration();
    await expect(update({
      commandId: '99100000-0000-4000-8000-000000000009',
      actorAccountId: ids.outsider,
      seasonId: ids.season,
      winPoints: 3,
      lossPoints: 1,
      ranking
    })).rejects.toMatchObject({
      report: {violatedRule: 'authorization.league_admin_required'}
    });
    await expect(update({
      commandId: '99100000-0000-4000-8000-000000000010',
      actorAccountId: ids.admin,
      seasonId: ids.season,
      winPoints: 2,
      lossPoints: 0,
      ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw']
    })).rejects.toMatchObject({
      report: {violatedRule: 'season.configuration_change_required'}
    });

    const stored = await pool.query<{result_configuration: unknown}>(
      'select result_configuration from seasons where id = $1',
      [ids.season]
    );
    expect(stored.rows[0]?.result_configuration).toEqual(original);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(0);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(0);
  });

  it('rejects ordinary service and direct-SQL changes after configuration freeze', async () => {
    const configuration = initialConfiguration();
    await pool.query(
      `insert into season_configuration_versions
        (id, season_id, version_number, configuration, basis_hash, frozen_at)
       values ($1, $2, 1, $3::jsonb, $4, '2026-08-16T07:00:00Z')`,
      [ids.configuration, ids.season, JSON.stringify(configuration), 'a'.repeat(64)]
    );
    await pool.query(
      'update seasons set frozen_configuration_version_id = $2 where id = $1',
      [ids.season, ids.configuration]
    );

    const update = createSeasonConfigurationService(new PostgresSeasonConfigurationStore(pool));
    await expect(update({
      commandId: '99100000-0000-4000-8000-000000000011',
      actorAccountId: ids.admin,
      seasonId: ids.season,
      winPoints: 3,
      lossPoints: 1,
      ranking
    })).rejects.toMatchObject({
      report: {violatedRule: 'season.configuration_mutable_required'}
    });
    await expect(pool.query(
      `update seasons
          set result_configuration = jsonb_set(result_configuration, '{standings,points,win}', '3')
        where id = $1`,
      [ids.season]
    )).rejects.toThrow(/versioned amendment/);

    const stored = await pool.query<{result_configuration: unknown}>(
      'select result_configuration from seasons where id = $1',
      [ids.season]
    );
    expect(stored.rows[0]?.result_configuration).toEqual(configuration);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(0);
  });
});

import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresSeasonTeamStore} from '@/courtside/adapters/postgres/season-team-store';
import {createDefaultSeasonResultConfiguration} from '@/courtside/core/season-setup';
import {createSeasonTeamService} from '@/courtside/services/manage-season-teams';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '98000000-0000-4000-8000-000000000001',
  admin: '98000000-0000-4000-8000-000000000002',
  outsider: '98000000-0000-4000-8000-000000000003',
  assignment: '98000000-0000-4000-8000-000000000004',
  season: '98000000-0000-4000-8000-000000000005',
  existingTeam: '98000000-0000-4000-8000-000000000006',
  removableTeam: '98000000-0000-4000-8000-000000000007',
  removableSeasonTeam: '98000000-0000-4000-8000-000000000008',
  player: '98000000-0000-4000-8000-000000000009',
  membership: '98000000-0000-4000-8000-000000000010',
  captainAssignment: '98000000-0000-4000-8000-000000000017'
};

describeWithDatabase('PostgreSQL Season Team setup', () => {
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
      [ids.season, ids.league, JSON.stringify(createDefaultSeasonResultConfiguration())]
    );
  });

  it('reuses League Teams, creates missing Teams, and adds participation atomically', async () => {
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $2, 'Canal Street')`,
      [ids.existingTeam, ids.league]
    );
    const manage = createSeasonTeamService(new PostgresSeasonTeamStore(pool));
    const command = {
      type: 'add_teams' as const,
      commandId: '98000000-0000-4000-8000-000000000011',
      actorAccountId: ids.admin,
      seasonId: ids.season,
      names: ['Canal Street', 'Belleville Ballers', 'belleville ballers', '']
    };

    const first = await manage(command);
    expect(first.receiptReused).toBe(false);
    expect(first.teams).toHaveLength(2);
    expect(first.teams.find((team) => team.name === 'Canal Street')).toMatchObject({
      teamId: ids.existingTeam,
      teamCreated: false,
      participationCreated: true
    });
    expect(first.teams.find((team) => team.name === 'Belleville Ballers')).toMatchObject({
      teamCreated: true,
      participationCreated: true
    });
    await expect(manage(command)).resolves.toEqual({...first, receiptReused: true});

    expect((await pool.query('select id from teams')).rowCount).toBe(2);
    expect((await pool.query('select id from season_teams')).rowCount).toBe(2);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(3);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(1);

    const dashboard = await new PostgresAdminDashboardStore(pool).load(ids.admin);
    expect(dashboard[0]?.seasons[0]?.teams).toEqual(
      expect.arrayContaining([
        {id: expect.any(String), teamId: ids.existingTeam, name: 'Canal Street'},
        {id: expect.any(String), teamId: expect.any(String), name: 'Belleville Ballers'}
      ])
    );

    await expect(pool.query(
      `insert into teams (league_id, name) values ($1, 'CANAL STREET')`,
      [ids.league]
    )).rejects.toMatchObject({code: '23505'});
  });

  it('removes only the Season participation and preserves the durable League Team', async () => {
    await pool.query(
      `insert into teams (id, league_id, name) values ($1, $2, 'Left Bank Hoops')`,
      [ids.removableTeam, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id) values ($1, $2, $3)`,
      [ids.removableSeasonTeam, ids.season, ids.removableTeam]
    );
    const manage = createSeasonTeamService(new PostgresSeasonTeamStore(pool));
    const result = await manage({
      type: 'remove_team',
      commandId: '98000000-0000-4000-8000-000000000012',
      actorAccountId: ids.admin,
      seasonTeamId: ids.removableSeasonTeam
    });

    expect(result.operation).toBe('remove_team');
    expect((await pool.query('select id from season_teams')).rowCount).toBe(0);
    expect((await pool.query('select id from teams where id = $1', [ids.removableTeam])).rowCount).toBe(1);
    expect((await pool.query(
      `select id from audit_records where action = 'season_team.removed'`
    )).rowCount).toBe(1);
  });

  it('rejects removal when roster history depends on participation', async () => {
    await pool.query(
      `insert into teams (id, league_id, name) values ($1, $2, 'Left Bank Hoops')`,
      [ids.removableTeam, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id) values ($1, $2, $3)`,
      [ids.removableSeasonTeam, ids.season, ids.removableTeam]
    );
    await pool.query(
      `insert into players (id, league_id, display_name) values ($1, $2, 'Avery Chen')`,
      [ids.player, ids.league]
    );
    await pool.query(
      `insert into roster_memberships
        (id, player_id, season_id, season_team_id, effective_from)
       values ($1, $2, $3, $4, '2026-08-16T05:00:00Z')`,
      [ids.membership, ids.player, ids.season, ids.removableSeasonTeam]
    );

    const manage = createSeasonTeamService(new PostgresSeasonTeamStore(pool));
    await expect(manage({
      type: 'remove_team',
      commandId: '98000000-0000-4000-8000-000000000013',
      actorAccountId: ids.admin,
      seasonTeamId: ids.removableSeasonTeam
    })).rejects.toMatchObject({
      report: {violatedRule: 'season_team.removal_without_dependencies'}
    });
    expect((await pool.query('select id from season_teams')).rowCount).toBe(1);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(0);
  });

  it('rejects removal when Team Captain history depends on participation', async () => {
    await pool.query(
      `insert into teams (id, league_id, name) values ($1, $2, 'Left Bank Hoops')`,
      [ids.removableTeam, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id) values ($1, $2, $3)`,
      [ids.removableSeasonTeam, ids.season, ids.removableTeam]
    );
    await pool.query(
      `insert into season_team_captain_assignments
        (id, season_team_id, user_account_id, assigned_at, assigned_by_account_id)
       values ($1, $2, $3, '2026-08-17T12:00:00Z', $4)`,
      [ids.captainAssignment, ids.removableSeasonTeam, ids.outsider, ids.admin]
    );

    const manage = createSeasonTeamService(new PostgresSeasonTeamStore(pool));
    await expect(manage({
      type: 'remove_team',
      commandId: '98000000-0000-4000-8000-000000000018',
      actorAccountId: ids.admin,
      seasonTeamId: ids.removableSeasonTeam
    })).rejects.toMatchObject({
      report: {violatedRule: 'season_team.removal_without_dependencies'}
    });
    expect((await pool.query('select id from season_teams')).rowCount).toBe(1);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(0);
  });

  it('rejects unauthorized addition without durable or participation mutation', async () => {
    const manage = createSeasonTeamService(new PostgresSeasonTeamStore(pool));
    await expect(manage({
      type: 'add_teams',
      commandId: '98000000-0000-4000-8000-000000000014',
      actorAccountId: ids.outsider,
      seasonId: ids.season,
      names: ['Canal Street']
    })).rejects.toMatchObject({
      report: {violatedRule: 'authorization.league_admin_required'}
    });
    expect((await pool.query('select id from teams')).rowCount).toBe(0);
    expect((await pool.query('select id from season_teams')).rowCount).toBe(0);
  });
});

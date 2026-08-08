import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresRosterManagementStore} from '@/courtside/adapters/postgres/roster-management-store';
import {TemporalScheduledInstantResolver} from '@/courtside/adapters/temporal/scheduled-instant-resolver';
import {createRosterManagementService} from '@/courtside/services/manage-roster';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '80000000-0000-4000-8000-000000000001',
  otherLeague: '80000000-0000-4000-8000-000000000002',
  admin: '80000000-0000-4000-8000-000000000003',
  outsider: '80000000-0000-4000-8000-000000000004',
  assignment: '80000000-0000-4000-8000-000000000005',
  season: '80000000-0000-4000-8000-000000000006',
  otherSeason: '80000000-0000-4000-8000-000000000007',
  teamA: '80000000-0000-4000-8000-000000000008',
  teamB: '80000000-0000-4000-8000-000000000009',
  otherTeam: '80000000-0000-4000-8000-000000000010',
  seasonTeamA: '80000000-0000-4000-8000-000000000011',
  seasonTeamB: '80000000-0000-4000-8000-000000000012',
  otherSeasonTeam: '80000000-0000-4000-8000-000000000013',
  player: '80000000-0000-4000-8000-000000000014',
  otherPlayer: '80000000-0000-4000-8000-000000000015'
};

const resultConfiguration = {
  standings: {
    points: {win: 2, loss: 0},
    ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw'],
    eligible_phases: ['regular'],
    eligible_statuses: ['final', 'forfeit'],
    adjustments_enabled: false,
    forfeit_treatment: 'explicit_score'
  },
  playoffs: {rounds: []}
};

describeWithDatabase('PostgreSQL Player and Roster Membership lifecycle', () => {
  let pool: Pool;
  let generatedIndex = 0;

  beforeAll(() => {
    pool = createPostgresPool(connectionString!);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    generatedIndex = 0;
    await pool.query(`
      truncate table
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
       values ($1, 'Courtside', 'America/Los_Angeles', 'en'),
              ($2, 'Other League', 'America/Toronto', 'en')`,
      [ids.league, ids.otherLeague]
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
       values ($1, $2, '2026', $4::jsonb),
              ($3, $5, '2026', $4::jsonb)`,
      [ids.season, ids.league, ids.otherSeason, JSON.stringify(resultConfiguration), ids.otherLeague]
    );
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $4, 'A'), ($2, $4, 'B'), ($3, $5, 'Other')`,
      [ids.teamA, ids.teamB, ids.otherTeam, ids.league, ids.otherLeague]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id)
       values ($1, $4, $5), ($2, $4, $6), ($3, $7, $8)`,
      [
        ids.seasonTeamA,
        ids.seasonTeamB,
        ids.otherSeasonTeam,
        ids.season,
        ids.teamA,
        ids.teamB,
        ids.otherSeason,
        ids.otherTeam
      ]
    );
    await pool.query(
      `insert into players (id, league_id, display_name)
       values ($1, $3, 'Existing Player'), ($2, $4, 'Other Player')`,
      [ids.player, ids.otherPlayer, ids.league, ids.otherLeague]
    );
  });

  function nextId() {
    generatedIndex += 1;
    return `81000000-0000-4000-8000-${String(generatedIndex).padStart(12, '0')}`;
  }

  function service() {
    return createRosterManagementService(
      new PostgresRosterManagementStore(pool),
      new TemporalScheduledInstantResolver(),
      {
        now: () => new Date('2026-08-08T19:00:00Z'),
        newId: nextId
      }
    );
  }

  it('creates and renames a durable Player with audit and idempotent retry', async () => {
    const manageRoster = service();
    const command = {
      type: 'create_player' as const,
      commandId: '82000000-0000-4000-8000-000000000001',
      actorAccountId: ids.admin,
      leagueId: ids.league,
      displayName: '  Jordan Lee  '
    };
    const created = await manageRoster(command);
    expect(created).toMatchObject({
      receiptReused: false,
      operation: 'create_player',
      player: {displayName: 'Jordan Lee', version: 0},
      membership: null
    });
    await expect(manageRoster(command)).resolves.toEqual({...created, receiptReused: true});

    const renamed = await manageRoster({
      type: 'rename_player',
      commandId: '82000000-0000-4000-8000-000000000002',
      actorAccountId: ids.admin,
      playerId: created.player.id,
      displayName: 'Jordan A. Lee',
      reason: 'Preferred display name'
    });
    expect(renamed.player).toMatchObject({displayName: 'Jordan A. Lee', version: 1});

    const persisted = await pool.query(
      `select p.display_name,
              p.version,
              (select count(*)::int from audit_records) as audit_count,
              (select count(*)::int from command_receipts) as receipt_count,
              (select reason from audit_records where action = 'player.display_name_updated') as reason
         from players p
        where p.id = $1`,
      [created.player.id]
    );
    expect(persisted.rows[0]).toEqual({
      display_name: 'Jordan A. Lee',
      version: 1,
      audit_count: 2,
      receipt_count: 2,
      reason: 'Preferred display name'
    });
  });

  it('adds, transfers, and ends membership while preserving contiguous history', async () => {
    const manageRoster = service();
    const added = await manageRoster({
      type: 'add_membership',
      commandId: '82000000-0000-4000-8000-000000000011',
      actorAccountId: ids.admin,
      playerId: ids.player,
      seasonTeamId: ids.seasonTeamA,
      localEffectiveAt: '2026-08-10T09:00'
    });
    expect(added.membership).toMatchObject({
      seasonTeamId: ids.seasonTeamA,
      effectiveFrom: '2026-08-10T16:00:00.000Z',
      effectiveUntil: null
    });

    const transferred = await manageRoster({
      type: 'transfer_membership',
      commandId: '82000000-0000-4000-8000-000000000012',
      actorAccountId: ids.admin,
      membershipId: added.membership!.id,
      targetSeasonTeamId: ids.seasonTeamB,
      localEffectiveAt: '2026-08-20T18:30',
      reason: 'Approved transfer'
    });
    expect(transferred.previousMembership).toMatchObject({
      id: added.membership!.id,
      effectiveUntil: '2026-08-21T01:30:00.000Z',
      version: 1
    });
    expect(transferred.membership).toMatchObject({
      seasonTeamId: ids.seasonTeamB,
      effectiveFrom: '2026-08-21T01:30:00.000Z',
      effectiveUntil: null,
      version: 0
    });

    const ended = await manageRoster({
      type: 'end_membership',
      commandId: '82000000-0000-4000-8000-000000000013',
      actorAccountId: ids.admin,
      membershipId: transferred.membership!.id,
      localEffectiveAt: '2026-08-30T12:00'
    });
    expect(ended.membership).toMatchObject({
      effectiveUntil: '2026-08-30T19:00:00.000Z',
      version: 1
    });

    const history = await pool.query(
      `select season_team_id, effective_from, effective_until, version
         from roster_memberships
        where player_id = $1
        order by effective_from`,
      [ids.player]
    );
    expect(history.rows).toHaveLength(2);
    expect(history.rows[0].effective_until).toEqual(history.rows[1].effective_from);
    expect(history.rows.map((row) => row.season_team_id)).toEqual([
      ids.seasonTeamA,
      ids.seasonTeamB
    ]);
    const actions = await pool.query(
      `select array_agg(action order by created_at, id) as actions from audit_records`
    );
    expect(actions.rows[0].actions).toEqual([
      'roster_membership.created',
      'roster_membership.transferred',
      'roster_membership.ended'
    ]);
  });

  it('rejects overlap, ambiguous time, cross-League membership, and unauthorized mutation', async () => {
    const manageRoster = service();
    await manageRoster({
      type: 'add_membership',
      commandId: '82000000-0000-4000-8000-000000000021',
      actorAccountId: ids.admin,
      playerId: ids.player,
      seasonTeamId: ids.seasonTeamA,
      localEffectiveAt: '2026-08-10T09:00'
    });
    await expect(
      manageRoster({
        type: 'add_membership',
        commandId: '82000000-0000-4000-8000-000000000022',
        actorAccountId: ids.admin,
        playerId: ids.player,
        seasonTeamId: ids.seasonTeamB,
        localEffectiveAt: '2026-08-11T09:00'
      })
    ).rejects.toMatchObject({report: {violatedRule: 'roster_membership.no_overlap'}});
    await expect(
      manageRoster({
        type: 'add_membership',
        commandId: '82000000-0000-4000-8000-000000000023',
        actorAccountId: ids.admin,
        playerId: ids.player,
        seasonTeamId: ids.seasonTeamB,
        localEffectiveAt: '2026-11-01T01:30'
      })
    ).rejects.toMatchObject({
      report: {violatedRule: 'roster_membership.effective_instant_unambiguous'}
    });
    await expect(
      manageRoster({
        type: 'add_membership',
        commandId: '82000000-0000-4000-8000-000000000024',
        actorAccountId: ids.admin,
        playerId: ids.player,
        seasonTeamId: ids.otherSeasonTeam,
        localEffectiveAt: '2026-08-11T09:00'
      })
    ).rejects.toMatchObject({report: {violatedRule: 'roster_membership.same_league'}});
    await expect(
      manageRoster({
        type: 'rename_player',
        commandId: '82000000-0000-4000-8000-000000000025',
        actorAccountId: ids.outsider,
        playerId: ids.player,
        displayName: 'Unauthorized Name'
      })
    ).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});

    const counts = await pool.query(
      `select
         (select count(*)::int from roster_memberships) as memberships,
         (select count(*)::int from audit_records) as audits,
         (select count(*)::int from command_receipts) as receipts`
    );
    expect(counts.rows[0]).toEqual({memberships: 1, audits: 1, receipts: 1});
  });

  it('enforces League ownership, overlap, and terminal history below the service layer', async () => {
    await expect(
      pool.query(
        `insert into roster_memberships
          (id, player_id, season_id, season_team_id, effective_from)
         values (gen_random_uuid(), $1, $2, $3, '2026-08-01T00:00:00Z')`,
        [ids.player, ids.otherSeason, ids.otherSeasonTeam]
      )
    ).rejects.toThrow(/same League/);

    const inserted = await pool.query<{id: string}>(
      `insert into roster_memberships
        (id, player_id, season_id, season_team_id, effective_from)
       values (gen_random_uuid(), $1, $2, $3, '2026-08-01T00:00:00Z')
       returning id`,
      [ids.player, ids.season, ids.seasonTeamA]
    );
    await expect(
      pool.query(
        `insert into roster_memberships
          (id, player_id, season_id, season_team_id, effective_from)
         values (gen_random_uuid(), $1, $2, $3, '2026-08-02T00:00:00Z')`,
        [ids.player, ids.season, ids.seasonTeamB]
      )
    ).rejects.toThrow(/conflicting key value violates exclusion constraint/);

    await pool.query(
      `update roster_memberships
          set effective_until = '2026-08-10T00:00:00Z', version = version + 1
        where id = $1`,
      [inserted.rows[0].id]
    );
    await expect(
      pool.query(
        `update roster_memberships
            set effective_until = '2026-08-11T00:00:00Z', version = version + 1
          where id = $1`,
        [inserted.rows[0].id]
      )
    ).rejects.toThrow(/terminal/);
  });
});

import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresPlayerPointsStore} from '@/courtside/adapters/postgres/player-points-store';
import {
  createPlayerPointsService,
  PlayerPointsRejected
} from '@/courtside/services/manage-player-points';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: 'a1000000-0000-4000-8000-000000000001',
  admin: 'a1000000-0000-4000-8000-000000000002',
  outsider: 'a1000000-0000-4000-8000-000000000003',
  assignment: 'a1000000-0000-4000-8000-000000000004',
  season: 'a1000000-0000-4000-8000-000000000005',
  teamA: 'a1000000-0000-4000-8000-000000000006',
  teamB: 'a1000000-0000-4000-8000-000000000007',
  seasonTeamA: 'a1000000-0000-4000-8000-000000000008',
  seasonTeamB: 'a1000000-0000-4000-8000-000000000009',
  playerA: 'a1000000-0000-4000-8000-000000000010',
  playerB: 'a1000000-0000-4000-8000-000000000011',
  membershipA: 'a1000000-0000-4000-8000-000000000012',
  membershipB: 'a1000000-0000-4000-8000-000000000013',
  configurationVersion: 'a1000000-0000-4000-8000-000000000014',
  game: 'a1000000-0000-4000-8000-000000000015'
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

describeWithDatabase('PostgreSQL points-first Player Stat Lines', () => {
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
        player_stat_lines,
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
       values ($1, 'Courtside', 'Europe/Paris', 'en')`,
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
       values ($1, $2, '2026', $3::jsonb)`,
      [ids.season, ids.league, JSON.stringify(resultConfiguration)]
    );
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $3, 'AA'), ($2, $3, 'BB')`,
      [ids.teamA, ids.teamB, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id)
       values ($1, $3, $4), ($2, $3, $5)`,
      [ids.seasonTeamA, ids.seasonTeamB, ids.season, ids.teamA, ids.teamB]
    );
    await pool.query(
      `insert into players (id, league_id, display_name)
       values ($1, $3, 'Avery Chen'), ($2, $3, 'Jordan Lee')`,
      [ids.playerA, ids.playerB, ids.league]
    );
    await pool.query(
      `insert into roster_memberships
        (id, player_id, season_id, season_team_id, effective_from)
       values ($1, $3, $5, $6, '2026-06-01T00:00:00Z'),
              ($2, $4, $5, $7, '2026-06-01T00:00:00Z')`,
      [
        ids.membershipA,
        ids.membershipB,
        ids.playerA,
        ids.playerB,
        ids.season,
        ids.seasonTeamA,
        ids.seasonTeamB
      ]
    );
    await pool.query(
      `insert into season_configuration_versions
        (id, season_id, version_number, configuration, basis_hash, frozen_at)
       values ($1, $2, 1, $3::jsonb, repeat('a', 64), '2026-08-01T00:00:00Z')`,
      [ids.configurationVersion, ids.season, JSON.stringify(resultConfiguration)]
    );
    await pool.query(
      'update seasons set frozen_configuration_version_id = $2 where id = $1',
      [ids.season, ids.configurationVersion]
    );
    await pool.query(
      `insert into games
        (id, season_id, phase, status, home_season_team_id, away_season_team_id,
         scheduled_at, started_at, competition_eligibility_at, finalized_at,
         home_score, away_score, winning_season_team_id, configuration_version_id)
       values ($1, $2, 'regular', 'final', $3, $4,
               '2026-08-10T18:00:00Z', '2026-08-10T18:05:00Z',
               '2026-08-10T18:05:00Z', '2026-08-10T20:00:00Z',
               80, 70, $3, $5)`,
      [ids.game, ids.season, ids.seasonTeamA, ids.seasonTeamB, ids.configurationVersion]
    );
  });

  function nextId() {
    generatedIndex += 1;
    return `a2000000-0000-4000-8000-${String(generatedIndex).padStart(12, '0')}`;
  }

  function service() {
    return createPlayerPointsService(new PostgresPlayerPointsStore(pool), {
      now: () => new Date('2026-08-11T12:00:00Z'),
      newId: nextId
    });
  }

  it('records zero separately from unknown, confirms partial lines, audits, and reuses a receipt', async () => {
    const recordPoints = service();
    const command = {
      type: 'record_player_points' as const,
      commandId: 'a3000000-0000-4000-8000-000000000001',
      actorAccountId: ids.admin,
      gameId: ids.game,
      verificationStatus: 'confirmed' as const,
      entries: [
        {rosterMembershipId: ids.membershipA, points: 0},
        {rosterMembershipId: ids.membershipB, points: null}
      ],
      reason: 'Verified score sheet'
    };

    const accepted = await recordPoints(command);
    expect(accepted).toMatchObject({
      receiptReused: false,
      changedLineCount: 1,
      lines: [{playerId: ids.playerA, points: 0, verificationStatus: 'confirmed'}]
    });
    await expect(recordPoints(command)).resolves.toEqual({...accepted, receiptReused: true});

    const persisted = await pool.query(
      `select points, completeness_status, verification_status,
              (select count(*)::int from audit_records where entity_type = 'PlayerStatLine') as audit_count,
              (select reason from audit_records where entity_type = 'PlayerStatLine') as reason
         from player_stat_lines`
    );
    expect(persisted.rows).toEqual([{
      points: 0,
      completeness_status: 'partial',
      verification_status: 'confirmed',
      audit_count: 1,
      reason: 'Verified score sheet'
    }]);
  });

  it('returns a corrected confirmed value to provisional and preserves prior audit value', async () => {
    const recordPoints = service();
    await recordPoints({
      type: 'record_player_points',
      commandId: 'a3000000-0000-4000-8000-000000000011',
      actorAccountId: ids.admin,
      gameId: ids.game,
      verificationStatus: 'confirmed',
      entries: [{rosterMembershipId: ids.membershipA, points: 12}],
      reason: null
    });
    const corrected = await recordPoints({
      type: 'record_player_points',
      commandId: 'a3000000-0000-4000-8000-000000000012',
      actorAccountId: ids.admin,
      gameId: ids.game,
      verificationStatus: 'provisional',
      entries: [{rosterMembershipId: ids.membershipA, points: 14}],
      reason: 'Score sheet correction'
    });
    expect(corrected.lines[0]).toMatchObject({points: 14, verificationStatus: 'provisional', version: 1});

    const audit = await pool.query(
      `select action, previous_value, new_value, reason
         from audit_records
        where entity_type = 'PlayerStatLine'
        order by created_at, id`
    );
    expect(audit.rows[1]).toMatchObject({
      action: 'player_stat_line.corrected',
      previous_value: {points: 12, verification_status: 'confirmed', version: 0},
      new_value: {points: 14, verification_status: 'provisional', version: 1},
      reason: 'Score sheet correction'
    });
  });

  it('rejects unauthorized, ineligible, duplicate, and unchanged submissions without mutation', async () => {
    const recordPoints = service();
    const base = {
      type: 'record_player_points' as const,
      actorAccountId: ids.outsider,
      gameId: ids.game,
      verificationStatus: 'provisional' as const,
      entries: [{rosterMembershipId: ids.membershipA, points: 8}],
      reason: null
    };
    await expect(recordPoints({...base, commandId: 'a3000000-0000-4000-8000-000000000021'}))
      .rejects.toBeInstanceOf(PlayerPointsRejected);
    await expect(recordPoints({
      ...base,
      commandId: 'a3000000-0000-4000-8000-000000000022',
      actorAccountId: ids.admin,
      entries: [
        {rosterMembershipId: ids.membershipA, points: 8},
        {rosterMembershipId: ids.membershipA, points: 9}
      ]
    })).rejects.toBeInstanceOf(PlayerPointsRejected);
    await expect(recordPoints({
      ...base,
      commandId: 'a3000000-0000-4000-8000-000000000025',
      actorAccountId: ids.admin,
      entries: [{rosterMembershipId: ids.membershipA, points: -1}]
    })).rejects.toMatchObject({report: {violatedRule: 'player_stat_line.points'}});

    const accepted = await recordPoints({
      ...base,
      commandId: 'a3000000-0000-4000-8000-000000000023',
      actorAccountId: ids.admin
    });
    expect(accepted.changedLineCount).toBe(1);
    await expect(recordPoints({
      ...base,
      commandId: 'a3000000-0000-4000-8000-000000000024',
      actorAccountId: ids.admin
    })).rejects.toMatchObject({report: {violatedRule: 'player_stat_line.material_change'}});
  });

  it('enforces eligibility at the database boundary', async () => {
    await expect(pool.query(
      `insert into player_stat_lines
        (id, game_id, player_id, roster_membership_id, season_id, season_team_id,
         points, completeness_status, verification_status, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, 4, 'partial', 'provisional', now(), now())`,
      [nextId(), ids.game, ids.playerA, ids.membershipA, ids.season, ids.seasonTeamB]
    )).rejects.toThrow();
  });
});

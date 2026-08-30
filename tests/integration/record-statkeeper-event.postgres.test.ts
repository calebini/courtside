import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresStatkeeperEventLedgerStore} from '@/courtside/adapters/postgres/statkeeper-event-ledger-store';
import {
  createStatkeeperEventLedgerService,
  StatkeeperLedgerRecordRejected
} from '@/courtside/services/record-statkeeper-event';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: 'd1000000-0000-4000-8000-000000000001',
  actor: 'd1000000-0000-4000-8000-000000000002',
  season: 'd1000000-0000-4000-8000-000000000003',
  teamA: 'd1000000-0000-4000-8000-000000000004',
  teamB: 'd1000000-0000-4000-8000-000000000005',
  seasonTeamA: 'd1000000-0000-4000-8000-000000000006',
  seasonTeamB: 'd1000000-0000-4000-8000-000000000007',
  playerA: 'd1000000-0000-4000-8000-000000000008',
  playerB: 'd1000000-0000-4000-8000-000000000009',
  membershipA: 'd1000000-0000-4000-8000-000000000010',
  membershipB: 'd1000000-0000-4000-8000-000000000011',
  configurationVersion: 'd1000000-0000-4000-8000-000000000012',
  game: 'd1000000-0000-4000-8000-000000000013',
  session: 'd1000000-0000-4000-8000-000000000014',
  profile: 'd1000000-0000-4000-8000-000000000015',
  media: 'd1000000-0000-4000-8000-000000000016',
  occurrence: 'd1000000-0000-4000-8000-000000000017'
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

const eventDefinitions = [{
  eventKey: 'shot',
  participantRoleKeys: ['shooter'],
  outcomes: [{
    outcomeKey: 'made_two',
    contributions: [
      {statKey: 'field_goals_made', increment: 1},
      {statKey: 'points', increment: 2}
    ]
  }]
}];

describeWithDatabase('PostgreSQL Statkeeper event ledger foundation', () => {
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
        statkeeper_statistical_event_contributions,
        statkeeper_statistical_event_assignments,
        statkeeper_statistical_events,
        statkeeper_occurrence_revisions,
        statkeeper_event_ledger_participants,
        statkeeper_event_ledger_heads,
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
       values ($1, 'Courtside', 'Europe/Paris', 'fr')`,
      [ids.league]
    );
    await pool.query(
      `insert into user_accounts (id, display_name)
       values ($1, 'Statkeeper')`,
      [ids.actor]
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
       values ($1, $3, 'Avery'), ($2, $3, 'Jordan')`,
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
               '2026-08-30T18:00:00Z', '2026-08-30T18:05:00Z',
               '2026-08-30T18:05:00Z', '2026-08-30T20:00:00Z',
               80, 70, $3, $5)`,
      [ids.game, ids.season, ids.seasonTeamA, ids.seasonTeamB, ids.configurationVersion]
    );
    await pool.query(
      `insert into statkeeper_event_ledger_heads
        (capture_session_id, game_id, profile_version_id, profile_content_hash, media_id,
         regulation_period_count, regulation_period_duration_ms, overtime_period_duration_ms,
         event_definitions, ledger_version, created_at, updated_at)
       values ($1, $2, $3, repeat('b', 64), $4, 4, 600000, 300000, $5::jsonb, 1,
               '2026-08-30T20:05:00Z', '2026-08-30T20:05:00Z')`,
      [ids.session, ids.game, ids.profile, ids.media, JSON.stringify(eventDefinitions)]
    );
    await pool.query(
      `insert into statkeeper_event_ledger_participants
        (capture_session_id, roster_membership_id, player_id, season_id, season_team_id,
         participation_status)
       values ($1, $2, $3, $4, $5, 'appeared'),
              ($1, $6, $7, $4, $8, 'did_not_play')`,
      [
        ids.session,
        ids.membershipA,
        ids.playerA,
        ids.season,
        ids.seasonTeamA,
        ids.membershipB,
        ids.playerB,
        ids.seasonTeamB
      ]
    );
  });

  function service() {
    return createStatkeeperEventLedgerService(
      new PostgresStatkeeperEventLedgerStore(pool),
      {now: () => new Date('2026-08-30T20:10:00Z')}
    );
  }

  function command(commandId: string) {
    return {
      type: 'record_statkeeper_ledger_occurrence' as const,
      commandId,
      actorAccountId: ids.actor,
      captureSessionId: ids.session,
      expectedLedgerVersion: 1,
      occurrence: {
        occurrenceId: ids.occurrence,
        evidenceTimestampMs: 90_000,
        evidenceWindow: {startMs: 89_000, endMs: 91_000},
        period: {kind: 'regulation' as const, ordinal: 1},
        clock: {state: 'exact' as const, remainingMs: 510_000},
        events: [{
          eventKey: 'shot',
          outcomeKey: 'made_two',
          seasonTeamId: ids.seasonTeamA,
          assignments: [{roleKey: 'shooter', rosterMembershipId: ids.membershipA}]
        }],
        operatorNote: 'Panier près du cercle'
      }
    };
  }

  it('atomically persists the immutable occurrence, events, contributions, version, and receipt', async () => {
    const record = service();
    const submitted = command('d2000000-0000-4000-8000-000000000001');

    const accepted = await record(submitted);
    expect(accepted).toMatchObject({
      receiptReused: false,
      occurrenceReused: false,
      ledgerVersion: 2,
      occurrenceId: ids.occurrence,
      eventIds: [expect.any(String)]
    });
    await expect(record(submitted)).resolves.toEqual({...accepted, receiptReused: true});

    const persisted = await pool.query<{
      canonical_payload: string;
      content_hash: string;
      source: string;
      verification_state: string;
      disposition: string;
      ledger_version: string;
      event_count: number;
      assignment_count: number;
      contribution_count: number;
      receipt_count: number;
    }>(
      `select occurrence.canonical_payload,
              occurrence.content_hash,
              occurrence.source,
              occurrence.verification_state,
              occurrence.disposition,
              head.ledger_version,
              (select count(*)::int from statkeeper_statistical_events) as event_count,
              (select count(*)::int from statkeeper_statistical_event_assignments) as assignment_count,
              (select count(*)::int from statkeeper_statistical_event_contributions) as contribution_count,
              (select count(*)::int from command_receipts) as receipt_count
         from statkeeper_occurrence_revisions occurrence
         join statkeeper_event_ledger_heads head
           on head.capture_session_id = occurrence.capture_session_id`
    );
    expect(persisted.rows[0]).toMatchObject({
      content_hash: accepted.contentHash,
      source: 'human',
      verification_state: 'recorded',
      disposition: 'active',
      ledger_version: '2',
      event_count: 1,
      assignment_count: 1,
      contribution_count: 2,
      receipt_count: 1
    });
    expect(persisted.rows[0]!.canonical_payload.endsWith('\n')).toBe(false);
    expect(JSON.parse(persisted.rows[0]!.canonical_payload)).toMatchObject({
      source: 'human',
      recorded_by_account_id: ids.actor,
      operator_note: 'Panier près du cercle'
    });
  });

  it('rejects a DNP assignment without advancing the ledger or persisting partial rows', async () => {
    const record = service();
    const submitted = command('d2000000-0000-4000-8000-000000000011');
    submitted.occurrence.events[0] = {
      ...submitted.occurrence.events[0]!,
      seasonTeamId: ids.seasonTeamB,
      assignments: [{roleKey: 'shooter', rosterMembershipId: ids.membershipB}]
    };

    await expect(record(submitted)).rejects.toMatchObject({
      report: {
        violatedRule: 'statkeeper.event.participation',
        authoritativeStatePreserved: true
      }
    });
    const state = await pool.query(
      `select ledger_version,
              (select count(*)::int from statkeeper_occurrence_revisions) as occurrences,
              (select count(*)::int from command_receipts) as receipts
         from statkeeper_event_ledger_heads`
    );
    expect(state.rows[0]).toEqual({ledger_version: '1', occurrences: 0, receipts: 0});
  });

  it('enforces append-only occurrence history at the database boundary', async () => {
    await service()(command('d2000000-0000-4000-8000-000000000021'));
    await expect(pool.query(
      `update statkeeper_occurrence_revisions set disposition = 'active'
        where occurrence_id = $1`,
      [ids.occurrence]
    )).rejects.toThrow(/append-only/);
    await expect(service()({
      ...command('d2000000-0000-4000-8000-000000000022'),
      occurrence: {...command('unused').occurrence, evidenceTimestampMs: 91_000}
    })).rejects.toBeInstanceOf(StatkeeperLedgerRecordRejected);
  });
});

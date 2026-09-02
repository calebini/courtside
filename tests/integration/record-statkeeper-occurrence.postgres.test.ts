import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresStatkeeperOccurrenceStore} from '@/courtside/adapters/postgres/statkeeper-occurrence-store';
import {PostgresStatkeeperPreflightStore} from '@/courtside/adapters/postgres/statkeeper-preflight-store';
import {createStatkeeperProfileActivationService} from '@/courtside/services/activate-statkeeper-profile';
import {createStatkeeperOccurrenceRecordService} from '@/courtside/services/record-statkeeper-occurrence';
import {createStatkeeperSessionStartService} from '@/courtside/services/start-statkeeper-session';
import {statkeeperProfileFixture} from '../fixtures/statkeeper-profile';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: 'fa000000-0000-4000-8000-000000000001',
  adminAccount: 'fa000000-0000-4000-8000-000000000002',
  statkeeperAccount: 'fa000000-0000-4000-8000-000000000003',
  adminAssignment: 'fa000000-0000-4000-8000-000000000004',
  statkeeperAssignment: 'fa000000-0000-4000-8000-000000000005',
  season: 'fa000000-0000-4000-8000-000000000006',
  teamA: 'fa000000-0000-4000-8000-000000000007',
  teamB: 'fa000000-0000-4000-8000-000000000008',
  seasonTeamA: 'fa000000-0000-4000-8000-000000000009',
  seasonTeamB: 'fa000000-0000-4000-8000-000000000010',
  playerA: 'fa000000-0000-4000-8000-000000000011',
  playerB: 'fa000000-0000-4000-8000-000000000012',
  membershipA: 'fa000000-0000-4000-8000-000000000013',
  membershipB: 'fa000000-0000-4000-8000-000000000014',
  configurationVersion: 'fa000000-0000-4000-8000-000000000015',
  game: 'fa000000-0000-4000-8000-000000000016',
  profile: 'fa000000-0000-4000-8000-000000000017',
  audit: 'fa000000-0000-4000-8000-000000000018',
  session: 'fa000000-0000-4000-8000-000000000019',
  workingRevision: 'fa000000-0000-4000-8000-000000000020',
  media: 'fa000000-0000-4000-8000-000000000021',
  initialPossession: 'fa000000-0000-4000-8000-000000000022',
  switchedPossession: 'fa000000-0000-4000-8000-000000000023',
  occurrence: 'fa000000-0000-4000-8000-000000000024'
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

function switchingProfile() {
  const profile = statkeeperProfileFixture();
  return {
    ...profile,
    captureActions: profile.captureActions.map((action) =>
      action.actionKey === 'made_two'
        ? {...action, possessionEffect: 'switch' as const}
        : action
    )
  };
}

describeWithDatabase('PostgreSQL production Statkeeper occurrence capture', () => {
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
        statkeeper_possession_sequences,
        statkeeper_statistical_event_contributions,
        statkeeper_statistical_event_assignments,
        statkeeper_statistical_events,
        statkeeper_occurrence_revisions,
        statkeeper_capture_session_coverage,
        statkeeper_event_ledger_participants,
        statkeeper_event_ledger_heads,
        statkeeper_capture_sessions,
        game_media,
        league_statkeeping_profile_versions,
        league_statkeeper_assignments,
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
       values ($1, 'Administrator'), ($2, 'Statkeeper')`,
      [ids.adminAccount, ids.statkeeperAccount]
    );
    await pool.query(
      `insert into league_admin_assignments (id, league_id, user_account_id)
       values ($1, $2, $3)`,
      [ids.adminAssignment, ids.league, ids.adminAccount]
    );
    await pool.query(
      `insert into league_statkeeper_assignments
        (id, league_id, user_account_id, assigned_by_account_id, assigned_at)
       values ($1, $2, $3, $4, '2026-08-30T12:00:00Z')`,
      [ids.statkeeperAssignment, ids.league, ids.statkeeperAccount, ids.adminAccount]
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

    const preflightStore = new PostgresStatkeeperPreflightStore(pool);
    const profileIds = [ids.profile, ids.audit];
    await createStatkeeperProfileActivationService(preflightStore, {
      now: () => new Date('2026-08-30T20:01:00Z'),
      newId: () => profileIds.shift()!
    })({
      type: 'activate_statkeeper_profile',
      commandId: 'fb000000-0000-4000-8000-000000000001',
      actorAccountId: ids.adminAccount,
      leagueId: ids.league,
      expectedCurrentProfileVersionId: null,
      definition: switchingProfile()
    });
    const sessionIds = [ids.session, ids.workingRevision, ids.media];
    await createStatkeeperSessionStartService(preflightStore, {
      now: () => new Date('2026-08-30T20:02:00Z'),
      newId: () => sessionIds.shift()!
    })({
      type: 'start_statkeeper_session',
      commandId: 'fb000000-0000-4000-8000-000000000002',
      actorAccountId: ids.adminAccount,
      gameId: ids.game,
      youtubeMedia: {kind: 'provider_asset_id', value: 'capture_fixture'},
      didNotPlayRosterMembershipIds: []
    });
    await pool.query(
      `insert into statkeeper_possession_sequences
        (id, capture_session_id, working_revision_id, possessing_season_team_id,
         start_media_offset_ms, started_by_transition_kind, created_by_account_id, created_at)
       values ($1, $2, $3, $4, 0, 'manual', $5, '2026-08-30T20:03:00Z')`,
      [
        ids.initialPossession,
        ids.session,
        ids.workingRevision,
        ids.seasonTeamA,
        ids.adminAccount
      ]
    );
  });

  function command(commandId: string, occurrenceId = ids.occurrence) {
    return {
      type: 'record_statkeeper_occurrence' as const,
      commandId,
      actorAccountId: ids.statkeeperAccount,
      captureSessionId: ids.session,
      expectedLedgerVersion: 1,
      occurrenceId,
      actionKey: 'made_two',
      evidenceTimestampMs: 42_000,
      evidenceWindow: {startMs: 41_000, endMs: 43_000},
      period: {kind: 'regulation' as const, ordinal: 1},
      clock: {state: 'exact' as const, remainingMs: 558_000},
      participantSelections: [{roleKey: 'shooter', playerId: ids.playerA}],
      operatorNote: 'Panier près du cercle'
    };
  }

  function service() {
    return createStatkeeperOccurrenceRecordService(
      new PostgresStatkeeperOccurrenceStore(pool),
      {
        now: () => new Date('2026-08-30T20:04:00Z'),
        newId: () => ids.switchedPossession
      }
    );
  }

  it('atomically expands an authorized action, records its ledger facts, and switches possession', async () => {
    const record = service();
    const submitted = command('fb000000-0000-4000-8000-000000000003');
    const accepted = await record(submitted);

    expect(accepted).toMatchObject({
      receiptReused: false,
      occurrenceReused: false,
      operation: 'record_statkeeper_occurrence',
      captureSessionId: ids.session,
      occurrenceId: ids.occurrence,
      ledgerVersion: 2,
      lifecycleStatus: 'capturing',
      possessionEffect: 'switch',
      possessionTransition: {
        sequenceId: ids.switchedPossession,
        fromSeasonTeamId: ids.seasonTeamA,
        toSeasonTeamId: ids.seasonTeamB,
        atMediaOffsetMs: 42_000
      },
      possessionPromptRequired: false
    });
    await expect(record(submitted)).resolves.toEqual({...accepted, receiptReused: true});

    const sameOccurrence = await record({
      ...submitted,
      commandId: 'fb000000-0000-4000-8000-000000000004',
      expectedLedgerVersion: 2
    });
    expect(sameOccurrence).toEqual({...accepted, occurrenceReused: true});
    await expect(record({
      ...submitted,
      commandId: 'fb000000-0000-4000-8000-000000000005',
      expectedLedgerVersion: 2,
      operatorNote: 'Different content'
    })).rejects.toMatchObject({
      report: {violatedRule: 'statkeeper.occurrence.identity'}
    });

    const persisted = await pool.query<{
      ledger_version: string;
      capture_action_key: string;
      source: string;
      verification_state: string;
      disposition: string;
      event_count: number;
      contribution_count: number;
      closed_count: number;
      open_team_id: string;
      automatic_cause: string;
      record_receipt_count: number;
    }>(
      `select head.ledger_version,
              occurrence.capture_action_key,
              occurrence.source,
              occurrence.verification_state,
              occurrence.disposition,
              (select count(*)::int from statkeeper_statistical_events) as event_count,
              (select count(*)::int from statkeeper_statistical_event_contributions) as contribution_count,
              (select count(*)::int from statkeeper_possession_sequences
                where end_media_offset_ms = 42000) as closed_count,
              (select possessing_season_team_id from statkeeper_possession_sequences
                where end_media_offset_ms is null) as open_team_id,
              (select causing_occurrence_id from statkeeper_possession_sequences
                where started_by_transition_kind = 'automatic') as automatic_cause,
              (select count(*)::int from command_receipts
                where command_type = 'statkeeper.occurrence_recorded') as record_receipt_count
         from statkeeper_occurrence_revisions occurrence
         join statkeeper_event_ledger_heads head
           on head.capture_session_id = occurrence.capture_session_id`
    );
    expect(persisted.rows[0]).toMatchObject({
      ledger_version: '2',
      capture_action_key: 'made_two',
      source: 'human',
      verification_state: 'recorded',
      disposition: 'active',
      event_count: 1,
      contribution_count: 1,
      closed_count: 1,
      open_team_id: ids.seasonTeamB,
      automatic_cause: ids.occurrence,
      record_receipt_count: 2
    });
  });

  it('rejects revoked authority and stale writes without partial ledger or possession mutation', async () => {
    await pool.query(
      `update league_statkeeper_assignments
          set revoked_by_account_id = $2,
              revoked_at = '2026-08-30T20:03:30Z'
        where id = $1`,
      [ids.statkeeperAssignment, ids.adminAccount]
    );
    await expect(service()(command('fb000000-0000-4000-8000-000000000011')))
      .rejects.toMatchObject({
        report: {
          violatedRule: 'authorization.statkeeper_or_league_admin_required',
          authoritativeStatePreserved: true
        }
      });
    expect((await pool.query('select ledger_version from statkeeper_event_ledger_heads')).rows[0].ledger_version)
      .toBe('1');
    expect((await pool.query('select count(*)::int as count from statkeeper_occurrence_revisions')).rows[0].count)
      .toBe(0);

    const adminCommand = {
      ...command('fb000000-0000-4000-8000-000000000012'),
      actorAccountId: ids.adminAccount
    };
    await service()(adminCommand);
    await expect(service()({
      ...adminCommand,
      commandId: 'fb000000-0000-4000-8000-000000000013',
      occurrenceId: 'fa000000-0000-4000-8000-000000000099',
      participantSelections: [{roleKey: 'shooter', playerId: ids.playerB}]
    })).rejects.toMatchObject({
      report: {violatedRule: 'statkeeper.ledger.stale_version'}
    });
    expect((await pool.query('select ledger_version from statkeeper_event_ledger_heads')).rows[0].ledger_version)
      .toBe('2');
    expect((await pool.query('select count(*)::int as count from statkeeper_occurrence_revisions')).rows[0].count)
      .toBe(1);
    expect((await pool.query(`select count(*)::int as count from command_receipts
      where command_type = 'statkeeper.occurrence_recorded'`)).rows[0].count).toBe(1);
  });

  it('returns a verified session to review when recording new material history', async () => {
    await pool.query(
      `update statkeeper_capture_sessions
          set lifecycle_status = 'verified', updated_at = '2026-08-30T20:03:30Z'
        where id = $1`,
      [ids.session]
    );
    const accepted = await service()({
      ...command('fb000000-0000-4000-8000-000000000021'),
      actorAccountId: ids.adminAccount
    });
    expect(accepted.lifecycleStatus).toBe('in_review');
    expect((await pool.query('select lifecycle_status from statkeeper_capture_sessions')).rows[0].lifecycle_status)
      .toBe('in_review');
  });
});

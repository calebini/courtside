import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresStatkeeperOccurrenceStore} from '@/courtside/adapters/postgres/statkeeper-occurrence-store';
import {PostgresStatkeeperOccurrenceCorrectionStore} from '@/courtside/adapters/postgres/statkeeper-occurrence-correction-store';
import {PostgresStatkeeperPreflightStore} from '@/courtside/adapters/postgres/statkeeper-preflight-store';
import {PostgresStatkeeperPossessionStore} from '@/courtside/adapters/postgres/statkeeper-possession-store';
import {PostgresStatkeeperReviewStore} from '@/courtside/adapters/postgres/statkeeper-review-store';
import {createStatkeeperReviewService, createStatkeeperProjectionPreviewService} from '@/courtside/services/review-statkeeper-session';
import type {StatkeeperCoverageDeclaration} from '@/courtside/core/statkeeper-coverage';
import {possessionBasisHash, type StatkeeperPossessionSequence} from '@/courtside/core/statkeeper-possession';
import {createStatkeeperPossessionService, type SetStatkeeperPossessionCommand} from '@/courtside/services/set-statkeeper-possession';
import {createStatkeeperProfileActivationService} from '@/courtside/services/activate-statkeeper-profile';
import {createStatkeeperOccurrenceRecordService} from '@/courtside/services/record-statkeeper-occurrence';
import {
  createStatkeeperOccurrenceCorrectionService, type CorrectStatkeeperOccurrenceCommand
} from '@/courtside/services/correct-statkeeper-occurrence';
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
  occurrence: 'fa000000-0000-4000-8000-000000000024',
  initialBasis: 'fa000000-0000-4000-8000-000000000025'
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

describeWithDatabase('PostgreSQL Statkeeper occurrence capture and possession control', () => {
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
    const possessionIds = [ids.initialPossession, ids.initialBasis];
    await createStatkeeperPossessionService(new PostgresStatkeeperPossessionStore(pool), {
      now: () => new Date('2026-08-30T20:03:00Z'), newId: () => possessionIds.shift()!
    })(possessionCommand({expectedLedgerVersion: 1, change: {kind: 'set_current', seasonTeamId: ids.seasonTeamA, mediaOffsetMs: 0}}));
  });

  function possessionCommand(overrides: Partial<SetStatkeeperPossessionCommand> = {}): SetStatkeeperPossessionCommand {
    return {
      type: 'set_statkeeper_possession', commandId: randomUUID(), actorAccountId: ids.statkeeperAccount,
      captureSessionId: ids.session, expectedLedgerVersion: 2,
      change: {kind: 'set_current', seasonTeamId: ids.seasonTeamB, mediaOffsetMs: 30_000}, ...overrides
    };
  }

  function possessionService() {
    return createStatkeeperPossessionService(new PostgresStatkeeperPossessionStore(pool), {
      now: () => new Date('2026-08-30T20:05:00Z')
    });
  }

  async function bases() {
    return (await pool.query<{
      id: string; previous_basis_id: string | null; ledger_version: string; operation: string;
      sequences: StatkeeperPossessionSequence[]; created_by_account_id: string; reason: string | null;
    }>('select * from statkeeper_possession_bases order by ledger_version')).rows;
  }

  async function state() {
    return (await pool.query(`select head.ledger_version, session.lifecycle_status, session.progress_version,
      (select count(*)::int from statkeeper_possession_bases) as basis_count,
      (select count(*)::int from command_receipts) as receipt_count,
      (select count(*)::int from statkeeper_occurrence_revisions) as occurrence_count
      from statkeeper_capture_sessions session join statkeeper_event_ledger_heads head
        on head.capture_session_id = session.id`)).rows[0];
  }

  function command(commandId: string, occurrenceId = ids.occurrence) {
    return {
      type: 'record_statkeeper_occurrence' as const,
      commandId,
      actorAccountId: ids.statkeeperAccount,
      captureSessionId: ids.session,
      expectedLedgerVersion: 2,
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

  function correctionService(dependencies: {now?: () => Date; newId?: () => string} = {}) {
    return createStatkeeperOccurrenceCorrectionService(
      new PostgresStatkeeperOccurrenceCorrectionStore(pool),
      {now: () => new Date('2026-08-30T20:05:00Z'), ...dependencies}
    );
  }

  function correctionCommand(
    operation: 'revise_statkeeper_occurrence' | 'void_statkeeper_occurrence',
    previousRevisionId: string,
    overrides: Partial<CorrectStatkeeperOccurrenceCommand> = {}
  ): CorrectStatkeeperOccurrenceCommand {
    const base = {
      type: operation, commandId: randomUUID(), actorAccountId: ids.statkeeperAccount,
      captureSessionId: ids.session, occurrenceId: ids.occurrence,
      expectedOccurrenceRevisionId: previousRevisionId, expectedLedgerVersion: 3,
      reason: 'Correction vidéo'
    } as const;
    return operation === 'revise_statkeeper_occurrence'
      ? {...base, type: operation, replacement: {
          actionKey: 'made_two', evidenceTimestampMs: 45_000,
          evidenceWindow: {startMs: 44_000, endMs: 46_000},
          period: {kind: 'regulation', ordinal: 1}, clock: {state: 'exact', remainingMs: 555_000},
          participantSelections: [{roleKey: 'shooter', playerId: ids.playerA}],
          operatorNote: 'Horodatage corrigé'
        }, ...overrides} as CorrectStatkeeperOccurrenceCommand
      : {...base, type: operation, ...overrides} as CorrectStatkeeperOccurrenceCommand;
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
      ledgerVersion: 3,
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
      expectedLedgerVersion: 3
    });
    expect(sameOccurrence).toEqual({...accepted, occurrenceReused: true});
    await expect(record({
      ...submitted,
      commandId: 'fb000000-0000-4000-8000-000000000005',
      expectedLedgerVersion: 3,
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
              (select count(*)::int from jsonb_array_elements(basis.sequences) s
                where s->>'endMediaOffsetMs' = '42000') as closed_count,
              (select s->>'possessingSeasonTeamId' from jsonb_array_elements(basis.sequences) s
                where s->>'endMediaOffsetMs' is null) as open_team_id,
              (select s->>'causingOccurrenceId' from jsonb_array_elements(basis.sequences) s
                where s->>'transitionKind' = 'automatic') as automatic_cause,
              (select count(*)::int from command_receipts
                where command_type = 'statkeeper.occurrence_recorded') as record_receipt_count
         from statkeeper_occurrence_revisions occurrence
         join statkeeper_event_ledger_heads head
           on head.capture_session_id = occurrence.capture_session_id
         join statkeeper_possession_bases basis
           on basis.capture_session_id = head.capture_session_id and basis.ledger_version = head.ledger_version`
    );
    expect(persisted.rows[0]).toMatchObject({
      ledger_version: '3',
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
      .toBe('2');
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
      .toBe('3');
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

  it('establishes initial possession, then manually switches with an immutable prior basis and receipt', async () => {
    const before = await bases();
    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({id: ids.initialBasis, previous_basis_id: null, ledger_version: '2', operation: 'manual_set'});
    expect(before[0].sequences).toMatchObject([{sequenceId: ids.initialPossession, endMediaOffsetMs: null, startMediaOffsetMs: 0}]);
    const submitted = possessionCommand({reason: '  Changement manuel  '});
    const set = possessionService();
    const accepted = await set(submitted);
    expect(accepted).toMatchObject({previousBasisId: ids.initialBasis, ledgerVersion: 3, reviewInvalidated: true,
      lifecycleStatus: 'capturing', openSequence: {possessingSeasonTeamId: ids.seasonTeamB, startMediaOffsetMs: 30_000, transitionKind: 'manual'}});
    const history = await bases();
    expect(history[0]).toEqual(before[0]);
    expect(history[1]).toMatchObject({previous_basis_id: ids.initialBasis, created_by_account_id: ids.statkeeperAccount, reason: 'Changement manuel'});
    expect(history[1].sequences[0]).toMatchObject({sequenceId: ids.initialPossession, endMediaOffsetMs: 30_000, endingReasonKey: 'manual_switch'});
    expect(accepted.basisHash).toBe(possessionBasisHash(history[1].sequences));
    const after = await state();
    await expect(set(submitted)).resolves.toEqual({...accepted, receiptReused: true});
    await expect(set({...submitted, reason: 'Different content'})).rejects.toMatchObject({report: {violatedRule: 'command.idempotency'}});
    expect(await state()).toEqual(after);
    expect(after).toMatchObject({occurrence_count: 0, progress_version: '0'});
  });

  it('lets capture consume manually switched possession through the same working basis', async () => {
    await possessionService()(possessionCommand());
    const record = createStatkeeperOccurrenceRecordService(new PostgresStatkeeperOccurrenceStore(pool), {
      now: () => new Date('2026-08-30T20:06:00Z')
    });
    const accepted = await record({...command(randomUUID()), expectedLedgerVersion: 3,
      participantSelections: [{roleKey: 'shooter', playerId: ids.playerB}]});
    expect(accepted).toMatchObject({ledgerVersion: 4, possessionTransition: {fromSeasonTeamId: ids.seasonTeamB, toSeasonTeamId: ids.seasonTeamA}});
    const history = await bases();
    expect(history.map((basis) => basis.operation)).toEqual(['manual_set', 'manual_set', 'automatic_switch']);
    expect(history[2].sequences).toHaveLength(3);
  });

  it('reverses an automatic switch explicitly without rewriting events, old bases, or original retries', async () => {
    const original = (await bases())[0];
    const submitted = command(randomUUID());
    const recorded = await service()(submitted);
    const prior = await bases();
    const eventsBefore = (await pool.query('select * from statkeeper_occurrence_revisions')).rows;
    const corrected = await possessionService()(possessionCommand({expectedLedgerVersion: 3,
      change: {kind: 'replace_basis', mediaOffsetMs: 42_000, sequences: original.sequences}, reason: 'Annuler le changement automatique'}));
    const after = await bases();
    expect(after.slice(0, 2)).toEqual(prior);
    expect(after[2]).toMatchObject({operation: 'manual_correction', previous_basis_id: prior[1].id});
    expect(corrected).toMatchObject({ledgerVersion: 4, openSequence: {sequenceId: ids.initialPossession, possessingSeasonTeamId: ids.seasonTeamA}});
    expect(corrected.basisHash).not.toBe(possessionBasisHash(prior[1].sequences));
    expect((await pool.query('select * from statkeeper_occurrence_revisions')).rows).toEqual(eventsBefore);
    await expect(service()(submitted)).resolves.toEqual({...recorded, receiptReused: true});
    await expect(service()({...submitted, commandId: randomUUID(), expectedLedgerVersion: 4}))
      .resolves.toEqual({...recorded, occurrenceReused: true});
    expect((await state()).ledger_version).toBe('4');
    expect(await bases()).toEqual(after);
  });

  it('accepts a historical interval correction even when current possession is unchanged', async () => {
    await service()(command(randomUUID()));
    const prior = (await bases())[1];
    const replacement = prior.sequences.map((sequence) => sequence.sequenceId === ids.initialPossession
      ? {...sequence, startMediaOffsetMs: 1_000} : sequence);
    const corrected = await possessionService()(possessionCommand({expectedLedgerVersion: 3,
      change: {kind: 'replace_basis', mediaOffsetMs: 1_000, sequences: replacement}}));
    expect(corrected.ledgerVersion).toBe(4);
    expect(corrected.openSequence).toEqual(prior.sequences[1]);
    expect(corrected.basisHash).not.toBe(possessionBasisHash(prior.sequences));
    expect((await bases())[1]).toEqual(prior);
  });

  it('can explicitly restore unknown possession without deleting the earlier history', async () => {
    const accepted = await possessionService()(possessionCommand({change: {kind: 'replace_basis', mediaOffsetMs: 0, sequences: []}}));
    expect(accepted.openSequence).toBeNull();
    expect(await bases()).toHaveLength(2);
    expect((await bases())[1].sequences).toEqual([]);
    const restored = await possessionService()(possessionCommand({expectedLedgerVersion: 3,
      change: {kind: 'set_current', seasonTeamId: ids.seasonTeamB, mediaOffsetMs: 10_000}}));
    expect(restored.ledgerVersion).toBe(4);
  });

  it('invalidates verified review without changing playback progress', async () => {
    await pool.query(`update statkeeper_capture_sessions set lifecycle_status = 'verified', updated_at = '2026-08-30T20:04:00Z'`);
    const before = await state();
    const accepted = await possessionService()(possessionCommand());
    expect(accepted).toMatchObject({lifecycleStatus: 'in_review', reviewInvalidated: true});
    expect(await state()).toMatchObject({lifecycle_status: 'in_review', ledger_version: '3', progress_version: before.progress_version});
  });

  it.each(['published', 'abandoned'])('rejects possession changes in terminal %s sessions', async (status) => {
    await pool.query(`update statkeeper_capture_sessions set lifecycle_status = $1, updated_at = '2026-08-30T20:04:00Z'`, [status]);
    const before = await state();
    await expect(possessionService()(possessionCommand())).rejects.toMatchObject({report: {violatedRule: 'statkeeper.session.editable_state'}});
    expect(await state()).toEqual(before);
  });

  it('rejects revoked authority while acknowledging prior acceptance on an identical retry', async () => {
    const submitted = possessionCommand();
    const accepted = await possessionService()(submitted);
    await pool.query(`update league_statkeeper_assignments set revoked_by_account_id = $1, revoked_at = '2026-08-30T20:06:00Z'
      where id = $2`, [ids.adminAccount, ids.statkeeperAssignment]);
    const before = await state();
    await expect(possessionService()(possessionCommand({expectedLedgerVersion: 3})))
      .rejects.toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
    await expect(possessionService()(submitted)).resolves.toEqual({...accepted, receiptReused: true});
    expect(await state()).toEqual(before);
  });

  it('rejects no-ops, stale versions, invalid teams and offsets without accepting a receipt', async () => {
    const before = await state();
    for (const [overrides, rule] of [
      [{change: {kind: 'set_current', seasonTeamId: ids.seasonTeamA, mediaOffsetMs: 1}}, 'statkeeper.possession.no_change'],
      [{expectedLedgerVersion: 1}, 'statkeeper.ledger.stale_version'],
      [{change: {kind: 'set_current', seasonTeamId: ids.teamA, mediaOffsetMs: 1}}, 'statkeeper.possession.team'],
      [{change: {kind: 'set_current', seasonTeamId: ids.seasonTeamB, mediaOffsetMs: -1}}, 'statkeeper.possession.offset'],
      [{change: {kind: 'replace_basis', mediaOffsetMs: 0, sequences: (await bases())[0].sequences}}, 'statkeeper.possession.no_change']
    ] as const) {
      await expect(possessionService()(possessionCommand(overrides))).rejects.toMatchObject({report: {violatedRule: rule, authoritativeStatePreserved: true}});
      expect(await state()).toEqual(before);
    }
  });

  it('serializes racing possession writes so only one advances the expected ledger', async () => {
    const outcomes = await Promise.allSettled([possessionService()(possessionCommand()), possessionService()(possessionCommand())]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.find((outcome) => outcome.status === 'rejected')).toMatchObject({reason: {report: {violatedRule: 'statkeeper.ledger.stale_version'}}});
    expect(await state()).toMatchObject({ledger_version: '3', basis_count: 2});
  });

  it('rolls back ledger and session state if appending the basis fails', async () => {
    const before = await state();
    const generated = [randomUUID(), ids.initialBasis]; // The basis primary key intentionally collides.
    const set = createStatkeeperPossessionService(new PostgresStatkeeperPossessionStore(pool), {
      now: () => new Date('2026-08-30T20:05:00Z'), newId: () => generated.shift()!
    });
    await expect(set(possessionCommand())).rejects.toMatchObject({code: '23505'});
    expect(await state()).toEqual(before);
  });

  it('enforces immutable basis history, freezes legacy rows, and denies browser table access', async () => {
    const before = await bases();
    await expect(pool.query(`update statkeeper_possession_bases set sequences = '[]'`)).rejects.toThrow();
    await expect(pool.query('delete from statkeeper_possession_bases')).rejects.toThrow();
    await expect(pool.query(`insert into statkeeper_possession_sequences
      (id, capture_session_id, working_revision_id, possessing_season_team_id, start_media_offset_ms,
       started_by_transition_kind, created_by_account_id, created_at)
      values ($1,$2,$3,$4,0,'manual',$5,now())`,
    [randomUUID(), ids.session, ids.workingRevision, ids.seasonTeamA, ids.adminAccount])).rejects.toThrow();
    const access = await pool.query(`select relrowsecurity as rls,
      has_table_privilege('anon', oid, 'SELECT,INSERT,UPDATE,DELETE') as anon_access,
      has_table_privilege('authenticated', oid, 'SELECT,INSERT,UPDATE,DELETE') as member_access
      from pg_class where relname = 'statkeeper_possession_bases'`);
    expect(access.rows[0]).toEqual({rls: true, anon_access: false, member_access: false});
    expect(await bases()).toEqual(before);
  });

  it('rejects malformed basis inserts even when a caller bypasses the service', async () => {
    const original = (await bases())[0].sequences[0];
    const invalid = [
      [original, {...original, sequenceId: randomUUID()}],
      [{...original, endMediaOffsetMs: 100}, {...original, sequenceId: randomUUID(), startMediaOffsetMs: 99}],
      [{...original, possessingSeasonTeamId: ids.teamA}],
      [{...original, transitionKind: 'automatic', causingOccurrenceId: ids.occurrence, causingOccurrenceRevisionId: randomUUID()}],
      [{...original, endMediaOffsetMs: 0.5}],
      [{...original, startMediaOffsetMs: null}]
    ];
    const before = await state();
    for (const sequences of invalid) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query(`update statkeeper_event_ledger_heads set ledger_version = ledger_version + 1, updated_at = '2026-08-30T20:05:00Z'`);
        await expect(client.query(`insert into statkeeper_possession_bases
          (id, capture_session_id, working_revision_id, ledger_version, previous_basis_id, sequences,
           operation, created_by_account_id, created_at, change_media_offset_ms)
          values ($1,$2,$3,3,$4,$5::jsonb,'manual_correction',$6,'2026-08-30T20:05:00Z',0)`,
        [randomUUID(), ids.session, ids.workingRevision, ids.initialBasis, JSON.stringify(sequences), ids.adminAccount])).rejects.toThrow();
      } finally { await client.query('rollback'); client.release(); }
    }
    expect(await state()).toEqual(before);
  });

  it('backfills a populated legacy timeline without fabricating prior versions or losing automatic causes', async () => {
    await service()(command(randomUUID()));
    const current = (await bases())[1];
    const migration = await readFile(new URL('../../supabase/migrations/20260903130000_statkeeper_possession_bases.sql', import.meta.url), 'utf8');
    const client = await pool.connect();
    try {
      // Reconstruct the previous schema only inside this rolled-back migration test.
      await client.query('begin');
      await client.query('drop trigger statkeeper_possession_sequences_archived on statkeeper_possession_sequences');
      for (const sequence of current.sequences) {
        await client.query(`insert into statkeeper_possession_sequences
          (id, capture_session_id, working_revision_id, possessing_season_team_id, start_media_offset_ms,
           end_media_offset_ms, ending_reason_key, started_by_transition_kind, causing_occurrence_id,
           causing_occurrence_revision_id, created_by_account_id, created_at)
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'2026-08-30T20:04:00Z')`,
        [sequence.sequenceId, ids.session, ids.workingRevision, sequence.possessingSeasonTeamId,
          sequence.startMediaOffsetMs, sequence.endMediaOffsetMs, sequence.endingReasonKey,
          sequence.transitionKind, sequence.causingOccurrenceId, sequence.causingOccurrenceRevisionId, ids.statkeeperAccount]);
      }
      await client.query('drop table statkeeper_possession_bases');
      await client.query('drop function enforce_statkeeper_possession_basis()');
      await client.query(migration);
      const migrated = (await client.query('select * from statkeeper_possession_bases')).rows;
      expect(migrated).toHaveLength(1);
      expect(migrated[0]).toMatchObject({operation: 'migration', ledger_version: '3', previous_basis_id: null, change_media_offset_ms: null,
        sequences: current.sequences});
      expect((await client.query('select count(*)::int as count from statkeeper_possession_sequences')).rows[0].count).toBe(2);
      expect((await client.query('select count(*)::int as count from statkeeper_occurrence_revisions')).rows[0].count).toBe(1);
    } finally { await client.query('rollback'); client.release(); }
    expect((await bases())[1]).toEqual(current);
  });

  it('revises through immutable lineage and deterministically replaces the latest automatic possession effect', async () => {
    const original = await service()(command(randomUUID()));
    const originalRows = (await pool.query('select * from statkeeper_occurrence_revisions order by revision_number')).rows;
    const priorBases = await bases();
    const submitted = correctionCommand('revise_statkeeper_occurrence', original.occurrenceRevisionId);
    const revise = correctionService();
    const accepted = await revise(submitted);
    expect(accepted).toMatchObject({receiptReused: false, operation: 'revise_statkeeper_occurrence',
      previousOccurrenceRevisionId: original.occurrenceRevisionId, revisionNumber: 2,
      disposition: 'active', ledgerVersion: 4, lifecycleStatus: 'capturing',
      possessionChanged: true, reviewInvalidated: true});
    expect(accepted.occurrenceRevisionId).not.toBe(original.occurrenceRevisionId);
    expect(accepted.eventIds).toHaveLength(1);
    const revisions = (await pool.query(`select revision_number, previous_occurrence_revision_id,
      disposition, verification_state, correction_reason, canonical_payload::jsonb as payload
      from statkeeper_occurrence_revisions order by revision_number`)).rows;
    expect(revisions).toHaveLength(2);
    expect((await pool.query('select * from statkeeper_occurrence_revisions where revision_number = 1')).rows[0])
      .toEqual(originalRows[0]);
    expect(revisions[1]).toMatchObject({revision_number: 2, previous_occurrence_revision_id: original.occurrenceRevisionId,
      disposition: 'active', verification_state: 'recorded', correction_reason: 'Correction vidéo'});
    expect(revisions[1].payload).toMatchObject({previous_occurrence_revision_id: original.occurrenceRevisionId,
      correction_reason: 'Correction vidéo', revision_number: 2, evidence_timestamp_ms: 45_000});
    const history = await bases();
    expect(history.slice(0, 2)).toEqual(priorBases);
    expect(history[2]).toMatchObject({operation: 'occurrence_correction', previous_basis_id: priorBases[1].id});
    expect(history[2].sequences).toHaveLength(2);
    expect(history[2].sequences[1]).toMatchObject({startMediaOffsetMs: 45_000,
      causingOccurrenceRevisionId: accepted.occurrenceRevisionId});
    expect(history[2].sequences.some((sequence) => sequence.causingOccurrenceRevisionId === original.occurrenceRevisionId)).toBe(false);
    const after = await state();
    await expect(revise(submitted)).resolves.toEqual({...accepted, receiptReused: true});
    await expect(revise({...submitted, reason: 'Autre raison'})).rejects.toMatchObject({report: {violatedRule: 'command.idempotency'}});
    await expect(service()({...command(randomUUID()), expectedLedgerVersion: 4}))
      .rejects.toMatchObject({report: {violatedRule: 'statkeeper.occurrence.identity'}});
    expect(await state()).toEqual(after);
    expect((await pool.query(`select count(*)::int as count from audit_records
      where action = 'statkeeper.occurrence_revised'`)).rows[0].count).toBe(1);
  });

  it('voids by appending a zero-event replacement revision and reverses an unconsumed automatic switch', async () => {
    const original = await service()(command(randomUUID()));
    const priorEvents = (await pool.query('select * from statkeeper_statistical_events')).rows;
    const priorBases = await bases();
    const submitted = correctionCommand('void_statkeeper_occurrence', original.occurrenceRevisionId, {reason: '  Mauvaise saisie  '});
    const accepted = await correctionService()(submitted);
    expect(accepted).toMatchObject({operation: 'void_statkeeper_occurrence', revisionNumber: 2,
      disposition: 'void', eventIds: [], ledgerVersion: 4, possessionChanged: true});
    expect((await pool.query('select * from statkeeper_statistical_events')).rows).toEqual(priorEvents);
    const revisions = (await pool.query(`select revision_number, disposition, correction_reason,
      canonical_payload::jsonb as payload from statkeeper_occurrence_revisions order by revision_number`)).rows;
    expect(revisions).toHaveLength(2);
    expect(revisions[1]).toMatchObject({revision_number: 2, disposition: 'void', correction_reason: 'Mauvaise saisie'});
    expect(revisions[1].payload).toMatchObject({events: [], disposition: 'void',
      previous_occurrence_revision_id: original.occurrenceRevisionId});
    await expect(pool.query(`insert into statkeeper_statistical_events
      (id, occurrence_revision_id, capture_session_id, emission_ordinal, event_key, outcome_key,
       season_team_id, content_hash)
      select $1, $2, capture_session_id, emission_ordinal, event_key, outcome_key, season_team_id, content_hash
        from statkeeper_statistical_events where occurrence_revision_id = $3`,
    [randomUUID(), accepted.occurrenceRevisionId, original.occurrenceRevisionId]))
      .rejects.toThrow(/Void occurrence revisions/);
    const history = await bases();
    expect(history.slice(0, 2)).toEqual(priorBases);
    expect(history[2].sequences).toEqual(priorBases[0].sequences);
    expect(await state()).toMatchObject({ledger_version: '4', occurrence_count: 2, progress_version: '0'});
  });

  it('requires explicit possession correction when later occurrence history depends on an automatic switch', async () => {
    const first = await service()(command(randomUUID()));
    const second = createStatkeeperOccurrenceRecordService(new PostgresStatkeeperOccurrenceStore(pool), {
      now: () => new Date('2026-08-30T20:05:00Z')
    });
    await second({...command(randomUUID(), 'fa000000-0000-4000-8000-000000000044'),
      expectedLedgerVersion: 3, actionKey: 'missed_two', evidenceTimestampMs: 43_000,
      participantSelections: [{roleKey: 'shooter', playerId: ids.playerB}]});
    const before = await state();
    await expect(correctionService()(correctionCommand('void_statkeeper_occurrence', first.occurrenceRevisionId,
      {expectedLedgerVersion: 4}))).rejects.toMatchObject({report: {
        violatedRule: 'statkeeper.possession.review_conflict', authoritativeStatePreserved: true,
        currentLedgerVersion: 4
      }});
    expect(await state()).toEqual(before);
  });

  it('does not introduce an automatic switch behind a later occurrence', async () => {
    const record = createStatkeeperOccurrenceRecordService(new PostgresStatkeeperOccurrenceStore(pool), {
      now: () => new Date('2026-08-30T20:04:00Z')
    });
    const first = await record({...command(randomUUID()), actionKey: 'missed_two',
      participantSelections: [{roleKey: 'shooter', playerId: ids.playerA}]});
    await record({...command(randomUUID(), 'fa000000-0000-4000-8000-000000000045'),
      expectedLedgerVersion: 3, actionKey: 'missed_two', evidenceTimestampMs: 44_000,
      evidenceWindow: null});
    await expect(correctionService()(correctionCommand('revise_statkeeper_occurrence', first.occurrenceRevisionId,
      {expectedLedgerVersion: 4}))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.possession.review_conflict'}});
  });

  it('voids without changing possession after an explicit manual correction has already taken ownership', async () => {
    const original = await service()(command(randomUUID()));
    const base = (await bases())[0];
    await possessionService()(possessionCommand({expectedLedgerVersion: 3,
      change: {kind: 'replace_basis', mediaOffsetMs: 42_000, sequences: base.sequences}}));
    const priorBases = await bases();
    const accepted = await correctionService()(correctionCommand('void_statkeeper_occurrence', original.occurrenceRevisionId,
      {expectedLedgerVersion: 4}));
    expect(accepted).toMatchObject({ledgerVersion: 5, disposition: 'void', possessionChanged: false, possessionBasisId: null});
    expect(await bases()).toEqual(priorBases);
  });

  it('reactivates a void occurrence only through a new complete active revision', async () => {
    const original = await service()(command(randomUUID()));
    const voided = await correctionService()(correctionCommand('void_statkeeper_occurrence', original.occurrenceRevisionId));
    await expect(correctionService()(correctionCommand('void_statkeeper_occurrence', voided.occurrenceRevisionId,
      {expectedLedgerVersion: 4}))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.occurrence.no_change'}});
    const revised = await correctionService()(correctionCommand('revise_statkeeper_occurrence', voided.occurrenceRevisionId,
      {expectedLedgerVersion: 4, replacement: {
        actionKey: 'made_two', evidenceTimestampMs: 45_000, evidenceWindow: null,
        period: {kind: 'regulation', ordinal: 1}, clock: {state: 'exact', remainingMs: 555_000},
        participantSelections: [{roleKey: 'shooter', playerId: ids.playerA}], operatorNote: null
      }}));
    expect(revised).toMatchObject({revisionNumber: 3, disposition: 'active', ledgerVersion: 5, possessionChanged: true});
    expect((await pool.query('select disposition from statkeeper_occurrence_revisions order by revision_number')).rows)
      .toEqual([{disposition: 'active'}, {disposition: 'void'}, {disposition: 'active'}]);
  });

  it('rejects alternate-path revision branches at the PostgreSQL boundary', async () => {
    const original = await service()(command(randomUUID()));
    await correctionService()(correctionCommand('void_statkeeper_occurrence', original.occurrenceRevisionId));
    await expect(pool.query(`insert into statkeeper_occurrence_revisions
      (occurrence_revision_id, capture_session_id, occurrence_id, revision_number,
       previous_occurrence_revision_id, correction_reason, game_id, profile_version_id, media_id,
       source, verification_state, disposition, canonical_payload, content_hash, recorded_by_account_id,
       accepted_ledger_version, capture_action_key, capture_input_hash, working_revision_id,
       accepted_lifecycle_status, created_at)
      select $1, capture_session_id, occurrence_id, 2, $2, 'branch', game_id, profile_version_id, media_id,
        source, verification_state, disposition, canonical_payload, content_hash, recorded_by_account_id,
        4, capture_action_key, capture_input_hash, working_revision_id, accepted_lifecycle_status,
        '2026-08-30T20:06:00Z'
      from statkeeper_occurrence_revisions where revision_number = 1`,
    [randomUUID(), original.occurrenceRevisionId])).rejects.toThrow(/latest immutable revision/);
    expect((await pool.query('select count(*)::int as count from statkeeper_occurrence_revisions')).rows[0].count).toBe(2);
  });

  it('returns verified corrections to review and rejects direct published or abandoned correction', async () => {
    const original = await service()(command(randomUUID()));
    await pool.query(`update statkeeper_capture_sessions set lifecycle_status = 'verified', updated_at = '2026-08-30T20:04:30Z'`);
    const accepted = await correctionService()(correctionCommand('void_statkeeper_occurrence', original.occurrenceRevisionId));
    expect(accepted.lifecycleStatus).toBe('in_review');
    for (const status of ['published', 'abandoned']) {
      await pool.query(`update statkeeper_capture_sessions set lifecycle_status = $1, updated_at = '2026-08-30T20:06:00Z'`, [status]);
      await expect(correctionService()(correctionCommand('revise_statkeeper_occurrence', accepted.occurrenceRevisionId,
        {expectedLedgerVersion: 4}))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.session.correction_state'}});
    }
  });

  it('rejects revoked authority, stale ledger/current revision, no-op revise and repeated void without mutation', async () => {
    const original = await service()(command(randomUUID()));
    const before = await state();
    await expect(correctionService()(correctionCommand('revise_statkeeper_occurrence', original.occurrenceRevisionId,
      {expectedLedgerVersion: 2}))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.ledger.stale_version'}});
    await expect(correctionService()(correctionCommand('revise_statkeeper_occurrence', randomUUID())))
      .rejects.toMatchObject({report: {violatedRule: 'statkeeper.occurrence.stale_revision'}});
    await expect(correctionService()(correctionCommand('revise_statkeeper_occurrence', original.occurrenceRevisionId,
      {replacement: {
        actionKey: 'made_two', evidenceTimestampMs: 42_000, evidenceWindow: {startMs: 41_000, endMs: 43_000},
        period: {kind: 'regulation', ordinal: 1}, clock: {state: 'exact', remainingMs: 558_000},
        participantSelections: [{roleKey: 'shooter', playerId: ids.playerA}], operatorNote: 'Panier près du cercle'
      }}))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.occurrence.no_change'}});
    expect(await state()).toEqual(before);
    const ordinary = correctionCommand('revise_statkeeper_occurrence', original.occurrenceRevisionId);
    const injected = {...ordinary, replacement: {
      ...('replacement' in ordinary ? ordinary.replacement : {}), model: 'deferred-model'
    }} as unknown as CorrectStatkeeperOccurrenceCommand;
    await expect(correctionService()(injected)).rejects.toMatchObject({report: {
      violatedRule: 'statkeeper.correction.replacement', authoritativeStatePreserved: true
    }});
    expect(await state()).toEqual(before);
    await pool.query(`update league_statkeeper_assignments set revoked_by_account_id = $1,
      revoked_at = '2026-08-30T20:05:00Z' where id = $2`, [ids.adminAccount, ids.statkeeperAssignment]);
    await expect(correctionService()(correctionCommand('void_statkeeper_occurrence', original.occurrenceRevisionId)))
      .rejects.toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
  });

  it('serializes concurrent corrections so only one extends the expected revision and ledger', async () => {
    const original = await service()(command(randomUUID()));
    const outcomes = await Promise.allSettled([
      correctionService()(correctionCommand('void_statkeeper_occurrence', original.occurrenceRevisionId)),
      correctionService()(correctionCommand('void_statkeeper_occurrence', original.occurrenceRevisionId))
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.find((outcome) => outcome.status === 'rejected')).toMatchObject({reason: {report: {violatedRule: 'statkeeper.ledger.stale_version'}}});
  });

  it('rolls back revision, possession, ledger, audit and receipt after a late audit failure', async () => {
    const recorded = await service()(command(randomUUID()));
    const before = await state();
    const generated = [randomUUID(), ids.audit];
    await expect(correctionService({newId: () => generated.shift()!})(
      correctionCommand('void_statkeeper_occurrence', recorded.occurrenceRevisionId)
    )).rejects.toMatchObject({code: '23505'});
    expect(await state()).toEqual(before);
    expect(await bases()).toHaveLength(2);
  });

  function reviewService(newId?: () => string) {
    return createStatkeeperReviewService(new PostgresStatkeeperReviewStore(pool), {
      now: () => new Date('2026-08-30T21:00:00Z'), ...(newId ? {newId} : {})
    });
  }
  function reviewCommand(expectedLedgerVersion: number) {
    return {type: 'submit_statkeeper_for_review' as const, commandId: randomUUID(), captureSessionId: ids.session,
      actorAccountId: ids.statkeeperAccount, expectedLedgerVersion};
  }
  const completeCoverage: readonly StatkeeperCoverageDeclaration[] = [{coverageGroupKey: 'scoring', status: 'complete', gaps: []}];
  function coverageCommand(expectedLedgerVersion: number, declarations = completeCoverage) {
    return {...reviewCommand(expectedLedgerVersion), type: 'replace_statkeeper_coverage' as const, declarations};
  }
  function preview() {
    return createStatkeeperProjectionPreviewService(new PostgresStatkeeperReviewStore(pool))({captureSessionId: ids.session, actorAccountId: ids.statkeeperAccount});
  }

  it('submits, declares coverage, and previews current totals and evidence without publishing any stats', async () => {
    const captured = await service()(command(randomUUID()));
    const submit = reviewCommand(captured.ledgerVersion);
    expect(await reviewService()(submit)).toMatchObject({ledgerVersion: 4, lifecycleStatus: 'in_review'});
    expect(await reviewService()(submit)).toMatchObject({receiptReused: true, ledgerVersion: 4});
    const coverage = coverageCommand(4);
    expect(await reviewService()(coverage)).toMatchObject({ledgerVersion: 5, coverageBasisId: expect.any(String)});
    const before = await state();
    const result = await preview();
    expect(result.coverageStale).toBe(false);
    expect(result.readyForVerification).toBe(true);
    expect(result.playerLines[0]!.values[0]).toMatchObject({recordedValue: 2, coverageStatus: 'partial',
      contributions: [{occurrenceId: ids.occurrence, occurrenceRevisionId: captured.occurrenceRevisionId, eventId: captured.eventIds[0]}]});
    expect(result.discrepancyAcceptanceRequired).toBe(true);
    expect(result.warnings.filter((w) => w.code === 'scoring_discrepancy')).toHaveLength(2);
    expect((await preview()).projectionHash).toBe(result.projectionHash);
    expect(await state()).toEqual(before);
    expect((await pool.query('select * from player_stat_lines')).rows).toHaveLength(0);
    expect((await pool.query('select distinct verification_state from statkeeper_occurrence_revisions')).rows).toEqual([{verification_state: 'recorded'}]);
    expect(await reviewService()(coverage)).toMatchObject({receiptReused: true, ledgerVersion: 5});
    await expect(reviewService()(coverageCommand(5))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.coverage.no_change'}});
    expect(await state()).toEqual(before);
  });

  it('invalidates coverage after correction and allows an identical declaration to reaffirm the new ledger', async () => {
    const captured = await service()(command(randomUUID()));
    await reviewService()(reviewCommand(3));
    await reviewService()(coverageCommand(4));
    const beforeHash = (await preview()).ledgerBasisHash;
    // Revising to a missed shot removes the earlier automatic possession switch.
    const revise = correctionCommand('revise_statkeeper_occurrence', captured.occurrenceRevisionId);
    await createStatkeeperOccurrenceCorrectionService(new PostgresStatkeeperOccurrenceCorrectionStore(pool), {
      now: () => new Date('2026-08-30T21:01:00Z')
    })({...revise, expectedLedgerVersion: 5});
    const stale = await preview();
    expect(stale.coverageStale).toBe(true);
    expect(stale.playerLines[0]!.values[0].recordedValue).toBeNull();
    expect(stale.ledgerBasisHash).not.toBe(beforeHash);
    await createStatkeeperReviewService(new PostgresStatkeeperReviewStore(pool), {now: () => new Date('2026-08-30T21:02:00Z')})(coverageCommand(6));
    expect((await preview()).coverageStale).toBe(false);
    expect((await pool.query('select reviewed_ledger_version from statkeeper_coverage_bases order by reviewed_ledger_version')).rows)
      .toEqual([{reviewed_ledger_version: '5'}, {reviewed_ledger_version: '7'}]);
  });

  it('rejects empty review, wrong state, incomplete coverage, and altered retries without writes', async () => {
    const before = await state();
    await expect(reviewService()(reviewCommand(2))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.review.active_occurrence_required'}});
    await expect(reviewService()(coverageCommand(2))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.review.state'}});
    expect(await state()).toEqual(before);
    await service()(command(randomUUID()));
    const submit = reviewCommand(3);
    await reviewService()(submit);
    const accepted = await state();
    await expect(reviewService()({...submit, expectedLedgerVersion: 4})).rejects.toMatchObject({report: {violatedRule: 'command.idempotency'}});
    await expect(reviewService()(coverageCommand(4, []))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.coverage.invalid'}});
    expect(await state()).toEqual(accepted);
  });

  it('serializes competing coverage replacements so the losing writer cannot create a receipt', async () => {
    await service()(command(randomUUID()));
    await reviewService()(reviewCommand(3));
    const results = await Promise.allSettled([reviewService()(coverageCommand(4)), reviewService()(coverageCommand(4))]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({report: {violatedRule: 'statkeeper.ledger.stale_version', currentLedgerVersion: 5}});
    expect((await pool.query('select count(*)::int as count from statkeeper_coverage_bases')).rows[0].count).toBe(1);
  });

  it('checks current authority for review and preview while acknowledging identical prior acceptance', async () => {
    await service()(command(randomUUID()));
    const submit = reviewCommand(3);
    await reviewService()(submit);
    await pool.query("update league_statkeeper_assignments set revoked_at = '2026-08-30T21:01:00Z', revoked_by_account_id = $2 where id = $1", [ids.statkeeperAssignment, ids.adminAccount]);
    const before = await state();
    expect(await reviewService()(submit)).toMatchObject({receiptReused: true, ledgerVersion: 4});
    for (const work of [() => reviewService()(coverageCommand(4)), () => preview()]) {
      await expect(work()).rejects.toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
      try { await work(); } catch (error) { expect((error as {report: object}).report).not.toHaveProperty('currentLedgerVersion'); }
    }
    expect(await state()).toEqual(before);
    expect(await createStatkeeperProjectionPreviewService(new PostgresStatkeeperReviewStore(pool))({captureSessionId: ids.session, actorAccountId: ids.adminAccount}))
      .toMatchObject({ledgerVersion: 4});
  });

  it('rolls back coverage, lifecycle, ledger, audit, and receipt on late persistence failure', async () => {
    await service()(command(randomUUID()));
    const beforeSubmit = await state();
    await expect(reviewService(() => ids.audit)(reviewCommand(3))).rejects.toMatchObject({code: '23505'});
    expect(await state()).toEqual(beforeSubmit);
    await reviewService()(reviewCommand(3));
    const beforeCoverage = await state();
    const generated = [randomUUID(), ids.audit];
    await expect(reviewService(() => generated.shift()!)(coverageCommand(4))).rejects.toMatchObject({code: '23505'});
    expect(await state()).toEqual(beforeCoverage);
    expect((await pool.query('select * from statkeeper_coverage_bases')).rows).toHaveLength(0);
    expect((await pool.query('select review_status from statkeeper_capture_session_coverage')).rows).toEqual([{review_status: 'not_reviewed'}]);
  });

  it('stores canonical gap history immutably, replays normalized retries, and denies browser database access', async () => {
    await service()(command(randomUUID()));
    await reviewService()(reviewCommand(3));
    const gap = {reasonKey: 'other' as const, explanation: '  Se\u0301quence floue  ', period: null, clockRange: null, mediaRange: {startMs: 100, endMs: 200}};
    const coverage = coverageCommand(4, [{coverageGroupKey: 'scoring', status: 'partial', gaps: [gap]}]);
    const accepted = await reviewService()(coverage);
    expect(await reviewService()({...coverage, declarations: [{coverageGroupKey: 'scoring', status: 'partial', gaps: [{...gap, explanation: 'Séquence floue'}]}]}))
      .toMatchObject({receiptReused: true, coverageHash: accepted.coverageHash});
    await expect(pool.query('delete from statkeeper_coverage_bases where id = $1', [accepted.coverageBasisId])).rejects.toThrow();
    await expect(pool.query('update statkeeper_coverage_bases set declarations = declarations where id = $1', [accepted.coverageBasisId])).rejects.toThrow();
    const permissions = await pool.query("select has_table_privilege('anon', 'statkeeper_coverage_bases', 'select') as anon, has_table_privilege('authenticated', 'statkeeper_coverage_bases', 'insert') as authenticated");
    expect(permissions.rows[0]).toEqual({anon: false, authenticated: false});
  });

  it('reads one consistent preview snapshot across concurrent committed ledger changes', async () => {
    await service()(command(randomUUID()));
    const store = new PostgresStatkeeperReviewStore(pool);
    await store.transaction(async (transaction) => {
      const before = await transaction.loadSession(ids.session);
      await reviewService()(reviewCommand(3));
      const after = await transaction.loadSession(ids.session);
      expect(after).toEqual(before);
      expect(after!.basis.context.ledgerVersion).toBe(3);
    }, {readOnly: true});
    expect((await preview()).ledgerVersion).toBe(4);
  });

  it('rejects review of a session whose only occurrence is void and rejects terminal-state review writes', async () => {
    const recorded = await service()(command(randomUUID()));
    await correctionService()(correctionCommand('void_statkeeper_occurrence', recorded.occurrenceRevisionId));
    await expect(reviewService()(reviewCommand(4))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.review.active_occurrence_required'}});
    for (const status of ['published', 'abandoned', 'verified']) {
      await pool.query('update statkeeper_capture_sessions set lifecycle_status = $2 where id = $1', [ids.session, status]);
      const before = await state();
      await expect(reviewService()(coverageCommand(4))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.review.state'}});
      await expect(reviewService()(reviewCommand(4))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.review.state'}});
      expect(await state()).toEqual(before);
    }
  });
});

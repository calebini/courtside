import type {Pool, PoolClient} from 'pg';

import {hasStatkeeperAccess} from '@/courtside/core/statkeeper-authority';
import {normalizePossessionSequences} from '@/courtside/core/statkeeper-possession';
import {normalizeStatkeeperProfileDefinition} from '@/courtside/core/statkeeper-profile';
import type {
  CorrectStatkeeperOccurrenceResult, StatkeeperOccurrenceCorrectionStore,
  StatkeeperOccurrenceCorrectionTransaction, StoredCorrectionSession
} from '@/courtside/services/correct-statkeeper-occurrence';
import {loadStatkeeperAuthority} from './statkeeper-authority';
import {appendPossessionBasis, loadPossessionBasis} from './statkeeper-possession-basis';

class PostgresStatkeeperOccurrenceCorrectionTransaction implements StatkeeperOccurrenceCorrectionTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }
  async findReceipt(commandId: string) {
    const result = await this.client.query<{command_type: string; payload_hash: string; result: CorrectStatkeeperOccurrenceResult}>(
      'select command_type, payload_hash, result from command_receipts where command_id = $1', [commandId]
    );
    const row = result.rows[0];
    return row ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result} : null;
  }

  async lockSession(captureSessionId: string): Promise<StoredCorrectionSession | null> {
    const result = await this.client.query<{
      league_id: string; lifecycle_status: StoredCorrectionSession['lifecycleStatus']; working_revision_id: string;
      game_id: string; profile_version_id: string; profile_content_hash: string; media_id: string;
      home_season_team_id: string; away_season_team_id: string; regulation_period_count: string;
      regulation_period_duration_ms: string; overtime_period_duration_ms: string;
      event_definitions: StoredCorrectionSession['ledger']['eventDefinitions']; ledger_version: string;
      profile_definition: unknown; stored_profile_hash: string;
    }>(`select session.league_id, session.lifecycle_status, session.working_revision_id,
              head.game_id, head.profile_version_id, head.profile_content_hash, head.media_id,
              session.home_season_team_id, session.away_season_team_id,
              head.regulation_period_count, head.regulation_period_duration_ms, head.overtime_period_duration_ms,
              head.event_definitions, head.ledger_version, profile.definition as profile_definition,
              profile.content_hash as stored_profile_hash
         from statkeeper_capture_sessions session
         join statkeeper_event_ledger_heads head on head.capture_session_id = session.id
         join league_statkeeping_profile_versions profile on profile.id = session.profile_version_id
        where session.id = $1 for update of session, head`, [captureSessionId]);
    const row = result.rows[0];
    if (!row) return null;
    const profile = normalizeStatkeeperProfileDefinition(row.profile_definition);
    if (profile.contentHash !== row.stored_profile_hash || profile.contentHash !== row.profile_content_hash) {
      throw new Error(`Capture Session ${captureSessionId} failed its Profile Version hash`);
    }
    const participants = (await this.client.query<{
      roster_membership_id: string; player_id: string; season_team_id: string;
      participation_status: 'appeared' | 'did_not_play';
    }>(`select roster_membership_id, player_id, season_team_id, participation_status
          from statkeeper_event_ledger_participants where capture_session_id = $1 order by roster_membership_id`,
    [captureSessionId])).rows.map((participant) => ({rosterMembershipId: participant.roster_membership_id,
      playerId: participant.player_id, seasonTeamId: participant.season_team_id,
      participationStatus: participant.participation_status}));
    const basisResult = await this.client.query<{
      id: string; previous_basis_id: string | null; ledger_version: string;
      operation: StoredCorrectionSession['possessionBasisOperation']; sequences: unknown;
    }>(`select id, previous_basis_id, ledger_version, operation, sequences
          from statkeeper_possession_bases where capture_session_id = $1 and working_revision_id = $2
         order by ledger_version desc limit 1`, [captureSessionId, row.working_revision_id]);
    const basis = basisResult.rows[0];
    const loaded = await loadPossessionBasis(this.client, captureSessionId, row.working_revision_id);
    const open = loaded.sequences.find((sequence) => sequence.endMediaOffsetMs === null);
    return {
      captureSessionId, leagueId: row.league_id, lifecycleStatus: row.lifecycle_status,
      workingRevisionId: row.working_revision_id,
      ledger: {captureSessionId, gameId: row.game_id, profileVersionId: row.profile_version_id,
        profileContentHash: row.profile_content_hash, mediaId: row.media_id,
        homeSeasonTeamId: row.home_season_team_id, awaySeasonTeamId: row.away_season_team_id,
        regulationPeriodCount: Number(row.regulation_period_count),
        regulationPeriodDurationMs: Number(row.regulation_period_duration_ms),
        overtimePeriodDurationMs: Number(row.overtime_period_duration_ms), eventDefinitions: row.event_definitions,
        participants, ledgerVersion: Number(row.ledger_version)},
      profile, participants,
      openPossession: open ? {sequenceId: open.sequenceId, possessingSeasonTeamId: open.possessingSeasonTeamId,
        startMediaOffsetMs: open.startMediaOffsetMs} : null,
      possessionBasisId: basis?.id ?? null, possessionBasisLedgerVersion: basis ? Number(basis.ledger_version) : null,
      possessionBasisOperation: basis?.operation ?? null, previousPossessionBasisId: basis?.previous_basis_id ?? null,
      possessionSequences: loaded.sequences
    };
  }

  async hasCaptureAuthority(leagueId: string, actorAccountId: string) {
    return hasStatkeeperAccess(await loadStatkeeperAuthority(this.client, leagueId, actorAccountId));
  }

  async findCurrentOccurrence(captureSessionId: string, occurrenceId: string) {
    const result = await this.client.query<{
      occurrence_revision_id: string; revision_number: number; previous_occurrence_revision_id: string | null;
      content_hash: string; canonical_payload: string; disposition: 'active' | 'void';
      capture_action_key: string; capture_input_hash: string; accepted_ledger_version: string;
      initial_accepted_ledger_version: string; event_ids: string[];
    }>(`select occurrence.occurrence_revision_id, occurrence.revision_number,
              occurrence.previous_occurrence_revision_id, occurrence.content_hash,
              occurrence.canonical_payload, occurrence.disposition, occurrence.capture_action_key,
              occurrence.capture_input_hash, occurrence.accepted_ledger_version,
              (select min(initial.accepted_ledger_version)
                 from statkeeper_occurrence_revisions initial
                where initial.capture_session_id = occurrence.capture_session_id
                  and initial.occurrence_id = occurrence.occurrence_id) as initial_accepted_ledger_version,
              coalesce(array_agg(event.id order by event.emission_ordinal)
                filter (where event.id is not null), array[]::uuid[]) as event_ids
         from statkeeper_occurrence_revisions occurrence
         left join statkeeper_statistical_events event on event.occurrence_revision_id = occurrence.occurrence_revision_id
        where occurrence.capture_session_id = $1 and occurrence.occurrence_id = $2
          and occurrence.revision_number = (select max(latest.revision_number)
            from statkeeper_occurrence_revisions latest
            where latest.capture_session_id = occurrence.capture_session_id and latest.occurrence_id = occurrence.occurrence_id)
        group by occurrence.occurrence_revision_id`, [captureSessionId, occurrenceId]);
    const row = result.rows[0];
    return row ? {record: {occurrenceId, occurrenceRevisionId: row.occurrence_revision_id,
      revisionNumber: row.revision_number, previousOccurrenceRevisionId: row.previous_occurrence_revision_id,
      disposition: row.disposition, contentHash: row.content_hash, canonicalPayload: row.canonical_payload, events: []},
      captureActionKey: row.capture_action_key, captureInputHash: row.capture_input_hash,
      acceptedLedgerVersion: Number(row.accepted_ledger_version),
      initialAcceptedLedgerVersion: Number(row.initial_accepted_ledger_version)} : null;
  }

  async findPossessionBasis(basisId: string) {
    const result = await this.client.query<{id: string; sequences: unknown}>(
      'select id, sequences from statkeeper_possession_bases where id = $1', [basisId]
    );
    const row = result.rows[0];
    return row ? {basisId: row.id, sequences: normalizePossessionSequences(row.sequences)} : null;
  }

  async hasLaterCurrentOccurrence(captureSessionId: string, occurrenceId: string, acceptedLedgerVersion: number) {
    const result = await this.client.query<{exists: boolean}>(`select exists (
      select 1 from (
        select distinct on (candidate.occurrence_id) candidate.occurrence_id, candidate.accepted_ledger_version
          from statkeeper_occurrence_revisions candidate
         where candidate.capture_session_id = $1
         order by candidate.occurrence_id, candidate.revision_number desc
      ) current_occurrence
      where current_occurrence.occurrence_id <> $2 and current_occurrence.accepted_ledger_version > $3
    ) as exists`, [captureSessionId, occurrenceId, acceptedLedgerVersion]);
    return result.rows[0]!.exists;
  }

  async persist(input: Parameters<StatkeeperOccurrenceCorrectionTransaction['persist']>[0]) {
    const {session, command, record, result, acceptedAt} = input;
    const head = await this.client.query(`update statkeeper_event_ledger_heads
      set ledger_version = ledger_version + 1, updated_at = $3
      where capture_session_id = $1 and ledger_version = $2`,
    [session.captureSessionId, session.ledger.ledgerVersion, acceptedAt]);
    if (head.rowCount !== 1) throw new Error('Statkeeper correction ledger changed concurrently');
    await this.client.query(`insert into statkeeper_occurrence_revisions
      (occurrence_revision_id, capture_session_id, occurrence_id, revision_number,
       previous_occurrence_revision_id, correction_reason, game_id, profile_version_id, media_id,
       source, verification_state, disposition, canonical_payload, content_hash, recorded_by_account_id,
       accepted_ledger_version, capture_action_key, capture_input_hash, working_revision_id,
       accepted_lifecycle_status, created_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'human','recorded',$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [record.occurrenceRevisionId, session.captureSessionId, record.occurrenceId, record.revisionNumber,
      record.previousOccurrenceRevisionId, command.reason ?? null, session.ledger.gameId,
      session.ledger.profileVersionId, session.ledger.mediaId, record.disposition, record.canonicalPayload,
      record.contentHash, command.actorAccountId, result.ledgerVersion, input.captureActionKey,
      input.captureInputHash, session.workingRevisionId, result.lifecycleStatus, acceptedAt]);
    for (const event of record.events) {
      await this.client.query(`insert into statkeeper_statistical_events
        (id, occurrence_revision_id, capture_session_id, emission_ordinal, event_key, outcome_key, season_team_id, content_hash)
        values ($1,$2,$3,$4,$5,$6,$7,$8)`, [event.id, record.occurrenceRevisionId, session.captureSessionId,
        event.emissionOrdinal, event.eventKey, event.outcomeKey, event.seasonTeamId, event.contentHash]);
      for (const assignment of event.assignments) await this.client.query(`insert into statkeeper_statistical_event_assignments
        (event_id, capture_session_id, role_key, roster_membership_id, player_id, season_team_id)
        values ($1,$2,$3,$4,$5,$6)`, [event.id, session.captureSessionId, assignment.roleKey,
        assignment.rosterMembershipId, assignment.playerId, assignment.seasonTeamId]);
      for (const contribution of event.contributions) await this.client.query(`insert into statkeeper_statistical_event_contributions
        (event_id, stat_key, increment) values ($1,$2,$3)`, [event.id, contribution.statKey, contribution.increment]);
    }
    if (input.possession) await appendPossessionBasis(this.client, {id: input.possession.basisId,
      captureSessionId: session.captureSessionId, workingRevisionId: session.workingRevisionId,
      ledgerVersion: result.ledgerVersion, previousBasisId: input.possession.previousBasisId,
      sequences: input.possession.sequences, operation: 'occurrence_correction',
      mediaOffsetMs: input.possession.mediaOffsetMs, actorAccountId: command.actorAccountId,
      reason: command.reason ?? null, createdAt: acceptedAt});
    const updated = await this.client.query(`update statkeeper_capture_sessions set lifecycle_status = $3, updated_at = $4
      where id = $1 and lifecycle_status = $2`,
    [session.captureSessionId, session.lifecycleStatus, result.lifecycleStatus, acceptedAt]);
    if (updated.rowCount !== 1) throw new Error('Statkeeper correction session changed concurrently');
    await this.client.query(`insert into audit_records
      (id, league_id, actor_account_id, action, entity_type, entity_id, previous_value, new_value, reason, created_at)
      values ($1,$2,$3,$4,'GameOccurrence',$5,$6::jsonb,$7::jsonb,$8,$9)`,
    [input.auditId, session.leagueId, command.actorAccountId,
      command.type === 'revise_statkeeper_occurrence' ? 'statkeeper.occurrence_revised' : 'statkeeper.occurrence_voided',
      record.occurrenceId, JSON.stringify({
        occurrenceRevisionId: input.previous.record.occurrenceRevisionId,
        revisionNumber: input.previous.record.revisionNumber,
        disposition: input.previous.record.disposition,
        contentHash: input.previous.record.contentHash
      }),
      JSON.stringify({occurrenceRevisionId: record.occurrenceRevisionId, revisionNumber: record.revisionNumber,
        disposition: record.disposition, contentHash: record.contentHash}), command.reason ?? null, acceptedAt]);
    await this.client.query(`insert into command_receipts (command_id, command_type, payload_hash, result, created_at)
      values ($1,$2,$3,$4::jsonb,$5)`, [command.commandId,
      command.type === 'revise_statkeeper_occurrence' ? 'statkeeper.occurrence_revised' : 'statkeeper.occurrence_voided',
      input.payloadHash, JSON.stringify(result), acceptedAt]);
  }
}

export class PostgresStatkeeperOccurrenceCorrectionStore implements StatkeeperOccurrenceCorrectionStore {
  constructor(private readonly pool: Pool) {}
  async transaction<T>(work: (transaction: StatkeeperOccurrenceCorrectionTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresStatkeeperOccurrenceCorrectionTransaction(client));
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally { client.release(); }
  }
}

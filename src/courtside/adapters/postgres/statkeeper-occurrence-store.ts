import type {Pool, PoolClient} from 'pg';

import {normalizeStatkeeperProfileDefinition} from '@/courtside/core/statkeeper-profile';
import {hasStatkeeperAccess} from '@/courtside/core/statkeeper-authority';
import {loadStatkeeperAuthority} from './statkeeper-authority';
import type {
  RecordStatkeeperOccurrenceResult,
  StatkeeperOccurrenceStore,
  StatkeeperOccurrenceTransaction,
  StoredCaptureReceipt,
  StoredStatkeeperCaptureSession
} from '@/courtside/services/record-statkeeper-occurrence';

class PostgresStatkeeperOccurrenceTransaction implements StatkeeperOccurrenceTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredCaptureReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: RecordStatkeeperOccurrenceResult;
    }>(
      'select command_type, payload_hash, result from command_receipts where command_id = $1',
      [commandId]
    );
    const row = result.rows[0];
    return row
      ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result}
      : null;
  }

  async findCaptureSessionForUpdate(
    captureSessionId: string
  ): Promise<StoredStatkeeperCaptureSession | null> {
    const result = await this.client.query<{
      capture_session_id: string;
      league_id: string;
      lifecycle_status: StoredStatkeeperCaptureSession['lifecycleStatus'];
      working_revision_id: string;
      game_id: string;
      profile_version_id: string;
      profile_content_hash: string;
      media_id: string;
      home_season_team_id: string;
      away_season_team_id: string;
      regulation_period_count: string;
      regulation_period_duration_ms: string;
      overtime_period_duration_ms: string;
      event_definitions: StoredStatkeeperCaptureSession['ledger']['eventDefinitions'];
      ledger_version: string;
      profile_definition: unknown;
      stored_profile_hash: string;
    }>(
      `select session.id as capture_session_id,
              session.league_id,
              session.lifecycle_status,
              session.working_revision_id,
              head.game_id,
              head.profile_version_id,
              head.profile_content_hash,
              head.media_id,
              session.home_season_team_id,
              session.away_season_team_id,
              head.regulation_period_count,
              head.regulation_period_duration_ms,
              head.overtime_period_duration_ms,
              head.event_definitions,
              head.ledger_version,
              profile.definition as profile_definition,
              profile.content_hash as stored_profile_hash
         from statkeeper_capture_sessions session
         join statkeeper_event_ledger_heads head on head.capture_session_id = session.id
         join league_statkeeping_profile_versions profile on profile.id = session.profile_version_id
        where session.id = $1
        for update of session, head`,
      [captureSessionId]
    );
    const row = result.rows[0];
    if (!row) return null;
    const profile = normalizeStatkeeperProfileDefinition(row.profile_definition);
    if (
      profile.contentHash !== row.stored_profile_hash
      || profile.contentHash !== row.profile_content_hash
    ) {
      throw new Error(`Capture Session ${captureSessionId} failed its Profile Version hash`);
    }
    const participants = await this.client.query<{
      roster_membership_id: string;
      player_id: string;
      season_team_id: string;
      participation_status: 'appeared' | 'did_not_play';
    }>(
      `select roster_membership_id, player_id, season_team_id, participation_status
         from statkeeper_event_ledger_participants
        where capture_session_id = $1
        order by roster_membership_id`,
      [captureSessionId]
    );
    const openPossession = await this.client.query<{
      id: string;
      possessing_season_team_id: string;
      start_media_offset_ms: string;
    }>(
      `select id, possessing_season_team_id, start_media_offset_ms
         from statkeeper_possession_sequences
        where capture_session_id = $1
          and end_media_offset_ms is null`,
      [captureSessionId]
    );
    const possession = openPossession.rows[0];
    return {
      captureSessionId: row.capture_session_id,
      leagueId: row.league_id,
      lifecycleStatus: row.lifecycle_status,
      workingRevisionId: row.working_revision_id,
      ledger: {
        captureSessionId: row.capture_session_id,
        gameId: row.game_id,
        profileVersionId: row.profile_version_id,
        profileContentHash: row.profile_content_hash,
        mediaId: row.media_id,
        homeSeasonTeamId: row.home_season_team_id,
        awaySeasonTeamId: row.away_season_team_id,
        regulationPeriodCount: Number(row.regulation_period_count),
        regulationPeriodDurationMs: Number(row.regulation_period_duration_ms),
        overtimePeriodDurationMs: Number(row.overtime_period_duration_ms),
        eventDefinitions: row.event_definitions,
        participants: participants.rows.map((participant) => ({
          rosterMembershipId: participant.roster_membership_id,
          playerId: participant.player_id,
          seasonTeamId: participant.season_team_id,
          participationStatus: participant.participation_status
        })),
        ledgerVersion: Number(row.ledger_version)
      },
      profile,
      participants: participants.rows.map((participant) => ({
        rosterMembershipId: participant.roster_membership_id,
        playerId: participant.player_id,
        seasonTeamId: participant.season_team_id,
        participationStatus: participant.participation_status
      })),
      openPossession: possession
        ? {
            sequenceId: possession.id,
            possessingSeasonTeamId: possession.possessing_season_team_id,
            startMediaOffsetMs: Number(possession.start_media_offset_ms)
          }
        : null
    };
  }

  async hasActiveCaptureAuthority(leagueId: string, actorAccountId: string) {
    return hasStatkeeperAccess(await loadStatkeeperAuthority(this.client, leagueId, actorAccountId));
  }

  async findOccurrence(captureSessionId: string, occurrenceId: string) {
    const result = await this.client.query<{
      occurrence_id: string;
      occurrence_revision_id: string;
      content_hash: string;
      accepted_ledger_version: string;
      accepted_lifecycle_status: 'capturing' | 'in_review';
      capture_action_key: string;
      capture_input_hash: string;
      event_ids: string[];
      automatic_possession_sequence_id: string | null;
      automatic_possessing_season_team_id: string | null;
      automatic_start_media_offset_ms: string | null;
    }>(
      `select occurrence.occurrence_id,
              occurrence.occurrence_revision_id,
              occurrence.content_hash,
              occurrence.accepted_ledger_version,
              occurrence.accepted_lifecycle_status,
              occurrence.capture_action_key,
              occurrence.capture_input_hash,
              coalesce(
                array_agg(event.id order by event.emission_ordinal)
                  filter (where event.id is not null),
                array[]::uuid[]
              ) as event_ids,
              (
                select possession.id
                  from statkeeper_possession_sequences possession
                 where possession.capture_session_id = occurrence.capture_session_id
                   and possession.causing_occurrence_revision_id = occurrence.occurrence_revision_id
                   and possession.started_by_transition_kind = 'automatic'
                 limit 1
              ) as automatic_possession_sequence_id,
              (
                select possession.possessing_season_team_id
                  from statkeeper_possession_sequences possession
                 where possession.capture_session_id = occurrence.capture_session_id
                   and possession.causing_occurrence_revision_id = occurrence.occurrence_revision_id
                   and possession.started_by_transition_kind = 'automatic'
                 limit 1
              ) as automatic_possessing_season_team_id,
              (
                select possession.start_media_offset_ms
                  from statkeeper_possession_sequences possession
                 where possession.capture_session_id = occurrence.capture_session_id
                   and possession.causing_occurrence_revision_id = occurrence.occurrence_revision_id
                   and possession.started_by_transition_kind = 'automatic'
                 limit 1
              ) as automatic_start_media_offset_ms
         from statkeeper_occurrence_revisions occurrence
         left join statkeeper_statistical_events event
           on event.occurrence_revision_id = occurrence.occurrence_revision_id
        where occurrence.capture_session_id = $1
          and occurrence.occurrence_id = $2
          and occurrence.revision_number = 1
          and occurrence.capture_action_key is not null
        group by occurrence.occurrence_id,
                 occurrence.occurrence_revision_id,
                 occurrence.content_hash,
                 occurrence.accepted_ledger_version,
                 occurrence.accepted_lifecycle_status,
                 occurrence.capture_action_key,
                 occurrence.capture_input_hash,
                 occurrence.capture_session_id`,
      [captureSessionId, occurrenceId]
    );
    const row = result.rows[0];
    return row
      ? {
          occurrenceId: row.occurrence_id,
          occurrenceRevisionId: row.occurrence_revision_id,
          contentHash: row.content_hash,
          eventIds: row.event_ids,
          acceptedLedgerVersion: Number(row.accepted_ledger_version),
          acceptedLifecycleStatus: row.accepted_lifecycle_status,
          captureActionKey: row.capture_action_key,
          captureInputHash: row.capture_input_hash,
          automaticPossessionSequenceId: row.automatic_possession_sequence_id,
          automaticPossessingSeasonTeamId: row.automatic_possessing_season_team_id,
          automaticStartMediaOffsetMs: row.automatic_start_media_offset_ms === null
            ? null
            : Number(row.automatic_start_media_offset_ms)
        }
      : null;
  }

  async advanceLedgerVersion(captureSessionId: string, expectedVersion: number, updatedAt: Date) {
    const result = await this.client.query<{ledger_version: string}>(
      `update statkeeper_event_ledger_heads
          set ledger_version = ledger_version + 1,
              updated_at = $3
        where capture_session_id = $1
          and ledger_version = $2
      returning ledger_version`,
      [captureSessionId, expectedVersion, updatedAt]
    );
    const row = result.rows[0];
    if (!row) throw new Error(`Statkeeper ledger ${captureSessionId} changed concurrently`);
    return Number(row.ledger_version);
  }

  async appendOccurrence(input: Parameters<StatkeeperOccurrenceTransaction['appendOccurrence']>[0]) {
    await this.client.query(
      `insert into statkeeper_occurrence_revisions
        (occurrence_revision_id, capture_session_id, occurrence_id, revision_number,
         game_id, profile_version_id, media_id, source, verification_state, disposition,
         canonical_payload, content_hash, recorded_by_account_id, accepted_ledger_version,
         capture_action_key, capture_input_hash, working_revision_id,
         accepted_lifecycle_status, created_at)
       values ($1, $2, $3, 1, $4, $5, $6, 'human', 'recorded', 'active',
               $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        input.record.occurrenceRevisionId,
        input.context.captureSessionId,
        input.record.occurrenceId,
        input.context.gameId,
        input.context.profileVersionId,
        input.context.mediaId,
        input.record.canonicalPayload,
        input.record.contentHash,
        input.actorAccountId,
        input.acceptedLedgerVersion,
        input.captureActionKey,
        input.captureInputHash,
        input.workingRevisionId,
        input.acceptedLifecycleStatus,
        input.createdAt
      ]
    );
    for (const event of input.record.events) {
      await this.client.query(
        `insert into statkeeper_statistical_events
          (id, occurrence_revision_id, capture_session_id, emission_ordinal,
           event_key, outcome_key, season_team_id, content_hash)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          event.id,
          input.record.occurrenceRevisionId,
          input.context.captureSessionId,
          event.emissionOrdinal,
          event.eventKey,
          event.outcomeKey,
          event.seasonTeamId,
          event.contentHash
        ]
      );
      for (const assignment of event.assignments) {
        await this.client.query(
          `insert into statkeeper_statistical_event_assignments
            (event_id, capture_session_id, role_key, roster_membership_id,
             player_id, season_team_id)
           values ($1, $2, $3, $4, $5, $6)`,
          [
            event.id,
            input.context.captureSessionId,
            assignment.roleKey,
            assignment.rosterMembershipId,
            assignment.playerId,
            assignment.seasonTeamId
          ]
        );
      }
      for (const contribution of event.contributions) {
        await this.client.query(
          `insert into statkeeper_statistical_event_contributions
            (event_id, stat_key, increment)
           values ($1, $2, $3)`,
          [event.id, contribution.statKey, contribution.increment]
        );
      }
    }
  }

  async applyAutomaticPossessionSwitch(
    input: Parameters<StatkeeperOccurrenceTransaction['applyAutomaticPossessionSwitch']>[0]
  ) {
    const closed = await this.client.query(
      `update statkeeper_possession_sequences
          set end_media_offset_ms = $3,
              ending_reason_key = 'automatic_switch'
        where id = $1
          and capture_session_id = $2
          and possessing_season_team_id = $4
          and end_media_offset_ms is null`,
      [
        input.closingSequenceId,
        input.captureSessionId,
        input.atMediaOffsetMs,
        input.fromSeasonTeamId
      ]
    );
    if (closed.rowCount !== 1) {
      throw new Error(`Open Possession Sequence ${input.closingSequenceId} changed concurrently`);
    }
    await this.client.query(
      `insert into statkeeper_possession_sequences
        (id, capture_session_id, working_revision_id, possessing_season_team_id,
         start_media_offset_ms, started_by_transition_kind, causing_occurrence_id,
         causing_occurrence_revision_id, created_by_account_id, created_at)
       values ($1, $2, $3, $4, $5, 'automatic', $6, $7, $8, $9)`,
      [
        input.newSequenceId,
        input.captureSessionId,
        input.workingRevisionId,
        input.toSeasonTeamId,
        input.atMediaOffsetMs,
        input.occurrenceId,
        input.occurrenceRevisionId,
        input.actorAccountId,
        input.createdAt
      ]
    );
  }

  async updateSessionAfterRecording(
    input: Parameters<StatkeeperOccurrenceTransaction['updateSessionAfterRecording']>[0]
  ) {
    const result = await this.client.query<{lifecycle_status: 'capturing' | 'in_review'}>(
      `update statkeeper_capture_sessions
          set lifecycle_status = case
                when lifecycle_status = 'verified' then 'in_review'
                else lifecycle_status
              end,
              updated_at = $3
        where id = $1
          and lifecycle_status = $2
          and lifecycle_status in ('capturing', 'in_review', 'verified')
      returning lifecycle_status`,
      [input.captureSessionId, input.previousLifecycleStatus, input.updatedAt]
    );
    const row = result.rows[0];
    if (!row) throw new Error(`Capture Session ${input.captureSessionId} changed concurrently`);
    return row.lifecycle_status;
  }

  async saveCommandReceipt(input: Parameters<StatkeeperOccurrenceTransaction['saveCommandReceipt']>[0]) {
    await this.client.query(
      `insert into command_receipts
        (command_id, command_type, payload_hash, result, created_at)
       values ($1, 'statkeeper.occurrence_recorded', $2, $3::jsonb, $4)`,
      [input.commandId, input.payloadHash, JSON.stringify(input.result), input.createdAt]
    );
  }
}

export class PostgresStatkeeperOccurrenceStore implements StatkeeperOccurrenceStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: StatkeeperOccurrenceTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresStatkeeperOccurrenceTransaction(client));
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }
}

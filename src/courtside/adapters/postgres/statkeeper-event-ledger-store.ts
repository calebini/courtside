import type {Pool, PoolClient} from 'pg';

import type {GameStatus} from '@/courtside/core/game';
import type {
  RecordStatkeeperLedgerOccurrenceResult,
  StatkeeperEventLedgerStore,
  StatkeeperEventLedgerTransaction,
  StoredStatkeeperLedgerHead,
  StoredStatkeeperLedgerReceipt,
  StoredStatkeeperOccurrence
} from '@/courtside/services/record-statkeeper-event';
import type {StatkeeperLedgerParticipant} from '@/courtside/core/statkeeper-event-ledger';

class PostgresStatkeeperEventLedgerTransaction implements StatkeeperEventLedgerTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredStatkeeperLedgerReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: RecordStatkeeperLedgerOccurrenceResult;
    }>(
      'select command_type, payload_hash, result from command_receipts where command_id = $1',
      [commandId]
    );
    const row = result.rows[0];
    return row
      ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result}
      : null;
  }

  async findLedgerHeadForUpdate(
    captureSessionId: string
  ): Promise<StoredStatkeeperLedgerHead | null> {
    const result = await this.client.query<{
      capture_session_id: string;
      game_id: string;
      game_status: GameStatus;
      competition_eligibility_at: Date | null;
      profile_version_id: string;
      profile_content_hash: string;
      media_id: string;
      home_season_team_id: string;
      away_season_team_id: string;
      regulation_period_count: string;
      regulation_period_duration_ms: string;
      overtime_period_duration_ms: string;
      event_definitions: StoredStatkeeperLedgerHead['eventDefinitions'];
      ledger_version: string;
    }>(
      `select h.capture_session_id,
              h.game_id,
              g.status as game_status,
              g.competition_eligibility_at,
              h.profile_version_id,
              h.profile_content_hash,
              h.media_id,
              g.home_season_team_id,
              g.away_season_team_id,
              h.regulation_period_count,
              h.regulation_period_duration_ms,
              h.overtime_period_duration_ms,
              h.event_definitions,
              h.ledger_version
         from statkeeper_event_ledger_heads h
         join games g on g.id = h.game_id
        where h.capture_session_id = $1
        for update of h`,
      [captureSessionId]
    );
    const row = result.rows[0];
    return row
      ? {
          captureSessionId: row.capture_session_id,
          gameId: row.game_id,
          gameStatus: row.game_status,
          competitionEligibilityAt: row.competition_eligibility_at,
          profileVersionId: row.profile_version_id,
          profileContentHash: row.profile_content_hash,
          mediaId: row.media_id,
          homeSeasonTeamId: row.home_season_team_id,
          awaySeasonTeamId: row.away_season_team_id,
          regulationPeriodCount: Number(row.regulation_period_count),
          regulationPeriodDurationMs: Number(row.regulation_period_duration_ms),
          overtimePeriodDurationMs: Number(row.overtime_period_duration_ms),
          eventDefinitions: row.event_definitions,
          ledgerVersion: Number(row.ledger_version)
        }
      : null;
  }

  async hasUserAccount(accountId: string) {
    const result = await this.client.query(
      'select 1 from user_accounts where id = $1 limit 1',
      [accountId]
    );
    return result.rowCount === 1;
  }

  async listParticipants(captureSessionId: string): Promise<StatkeeperLedgerParticipant[]> {
    const result = await this.client.query<{
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
    return result.rows.map((row) => ({
      rosterMembershipId: row.roster_membership_id,
      playerId: row.player_id,
      seasonTeamId: row.season_team_id,
      participationStatus: row.participation_status
    }));
  }

  async findOccurrence(
    captureSessionId: string,
    occurrenceId: string
  ): Promise<StoredStatkeeperOccurrence | null> {
    const result = await this.client.query<{
      occurrence_id: string;
      occurrence_revision_id: string;
      content_hash: string;
      accepted_ledger_version: string;
      event_ids: string[];
    }>(
      `select occurrence.occurrence_id,
              occurrence.occurrence_revision_id,
              occurrence.content_hash,
              occurrence.accepted_ledger_version,
              coalesce(
                array_agg(event.id order by event.emission_ordinal)
                  filter (where event.id is not null),
                array[]::uuid[]
              ) as event_ids
         from statkeeper_occurrence_revisions occurrence
         left join statkeeper_statistical_events event
           on event.occurrence_revision_id = occurrence.occurrence_revision_id
        where occurrence.capture_session_id = $1
          and occurrence.occurrence_id = $2
          and occurrence.revision_number = 1
        group by occurrence.occurrence_id,
                 occurrence.occurrence_revision_id,
                 occurrence.content_hash,
                 occurrence.accepted_ledger_version`,
      [captureSessionId, occurrenceId]
    );
    const row = result.rows[0];
    return row
      ? {
          occurrenceId: row.occurrence_id,
          occurrenceRevisionId: row.occurrence_revision_id,
          contentHash: row.content_hash,
          eventIds: row.event_ids,
          acceptedLedgerVersion: Number(row.accepted_ledger_version)
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

  async appendOccurrence(
    input: Parameters<StatkeeperEventLedgerTransaction['appendOccurrence']>[0]
  ) {
    await this.client.query(
      `insert into statkeeper_occurrence_revisions
        (occurrence_revision_id, capture_session_id, occurrence_id, revision_number,
         game_id, profile_version_id, media_id, source, verification_state, disposition,
         canonical_payload, content_hash, recorded_by_account_id, accepted_ledger_version,
         created_at)
       values ($1, $2, $3, 1, $4, $5, $6, 'human', 'recorded', 'active',
               $7, $8, $9, $10, $11)`,
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

  async saveCommandReceipt(
    input: Parameters<StatkeeperEventLedgerTransaction['saveCommandReceipt']>[0]
  ) {
    await this.client.query(
      `insert into command_receipts
        (command_id, command_type, payload_hash, result, created_at)
       values ($1, $2, $3, $4::jsonb, $5)`,
      [
        input.commandId,
        input.commandType,
        input.payloadHash,
        JSON.stringify(input.result),
        input.createdAt
      ]
    );
  }
}

export class PostgresStatkeeperEventLedgerStore implements StatkeeperEventLedgerStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: StatkeeperEventLedgerTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresStatkeeperEventLedgerTransaction(client));
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

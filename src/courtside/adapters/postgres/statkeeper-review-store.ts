import type {Pool, PoolClient} from 'pg';

import {hasStatkeeperAccess} from '@/courtside/core/statkeeper-authority';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';
import {normalizeStatkeeperCoverage, statkeeperCoverageValue, type StatkeeperCoverageDeclaration} from '@/courtside/core/statkeeper-coverage';
import {normalizePossessionSequences} from '@/courtside/core/statkeeper-possession';
import {normalizeStatkeeperProfileDefinition} from '@/courtside/core/statkeeper-profile';
import type {StatkeeperReviewResult, StatkeeperReviewSession, StatkeeperReviewStore, StatkeeperReviewTransaction} from '@/courtside/services/review-statkeeper-session';
import {loadStatkeeperAuthority} from './statkeeper-authority';

class PostgresStatkeeperReviewTransaction implements StatkeeperReviewTransaction {
  constructor(private readonly client: PoolClient, private readonly readOnly: boolean) {}
  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }
  async findReceipt(commandId: string) {
    const row = (await this.client.query<{command_type: string; payload_hash: string; result: StatkeeperReviewResult}>(
      'select command_type, payload_hash, result from command_receipts where command_id = $1', [commandId])).rows[0];
    return row ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result} : null;
  }
  async hasAuthority(leagueId: string, accountId: string) {
    return hasStatkeeperAccess(await loadStatkeeperAuthority(this.client, leagueId, accountId));
  }
  async loadSession(captureSessionId: string): Promise<StatkeeperReviewSession | null> {
    const row = (await this.client.query<{
      league_id: string; season_id: string; lifecycle_status: StatkeeperReviewSession['lifecycleStatus']; working_revision_id: string;
      game_id: string; profile_version_id: string; profile_content_hash: string; media_id: string;
      home_season_team_id: string; away_season_team_id: string; ledger_version: string;
      profile_definition: unknown; stored_profile_hash: string; provider: string; provider_asset_id: string;
      home_score: number; away_score: number;
    }>(`select session.league_id, session.season_id, session.lifecycle_status, session.working_revision_id,
       head.game_id, head.profile_version_id, head.profile_content_hash, head.media_id, head.ledger_version,
       session.home_season_team_id, session.away_season_team_id,
       profile.definition as profile_definition, profile.content_hash as stored_profile_hash,
       media.provider, media.provider_asset_id, game.home_score, game.away_score
       from statkeeper_capture_sessions session
       join statkeeper_event_ledger_heads head on head.capture_session_id = session.id
       join league_statkeeping_profile_versions profile on profile.id = session.profile_version_id
       join game_media media on media.id = session.media_id
       join games game on game.id = session.game_id
       where session.id = $1 ${this.readOnly ? '' : 'for update of session, head'}`, [captureSessionId])).rows[0];
    if (!row) return null;
    const profile = normalizeStatkeeperProfileDefinition(row.profile_definition);
    if (profile.contentHash !== row.stored_profile_hash || profile.contentHash !== row.profile_content_hash) {
      throw new Error('Capture Session Profile hash mismatch');
    }
    const participants = (await this.client.query<{
      roster_membership_id: string; player_id: string; season_team_id: string; participation_status: 'appeared' | 'did_not_play';
    }>(`select roster_membership_id, player_id, season_team_id, participation_status
      from statkeeper_event_ledger_participants where capture_session_id = $1`, [captureSessionId])).rows.map((p) => ({
      rosterMembershipId: p.roster_membership_id, playerId: p.player_id, seasonTeamId: p.season_team_id, participationStatus: p.participation_status}));
    const occurrences = (await this.client.query<{
      occurrence_id: string; occurrence_revision_id: string; revision_number: number; disposition: 'active' | 'void';
      verification_state: 'recorded' | 'verified'; canonical_payload: string; content_hash: string;
    }>(`select distinct on (occurrence_id) occurrence_id, occurrence_revision_id, revision_number,
       disposition, verification_state, canonical_payload, content_hash
       from statkeeper_occurrence_revisions where capture_session_id = $1
       order by occurrence_id, revision_number desc`, [captureSessionId])).rows.map((o) => ({
      occurrenceId: o.occurrence_id, occurrenceRevisionId: o.occurrence_revision_id, revisionNumber: o.revision_number,
      disposition: o.disposition, verificationState: o.verification_state, canonicalPayload: o.canonical_payload, contentHash: o.content_hash}));
    const possession = (await this.client.query<{
      id: string; previous_basis_id: string | null; ledger_version: string; operation: string; sequences: unknown;
    }>(`select id, previous_basis_id, ledger_version, operation, sequences from statkeeper_possession_bases
       where capture_session_id = $1 and working_revision_id = $2 order by ledger_version desc limit 1`,
    [captureSessionId, row.working_revision_id])).rows[0];
    const coverage = (await this.client.query<{
      reviewed_ledger_version: string; declarations: StatkeeperCoverageDeclaration[]; content_hash: string;
    }>(`select reviewed_ledger_version, declarations, content_hash from statkeeper_coverage_bases
       where capture_session_id = $1 and working_revision_id = $2 order by reviewed_ledger_version desc limit 1`,
    [captureSessionId, row.working_revision_id])).rows[0];
    const declarations = normalizeStatkeeperCoverage(coverage?.declarations ?? profile.coverageGroupKeys.map((coverageGroupKey) => ({
      coverageGroupKey, status: 'not_reviewed', gaps: []})), profile);
    if (coverage && statkeeperCanonicalHash(statkeeperCoverageValue(declarations)) !== coverage.content_hash) {
      throw new Error('Capture Session coverage hash mismatch');
    }
    return {leagueId: row.league_id, lifecycleStatus: row.lifecycle_status, basis: {
      context: {captureSessionId, gameId: row.game_id, profileVersionId: row.profile_version_id,
        profileContentHash: row.profile_content_hash, mediaId: row.media_id, homeSeasonTeamId: row.home_season_team_id,
        awaySeasonTeamId: row.away_season_team_id, ledgerVersion: Number(row.ledger_version), participants,
        regulationPeriodCount: profile.definition.regulationPeriodCount, regulationPeriodDurationMs: profile.definition.regulationPeriodDurationMs,
        overtimePeriodDurationMs: profile.definition.overtimePeriodDurationMs, eventDefinitions: profile.eventDefinitions},
      workingRevisionId: row.working_revision_id, seasonId: row.season_id, profile,
      media: {provider: row.provider, providerAssetId: row.provider_asset_id}, scores: {home: row.home_score, away: row.away_score}, occurrences,
      possession: {basisId: possession?.id ?? null, ledgerVersion: possession ? Number(possession.ledger_version) : null,
        previousBasisId: possession?.previous_basis_id ?? null, operation: possession?.operation ?? null,
        sequences: normalizePossessionSequences(possession?.sequences ?? [])},
      coverage: {reviewedLedgerVersion: coverage ? Number(coverage.reviewed_ledger_version) : null, declarations}
    }};
  }
  async persist(input: Parameters<StatkeeperReviewTransaction['persist']>[0]) {
    const {session, command, result, acceptedAt, declarations} = input;
    const changed = await this.client.query(`update statkeeper_event_ledger_heads set ledger_version = ledger_version + 1, updated_at = $3
      where capture_session_id = $1 and ledger_version = $2`, [command.captureSessionId, command.expectedLedgerVersion, acceptedAt]);
    if (changed.rowCount !== 1) throw new Error('Review ledger changed concurrently');
    const updated = await this.client.query(`update statkeeper_capture_sessions set lifecycle_status = 'in_review', updated_at = $3
      where id = $1 and lifecycle_status = $2`, [command.captureSessionId, session.lifecycleStatus, acceptedAt]);
    if (updated.rowCount !== 1) throw new Error('Review session changed concurrently');
    if (declarations) {
      await this.client.query(`insert into statkeeper_coverage_bases
        (id, capture_session_id, working_revision_id, reviewed_ledger_version, declarations, content_hash, reviewed_by_account_id, created_at)
        values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)`, [result.coverageBasisId, command.captureSessionId, session.basis.workingRevisionId,
        result.ledgerVersion, JSON.stringify(declarations), result.coverageHash, command.actorAccountId, acceptedAt]);
      for (const declaration of declarations) await this.client.query(`update statkeeper_capture_session_coverage set review_status = $3
        where capture_session_id = $1 and coverage_group_key = $2`, [command.captureSessionId, declaration.coverageGroupKey, declaration.status]);
    }
    await this.client.query(`insert into audit_records
      (id, league_id, actor_account_id, action, entity_type, entity_id, previous_value, new_value, reason, created_at)
      values ($1,$2,$3,$4,'CaptureSession',$5,$6::jsonb,$7::jsonb,null,$8)`, [input.auditId, session.leagueId,
      command.actorAccountId, command.type, command.captureSessionId,
      JSON.stringify({lifecycleStatus: session.lifecycleStatus, ledgerVersion: command.expectedLedgerVersion,
        coverageReviewedLedgerVersion: session.basis.coverage.reviewedLedgerVersion}), JSON.stringify(result), acceptedAt]);
    await this.client.query(`insert into command_receipts (command_id, command_type, payload_hash, result, created_at)
      values ($1,$2,$3,$4::jsonb,$5)`, [command.commandId, command.type, input.payloadHash, JSON.stringify(result), acceptedAt]);
  }
}

export class PostgresStatkeeperReviewStore implements StatkeeperReviewStore {
  constructor(private readonly pool: Pool) {}
  async transaction<T>(work: (transaction: StatkeeperReviewTransaction) => Promise<T>, options: {readonly readOnly: boolean}): Promise<T> {
    const client = await this.pool.connect();
    try {
      // Snapshot all read dependencies, including authoritative scores, without creating a write or receipt.
      await client.query(options.readOnly ? 'begin isolation level repeatable read read only' : 'begin');
      const result = await work(new PostgresStatkeeperReviewTransaction(client, options.readOnly));
      await client.query('commit');
      return result;
    } catch (error) { await client.query('rollback'); throw error; }
    finally { client.release(); }
  }
}

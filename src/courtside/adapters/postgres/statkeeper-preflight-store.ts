import type {Pool, PoolClient} from 'pg';

import {normalizeStatkeeperProfileDefinition} from '@/courtside/core/statkeeper-profile';
import type {
  ActivateStatkeeperProfileResult,
  StatkeeperProfileStore,
  StatkeeperProfileTransaction,
  StoredStatkeeperProfileReceipt
} from '@/courtside/services/activate-statkeeper-profile';
import type {
  StartStatkeeperSessionResult,
  StatkeeperSessionStore,
  StatkeeperSessionTransaction,
  StoredActiveStatkeeperPreflightProfile,
  StoredStatkeeperSessionReceipt
} from '@/courtside/services/start-statkeeper-session';

class PostgresStatkeeperPreflightTransaction
implements StatkeeperProfileTransaction, StatkeeperSessionTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(
    commandId: string
  ): Promise<StoredStatkeeperProfileReceipt & StoredStatkeeperSessionReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: ActivateStatkeeperProfileResult & StartStatkeeperSessionResult;
    }>(
      'select command_type, payload_hash, result from command_receipts where command_id = $1',
      [commandId]
    );
    const row = result.rows[0];
    return row
      ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result}
      : null;
  }

  async lockLeague(leagueId: string) {
    const result = await this.client.query(
      'select 1 from leagues where id = $1 for update',
      [leagueId]
    );
    return result.rowCount === 1;
  }

  async hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string) {
    const result = await this.client.query(
      `select 1
         from league_admin_assignments
        where league_id = $1
          and user_account_id = $2
          and revoked_at is null
        limit 1`,
      [leagueId, actorAccountId]
    );
    return result.rowCount === 1;
  }

  async findActiveProfile(leagueId: string) {
    const result = await this.client.query<{
      id: string;
      league_id: string;
      version_number: number;
      content_hash: string;
      definition: unknown;
    }>(
      `select profile.id,
              profile.league_id,
              profile.version_number,
              profile.content_hash,
              profile.definition
         from leagues league
         join league_statkeeping_profile_versions profile
           on profile.id = league.active_statkeeping_profile_version_id
        where league.id = $1`,
      [leagueId]
    );
    const row = result.rows[0];
    if (!row) return null;
    const profile = normalizeStatkeeperProfileDefinition(row.definition);
    if (profile.contentHash !== row.content_hash) {
      throw new Error(`Statkeeper Profile Version ${row.id} failed its canonical content hash`);
    }
    return {
      id: row.id,
      leagueId: row.league_id,
      versionNumber: row.version_number,
      contentHash: row.content_hash,
      profile
    } as StoredActiveStatkeeperPreflightProfile & {
      readonly contentHash: string;
    };
  }

  async nextProfileVersionNumber(leagueId: string) {
    const result = await this.client.query<{next_version: number}>(
      `select coalesce(max(version_number), 0)::int + 1 as next_version
         from league_statkeeping_profile_versions
        where league_id = $1`,
      [leagueId]
    );
    return result.rows[0]!.next_version;
  }

  async listPriorProfiles(leagueId: string) {
    const result = await this.client.query<{definition: unknown}>(
      `select definition
         from league_statkeeping_profile_versions
        where league_id = $1
        order by version_number`,
      [leagueId]
    );
    return result.rows.map((row) => normalizeStatkeeperProfileDefinition(row.definition));
  }

  async insertProfileVersion(input: Parameters<StatkeeperProfileTransaction['insertProfileVersion']>[0]) {
    await this.client.query(
      `insert into league_statkeeping_profile_versions
        (id, league_id, version_number, definition, event_definitions, coverage_group_keys,
         content_hash, regulation_period_count, regulation_period_duration_ms,
         overtime_period_duration_ms, created_by_account_id, created_at)
       values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12)`,
      [
        input.id,
        input.leagueId,
        input.versionNumber,
        JSON.stringify(input.profile.definition),
        JSON.stringify(input.profile.eventDefinitions),
        JSON.stringify(input.profile.coverageGroupKeys),
        input.profile.contentHash,
        input.profile.definition.regulationPeriodCount,
        input.profile.definition.regulationPeriodDurationMs,
        input.profile.definition.overtimePeriodDurationMs,
        input.createdByAccountId,
        input.createdAt
      ]
    );
  }

  async setActiveProfile(leagueId: string, profileVersionId: string) {
    const result = await this.client.query(
      'update leagues set active_statkeeping_profile_version_id = $2 where id = $1',
      [leagueId, profileVersionId]
    );
    if (result.rowCount !== 1) throw new Error(`League ${leagueId} changed during profile activation`);
  }

  async appendAuditRecord(input: Parameters<StatkeeperProfileTransaction['appendAuditRecord']>[0]) {
    await this.client.query(
      `insert into audit_records
        (id, league_id, actor_account_id, action, entity_type, entity_id,
         previous_value, new_value, reason, created_at)
       values ($1, $2, $3, 'statkeeper.profile_activated', 'StatkeepingProfileVersion', $4,
               $5::jsonb, $6::jsonb, null, $7)`,
      [
        input.id,
        input.leagueId,
        input.actorAccountId,
        input.entityId,
        JSON.stringify(input.previousValue),
        JSON.stringify(input.newValue),
        input.createdAt
      ]
    );
  }

  async findGameForUpdate(gameId: string) {
    const result = await this.client.query<{
      id: string;
      league_id: string;
      season_id: string;
      home_season_team_id: string;
      away_season_team_id: string;
      status: Parameters<StatkeeperSessionTransaction['listEligibleParticipants']>[0]['status'];
      competition_eligibility_at: Date | null;
    }>(
      `select game.id,
              season.league_id,
              game.season_id,
              game.home_season_team_id,
              game.away_season_team_id,
              game.status,
              game.competition_eligibility_at
         from games game
         join seasons season on season.id = game.season_id
        where game.id = $1
        for update of game`,
      [gameId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          leagueId: row.league_id,
          seasonId: row.season_id,
          homeSeasonTeamId: row.home_season_team_id,
          awaySeasonTeamId: row.away_season_team_id,
          status: row.status,
          competitionEligibilityAt: row.competition_eligibility_at
        }
      : null;
  }

  async hasUserAccount(accountId: string) {
    const result = await this.client.query('select 1 from user_accounts where id = $1 limit 1', [accountId]);
    return result.rowCount === 1;
  }

  async findCaptureSessionIdByGame(gameId: string) {
    const result = await this.client.query<{id: string}>(
      'select id from statkeeper_capture_sessions where game_id = $1',
      [gameId]
    );
    return result.rows[0]?.id ?? null;
  }

  async listEligibleParticipants(
    game: Parameters<StatkeeperSessionTransaction['listEligibleParticipants']>[0]
  ) {
    const result = await this.client.query<{
      roster_membership_id: string;
      player_id: string;
      season_id: string;
      season_team_id: string;
    }>(
      `select membership.id as roster_membership_id,
              membership.player_id,
              membership.season_id,
              membership.season_team_id
         from roster_memberships membership
        where membership.season_id = $1
          and membership.season_team_id in ($2, $3)
          and membership.effective_from <= $4
          and (membership.effective_until is null or membership.effective_until > $4)
        order by membership.id`,
      [
        game.seasonId,
        game.homeSeasonTeamId,
        game.awaySeasonTeamId,
        game.competitionEligibilityAt
      ]
    );
    return result.rows.map((row) => ({
      rosterMembershipId: row.roster_membership_id,
      playerId: row.player_id,
      seasonId: row.season_id,
      seasonTeamId: row.season_team_id
    }));
  }

  async findGameMedia(
    leagueId: string,
    media: Parameters<StatkeeperSessionTransaction['findGameMedia']>[1]
  ) {
    const result = await this.client.query<{id: string; game_id: string}>(
      `select id, game_id
         from game_media
        where league_id = $1
          and provider = $2
          and provider_asset_id = $3`,
      [leagueId, media.provider, media.providerAssetId]
    );
    const row = result.rows[0];
    return row ? {id: row.id, gameId: row.game_id} : null;
  }

  async insertGameMedia(input: Parameters<StatkeeperSessionTransaction['insertGameMedia']>[0]) {
    await this.client.query(
      `insert into game_media
        (id, league_id, game_id, provider, provider_asset_id, original_reference,
         created_by_account_id, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.id,
        input.game.leagueId,
        input.game.id,
        input.media.provider,
        input.media.providerAssetId,
        input.media.originalReference,
        input.createdByAccountId,
        input.createdAt
      ]
    );
  }

  async createCaptureSession(input: Parameters<StatkeeperSessionTransaction['createCaptureSession']>[0]) {
    const definition = input.profile.profile.definition;
    await this.client.query(
      `insert into statkeeper_capture_sessions
        (id, game_id, league_id, season_id, home_season_team_id, away_season_team_id,
         profile_version_id, media_id, lifecycle_status, working_revision_id,
         progress_version, playback_offset_ms, active_period_kind, active_period_ordinal,
         active_clock_state, active_clock_remaining_ms, active_clock_reason,
         selected_season_team_id, created_by_account_id, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 'capturing', $9,
               0, 0, 'regulation', 1, 'exact', $10, null, null, $11, $12, $12)`,
      [
        input.id,
        input.game.id,
        input.game.leagueId,
        input.game.seasonId,
        input.game.homeSeasonTeamId,
        input.game.awaySeasonTeamId,
        input.profile.id,
        input.mediaId,
        input.workingRevisionId,
        definition.regulationPeriodDurationMs,
        input.createdByAccountId,
        input.createdAt
      ]
    );
    await this.client.query(
      `insert into statkeeper_event_ledger_heads
        (capture_session_id, game_id, profile_version_id, profile_content_hash, media_id,
         regulation_period_count, regulation_period_duration_ms, overtime_period_duration_ms,
         event_definitions, ledger_version, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, 1, $10, $10)`,
      [
        input.id,
        input.game.id,
        input.profile.id,
        input.profile.profile.contentHash,
        input.mediaId,
        definition.regulationPeriodCount,
        definition.regulationPeriodDurationMs,
        definition.overtimePeriodDurationMs,
        JSON.stringify(input.profile.profile.eventDefinitions),
        input.createdAt
      ]
    );
    for (const participant of input.participants) {
      await this.client.query(
        `insert into statkeeper_event_ledger_participants
          (capture_session_id, roster_membership_id, player_id, season_id,
           season_team_id, participation_status)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          input.id,
          participant.rosterMembershipId,
          participant.playerId,
          participant.seasonId,
          participant.seasonTeamId,
          participant.participationStatus
        ]
      );
    }
    for (const coverageGroupKey of input.profile.profile.coverageGroupKeys) {
      await this.client.query(
        `insert into statkeeper_capture_session_coverage
          (capture_session_id, coverage_group_key, review_status)
         values ($1, $2, 'not_reviewed')`,
        [input.id, coverageGroupKey]
      );
    }
  }

  async saveCommandReceipt(
    input:
      | Parameters<StatkeeperProfileTransaction['saveCommandReceipt']>[0]
      | Parameters<StatkeeperSessionTransaction['saveCommandReceipt']>[0]
  ) {
    const commandType = input.result.operation === 'activate_statkeeper_profile'
      ? 'statkeeper.profile_activated'
      : 'statkeeper.session_started';
    await this.client.query(
      `insert into command_receipts
        (command_id, command_type, payload_hash, result, created_at)
       values ($1, $2, $3, $4::jsonb, $5)`,
      [input.commandId, commandType, input.payloadHash, JSON.stringify(input.result), input.createdAt]
    );
  }
}

export class PostgresStatkeeperPreflightStore
implements StatkeeperProfileStore, StatkeeperSessionStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(
    work: (
      transaction: StatkeeperProfileTransaction & StatkeeperSessionTransaction
    ) => Promise<T>
  ) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresStatkeeperPreflightTransaction(client));
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

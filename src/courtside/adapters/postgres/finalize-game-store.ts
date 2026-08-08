import type {Pool, PoolClient} from 'pg';

import type {GamePhase, GameStatus} from '@/courtside/core/game';
import type {StandingsGame} from '@/courtside/core/standings';
import type {
  FinalizeGameResult,
  FinalizeGameStore,
  FinalizeGameTransaction,
  StoredCommandReceipt,
  StoredConfigurationVersion,
  StoredGame,
  StoredSeason
} from '@/courtside/services/finalize-game';

class PostgresFinalizeGameTransaction implements FinalizeGameTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredCommandReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: FinalizeGameResult;
    }>(
      `select command_type, payload_hash, result
         from command_receipts
        where command_id = $1`,
      [commandId]
    );
    const row = result.rows[0];
    return row
      ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result}
      : null;
  }

  async findGameForUpdate(gameId: string): Promise<StoredGame | null> {
    const result = await this.client.query<{
      id: string;
      season_id: string;
      league_id: string;
      status: GameStatus;
      phase: GamePhase;
      home_season_team_id: string;
      away_season_team_id: string;
      home_score: number | null;
      away_score: number | null;
      winning_season_team_id: string | null;
      configuration_version_id: string | null;
      competition_eligibility_at: Date | null;
      finalized_at: Date | null;
      version: number;
    }>(
      `select g.id,
              g.season_id,
              s.league_id,
              g.status,
              g.phase,
              g.home_season_team_id,
              g.away_season_team_id,
              g.home_score,
              g.away_score,
              g.winning_season_team_id,
              g.configuration_version_id,
              g.competition_eligibility_at,
              g.finalized_at,
              g.version
         from games g
         join seasons s on s.id = g.season_id
        where g.id = $1
        for update of g`,
      [gameId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          seasonId: row.season_id,
          leagueId: row.league_id,
          status: row.status,
          phase: row.phase,
          homeSeasonTeamId: row.home_season_team_id,
          awaySeasonTeamId: row.away_season_team_id,
          homeScore: row.home_score,
          awayScore: row.away_score,
          winningSeasonTeamId: row.winning_season_team_id,
          configurationVersionId: row.configuration_version_id,
          competitionEligibilityAt: row.competition_eligibility_at,
          finalizedAt: row.finalized_at,
          version: row.version
        }
      : null;
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

  async findSeasonForUpdate(seasonId: string): Promise<StoredSeason> {
    const result = await this.client.query<{
      id: string;
      result_configuration: unknown;
      frozen_configuration_version_id: string | null;
    }>(
      `select id, result_configuration, frozen_configuration_version_id
         from seasons
        where id = $1
        for update`,
      [seasonId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Season ${seasonId} disappeared while its Game was locked`);
    }
    return {
      id: row.id,
      resultConfiguration: row.result_configuration,
      frozenConfigurationVersionId: row.frozen_configuration_version_id
    };
  }

  async findConfigurationVersion(configurationVersionId: string): Promise<StoredConfigurationVersion> {
    const result = await this.client.query<{
      id: string;
      configuration: unknown;
      basis_hash: string;
    }>(
      `select id, configuration, basis_hash
         from season_configuration_versions
        where id = $1`,
      [configurationVersionId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Frozen configuration version ${configurationVersionId} does not exist`);
    }
    return {id: row.id, configuration: row.configuration, basisHash: row.basis_hash};
  }

  async createConfigurationVersion(input: {
    id: string;
    seasonId: string;
    configuration: unknown;
    basisHash: string;
    frozenAt: Date;
  }): Promise<StoredConfigurationVersion> {
    await this.client.query(
      `insert into season_configuration_versions
        (id, season_id, version_number, configuration, basis_hash, frozen_at)
       values ($1, $2, 1, $3::jsonb, $4, $5)`,
      [input.id, input.seasonId, JSON.stringify(input.configuration), input.basisHash, input.frozenAt]
    );
    return {id: input.id, configuration: input.configuration, basisHash: input.basisHash};
  }

  async setFrozenConfigurationVersion(seasonId: string, configurationVersionId: string) {
    const result = await this.client.query(
      `update seasons
          set frozen_configuration_version_id = $2
        where id = $1
          and frozen_configuration_version_id is null`,
      [seasonId, configurationVersionId]
    );
    if (result.rowCount !== 1) {
      throw new Error(`Season ${seasonId} could not accept its first frozen configuration`);
    }
  }

  async saveAuthoritativeResult(input: {
    gameId: string;
    expectedVersion: number;
    expectedStatus: GameStatus;
    status: 'final' | 'forfeit';
    homeScore: number;
    awayScore: number;
    winningSeasonTeamId: string;
    configurationVersionId: string;
    competitionEligibilityAt: Date;
    finalizedAt: Date;
  }) {
    const result = await this.client.query(
      `update games
          set status = $4,
              home_score = $5,
              away_score = $6,
              winning_season_team_id = $7,
              configuration_version_id = $8,
              competition_eligibility_at = $9,
              finalized_at = $10,
              version = version + 1
        where id = $1
          and version = $2
          and status = $3`,
      [
        input.gameId,
        input.expectedVersion,
        input.expectedStatus,
        input.status,
        input.homeScore,
        input.awayScore,
        input.winningSeasonTeamId,
        input.configurationVersionId,
        input.competitionEligibilityAt,
        input.finalizedAt
      ]
    );
    if (result.rowCount !== 1) {
      throw new Error(`Game ${input.gameId} changed during authoritative result mutation`);
    }
  }

  async appendAuditRecord(input: {
    id: string;
    leagueId: string;
    actorAccountId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into audit_records
        (id, league_id, actor_account_id, action, entity_type, entity_id,
         previous_value, new_value, reason, created_at)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
      [
        input.id,
        input.leagueId,
        input.actorAccountId,
        input.action,
        input.entityType,
        input.entityId,
        JSON.stringify(input.previousValue),
        JSON.stringify(input.newValue),
        input.reason,
        input.createdAt
      ]
    );
  }

  async listSeasonTeamIds(seasonId: string) {
    const result = await this.client.query<{id: string}>(
      'select id from season_teams where season_id = $1 order by id',
      [seasonId]
    );
    return result.rows.map((row) => row.id);
  }

  async listAuthoritativeRegularGames(seasonId: string): Promise<StandingsGame[]> {
    const result = await this.client.query<{
      id: string;
      phase: GamePhase;
      status: GameStatus;
      home_season_team_id: string;
      away_season_team_id: string;
      home_score: number;
      away_score: number;
    }>(
      `select id, phase, status, home_season_team_id, away_season_team_id,
              home_score, away_score
         from games
        where season_id = $1
          and phase = 'regular'
          and status in ('final', 'forfeit')
        order by id`,
      [seasonId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      phase: row.phase,
      status: row.status,
      homeSeasonTeamId: row.home_season_team_id,
      awaySeasonTeamId: row.away_season_team_id,
      homeScore: row.home_score,
      awayScore: row.away_score
    }));
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: FinalizeGameResult;
    createdAt: Date;
  }) {
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

export class PostgresFinalizeGameStore implements FinalizeGameStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: FinalizeGameTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresFinalizeGameTransaction(client));
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

export {PostgresFinalizeGameStore as PostgresGameResultStore};

import type {Pool, PoolClient} from 'pg';

import type {GameStatus} from '@/courtside/core/game';
import type {PlayerStatVerification} from '@/courtside/core/player-stat-line';
import type {
  EligiblePlayerMembership,
  PlayerPointMutationResult,
  PlayerPointsStore,
  PlayerPointsTransaction,
  StoredPlayerPointsGame,
  StoredPlayerPointsReceipt,
  StoredPlayerStatLine
} from '@/courtside/services/manage-player-points';

class PostgresPlayerPointsTransaction implements PlayerPointsTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredPlayerPointsReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: PlayerPointMutationResult;
    }>(
      'select command_type, payload_hash, result from command_receipts where command_id = $1',
      [commandId]
    );
    const row = result.rows[0];
    return row
      ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result}
      : null;
  }

  async findGameForUpdate(gameId: string): Promise<StoredPlayerPointsGame | null> {
    const result = await this.client.query<{
      id: string;
      season_id: string;
      league_id: string;
      status: GameStatus;
      home_season_team_id: string;
      away_season_team_id: string;
      competition_eligibility_at: Date | null;
    }>(
      `select g.id,
              g.season_id,
              s.league_id,
              g.status,
              g.home_season_team_id,
              g.away_season_team_id,
              g.competition_eligibility_at
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
          homeSeasonTeamId: row.home_season_team_id,
          awaySeasonTeamId: row.away_season_team_id,
          competitionEligibilityAt: row.competition_eligibility_at
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

  async listEligibleMemberships(gameId: string): Promise<EligiblePlayerMembership[]> {
    const result = await this.client.query<{
      id: string;
      player_id: string;
      season_team_id: string;
    }>(
      `select rm.id, rm.player_id, rm.season_team_id
         from games g
         join roster_memberships rm
           on rm.season_id = g.season_id
          and rm.season_team_id in (g.home_season_team_id, g.away_season_team_id)
          and rm.effective_from <= g.competition_eligibility_at
          and (rm.effective_until is null or rm.effective_until > g.competition_eligibility_at)
        where g.id = $1
          and g.competition_eligibility_at is not null
        order by rm.season_team_id, rm.player_id, rm.id`,
      [gameId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      playerId: row.player_id,
      seasonTeamId: row.season_team_id
    }));
  }

  async listStatLinesForUpdate(gameId: string): Promise<StoredPlayerStatLine[]> {
    const result = await this.client.query<{
      id: string;
      game_id: string;
      player_id: string;
      roster_membership_id: string;
      season_team_id: string;
      points: number | null;
      completeness_status: 'partial' | 'complete';
      verification_status: PlayerStatVerification;
      version: number;
    }>(
      `select id,
              game_id,
              player_id,
              roster_membership_id,
              season_team_id,
              points,
              completeness_status,
              verification_status,
              version
         from player_stat_lines
        where game_id = $1
        order by roster_membership_id
        for update`,
      [gameId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      gameId: row.game_id,
      playerId: row.player_id,
      rosterMembershipId: row.roster_membership_id,
      seasonTeamId: row.season_team_id,
      points: row.points,
      completenessStatus: row.completeness_status,
      verificationStatus: row.verification_status,
      version: row.version
    }));
  }

  async insertStatLine(input: {
    id: string;
    gameId: string;
    playerId: string;
    rosterMembershipId: string;
    seasonId: string;
    seasonTeamId: string;
    points: number | null;
    verificationStatus: PlayerStatVerification;
    occurredAt: Date;
  }) {
    await this.client.query(
      `insert into player_stat_lines
        (id, game_id, player_id, roster_membership_id, season_id, season_team_id,
         points, completeness_status, verification_status, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, 'partial', $8, $9, $9)`,
      [
        input.id,
        input.gameId,
        input.playerId,
        input.rosterMembershipId,
        input.seasonId,
        input.seasonTeamId,
        input.points,
        input.verificationStatus,
        input.occurredAt
      ]
    );
  }

  async updateStatLine(input: {
    id: string;
    expectedVersion: number;
    points: number | null;
    verificationStatus: PlayerStatVerification;
    occurredAt: Date;
  }) {
    const result = await this.client.query(
      `update player_stat_lines
          set points = $3,
              completeness_status = 'partial',
              verification_status = $4,
              version = version + 1,
              updated_at = $5
        where id = $1
          and version = $2`,
      [input.id, input.expectedVersion, input.points, input.verificationStatus, input.occurredAt]
    );
    if (result.rowCount !== 1) {
      throw new Error(`Player Stat Line ${input.id} changed concurrently`);
    }
  }

  async appendAudit(input: {
    id: string;
    leagueId: string;
    actorAccountId: string;
    action: string;
    playerStatLineId: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into audit_records
        (id, league_id, actor_account_id, action, entity_type, entity_id,
         previous_value, new_value, reason, created_at)
       values ($1, $2, $3, $4, 'PlayerStatLine', $5, $6::jsonb, $7::jsonb, $8, $9)`,
      [
        input.id,
        input.leagueId,
        input.actorAccountId,
        input.action,
        input.playerStatLineId,
        JSON.stringify(input.previousValue),
        JSON.stringify(input.newValue),
        input.reason,
        input.createdAt
      ]
    );
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: PlayerPointMutationResult;
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

export class PostgresPlayerPointsStore implements PlayerPointsStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: PlayerPointsTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresPlayerPointsTransaction(client));
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

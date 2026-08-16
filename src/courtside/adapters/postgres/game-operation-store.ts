import type {Pool, PoolClient} from 'pg';

import type {
  GameOperationResult,
  GameOperationStore,
  GameOperationTransaction,
  StoredGameOperationGame,
  StoredGameOperationReceipt,
  StoredGameOperationSeason
} from '@/courtside/services/manage-game';

class PostgresGameOperationTransaction implements GameOperationTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredGameOperationReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: GameOperationResult;
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

  async findSeasonForUpdate(seasonId: string): Promise<StoredGameOperationSeason | null> {
    const result = await this.client.query<{
      id: string;
      league_id: string;
      timezone: string;
    }>(
      `select s.id, s.league_id, l.timezone
         from seasons s
         join leagues l on l.id = s.league_id
        where s.id = $1
        for update of s, l`,
      [seasonId]
    );
    const row = result.rows[0];
    return row
      ? {id: row.id, leagueId: row.league_id, leagueTimezone: row.timezone}
      : null;
  }

  async findGameForUpdate(gameId: string): Promise<StoredGameOperationGame | null> {
    const result = await this.client.query<{
      id: string;
      season_id: string;
      league_id: string;
      timezone: string;
      status: StoredGameOperationGame['status'];
      phase: StoredGameOperationGame['phase'];
      home_season_team_id: string;
      away_season_team_id: string;
      scheduled_at: Date;
      started_at: Date | null;
      venue_id: string | null;
      venue_instructions: string | null;
      version: number;
    }>(
      `select g.id,
              g.season_id,
              s.league_id,
              l.timezone,
              g.status,
              g.phase,
              g.home_season_team_id,
              g.away_season_team_id,
              g.scheduled_at,
              g.started_at,
              g.venue_id,
              g.venue_instructions,
              g.version
         from games g
         join seasons s on s.id = g.season_id
         join leagues l on l.id = s.league_id
        where g.id = $1
        for update of g, l`,
      [gameId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          seasonId: row.season_id,
          leagueId: row.league_id,
          leagueTimezone: row.timezone,
          status: row.status,
          phase: row.phase,
          homeSeasonTeamId: row.home_season_team_id,
          awaySeasonTeamId: row.away_season_team_id,
          scheduledAt: row.scheduled_at,
          startedAt: row.started_at,
          venueId: row.venue_id,
          venueInstructions: row.venue_instructions,
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

  async seasonTeamsBelongToSeason(seasonId: string, seasonTeamIds: readonly string[]) {
    const result = await this.client.query<{count: number}>(
      `select count(*)::int as count
         from season_teams
        where season_id = $1
          and id = any($2::uuid[])`,
      [seasonId, seasonTeamIds]
    );
    return result.rows[0]?.count === seasonTeamIds.length;
  }

  async venueBelongsToLeague(leagueId: string, venueId: string) {
    const result = await this.client.query(
      `select 1
         from venues
        where id = $1
          and league_id = $2
          and archived_at is null`,
      [venueId, leagueId]
    );
    return result.rowCount === 1;
  }

  async insertScheduledGame(input: {
    id: string;
    seasonId: string;
    homeSeasonTeamId: string;
    awaySeasonTeamId: string;
    scheduledAt: Date;
    venueId: string | null;
    venueInstructions: string | null;
  }) {
    await this.client.query(
      `insert into games
        (id, season_id, phase, status, home_season_team_id, away_season_team_id,
         scheduled_at, venue_id, venue_instructions)
       values ($1, $2, 'regular', 'scheduled', $3, $4, $5, $6, $7)`,
      [
        input.id,
        input.seasonId,
        input.homeSeasonTeamId,
        input.awaySeasonTeamId,
        input.scheduledAt,
        input.venueId,
        input.venueInstructions
      ]
    );
  }

  async rescheduleGame(input: {
    gameId: string;
    expectedVersion: number;
    expectedStatus: 'scheduled' | 'postponed';
    scheduledAt: Date;
    venueId: string | null;
    venueInstructions: string | null;
  }) {
    const result = await this.client.query(
      `update games
          set status = 'scheduled',
              scheduled_at = $4,
              venue_id = $5,
              venue_instructions = $6,
              started_at = null,
              version = version + 1
        where id = $1
          and version = $2
          and status = $3`,
      [
        input.gameId,
        input.expectedVersion,
        input.expectedStatus,
        input.scheduledAt,
        input.venueId,
        input.venueInstructions
      ]
    );
    if (result.rowCount !== 1) {
      throw new Error(`Game ${input.gameId} changed during rescheduling`);
    }
  }

  async transitionGame(input: {
    gameId: string;
    expectedVersion: number;
    expectedStatus: 'scheduled' | 'postponed';
    status: 'postponed' | 'cancelled' | 'in_progress';
    startedAt: Date | null;
  }) {
    const result = await this.client.query(
      `update games
          set status = $4,
              started_at = $5,
              competition_eligibility_at = case
                when $4 = 'in_progress' then $5
                else competition_eligibility_at
              end,
              version = version + 1
        where id = $1
          and version = $2
          and status = $3`,
      [input.gameId, input.expectedVersion, input.expectedStatus, input.status, input.startedAt]
    );
    if (result.rowCount !== 1) {
      throw new Error(`Game ${input.gameId} changed during ${input.status} transition`);
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

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: GameOperationResult;
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

export class PostgresGameOperationStore implements GameOperationStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: GameOperationTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresGameOperationTransaction(client));
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

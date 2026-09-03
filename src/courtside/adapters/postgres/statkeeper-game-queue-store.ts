import type {Pool, PoolClient} from 'pg';

import type {StatkeeperQueueGame, StatkeeperSessionStatus} from '@/courtside/core/statkeeper-game-queue';
import type {
  StatkeeperGameQueueReadTransaction,
  StatkeeperGameQueueStore,
  StatkeeperQueueLeague
} from '@/courtside/services/read-statkeeper-game-queue';
import {loadStatkeeperAuthority} from './statkeeper-authority';

interface QueueGameRow extends Omit<StatkeeperQueueGame, 'session'> {
  session_id: string | null;
  session_status: StatkeeperSessionStatus | null;
  profile_version_id: string | null;
  ledger_version: string | null;
  progress_version: string | null;
  playback_offset_ms: string | null;
  updated_at: Date | null;
}

class PostgresStatkeeperGameQueueReadTransaction implements StatkeeperGameQueueReadTransaction {
  constructor(private readonly client: PoolClient) {}

  loadAuthority(leagueId: string, actorAccountId: string) {
    return loadStatkeeperAuthority(this.client, leagueId, actorAccountId);
  }

  async findLeague(leagueId: string) {
    const result = await this.client.query<StatkeeperQueueLeague>(
      `select id, name, timezone, active_statkeeping_profile_version_id as "activeProfileVersionId"
         from leagues where id = $1`,
      [leagueId]
    );
    return result.rows[0] ?? null;
  }

  async listCompletedGames(leagueId: string): Promise<StatkeeperQueueGame[]> {
    const result = await this.client.query<QueueGameRow>(
      `select g.id as "gameId", g.season_id as "seasonId", season.name as "seasonName",
              g.phase, g.status, g.scheduled_at as "scheduledAt", g.finalized_at as "finalizedAt",
              g.home_season_team_id as "homeSeasonTeamId", ht.name as "homeTeamName",
              g.home_score as "homeScore", g.away_season_team_id as "awaySeasonTeamId",
              away_team.name as "awayTeamName", g.away_score as "awayScore",
              session.id as session_id, session.lifecycle_status as session_status,
              session.profile_version_id, head.ledger_version, session.progress_version,
              session.playback_offset_ms, session.updated_at
         from games g
         join seasons season on season.id = g.season_id
         join season_teams hst on hst.id = g.home_season_team_id
         join teams ht on ht.id = hst.team_id
         join season_teams ast on ast.id = g.away_season_team_id
         join teams away_team on away_team.id = ast.team_id
         left join statkeeper_capture_sessions session on session.game_id = g.id
         left join statkeeper_event_ledger_heads head on head.capture_session_id = session.id
        where season.league_id = $1
          and g.status in ('final', 'forfeit')
          and g.competition_eligibility_at is not null`,
      [leagueId]
    );
    return result.rows.map((row) => {
      if (row.session_id && (!row.ledger_version || !row.session_status || !row.profile_version_id
        || row.progress_version === null || row.playback_offset_ms === null || !row.updated_at)) {
        throw new Error(`Capture Session ${row.session_id} has an incomplete queue basis`);
      }
      // Explicit projection: never expose operator accounts, contact details, or arbitrary table columns.
      return {
        gameId: row.gameId,
        seasonId: row.seasonId,
        seasonName: row.seasonName,
        phase: row.phase,
        status: row.status,
        scheduledAt: row.scheduledAt,
        finalizedAt: row.finalizedAt,
        homeSeasonTeamId: row.homeSeasonTeamId,
        homeTeamName: row.homeTeamName,
        homeScore: row.homeScore,
        awaySeasonTeamId: row.awaySeasonTeamId,
        awayTeamName: row.awayTeamName,
        awayScore: row.awayScore,
        session: row.session_id ? {
          id: row.session_id,
          status: row.session_status!,
          profileVersionId: row.profile_version_id!,
          ledgerVersion: Number(row.ledger_version),
          progressVersion: Number(row.progress_version),
          playbackOffsetMs: Number(row.playback_offset_ms),
          updatedAt: row.updated_at!
        } : null
      };
    });
  }
}

export class PostgresStatkeeperGameQueueStore implements StatkeeperGameQueueStore {
  constructor(private readonly pool: Pool) {}

  async read<T>(work: (transaction: StatkeeperGameQueueReadTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin transaction isolation level repeatable read read only');
      const result = await work(new PostgresStatkeeperGameQueueReadTransaction(client));
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

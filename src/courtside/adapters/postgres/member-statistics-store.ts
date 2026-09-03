import type {Pool} from 'pg';

import type {GamePhase} from '@/courtside/core/game';
import {
  calculateMemberLeaderboard,
  type MemberLeaderboardRow
} from '@/courtside/core/member-statistics';
import type {PlayerStatVerification} from '@/courtside/core/player-stat-line';

export interface MemberStatisticsLeague {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
}

export interface MemberStatisticsSeasonChoice {
  readonly id: string;
  readonly name: string;
}

export interface MemberBoxScoreEntry {
  readonly rosterMembershipId: string;
  readonly playerId: string;
  readonly playerName: string;
  readonly seasonTeamId: string;
  readonly teamName: string;
  readonly points: number | null;
  readonly verificationStatus: PlayerStatVerification | null;
}

export interface MemberCompletedGame {
  readonly id: string;
  readonly phase: GamePhase;
  readonly status: 'final' | 'forfeit';
  readonly scheduledAt: Date;
  readonly finalizedAt: Date;
  readonly homeSeasonTeamId: string;
  readonly homeTeamName: string;
  readonly homeScore: number;
  readonly awaySeasonTeamId: string;
  readonly awayTeamName: string;
  readonly awayScore: number;
  readonly homePlayers: readonly MemberBoxScoreEntry[];
  readonly awayPlayers: readonly MemberBoxScoreEntry[];
}

export interface MemberPlayerGameLogEntry {
  readonly gameId: string;
  readonly scheduledAt: Date;
  readonly status: 'final' | 'forfeit';
  readonly seasonTeamId: string;
  readonly teamName: string;
  readonly opponentTeamName: string;
  readonly teamScore: number;
  readonly opponentScore: number;
  readonly points: number | null;
  readonly verificationStatus: PlayerStatVerification | null;
}

export interface MemberPlayerSummary {
  readonly id: string;
  readonly displayName: string;
  readonly teamNames: readonly string[];
  readonly leaderboard: MemberLeaderboardRow | null;
  readonly gameLog: readonly MemberPlayerGameLogEntry[];
}

export interface MemberStatisticsSeason {
  readonly id: string;
  readonly name: string;
  readonly leaderboard: readonly MemberLeaderboardRow[];
  readonly players: readonly MemberPlayerSummary[];
  readonly completedGames: readonly MemberCompletedGame[];
}

export interface MemberStatisticsDashboard {
  readonly hasAccess: boolean;
  readonly hasAdministrativeAccess: boolean;
  readonly league: MemberStatisticsLeague | null;
  readonly seasons: readonly MemberStatisticsSeasonChoice[];
  readonly selectedSeason: MemberStatisticsSeason | null;
}

interface LeagueRow {
  id: string;
  name: string;
  timezone: string;
  is_admin: boolean;
}

interface SeasonRow {
  id: string;
  name: string;
}

interface DirectoryRow {
  player_id: string;
  player_name: string;
  team_name: string;
}

interface GameRow {
  id: string;
  phase: GamePhase;
  status: 'final' | 'forfeit';
  scheduled_at: Date;
  finalized_at: Date;
  home_season_team_id: string;
  home_team_name: string;
  home_score: number;
  away_season_team_id: string;
  away_team_name: string;
  away_score: number;
}

interface EligiblePlayerRow {
  game_id: string;
  roster_membership_id: string;
  player_id: string;
  player_name: string;
  season_team_id: string;
  team_name: string;
  points: number | null;
  verification_status: PlayerStatVerification | null;
}

export class PostgresMemberStatisticsStore {
  constructor(private readonly pool: Pool) {}

  private async loadAccessibleLeague(accountId: string): Promise<LeagueRow | null> {
    const result = await this.pool.query<LeagueRow>(
      `with accessible_leagues as (
         select laa.league_id, true as is_admin
           from league_admin_assignments laa
          where laa.user_account_id = $1 and laa.revoked_at is null
         union all
         select lsa.league_id, false as is_admin
           from league_statkeeper_assignments lsa
          where lsa.user_account_id = $1 and lsa.revoked_at is null
         union all
         select s.league_id, false as is_admin
           from season_team_captain_assignments stca
           join season_teams st on st.id = stca.season_team_id
           join seasons s on s.id = st.season_id
          where stca.user_account_id = $1 and stca.revoked_at is null
         union all
         select p.league_id, false as is_admin
           from player_management_relationships pmr
           join players p on p.id = pmr.player_id
          where pmr.user_account_id = $1 and pmr.status = 'approved'
       )
       select l.id, l.name, l.timezone, bool_or(al.is_admin) as is_admin
         from accessible_leagues al
         join leagues l on l.id = al.league_id
        group by l.id, l.name, l.timezone
        order by l.name, l.id
        limit 1`,
      [accountId]
    );
    return result.rows[0] ?? null;
  }

  async hasAccess(accountId: string) {
    return (await this.loadAccessibleLeague(accountId)) !== null;
  }

  async load(accountId: string, requestedSeasonId?: string): Promise<MemberStatisticsDashboard> {
    const league = await this.loadAccessibleLeague(accountId);
    if (!league) {
      return {
        hasAccess: false,
        hasAdministrativeAccess: false,
        league: null,
        seasons: [],
        selectedSeason: null
      };
    }

    const seasonResult = await this.pool.query<SeasonRow>(
      `select id, name
         from seasons
        where league_id = $1
        order by created_at desc, id`,
      [league.id]
    );
    const seasonRow = seasonResult.rows.find((season) => season.id === requestedSeasonId) ??
      seasonResult.rows[0] ?? null;
    const base = {
      hasAccess: true,
      hasAdministrativeAccess: league.is_admin,
      league: {id: league.id, name: league.name, timezone: league.timezone},
      seasons: seasonResult.rows
    };
    if (!seasonRow) return {...base, selectedSeason: null};

    const [directoryResult, gameResult, eligibleResult] = await Promise.all([
      this.pool.query<DirectoryRow>(
        `select distinct p.id as player_id, p.display_name as player_name, t.name as team_name
           from roster_memberships rm
           join players p on p.id = rm.player_id
           join season_teams st on st.id = rm.season_team_id
           join teams t on t.id = st.team_id
          where rm.season_id = $1
          order by p.display_name, p.id, t.name`,
        [seasonRow.id]
      ),
      this.pool.query<GameRow>(
        `select g.id, g.phase, g.status, g.scheduled_at, g.finalized_at,
                g.home_season_team_id, ht.name as home_team_name, g.home_score,
                g.away_season_team_id, at.name as away_team_name, g.away_score
           from games g
           join season_teams hst on hst.id = g.home_season_team_id
           join teams ht on ht.id = hst.team_id
           join season_teams ast on ast.id = g.away_season_team_id
           join teams at on at.id = ast.team_id
          where g.season_id = $1 and g.status in ('final', 'forfeit')
          order by g.finalized_at desc, g.scheduled_at desc, g.id`,
        [seasonRow.id]
      ),
      this.pool.query<EligiblePlayerRow>(
        `select g.id as game_id, rm.id as roster_membership_id,
                p.id as player_id, p.display_name as player_name,
                rm.season_team_id, t.name as team_name,
                psl.points, psl.verification_status
           from games g
           join roster_memberships rm
             on rm.season_id = g.season_id
            and rm.season_team_id in (g.home_season_team_id, g.away_season_team_id)
            and rm.effective_from <= g.competition_eligibility_at
            and (rm.effective_until is null or rm.effective_until > g.competition_eligibility_at)
           join players p on p.id = rm.player_id
           join season_teams st on st.id = rm.season_team_id
           join teams t on t.id = st.team_id
           left join player_stat_lines psl
             on psl.game_id = g.id and psl.roster_membership_id = rm.id
          where g.season_id = $1
            and g.status in ('final', 'forfeit')
            and g.competition_eligibility_at is not null
          order by g.finalized_at desc, g.id, rm.season_team_id, p.display_name, p.id`,
        [seasonRow.id]
      )
    ]);

    const leaderboard = calculateMemberLeaderboard(eligibleResult.rows.map((row) => ({
      gameId: row.game_id,
      playerId: row.player_id,
      playerName: row.player_name,
      points: row.points,
      verificationStatus: row.verification_status
    })));
    const leaderboardByPlayer = new Map(leaderboard.map((row) => [row.playerId, row]));
    const eligibleByGame = new Map<string, EligiblePlayerRow[]>();
    for (const row of eligibleResult.rows) {
      const entries = eligibleByGame.get(row.game_id) ?? [];
      entries.push(row);
      eligibleByGame.set(row.game_id, entries);
    }

    const completedGames: MemberCompletedGame[] = gameResult.rows.map((game) => {
      const entries = eligibleByGame.get(game.id) ?? [];
      const mapEntry = (row: EligiblePlayerRow): MemberBoxScoreEntry => ({
        rosterMembershipId: row.roster_membership_id,
        playerId: row.player_id,
        playerName: row.player_name,
        seasonTeamId: row.season_team_id,
        teamName: row.team_name,
        points: row.points,
        verificationStatus: row.verification_status
      });
      return {
        id: game.id,
        phase: game.phase,
        status: game.status,
        scheduledAt: game.scheduled_at,
        finalizedAt: game.finalized_at,
        homeSeasonTeamId: game.home_season_team_id,
        homeTeamName: game.home_team_name,
        homeScore: game.home_score,
        awaySeasonTeamId: game.away_season_team_id,
        awayTeamName: game.away_team_name,
        awayScore: game.away_score,
        homePlayers: entries.filter((row) => row.season_team_id === game.home_season_team_id).map(mapEntry),
        awayPlayers: entries.filter((row) => row.season_team_id === game.away_season_team_id).map(mapEntry)
      };
    });
    const gamesById = new Map(completedGames.map((game) => [game.id, game]));
    const teamsByPlayer = new Map<string, Set<string>>();
    for (const row of directoryResult.rows) {
      const teams = teamsByPlayer.get(row.player_id) ?? new Set<string>();
      teams.add(row.team_name);
      teamsByPlayer.set(row.player_id, teams);
    }
    const directoryPlayers = new Map(directoryResult.rows.map((row) => [row.player_id, row.player_name]));
    const players: MemberPlayerSummary[] = [...directoryPlayers.entries()].map(([playerId, displayName]) => ({
      id: playerId,
      displayName,
      teamNames: [...(teamsByPlayer.get(playerId) ?? [])].sort((left, right) => left.localeCompare(right)),
      leaderboard: leaderboardByPlayer.get(playerId) ?? null,
      gameLog: eligibleResult.rows
        .filter((row) => row.player_id === playerId)
        .map((row): MemberPlayerGameLogEntry | null => {
          const game = gamesById.get(row.game_id);
          if (!game) return null;
          const isHome = row.season_team_id === game.homeSeasonTeamId;
          return {
            gameId: game.id,
            scheduledAt: game.scheduledAt,
            status: game.status,
            seasonTeamId: row.season_team_id,
            teamName: row.team_name,
            opponentTeamName: isHome ? game.awayTeamName : game.homeTeamName,
            teamScore: isHome ? game.homeScore : game.awayScore,
            opponentScore: isHome ? game.awayScore : game.homeScore,
            points: row.points,
            verificationStatus: row.verification_status
          };
        })
        .filter((entry): entry is MemberPlayerGameLogEntry => entry !== null)
    }));
    players.sort((left, right) => left.displayName.localeCompare(right.displayName, undefined, {sensitivity: 'base'}) || left.id.localeCompare(right.id));

    return {
      ...base,
      selectedSeason: {
        id: seasonRow.id,
        name: seasonRow.name,
        leaderboard,
        players,
        completedGames
      }
    };
  }
}

import type {Pool} from 'pg';

import {canonicalHash, readStandingsConfiguration} from '@/courtside/core/configuration';
import type {GamePhase, GameStatus} from '@/courtside/core/game';
import {calculateStandings, type StandingsGame} from '@/courtside/core/standings';

export interface PublicGame {
  readonly id: string;
  readonly phase: GamePhase;
  readonly status: GameStatus;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly scheduledAt: Date;
  readonly finalizedAt: Date | null;
  readonly venueName: string | null;
  readonly venueAddress: string | null;
  readonly venueInstructions: string | null;
  readonly homeScore: number | null;
  readonly awayScore: number | null;
}

export interface PublicStanding {
  readonly seasonTeamId: string;
  readonly teamName: string;
  readonly rank: number | null;
  readonly gamesPlayed: number;
  readonly wins: number;
  readonly losses: number;
  readonly leaguePoints: number;
  readonly pointsFor: number;
  readonly pointsAgainst: number;
  readonly pointDifferential: number;
}

export interface PublicSeason {
  readonly id: string;
  readonly name: string;
  readonly schedule: readonly PublicGame[];
  readonly results: readonly PublicGame[];
  readonly standings: readonly PublicStanding[];
  readonly unresolvedTieCount: number;
}

export interface PublicLeague {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
  readonly defaultLanguage: 'en' | 'fr';
  readonly seasons: readonly PublicSeason[];
}

interface LeagueRow {
  id: string;
  name: string;
  timezone: string;
  default_language: 'en' | 'fr';
}

interface SeasonRow {
  id: string;
  league_id: string;
  name: string;
  result_configuration: unknown;
  configuration_version_id: string | null;
  frozen_configuration: unknown | null;
  created_at: Date;
}

interface TeamRow {
  season_id: string;
  season_team_id: string;
  team_name: string;
}

interface GameRow {
  id: string;
  season_id: string;
  phase: GamePhase;
  status: GameStatus;
  home_season_team_id: string;
  away_season_team_id: string;
  home_team_name: string;
  away_team_name: string;
  scheduled_at: Date;
  finalized_at: Date | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_instructions: string | null;
  home_score: number | null;
  away_score: number | null;
}

const scheduleStatuses = new Set<GameStatus>([
  'scheduled',
  'postponed',
  'cancelled',
  'in_progress'
]);

export class PostgresPublicLeagueStore {
  constructor(private readonly pool: Pool) {}

  async load(): Promise<PublicLeague[]> {
    const [leagueResult, seasonResult, teamResult, gameResult] = await Promise.all([
      this.pool.query<LeagueRow>(
        `select id, name, timezone, default_language
           from leagues
          order by name, id`
      ),
      this.pool.query<SeasonRow>(
        `select s.id,
                s.league_id,
                s.name,
                s.result_configuration,
                s.frozen_configuration_version_id as configuration_version_id,
                scv.configuration as frozen_configuration,
                s.created_at
           from seasons s
           left join season_configuration_versions scv
             on scv.id = s.frozen_configuration_version_id
          order by s.created_at desc, s.id`
      ),
      this.pool.query<TeamRow>(
        `select st.season_id,
                st.id as season_team_id,
                t.name as team_name
           from season_teams st
           join teams t on t.id = st.team_id
          order by st.season_id, t.name, st.id`
      ),
      this.pool.query<GameRow>(
        `select g.id,
                g.season_id,
                g.phase,
                g.status,
                g.home_season_team_id,
                g.away_season_team_id,
                ht.name as home_team_name,
                at.name as away_team_name,
                g.scheduled_at,
                g.finalized_at,
                v.name as venue_name,
                v.address as venue_address,
                g.venue_instructions,
                g.home_score,
                g.away_score
           from games g
           join season_teams hst on hst.id = g.home_season_team_id
           join teams ht on ht.id = hst.team_id
           join season_teams ast on ast.id = g.away_season_team_id
           join teams at on at.id = ast.team_id
           left join venues v on v.id = g.venue_id
          order by g.scheduled_at, g.id`
      )
    ]);

    const teamsBySeason = new Map<string, TeamRow[]>();
    for (const team of teamResult.rows) {
      const teams = teamsBySeason.get(team.season_id) ?? [];
      teams.push(team);
      teamsBySeason.set(team.season_id, teams);
    }

    const gamesBySeason = new Map<string, GameRow[]>();
    for (const game of gameResult.rows) {
      const games = gamesBySeason.get(game.season_id) ?? [];
      games.push(game);
      gamesBySeason.set(game.season_id, games);
    }

    const seasonsByLeague = new Map<string, PublicSeason[]>();
    for (const seasonRow of seasonResult.rows) {
      const teams = teamsBySeason.get(seasonRow.id) ?? [];
      const games = gamesBySeason.get(seasonRow.id) ?? [];
      const configuration = seasonRow.frozen_configuration ?? seasonRow.result_configuration;
      const configurationVersionId =
        seasonRow.configuration_version_id ?? `mutable-${canonicalHash(configuration)}`;
      const authoritativeGames: StandingsGame[] = games
        .filter(
          (game): game is GameRow & {home_score: number; away_score: number} =>
            (game.status === 'final' || game.status === 'forfeit') &&
            game.home_score !== null &&
            game.away_score !== null
        )
        .map((game) => ({
          id: game.id,
          phase: game.phase,
          status: game.status,
          homeSeasonTeamId: game.home_season_team_id,
          awaySeasonTeamId: game.away_season_team_id,
          homeScore: game.home_score,
          awayScore: game.away_score
        }));
      const projection = calculateStandings({
        seasonId: seasonRow.id,
        configurationVersionId,
        seasonTeamIds: teams.map((team) => team.season_team_id),
        games: authoritativeGames,
        configuration: readStandingsConfiguration(configuration)
      });
      const teamNames = new Map(
        teams.map((team) => [team.season_team_id, team.team_name])
      );
      const publicGames: PublicGame[] = games.map((game) => ({
        id: game.id,
        phase: game.phase,
        status: game.status,
        homeTeamName: game.home_team_name,
        awayTeamName: game.away_team_name,
        scheduledAt: game.scheduled_at,
        finalizedAt: game.finalized_at,
        venueName: game.venue_name,
        venueAddress: game.venue_address,
        venueInstructions: game.venue_instructions,
        homeScore: game.home_score,
        awayScore: game.away_score
      }));
      const season: PublicSeason = {
        id: seasonRow.id,
        name: seasonRow.name,
        schedule: publicGames.filter((game) => scheduleStatuses.has(game.status)),
        results: publicGames
          .filter((game) => game.status === 'final' || game.status === 'forfeit')
          .sort(
            (left, right) =>
              (right.finalizedAt?.getTime() ?? 0) - (left.finalizedAt?.getTime() ?? 0)
          ),
        standings: projection.rows.map((standing) => ({
          ...standing,
          teamName: teamNames.get(standing.seasonTeamId) ?? standing.seasonTeamId
        })),
        unresolvedTieCount: projection.unresolvedTies.length
      };
      const seasons = seasonsByLeague.get(seasonRow.league_id) ?? [];
      seasons.push(season);
      seasonsByLeague.set(seasonRow.league_id, seasons);
    }

    return leagueResult.rows.map((league) => ({
      id: league.id,
      name: league.name,
      timezone: league.timezone,
      defaultLanguage: league.default_language,
      seasons: seasonsByLeague.get(league.id) ?? []
    }));
  }
}

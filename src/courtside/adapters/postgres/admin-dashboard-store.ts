import type {Pool} from 'pg';

import {canonicalHash, readStandingsConfiguration} from '@/courtside/core/configuration';
import type {GamePhase, GameStatus} from '@/courtside/core/game';
import {calculateStandings, type StandingsGame} from '@/courtside/core/standings';

export interface AdminGame {
  readonly id: string;
  readonly status: GameStatus;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly scheduledAt: Date;
  readonly venueId: string | null;
  readonly venueName: string | null;
  readonly venueInstructions: string | null;
}

export interface AdminResultAudit {
  readonly id: string;
  readonly action: 'game.finalized' | 'game.forfeited' | 'game.result_corrected';
  readonly actorName: string;
  readonly previousHomeScore: number | null;
  readonly previousAwayScore: number | null;
  readonly newHomeScore: number;
  readonly newAwayScore: number;
  readonly reason: string | null;
  readonly createdAt: Date;
}

export interface AdminCompletedGame extends AdminGame {
  readonly status: 'final' | 'forfeit';
  readonly homeScore: number;
  readonly awayScore: number;
  readonly winningSeasonTeamId: string;
  readonly audits: readonly AdminResultAudit[];
}

export interface AdminSeasonTeam {
  readonly id: string;
  readonly teamId: string;
  readonly name: string;
}

export interface AdminVenue {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly notes: string | null;
  readonly archivedAt: Date | null;
}

export interface AdminStanding {
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

export interface AdminSeason {
  readonly id: string;
  readonly name: string;
  readonly configurationFrozen: boolean;
  readonly teams: readonly AdminSeasonTeam[];
  readonly scheduledGames: readonly AdminGame[];
  readonly postponedGames: readonly AdminGame[];
  readonly inProgressGames: readonly AdminGame[];
  readonly completedGames: readonly AdminCompletedGame[];
  readonly standings: readonly AdminStanding[];
  readonly unresolvedTieCount: number;
}

export interface AdminLeague {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
  readonly venues: readonly AdminVenue[];
  readonly seasons: readonly AdminSeason[];
}

interface SeasonRow {
  league_id: string;
  league_name: string;
  timezone: string;
  season_id: string;
  season_name: string;
  result_configuration: unknown;
  configuration_version_id: string | null;
  frozen_configuration: unknown | null;
}

interface LeagueRow {
  id: string;
  name: string;
  timezone: string;
}

interface TeamRow {
  season_team_id: string;
  team_id: string;
  team_name: string;
}

interface VenueRow {
  league_id: string;
  id: string;
  name: string;
  address: string;
  notes: string | null;
  archived_at: Date | null;
}

interface GameRow {
  id: string;
  phase: GamePhase;
  status: GameStatus;
  scheduled_at: Date;
  home_season_team_id: string;
  away_season_team_id: string;
  home_team_name: string;
  away_team_name: string;
  venue_id: string | null;
  venue_name: string | null;
  venue_instructions: string | null;
  home_score: number | null;
  away_score: number | null;
  winning_season_team_id: string | null;
}

interface ResultAuditRow {
  id: string;
  game_id: string;
  action: AdminResultAudit['action'];
  actor_name: string;
  previous_home_score: string | null;
  previous_away_score: string | null;
  new_home_score: string;
  new_away_score: string;
  reason: string | null;
  created_at: Date;
}

export class PostgresAdminDashboardStore {
  constructor(private readonly pool: Pool) {}

  async load(accountId: string): Promise<AdminLeague[]> {
    const [leagueResult, seasonResult, venueResult] = await Promise.all([
      this.pool.query<LeagueRow>(
        `select l.id, l.name, l.timezone
           from league_admin_assignments laa
           join leagues l on l.id = laa.league_id
          where laa.user_account_id = $1
            and laa.revoked_at is null
          order by l.name, l.id`,
        [accountId]
      ),
      this.pool.query<SeasonRow>(
      `select l.id as league_id,
              l.name as league_name,
              l.timezone,
              s.id as season_id,
              s.name as season_name,
              s.result_configuration,
              s.frozen_configuration_version_id as configuration_version_id,
              scv.configuration as frozen_configuration
         from league_admin_assignments laa
         join leagues l on l.id = laa.league_id
         join seasons s on s.league_id = l.id
         left join season_configuration_versions scv
           on scv.id = s.frozen_configuration_version_id
        where laa.user_account_id = $1
          and laa.revoked_at is null
        order by l.name, s.created_at desc, s.id`,
      [accountId]
      ),
      this.pool.query<VenueRow>(
        `select v.league_id, v.id, v.name, v.address, v.notes, v.archived_at
           from league_admin_assignments laa
           join venues v on v.league_id = laa.league_id
          where laa.user_account_id = $1
            and laa.revoked_at is null
          order by v.archived_at nulls first, v.name, v.id`,
        [accountId]
      )
    ]);

    const venuesByLeague = new Map<string, AdminVenue[]>();
    for (const venue of venueResult.rows) {
      const venues = venuesByLeague.get(venue.league_id) ?? [];
      venues.push({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        notes: venue.notes,
        archivedAt: venue.archived_at
      });
      venuesByLeague.set(venue.league_id, venues);
    }

    const leagues = new Map<string, AdminLeague & {seasons: AdminSeason[]}>(
      leagueResult.rows.map((league) => [
        league.id,
        {
          id: league.id,
          name: league.name,
          timezone: league.timezone,
          venues: venuesByLeague.get(league.id) ?? [],
          seasons: []
        }
      ])
    );
    for (const row of seasonResult.rows) {
      const [teamResult, gameResult, auditResult] = await Promise.all([
        this.pool.query<TeamRow>(
          `select st.id as season_team_id, st.team_id, t.name as team_name
             from season_teams st
             join teams t on t.id = st.team_id
            where st.season_id = $1
            order by t.name, st.id`,
          [row.season_id]
        ),
        this.pool.query<GameRow>(
          `select g.id,
                  g.phase,
                  g.status,
                  g.scheduled_at,
                  g.home_season_team_id,
                  g.away_season_team_id,
                  ht.name as home_team_name,
                  at.name as away_team_name,
                  g.venue_id,
                  v.name as venue_name,
                  g.venue_instructions,
                  g.home_score,
                  g.away_score,
                  g.winning_season_team_id
             from games g
             join season_teams hst on hst.id = g.home_season_team_id
             join teams ht on ht.id = hst.team_id
             join season_teams ast on ast.id = g.away_season_team_id
             join teams at on at.id = ast.team_id
             left join venues v on v.id = g.venue_id
            where g.season_id = $1
              and g.phase = 'regular'
            order by g.scheduled_at, g.id`,
          [row.season_id]
        ),
        this.pool.query<ResultAuditRow>(
          `select ar.id,
                  ar.entity_id as game_id,
                  ar.action,
                  ua.display_name as actor_name,
                  ar.previous_value ->> 'home_score' as previous_home_score,
                  ar.previous_value ->> 'away_score' as previous_away_score,
                  ar.new_value ->> 'home_score' as new_home_score,
                  ar.new_value ->> 'away_score' as new_away_score,
                  ar.reason,
                  ar.created_at
             from audit_records ar
             join user_accounts ua on ua.id = ar.actor_account_id
             join games g on g.id = ar.entity_id
            where g.season_id = $1
              and g.phase = 'regular'
              and ar.entity_type = 'Game'
              and ar.action in ('game.finalized', 'game.forfeited', 'game.result_corrected')
            order by ar.created_at desc, ar.id desc`,
          [row.season_id]
        )
      ]);

      const auditsByGame = new Map<string, AdminResultAudit[]>();
      for (const audit of auditResult.rows) {
        const audits = auditsByGame.get(audit.game_id) ?? [];
        audits.push({
          id: audit.id,
          action: audit.action,
          actorName: audit.actor_name,
          previousHomeScore:
            audit.previous_home_score === null ? null : Number(audit.previous_home_score),
          previousAwayScore:
            audit.previous_away_score === null ? null : Number(audit.previous_away_score),
          newHomeScore: Number(audit.new_home_score),
          newAwayScore: Number(audit.new_away_score),
          reason: audit.reason,
          createdAt: audit.created_at
        });
        auditsByGame.set(audit.game_id, audits);
      }

      const teamNames = new Map(
        teamResult.rows.map((team) => [team.season_team_id, team.team_name])
      );
      const configuration = row.frozen_configuration ?? row.result_configuration;
      const configurationVersionId =
        row.configuration_version_id ?? `mutable-${canonicalHash(configuration)}`;
      const authoritativeGames: StandingsGame[] = gameResult.rows
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
        seasonId: row.season_id,
        configurationVersionId,
        seasonTeamIds: teamResult.rows.map((team) => team.season_team_id),
        games: authoritativeGames,
        configuration: readStandingsConfiguration(configuration)
      });

      const season: AdminSeason = {
        id: row.season_id,
        name: row.season_name,
        configurationFrozen: row.configuration_version_id !== null,
        teams: teamResult.rows.map((team) => ({
          id: team.season_team_id,
          teamId: team.team_id,
          name: team.team_name
        })),
        scheduledGames: gameResult.rows
          .filter((game) => game.status === 'scheduled')
          .map((game) => ({
            id: game.id,
            status: game.status,
            homeTeamName: game.home_team_name,
            awayTeamName: game.away_team_name,
            homeSeasonTeamId: game.home_season_team_id,
            awaySeasonTeamId: game.away_season_team_id,
            scheduledAt: game.scheduled_at,
            venueId: game.venue_id,
            venueName: game.venue_name,
            venueInstructions: game.venue_instructions
          })),
        postponedGames: gameResult.rows
          .filter((game) => game.status === 'postponed')
          .map((game) => ({
            id: game.id,
            status: game.status,
            homeTeamName: game.home_team_name,
            awayTeamName: game.away_team_name,
            homeSeasonTeamId: game.home_season_team_id,
            awaySeasonTeamId: game.away_season_team_id,
            scheduledAt: game.scheduled_at,
            venueId: game.venue_id,
            venueName: game.venue_name,
            venueInstructions: game.venue_instructions
          })),
        inProgressGames: gameResult.rows
          .filter((game) => game.status === 'in_progress')
          .map((game) => ({
            id: game.id,
            status: game.status,
            homeTeamName: game.home_team_name,
            awayTeamName: game.away_team_name,
            homeSeasonTeamId: game.home_season_team_id,
            awaySeasonTeamId: game.away_season_team_id,
            scheduledAt: game.scheduled_at,
            venueId: game.venue_id,
            venueName: game.venue_name,
            venueInstructions: game.venue_instructions
          })),
        completedGames: gameResult.rows
          .filter(
            (game): game is GameRow & {
              status: 'final' | 'forfeit';
              home_score: number;
              away_score: number;
              winning_season_team_id: string;
            } =>
              (game.status === 'final' || game.status === 'forfeit') &&
              game.home_score !== null &&
              game.away_score !== null &&
              game.winning_season_team_id !== null
          )
          .map((game) => ({
            id: game.id,
            status: game.status,
            homeTeamName: game.home_team_name,
            awayTeamName: game.away_team_name,
            scheduledAt: game.scheduled_at,
            venueId: game.venue_id,
            venueName: game.venue_name,
            venueInstructions: game.venue_instructions,
            homeSeasonTeamId: game.home_season_team_id,
            awaySeasonTeamId: game.away_season_team_id,
            homeScore: game.home_score,
            awayScore: game.away_score,
            winningSeasonTeamId: game.winning_season_team_id,
            audits: auditsByGame.get(game.id) ?? []
          })),
        standings: projection.rows.map((standing) => ({
          ...standing,
          teamName: teamNames.get(standing.seasonTeamId) ?? standing.seasonTeamId
        })),
        unresolvedTieCount: projection.unresolvedTies.length
      };

      const league = leagues.get(row.league_id);
      if (!league) {
        throw new Error('An authorized Season resolved without its League');
      }
      league.seasons.push(season);
    }

    return [...leagues.values()];
  }
}

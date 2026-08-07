import {canonicalHash, type RankingCriterion, type StandingsConfiguration} from './configuration';
import {RuleViolation} from './errors';
import type {GamePhase, GameStatus} from './game';

export interface StandingsGame {
  readonly id: string;
  readonly phase: GamePhase;
  readonly status: GameStatus;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly homeScore: number;
  readonly awayScore: number;
}

export interface StandingsRow {
  readonly seasonTeamId: string;
  readonly rank: number | null;
  readonly gamesPlayed: number;
  readonly wins: number;
  readonly losses: number;
  readonly leaguePoints: number;
  readonly pointsFor: number;
  readonly pointsAgainst: number;
  readonly pointDifferential: number;
}

export interface UnresolvedTieContext {
  readonly identity: string;
  readonly seasonTeamIds: readonly string[];
  readonly precedingCriterionValues: readonly {
    readonly criterion: Exclude<RankingCriterion, 'random_draw'>;
    readonly value: number;
  }[];
}

export interface StandingsProjection {
  readonly seasonId: string;
  readonly configurationVersionId: string;
  readonly rows: readonly StandingsRow[];
  readonly unresolvedTies: readonly UnresolvedTieContext[];
}

interface MutableRow {
  seasonTeamId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

function criterionValue(row: StandingsRow, criterion: Exclude<RankingCriterion, 'random_draw'>) {
  switch (criterion) {
    case 'league_points':
      return row.leaguePoints;
    case 'point_differential':
      return row.pointDifferential;
    case 'points_scored':
      return row.pointsFor;
  }
}

function rowsTie(
  left: StandingsRow,
  right: StandingsRow,
  criteria: readonly Exclude<RankingCriterion, 'random_draw'>[]
) {
  return criteria.every((criterion) => criterionValue(left, criterion) === criterionValue(right, criterion));
}

export function calculateStandings(input: {
  readonly seasonId: string;
  readonly configurationVersionId: string;
  readonly seasonTeamIds: readonly string[];
  readonly games: readonly StandingsGame[];
  readonly configuration: StandingsConfiguration;
}): StandingsProjection {
  const rows = new Map<string, MutableRow>();
  for (const seasonTeamId of [...input.seasonTeamIds].sort()) {
    rows.set(seasonTeamId, {
      seasonTeamId,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0
    });
  }

  const eligiblePhases = new Set(input.configuration.eligiblePhases);
  const eligibleStatuses = new Set(input.configuration.eligibleStatuses);

  for (const game of input.games) {
    if (!eligiblePhases.has(game.phase as 'regular') || !eligibleStatuses.has(game.status as 'final')) {
      continue;
    }

    const home = rows.get(game.homeSeasonTeamId);
    const away = rows.get(game.awaySeasonTeamId);
    if (!home || !away) {
      throw new RuleViolation(
        'standings.participating_season_team_required',
        `Authoritative Game ${game.id} references a Season Team outside the projection`
      );
    }
    if (game.homeScore === game.awayScore) {
      throw new RuleViolation(
        'standings.authoritative_score_not_tied',
        `Authoritative Game ${game.id} has a tied score`
      );
    }

    home.gamesPlayed += 1;
    away.gamesPlayed += 1;
    home.pointsFor += game.homeScore;
    home.pointsAgainst += game.awayScore;
    away.pointsFor += game.awayScore;
    away.pointsAgainst += game.homeScore;

    if (game.homeScore > game.awayScore) {
      home.wins += 1;
      away.losses += 1;
    } else {
      away.wins += 1;
      home.losses += 1;
    }
  }

  const rankedRows: StandingsRow[] = [...rows.values()].map((row) => ({
    ...row,
    rank: null,
    leaguePoints:
      row.wins * input.configuration.points.win +
      row.losses * input.configuration.points.loss,
    pointDifferential: row.pointsFor - row.pointsAgainst
  }));
  const numericCriteria = input.configuration.ranking.filter(
    (criterion): criterion is Exclude<RankingCriterion, 'random_draw'> =>
      criterion !== 'random_draw'
  );

  rankedRows.sort((left, right) => {
    for (const criterion of numericCriteria) {
      const comparison = criterionValue(right, criterion) - criterionValue(left, criterion);
      if (comparison !== 0) {
        return comparison;
      }
    }
    return left.seasonTeamId.localeCompare(right.seasonTeamId);
  });

  const unresolvedTies: UnresolvedTieContext[] = [];
  const hasRandomDraw = input.configuration.ranking.includes('random_draw');
  let index = 0;
  let nextRank = 1;

  while (index < rankedRows.length) {
    let end = index + 1;
    while (end < rankedRows.length && rowsTie(rankedRows[index], rankedRows[end], numericCriteria)) {
      end += 1;
    }

    const group = rankedRows.slice(index, end);
    if (group.length > 1 && hasRandomDraw) {
      const seasonTeamIds = group.map((row) => row.seasonTeamId).sort();
      const precedingCriterionValues = numericCriteria.map((criterion) => ({
        criterion,
        value: criterionValue(group[0], criterion)
      }));
      unresolvedTies.push({
        identity: canonicalHash({
          season_id: input.seasonId,
          configuration_version_id: input.configurationVersionId,
          criterion: 'random_draw',
          season_team_ids: seasonTeamIds,
          preceding_criterion_values: precedingCriterionValues
        }),
        seasonTeamIds,
        precedingCriterionValues
      });
    } else {
      for (const row of group) {
        (row as {rank: number | null}).rank = nextRank;
      }
    }

    nextRank += group.length;
    index = end;
  }

  return {
    seasonId: input.seasonId,
    configurationVersionId: input.configurationVersionId,
    rows: rankedRows,
    unresolvedTies
  };
}

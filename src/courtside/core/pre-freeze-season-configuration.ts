import {
  canonicalHash,
  readStandingsConfiguration,
  type RankingCriterion
} from './configuration';
import {RuleViolation} from './errors';

export const EDITABLE_RANKING_CRITERIA = [
  'league_points',
  'point_differential',
  'points_scored'
] as const satisfies readonly RankingCriterion[];

export type EditableRankingCriterion = (typeof EDITABLE_RANKING_CRITERIA)[number];

export interface EditableStandingsInput {
  readonly winPoints: number;
  readonly lossPoints: number;
  readonly ranking: readonly RankingCriterion[];
}

export interface EditableSeasonConfiguration extends EditableStandingsInput {
  readonly playoffRoundCount: number;
  readonly configurationHash: string;
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RuleViolation('configuration.shape', `${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function validateEditablePoints(winPoints: number, lossPoints: number) {
  if (
    !Number.isSafeInteger(winPoints) ||
    !Number.isSafeInteger(lossPoints) ||
    winPoints < 0 ||
    lossPoints < 0
  ) {
    throw new RuleViolation(
      'configuration.nonnegative_safe_points',
      'Win and loss League Points must be nonnegative safe integers'
    );
  }
  if (winPoints <= lossPoints) {
    throw new RuleViolation(
      'configuration.win_points_greater_than_loss',
      'A win must award more League Points than a loss'
    );
  }
}

function validateEditableRanking(ranking: readonly string[]): RankingCriterion[] {
  const expected = new Set<string>(EDITABLE_RANKING_CRITERIA);
  if (
    ranking.length !== EDITABLE_RANKING_CRITERIA.length + 1 ||
    ranking.at(-1) !== 'random_draw' ||
    new Set(ranking).size !== ranking.length ||
    ranking.slice(0, -1).some((criterion) => !expected.has(criterion))
  ) {
    throw new RuleViolation(
      'configuration.editable_ranking_permutation',
      'Ranking must contain every supported score criterion once, followed by random_draw'
    );
  }
  return [...ranking] as RankingCriterion[];
}

export function normalizeEditableStandingsInput(
  input: EditableStandingsInput
): EditableStandingsInput {
  validateEditablePoints(input.winPoints, input.lossPoints);
  return {
    winPoints: input.winPoints,
    lossPoints: input.lossPoints,
    ranking: validateEditableRanking(input.ranking)
  };
}

function playoffRoundCount(value: unknown) {
  const root = record(value, 'configuration');
  const playoffs = record(root.playoffs, 'configuration.playoffs');
  if (!Array.isArray(playoffs.rounds)) {
    throw new RuleViolation(
      'configuration.playoff_rounds',
      'configuration.playoffs.rounds must be an array'
    );
  }
  return playoffs.rounds.length;
}

export function readEditableSeasonConfiguration(value: unknown): EditableSeasonConfiguration {
  const standings = readStandingsConfiguration(value);
  validateEditablePoints(standings.points.win, standings.points.loss);
  const ranking = validateEditableRanking(standings.ranking);
  const root = record(value, 'configuration');
  const storedStandings = record(root.standings, 'configuration.standings');
  if (storedStandings.forfeit_treatment !== 'explicit_score') {
    throw new RuleViolation(
      'configuration.explicit_score_forfeit',
      'The current editor supports only explicit-score forfeit treatment'
    );
  }
  return {
    winPoints: standings.points.win,
    lossPoints: standings.points.loss,
    ranking,
    playoffRoundCount: playoffRoundCount(value),
    configurationHash: canonicalHash(value)
  };
}

export function applyPreFreezeStandingsConfiguration(
  current: unknown,
  input: EditableStandingsInput
) {
  readEditableSeasonConfiguration(current);
  const normalized = normalizeEditableStandingsInput(input);
  const root = record(current, 'configuration');
  const standings = record(root.standings, 'configuration.standings');
  const next = {
    ...root,
    standings: {
      ...standings,
      points: {win: normalized.winPoints, loss: normalized.lossPoints},
      ranking: [...normalized.ranking]
    }
  };
  readEditableSeasonConfiguration(next);
  return next;
}

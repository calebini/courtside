import {createHash} from 'node:crypto';

import {RuleViolation} from './errors';

export type RankingCriterion =
  | 'league_points'
  | 'point_differential'
  | 'points_scored'
  | 'random_draw';

export type EligibleGameStatus = 'final' | 'forfeit';
export type EligibleGamePhase = 'regular';

export interface StandingsConfiguration {
  readonly points: {
    readonly win: number;
    readonly loss: number;
  };
  readonly ranking: readonly RankingCriterion[];
  readonly eligiblePhases: readonly EligibleGamePhase[];
  readonly eligibleStatuses: readonly EligibleGameStatus[];
  readonly adjustmentsEnabled: boolean;
}

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | readonly JsonValue[] | {[key: string]: JsonValue};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeJson(value: unknown, path: string): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new RuleViolation('configuration.canonical_json', `${path} must be finite`);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeJson(item, `${path}[${index}]`));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeJson(value[key], `${path}.${key}`)])
    );
  }

  throw new RuleViolation(
    'configuration.canonical_json',
    `${path} contains a value that cannot be canonicalized`
  );
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalizeJson(value, '$'));
}

export function canonicalHash(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new RuleViolation('configuration.shape', `${path} must be an object`);
  }
  return value;
}

function requireInteger(value: unknown, path: string): number {
  if (!Number.isInteger(value)) {
    throw new RuleViolation('configuration.integer', `${path} must be an integer`);
  }
  return value as number;
}

function requireStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new RuleViolation('configuration.array', `${path} must be a string array`);
  }
  return value;
}

export function readStandingsConfiguration(value: unknown): StandingsConfiguration {
  const root = requireRecord(value, 'configuration');
  const standings = requireRecord(root.standings, 'configuration.standings');
  const points = requireRecord(standings.points, 'configuration.standings.points');
  const ranking = requireStringArray(
    standings.ranking,
    'configuration.standings.ranking'
  );
  const allowedCriteria = new Set<RankingCriterion>([
    'league_points',
    'point_differential',
    'points_scored',
    'random_draw'
  ]);

  if (ranking.length === 0 || ranking.some((item) => !allowedCriteria.has(item as RankingCriterion))) {
    throw new RuleViolation(
      'configuration.ranking_vocabulary',
      'configuration.standings.ranking contains an unknown or empty criterion set'
    );
  }
  if (new Set(ranking).size !== ranking.length) {
    throw new RuleViolation(
      'configuration.ranking_unique',
      'configuration.standings.ranking cannot repeat a criterion'
    );
  }
  const randomDrawIndex = ranking.indexOf('random_draw');
  if (randomDrawIndex !== -1 && randomDrawIndex !== ranking.length - 1) {
    throw new RuleViolation(
      'configuration.random_draw_last',
      'random_draw must be the final ranking criterion'
    );
  }

  const eligiblePhases = requireStringArray(
    standings.eligible_phases,
    'configuration.standings.eligible_phases'
  );
  if (eligiblePhases.length === 0 || eligiblePhases.some((phase) => phase !== 'regular')) {
    throw new RuleViolation(
      'configuration.regular_standings_only',
      'regular-season standings may include only the regular phase'
    );
  }

  const eligibleStatuses = requireStringArray(
    standings.eligible_statuses,
    'configuration.standings.eligible_statuses'
  );
  if (
    eligibleStatuses.length === 0 ||
    eligibleStatuses.some((status) => status !== 'final' && status !== 'forfeit')
  ) {
    throw new RuleViolation(
      'configuration.authoritative_statuses_only',
      'standings may include only final and forfeit statuses'
    );
  }

  if (typeof standings.adjustments_enabled !== 'boolean') {
    throw new RuleViolation(
      'configuration.adjustments_flag',
      'configuration.standings.adjustments_enabled must be boolean'
    );
  }
  if (standings.adjustments_enabled) {
    throw new RuleViolation(
      'configuration.adjustments_deferred',
      'standings adjustments are not implemented in the first slice'
    );
  }

  return {
    points: {
      win: requireInteger(points.win, 'configuration.standings.points.win'),
      loss: requireInteger(points.loss, 'configuration.standings.points.loss')
    },
    ranking: ranking as RankingCriterion[],
    eligiblePhases: eligiblePhases as EligibleGamePhase[],
    eligibleStatuses: eligibleStatuses as EligibleGameStatus[],
    adjustmentsEnabled: false
  };
}

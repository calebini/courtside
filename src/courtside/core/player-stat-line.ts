import {RuleViolation} from './errors';

export type PlayerStatCompleteness = 'partial' | 'complete';
export type PlayerStatVerification = 'provisional' | 'confirmed';

export interface PlayerPointState {
  readonly points: number | null;
  readonly completenessStatus: PlayerStatCompleteness;
  readonly verificationStatus: PlayerStatVerification;
  readonly version: number;
}

export interface PlayerPointTransition {
  readonly changed: boolean;
  readonly next: PlayerPointState;
  readonly kind: 'created' | 'updated' | 'confirmed' | 'corrected' | 'unchanged';
}

export function assertPlayerPoints(points: number | null) {
  if (points !== null && (!Number.isSafeInteger(points) || points < 0)) {
    throw new RuleViolation(
      'player_stat_line.points',
      'Player points must be an unknown value or a nonnegative safe integer'
    );
  }
}

export function transitionPlayerPoints(
  current: PlayerPointState | null,
  points: number | null,
  requestedVerification: PlayerStatVerification
): PlayerPointTransition | null {
  assertPlayerPoints(points);
  if (requestedVerification !== 'provisional' && requestedVerification !== 'confirmed') {
    throw new RuleViolation(
      'player_stat_line.verification',
      'Player Stat Line verification status is unsupported'
    );
  }

  if (!current && points === null) {
    return null;
  }

  if (!current) {
    return {
      changed: true,
      kind: 'created',
      next: {
        points,
        completenessStatus: 'partial',
        verificationStatus: requestedVerification,
        version: 0
      }
    };
  }

  const pointsChanged = current.points !== points;
  const verificationStatus = pointsChanged
    ? requestedVerification
    : requestedVerification === 'confirmed'
      ? 'confirmed'
      : current.verificationStatus;
  const changed = pointsChanged || current.verificationStatus !== verificationStatus;

  return {
    changed,
    kind: !changed
      ? 'unchanged'
      : pointsChanged && current.verificationStatus === 'confirmed'
        ? 'corrected'
        : !pointsChanged && verificationStatus === 'confirmed'
        ? 'confirmed'
        : 'updated',
    next: changed
      ? {
          points,
          completenessStatus: 'partial',
          verificationStatus,
          version: current.version + 1
        }
      : current
  };
}

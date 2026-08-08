import {RuleViolation} from './errors';

export type GameStatus =
  | 'scheduled'
  | 'postponed'
  | 'cancelled'
  | 'in_progress'
  | 'final'
  | 'forfeit';

export type GamePhase = 'regular' | 'playoff';

export interface GameState {
  readonly id: string;
  readonly status: GameStatus;
  readonly phase: GamePhase;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly version: number;
}

export interface FinalScore {
  readonly home: number;
  readonly away: number;
}

export function validateGameParticipants(homeSeasonTeamId: string, awaySeasonTeamId: string) {
  if (!homeSeasonTeamId || !awaySeasonTeamId || homeSeasonTeamId === awaySeasonTeamId) {
    throw new RuleViolation(
      'game.distinct_participants_required',
      'A Game requires distinct home and away Season Teams'
    );
  }
}

export function rescheduleGameState(game: GameState): GameState {
  if (game.status !== 'scheduled' && game.status !== 'postponed') {
    throw new RuleViolation(
      'game.scheduled_or_postponed_to_scheduled_only',
      `Game ${game.id} cannot be rescheduled from ${game.status}`
    );
  }
  return {...game, status: 'scheduled', version: game.version + 1};
}

export function postponeGameState(game: GameState): GameState {
  if (game.status !== 'scheduled') {
    throw new RuleViolation(
      'game.scheduled_to_postponed_only',
      `Game ${game.id} cannot transition from ${game.status} to postponed`
    );
  }
  return {...game, status: 'postponed', version: game.version + 1};
}

export function cancelGameState(game: GameState): GameState {
  if (game.status !== 'scheduled' && game.status !== 'postponed') {
    throw new RuleViolation(
      'game.precompetition_to_cancelled_only',
      `Game ${game.id} cannot transition from ${game.status} to cancelled`
    );
  }
  return {...game, status: 'cancelled', version: game.version + 1};
}

export function startGameState(game: GameState): GameState {
  if (game.status !== 'scheduled') {
    throw new RuleViolation(
      'game.scheduled_to_in_progress_only',
      `Game ${game.id} cannot transition from ${game.status} to in_progress`
    );
  }
  return {...game, status: 'in_progress', version: game.version + 1};
}

export interface FinalizedGameState extends GameState {
  readonly status: 'final';
  readonly homeScore: number;
  readonly awayScore: number;
  readonly winningSeasonTeamId: string;
  readonly version: number;
}

export function finalizeGameState(game: GameState, score: FinalScore): FinalizedGameState {
  if (game.status !== 'in_progress') {
    throw new RuleViolation(
      'game.in_progress_to_final_only',
      `Game ${game.id} cannot transition from ${game.status} to final`
    );
  }

  if (
    !Number.isInteger(score.home) ||
    !Number.isInteger(score.away) ||
    score.home < 0 ||
    score.away < 0
  ) {
    throw new RuleViolation(
      'game.authoritative_score_nonnegative_integer',
      'An authoritative score must contain non-negative integers'
    );
  }

  if (score.home === score.away) {
    throw new RuleViolation(
      'game.authoritative_score_not_tied',
      'A final Game score cannot be tied; overtime must resolve the Game'
    );
  }

  return {
    ...game,
    status: 'final',
    homeScore: score.home,
    awayScore: score.away,
    winningSeasonTeamId:
      score.home > score.away ? game.homeSeasonTeamId : game.awaySeasonTeamId,
    version: game.version + 1
  };
}

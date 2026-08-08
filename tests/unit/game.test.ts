import {describe, expect, it} from 'vitest';

import {
  cancelGameState,
  finalizeGameState,
  postponeGameState,
  rescheduleGameState,
  startGameState,
  validateGameParticipants,
  type GameState
} from '@/courtside/core/game';

const game = {
  id: 'game-1',
  status: 'in_progress' as const,
  phase: 'regular' as const,
  homeSeasonTeamId: 'home',
  awaySeasonTeamId: 'away',
  version: 4
};

describe('Game finalization', () => {
  it('produces a winner and advances the version', () => {
    expect(finalizeGameState(game, {home: 81, away: 77})).toMatchObject({
      status: 'final',
      winningSeasonTeamId: 'home',
      version: 5
    });
  });

  it('rejects a tied authoritative score', () => {
    expect(() => finalizeGameState(game, {home: 77, away: 77})).toThrow(
      /overtime must resolve/
    );
  });

  it('rejects finalization from a non-permitted state', () => {
    expect(() =>
      finalizeGameState({...game, status: 'scheduled'}, {home: 81, away: 77})
    ).toThrow(/cannot transition/);
  });
});

describe('Game scheduling lifecycle', () => {
  const scheduled: GameState = {...game, status: 'scheduled'};
  const postponed: GameState = {...game, status: 'postponed'};

  it('requires two distinct participants', () => {
    expect(() => validateGameParticipants('team-a', 'team-b')).not.toThrow();
    expect(() => validateGameParticipants('team-a', 'team-a')).toThrowError(
      expect.objectContaining({rule: 'game.distinct_participants_required'})
    );
  });

  it('supports scheduled postponement, cancellation, and start', () => {
    expect(postponeGameState(scheduled)).toMatchObject({status: 'postponed', version: 5});
    expect(cancelGameState(scheduled)).toMatchObject({status: 'cancelled', version: 5});
    expect(startGameState(scheduled)).toMatchObject({status: 'in_progress', version: 5});
  });

  it('requires an explicit reschedule before a postponed Game starts', () => {
    expect(() => startGameState(postponed)).toThrowError(
      expect.objectContaining({rule: 'game.scheduled_to_in_progress_only'})
    );
    expect(rescheduleGameState(postponed)).toMatchObject({status: 'scheduled', version: 5});
  });

  it('rejects pre-result operations from an authoritative terminal state', () => {
    const terminal: GameState = {...game, status: 'final'};
    expect(() => postponeGameState(terminal)).toThrow();
    expect(() => cancelGameState(terminal)).toThrow();
    expect(() => rescheduleGameState(terminal)).toThrow();
  });
});

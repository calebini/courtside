import {describe, expect, it} from 'vitest';

import {finalizeGameState} from '@/courtside/core/game';

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

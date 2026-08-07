import {describe, expect, it} from 'vitest';

import {canonicalHash, canonicalJson, readStandingsConfiguration} from '@/courtside/core/configuration';

describe('result-affecting configuration', () => {
  it('produces the same identity for objects with different key insertion order', () => {
    const left = {standings: {points: {win: 2, loss: 0}, ranking: ['league_points']}};
    const right = {standings: {ranking: ['league_points'], points: {loss: 0, win: 2}}};

    expect(canonicalJson(left)).toBe(canonicalJson(right));
    expect(canonicalHash(left)).toBe(canonicalHash(right));
  });

  it('rejects a random draw that is not the final ranking criterion', () => {
    expect(() =>
      readStandingsConfiguration({
        standings: {
          points: {win: 2, loss: 0},
          ranking: ['random_draw', 'league_points'],
          eligible_phases: ['regular'],
          eligible_statuses: ['final', 'forfeit'],
          adjustments_enabled: false
        }
      })
    ).toThrow(/random_draw must be the final/);
  });
});

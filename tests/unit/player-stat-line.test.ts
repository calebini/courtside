import {describe, expect, it} from 'vitest';

import {transitionPlayerPoints} from '@/courtside/core/player-stat-line';

describe('Player points transitions', () => {
  it('distinguishes unknown from known zero', () => {
    expect(transitionPlayerPoints(null, null, 'provisional')).toBeNull();
    expect(transitionPlayerPoints(null, 0, 'provisional')).toEqual({
      changed: true,
      kind: 'created',
      next: {
        points: 0,
        completenessStatus: 'partial',
        verificationStatus: 'provisional',
        version: 0
      }
    });
  });

  it('confirms a partial line without pretending detailed statistics are complete', () => {
    expect(transitionPlayerPoints({
      points: 12,
      completenessStatus: 'partial',
      verificationStatus: 'provisional',
      version: 2
    }, 12, 'confirmed')).toEqual({
      changed: true,
      kind: 'confirmed',
      next: {
        points: 12,
        completenessStatus: 'partial',
        verificationStatus: 'confirmed',
        version: 3
      }
    });
  });

  it('returns a corrected confirmed value to provisional unless explicitly verified', () => {
    const current = {
      points: 12,
      completenessStatus: 'partial' as const,
      verificationStatus: 'confirmed' as const,
      version: 3
    };
    expect(transitionPlayerPoints(current, 14, 'provisional')?.next).toMatchObject({
      points: 14,
      verificationStatus: 'provisional',
      version: 4
    });
    expect(transitionPlayerPoints(current, 14, 'confirmed')?.next).toMatchObject({
      points: 14,
      verificationStatus: 'confirmed',
      version: 4
    });
    expect(transitionPlayerPoints(current, 14, 'provisional')?.kind).toBe('corrected');
  });

  it('does not downgrade an unchanged confirmed value in a provisional batch', () => {
    expect(transitionPlayerPoints({
      points: 9,
      completenessStatus: 'partial',
      verificationStatus: 'confirmed',
      version: 1
    }, 9, 'provisional')).toMatchObject({changed: false, kind: 'unchanged'});
  });

  it('rejects invalid numeric values and identifies unchanged content', () => {
    expect(() => transitionPlayerPoints(null, -1, 'provisional')).toThrow(/nonnegative/);
    expect(() => transitionPlayerPoints(null, 1.5, 'provisional')).toThrow(/nonnegative/);
    expect(transitionPlayerPoints({
      points: 8,
      completenessStatus: 'partial',
      verificationStatus: 'confirmed',
      version: 1
    }, 8, 'confirmed')).toMatchObject({changed: false, kind: 'unchanged'});
  });
});

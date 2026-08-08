import {describe, expect, it} from 'vitest';

import {
  endRosterMembershipState,
  normalizePlayerDisplayName,
  renamePlayerState,
  rosterIntervalsOverlap,
  transferRosterMembershipState,
  type RosterMembershipState
} from '@/courtside/core/roster';

const membership: RosterMembershipState = {
  id: 'membership-1',
  playerId: 'player-1',
  seasonId: 'season-1',
  seasonTeamId: 'team-1',
  effectiveFrom: new Date('2026-08-01T00:00:00Z'),
  effectiveUntil: null,
  version: 0
};

describe('Player identity', () => {
  it('normalizes supported display names and advances an actual rename', () => {
    expect(normalizePlayerDisplayName('  Jordan Lee  ')).toBe('Jordan Lee');
    expect(
      renamePlayerState(
        {id: 'player-1', leagueId: 'league-1', displayName: 'Jordan Lee', version: 2},
        'Jordan A. Lee'
      )
    ).toMatchObject({displayName: 'Jordan A. Lee', version: 3});
  });

  it('rejects blank, control-character, overlong, and no-op names', () => {
    expect(() => normalizePlayerDisplayName('   ')).toThrow();
    expect(() => normalizePlayerDisplayName('Jordan\nLee')).toThrow();
    expect(() => normalizePlayerDisplayName('a'.repeat(121))).toThrow();
    expect(() =>
      renamePlayerState(
        {id: 'player-1', leagueId: 'league-1', displayName: 'Jordan Lee', version: 2},
        ' Jordan Lee '
      )
    ).toThrowError(expect.objectContaining({rule: 'player.display_name_changes_value'}));
  });
});

describe('Roster Membership lifecycle', () => {
  it('closes an open membership with an exclusive end', () => {
    expect(endRosterMembershipState(membership, new Date('2026-08-10T00:00:00Z'))).toMatchObject({
      effectiveUntil: new Date('2026-08-10T00:00:00Z'),
      version: 1
    });
  });

  it('transfers without a gap by closing and opening at the same instant', () => {
    const effectiveAt = new Date('2026-08-10T00:00:00Z');
    const transferred = transferRosterMembershipState(
      membership,
      'team-2',
      effectiveAt,
      'membership-2'
    );
    expect(transferred.closedMembership.effectiveUntil).toEqual(effectiveAt);
    expect(transferred.newMembership).toMatchObject({
      id: 'membership-2',
      seasonTeamId: 'team-2',
      effectiveFrom: effectiveAt,
      effectiveUntil: null,
      version: 0
    });
    expect(rosterIntervalsOverlap(transferred.closedMembership, transferred.newMembership)).toBe(
      false
    );
  });

  it('rejects closing at the start, closing twice, or transferring to the same team', () => {
    expect(() => endRosterMembershipState(membership, membership.effectiveFrom)).toThrowError(
      expect.objectContaining({rule: 'roster_membership.end_after_start'})
    );
    expect(() =>
      endRosterMembershipState({...membership, effectiveUntil: new Date()}, new Date())
    ).toThrowError(expect.objectContaining({rule: 'roster_membership.open_required'}));
    expect(() =>
      transferRosterMembershipState(
        membership,
        membership.seasonTeamId,
        new Date('2026-08-10T00:00:00Z'),
        'membership-2'
      )
    ).toThrowError(expect.objectContaining({rule: 'roster_membership.transfer_changes_team'}));
  });

  it('detects overlap while allowing touching half-open intervals', () => {
    const closed = {
      effectiveFrom: new Date('2026-08-01T00:00:00Z'),
      effectiveUntil: new Date('2026-08-10T00:00:00Z')
    };
    expect(
      rosterIntervalsOverlap(closed, {
        effectiveFrom: new Date('2026-08-09T23:59:59Z'),
        effectiveUntil: null
      })
    ).toBe(true);
    expect(
      rosterIntervalsOverlap(closed, {
        effectiveFrom: new Date('2026-08-10T00:00:00Z'),
        effectiveUntil: null
      })
    ).toBe(false);
  });
});

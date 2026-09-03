import {describe, expect, it, vi} from 'vitest';

import {hasStatkeeperAccess} from '@/courtside/core/statkeeper-authority';
import {buildStatkeeperGameQueue, type StatkeeperQueueGame, type StatkeeperSessionStatus} from '@/courtside/core/statkeeper-game-queue';
import {createStatkeeperGameQueueReader, type StatkeeperGameQueueReadTransaction} from '@/courtside/services/read-statkeeper-game-queue';

const leagueId = 'fa000000-0000-4000-8000-000000000001';
const actorAccountId = 'fa000000-0000-4000-8000-000000000002';

function game(gameId: string, status: StatkeeperSessionStatus | null): StatkeeperQueueGame {
  return {
    gameId, seasonId: 'season', seasonName: '2026', phase: 'regular', status: 'final',
    scheduledAt: new Date('2026-08-30T18:00:00Z'), finalizedAt: new Date('2026-08-30T20:00:00Z'),
    homeSeasonTeamId: 'home', homeTeamName: 'Home', homeScore: 80,
    awaySeasonTeamId: 'away', awayTeamName: 'Away', awayScore: 70,
    session: status ? {
      id: `session-${gameId}`, status, profileVersionId: 'profile', ledgerVersion: 4,
      progressVersion: 3, playbackOffsetMs: 45000, updatedAt: new Date('2026-08-31T20:00:00Z')
    } : null
  };
}

describe('Statkeeper authority and game queue', () => {
  it.each([
    [false, false, false], [true, false, true], [false, true, true], [true, true, true]
  ])('grants capture access for admin=%s, Statkeeper=%s: %s', (admin, keeper, expected) => {
    expect(hasStatkeeperAccess({isLeagueAdministrator: admin, isLeagueStatkeeper: keeper})).toBe(expected);
  });

  it('prioritizes capture, unstarted Games, review, and published sessions without restarting abandoned history', () => {
    const input = [game('a', 'abandoned'), game('p', 'published'), game('v', 'verified'), game('r', 'in_review'), game('n', null), game('c2', 'capturing'), game('c1', 'capturing')];
    const queue = buildStatkeeperGameQueue(input, true);
    expect(queue.map((entry) => entry.gameId)).toEqual(['c1', 'c2', 'n', 'r', 'v', 'p', 'a']);
    expect(queue.map((entry) => entry.canResumeSession)).toEqual([true, true, false, true, true, false, false]);
    expect(queue.filter((entry) => entry.canStartSession).map((entry) => entry.gameId)).toEqual(['n']);
    expect(input[0]?.gameId).toBe('a');
  });

  it('sorts recent work first within a group and missing active profiles block starts, not existing-session resume', () => {
    const recent = game('z', 'capturing');
    const queue = buildStatkeeperGameQueue([
      game('a', 'capturing'), game('n', null),
      {...recent, session: {...recent.session!, updatedAt: new Date('2026-09-01T20:00:00Z')}}
    ], false);
    expect(queue.map((entry) => entry.gameId)).toEqual(['z', 'a', 'n']);
    expect(queue[0]?.canResumeSession).toBe(true);
    expect(queue[2]?.canStartSession).toBe(false);
  });

  it('denies data before loading League or Games and rechecks authority on every read', async () => {
    const transaction = {
      loadAuthority: vi.fn().mockResolvedValue({isLeagueAdministrator: false, isLeagueStatkeeper: false}),
      findLeague: vi.fn().mockResolvedValue({id: leagueId, name: 'League', timezone: 'Europe/Paris', activeProfileVersionId: 'profile'}),
      listCompletedGames: vi.fn().mockResolvedValue([game('n', null)])
    };
    const read = createStatkeeperGameQueueReader({read: async (work) => work(transaction)});
    await expect(read({actorAccountId, leagueId})).resolves.toEqual({hasAccess: false, canManageStatkeeperAssignments: false, league: null, games: []});
    expect(transaction.findLeague).not.toHaveBeenCalled();
    expect(transaction.listCompletedGames).not.toHaveBeenCalled();
    transaction.loadAuthority.mockResolvedValue({isLeagueAdministrator: false, isLeagueStatkeeper: true});
    await expect(read({actorAccountId, leagueId})).resolves.toMatchObject({hasAccess: true, canManageStatkeeperAssignments: false});
    transaction.loadAuthority.mockResolvedValue({isLeagueAdministrator: true, isLeagueStatkeeper: false});
    await expect(read({actorAccountId, leagueId})).resolves.toMatchObject({hasAccess: true, canManageStatkeeperAssignments: true});
    expect(transaction.loadAuthority).toHaveBeenCalledTimes(3);
  });

  it('rejects invalid scope identities without accessing persistence', async () => {
    const snapshot = vi.fn();
    const read = createStatkeeperGameQueueReader({read: async (work) => {
      snapshot();
      return work({} as StatkeeperGameQueueReadTransaction);
    }});
    await expect(read({actorAccountId, leagueId: 'bad'})).rejects.toMatchObject({rule: 'statkeeper.queue.identity'});
    expect(snapshot).not.toHaveBeenCalled();
  });
});

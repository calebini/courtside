import {describe, expect, it} from 'vitest';

import {calculateMemberLeaderboard} from '@/courtside/core/member-statistics';

describe('member statistics', () => {
  it('uses only confirmed known points while counting a confirmed zero', () => {
    expect(calculateMemberLeaderboard([
      {gameId: 'g1', playerId: 'avery', playerName: 'Avery', points: 0, verificationStatus: 'confirmed'},
      {gameId: 'g2', playerId: 'avery', playerName: 'Avery', points: 12, verificationStatus: 'confirmed'},
      {gameId: 'g3', playerId: 'avery', playerName: 'Avery', points: 20, verificationStatus: 'provisional'},
      {gameId: 'g1', playerId: 'jordan', playerName: 'Jordan', points: null, verificationStatus: null}
    ])).toEqual([{
      playerId: 'avery',
      playerName: 'Avery',
      confirmedTotalPoints: 12,
      confirmedRecordedPointsGames: 2,
      pointsPerRecordedPointsGame: 6,
      rank: 1
    }]);
  });

  it('shares ranks for tied totals and leaves the next competition rank open', () => {
    expect(calculateMemberLeaderboard([
      {gameId: 'g1', playerId: 'b', playerName: 'Beta', points: 20, verificationStatus: 'confirmed'},
      {gameId: 'g1', playerId: 'a', playerName: 'Alpha', points: 20, verificationStatus: 'confirmed'},
      {gameId: 'g1', playerId: 'c', playerName: 'Charlie', points: 10, verificationStatus: 'confirmed'}
    ])).toMatchObject([
      {playerId: 'a', rank: 1},
      {playerId: 'b', rank: 1},
      {playerId: 'c', rank: 3}
    ]);
  });

  it('rejects duplicate game and player inputs', () => {
    expect(() => calculateMemberLeaderboard([
      {gameId: 'g1', playerId: 'a', playerName: 'Alpha', points: 4, verificationStatus: 'confirmed'},
      {gameId: 'g1', playerId: 'a', playerName: 'Alpha', points: 5, verificationStatus: 'confirmed'}
    ])).toThrow(/Duplicate member statistic input/);
  });
});

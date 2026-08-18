import type {PlayerStatVerification} from './player-stat-line';

export interface MemberStatisticInput {
  readonly gameId: string;
  readonly playerId: string;
  readonly playerName: string;
  readonly points: number | null;
  readonly verificationStatus: PlayerStatVerification | null;
}

export interface MemberLeaderboardRow {
  readonly playerId: string;
  readonly playerName: string;
  readonly confirmedTotalPoints: number;
  readonly confirmedRecordedPointsGames: number;
  readonly pointsPerRecordedPointsGame: number;
  readonly rank: number;
}

/**
 * Builds the member leaderboard from confirmed, known point values only.
 * A confirmed zero is known and therefore counts as a recorded-points game.
 */
export function calculateMemberLeaderboard(
  inputs: readonly MemberStatisticInput[]
): MemberLeaderboardRow[] {
  const seen = new Set<string>();
  const totals = new Map<string, {
    playerName: string;
    total: number;
    recordedGames: number;
  }>();

  for (const input of inputs) {
    const identity = `${input.gameId}:${input.playerId}`;
    if (seen.has(identity)) {
      throw new Error(`Duplicate member statistic input: ${identity}`);
    }
    seen.add(identity);

    if (input.points === null || input.verificationStatus !== 'confirmed') continue;
    const current = totals.get(input.playerId) ?? {
      playerName: input.playerName,
      total: 0,
      recordedGames: 0
    };
    current.total += input.points;
    current.recordedGames += 1;
    totals.set(input.playerId, current);
  }

  const rows = [...totals.entries()].map(([playerId, total]) => ({
    playerId,
    playerName: total.playerName,
    confirmedTotalPoints: total.total,
    confirmedRecordedPointsGames: total.recordedGames,
    pointsPerRecordedPointsGame: total.total / total.recordedGames
  }));
  rows.sort((left, right) =>
    right.confirmedTotalPoints - left.confirmedTotalPoints ||
    left.playerName.localeCompare(right.playerName, undefined, {sensitivity: 'base'}) ||
    left.playerId.localeCompare(right.playerId)
  );

  let previousTotal: number | null = null;
  let rank = 0;
  return rows.map((row, index) => {
    if (row.confirmedTotalPoints !== previousTotal) rank = index + 1;
    previousTotal = row.confirmedTotalPoints;
    return {...row, rank};
  });
}

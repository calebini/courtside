import type {GamePhase} from './game';

export type StatkeeperSessionStatus = 'capturing' | 'in_review' | 'verified' | 'published' | 'abandoned';
export type StatkeeperQueueGroup = 'resume_capture' | 'not_started' | 'awaiting_review' | 'published' | 'abandoned';

export interface StatkeeperQueueGame {
  readonly gameId: string;
  readonly seasonId: string;
  readonly seasonName: string;
  readonly phase: GamePhase;
  readonly status: 'final' | 'forfeit';
  readonly scheduledAt: Date;
  readonly finalizedAt: Date;
  readonly homeSeasonTeamId: string;
  readonly homeTeamName: string;
  readonly homeScore: number;
  readonly awaySeasonTeamId: string;
  readonly awayTeamName: string;
  readonly awayScore: number;
  readonly session: {
    readonly id: string;
    readonly status: StatkeeperSessionStatus;
    readonly profileVersionId: string;
    readonly ledgerVersion: number;
    readonly progressVersion: number;
    readonly playbackOffsetMs: number;
    readonly updatedAt: Date;
  } | null;
}

export interface StatkeeperQueueEntry extends StatkeeperQueueGame {
  readonly group: StatkeeperQueueGroup;
  readonly canStartSession: boolean;
  readonly canResumeSession: boolean;
}

const GROUP_ORDER: Record<StatkeeperQueueGroup, number> = {
  resume_capture: 0, not_started: 1, awaiting_review: 2, published: 3, abandoned: 4
};

function queueGroup(session: StatkeeperQueueGame['session']): StatkeeperQueueGroup {
  if (!session) return 'not_started';
  switch (session.status) {
    case 'capturing': return 'resume_capture';
    case 'in_review':
    case 'verified': return 'awaiting_review';
    case 'published': return 'published';
    case 'abandoned': return 'abandoned';
  }
}

/** Queue order is assistance, not permission to skip command-time lifecycle/authority checks. */
export function buildStatkeeperGameQueue(
  games: readonly StatkeeperQueueGame[],
  hasActiveProfile: boolean
): StatkeeperQueueEntry[] {
  const entries = games.map((game): StatkeeperQueueEntry => ({
    ...game,
    group: queueGroup(game.session),
    canStartSession: game.session === null && hasActiveProfile,
    canResumeSession: game.session !== null
      && ['capturing', 'in_review', 'verified'].includes(game.session.status)
  }));
  return entries.sort((left, right) =>
    GROUP_ORDER[left.group] - GROUP_ORDER[right.group]
    || (right.session?.updatedAt ?? right.finalizedAt).getTime()
      - (left.session?.updatedAt ?? left.finalizedAt).getTime()
    || right.scheduledAt.getTime() - left.scheduledAt.getTime()
    || (left.gameId < right.gameId ? -1 : left.gameId > right.gameId ? 1 : 0)
  );
}

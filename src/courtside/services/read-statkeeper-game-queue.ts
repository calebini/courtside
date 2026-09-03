import {RuleViolation} from '@/courtside/core/errors';
import {hasStatkeeperAccess, type StatkeeperAuthority} from '@/courtside/core/statkeeper-authority';
import {
  buildStatkeeperGameQueue,
  type StatkeeperQueueEntry,
  type StatkeeperQueueGame
} from '@/courtside/core/statkeeper-game-queue';

export interface StatkeeperQueueLeague {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
  readonly activeProfileVersionId: string | null;
}

export interface StatkeeperGameQueueReadTransaction {
  loadAuthority(leagueId: string, actorAccountId: string): Promise<StatkeeperAuthority>;
  findLeague(leagueId: string): Promise<StatkeeperQueueLeague | null>;
  listCompletedGames(leagueId: string): Promise<readonly StatkeeperQueueGame[]>;
}

export interface StatkeeperGameQueueStore {
  /** A consistent, read-only snapshot; implementations must never run queue reads outside it. */
  read<T>(work: (transaction: StatkeeperGameQueueReadTransaction) => Promise<T>): Promise<T>;
}

export type StatkeeperGameQueueResult = {
  readonly hasAccess: false;
  readonly canManageStatkeeperAssignments: false;
  readonly league: null;
  readonly games: readonly [];
} | {
  readonly hasAccess: true;
  readonly canManageStatkeeperAssignments: boolean;
  readonly league: StatkeeperQueueLeague;
  readonly games: readonly StatkeeperQueueEntry[];
};

export function createStatkeeperGameQueueReader(store: StatkeeperGameQueueStore) {
  return async (request: {
    /** Bound to the verified server identity by the caller, never supplied by a browser. */
    readonly actorAccountId: string;
    readonly leagueId: string;
  }): Promise<StatkeeperGameQueueResult> => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof request.actorAccountId !== 'string' || !uuid.test(request.actorAccountId)
      || typeof request.leagueId !== 'string' || !uuid.test(request.leagueId)) {
      throw new RuleViolation('statkeeper.queue.identity', 'Queue actor and League identities must be UUIDs');
    }
    const actorAccountId = request.actorAccountId.toLowerCase();
    const leagueId = request.leagueId.toLowerCase();
    const denied = {hasAccess: false, canManageStatkeeperAssignments: false, league: null, games: []} as const;
    return store.read(async (transaction) => {
      const authority = await transaction.loadAuthority(leagueId, actorAccountId);
      if (!hasStatkeeperAccess(authority)) return denied;
      const league = await transaction.findLeague(leagueId);
      if (!league) return denied;
      const games = await transaction.listCompletedGames(leagueId);
      return {
        hasAccess: true,
        canManageStatkeeperAssignments: authority.isLeagueAdministrator,
        league,
        games: buildStatkeeperGameQueue(games, league.activeProfileVersionId !== null)
      };
    });
  };
}

import {randomUUID} from 'node:crypto';

import {RuleViolation} from '@/courtside/core/errors';
import {nextPlayerManagementStatus, type PlayerManagementStatus} from '@/courtside/core/player-profile';

export interface StoredPlayerAccessRelationship {
  readonly id: string;
  readonly playerId: string;
  readonly leagueId: string;
  readonly userAccountId: string;
  readonly status: PlayerManagementStatus;
  readonly version: number;
}

export interface PlayerAccessTransaction {
  findPlayer(playerId: string): Promise<{id: string; leagueId: string} | null>;
  findRelationship(relationshipId: string): Promise<StoredPlayerAccessRelationship | null>;
  hasLeagueAdmin(leagueId: string, accountId: string): Promise<boolean>;
  hasActivePair(playerId: string, accountId: string): Promise<boolean>;
  accountExists(accountId: string): Promise<boolean>;
  insertRelationship(input: {
    id: string; playerId: string; userAccountId: string; status: 'requested' | 'approved';
    actorAccountId: string; occurredAt: Date;
  }): Promise<void>;
  transitionRelationship(input: {
    relationshipId: string; expectedVersion: number; status: 'approved' | 'revoked';
    actorAccountId: string; occurredAt: Date;
  }): Promise<void>;
  appendAudit(input: {
    id: string; leagueId: string; actorAccountId: string; action: string; entityId: string;
    previousValue: unknown; newValue: unknown; reason: string | null; occurredAt: Date;
  }): Promise<void>;
}

export interface PlayerAccessStore {
  transaction<T>(work: (transaction: PlayerAccessTransaction) => Promise<T>): Promise<T>;
}

export type PlayerAccessCommand =
  | {type: 'request'; actorAccountId: string; playerId: string}
  | {type: 'grant'; actorAccountId: string; playerId: string; userAccountId: string; reason?: string | null}
  | {type: 'approve' | 'revoke'; actorAccountId: string; relationshipId: string; reason?: string | null};

export function createPlayerAccessService(
  store: PlayerAccessStore,
  dependencies: {now?: () => Date; newId?: () => string} = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return (command: PlayerAccessCommand) => store.transaction(async (transaction) => {
    const occurredAt = now();
    if (command.type === 'request' || command.type === 'grant') {
      const player = await transaction.findPlayer(command.playerId);
      if (!player) throw new RuleViolation('player.exists', 'Player not found');
      const targetAccountId = command.type === 'request' ? command.actorAccountId : command.userAccountId;
      if (command.type === 'grant' && !await transaction.hasLeagueAdmin(player.leagueId, command.actorAccountId)) {
        throw new RuleViolation('player_management.admin_required', 'League Administrator authority required');
      }
      if (!await transaction.accountExists(targetAccountId)) {
        throw new RuleViolation('user_account.exists', 'User Account not found');
      }
      if (await transaction.hasActivePair(player.id, targetAccountId)) {
        throw new RuleViolation('player_management.active_pair_unique', 'An active request or grant already exists');
      }
      const relationshipId = newId();
      const status = command.type === 'grant' ? 'approved' : 'requested';
      await transaction.insertRelationship({
        id: relationshipId, playerId: player.id, userAccountId: targetAccountId,
        status, actorAccountId: command.actorAccountId, occurredAt
      });
      await transaction.appendAudit({
        id: newId(), leagueId: player.leagueId, actorAccountId: command.actorAccountId,
        action: `player_management.${status}`, entityId: relationshipId,
        previousValue: {}, newValue: {playerId: player.id, userAccountId: targetAccountId, status},
        reason: command.type === 'grant' ? command.reason?.trim() || null : null, occurredAt
      });
      return {relationshipId, status};
    }

    const relationship = await transaction.findRelationship(command.relationshipId);
    if (!relationship) throw new RuleViolation('player_management.exists', 'Relationship not found');
    if (!await transaction.hasLeagueAdmin(relationship.leagueId, command.actorAccountId)) {
      throw new RuleViolation('player_management.admin_required', 'League Administrator authority required');
    }
    const status = nextPlayerManagementStatus(relationship.status, command.type) as 'approved' | 'revoked';
    await transaction.transitionRelationship({
      relationshipId: relationship.id, expectedVersion: relationship.version, status,
      actorAccountId: command.actorAccountId, occurredAt
    });
    await transaction.appendAudit({
      id: newId(), leagueId: relationship.leagueId, actorAccountId: command.actorAccountId,
      action: `player_management.${status}`, entityId: relationship.id,
      previousValue: {status: relationship.status}, newValue: {status},
      reason: command.reason?.trim() || null, occurredAt
    });
    return {relationshipId: relationship.id, status};
  });
}

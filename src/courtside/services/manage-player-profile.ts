import {randomUUID} from 'node:crypto';

import {RuleViolation} from '@/courtside/core/errors';
import {normalizePlayerDisplayName} from '@/courtside/core/roster';
import type {ProfilePhotoType} from '@/courtside/core/player-profile';

export interface StoredPrivatePlayer {
  readonly id: string;
  readonly leagueId: string;
  readonly displayName: string;
  readonly version: number;
  readonly profilePhotoObjectKey: string | null;
  readonly profilePhotoContentType: ProfilePhotoType | null;
  readonly profilePhotoByteSize: number | null;
}

export interface PlayerProfileTransaction {
  findPlayer(playerId: string): Promise<StoredPrivatePlayer | null>;
  canManage(playerId: string, leagueId: string, accountId: string): Promise<boolean>;
  updateDisplayName(playerId: string, expectedVersion: number, displayName: string): Promise<void>;
  updatePhoto(playerId: string, expectedVersion: number, photo: {objectKey: string; contentType: ProfilePhotoType; byteSize: number; updatedAt: Date} | null): Promise<void>;
  appendAudit(input: {id: string; leagueId: string; actorAccountId: string; action: string; playerId: string; previousValue: unknown; newValue: unknown; occurredAt: Date}): Promise<void>;
}

export interface PlayerProfileStore {
  transaction<T>(work: (transaction: PlayerProfileTransaction) => Promise<T>): Promise<T>;
}

export type PlayerProfileCommand =
  | {type: 'rename'; actorAccountId: string; playerId: string; displayName: string}
  | {type: 'set_photo'; actorAccountId: string; playerId: string; objectKey: string; contentType: ProfilePhotoType; byteSize: number}
  | {type: 'clear_photo'; actorAccountId: string; playerId: string};

export function authorizePlayerProfileManagement(
  store: PlayerProfileStore,
  actorAccountId: string,
  playerId: string
) {
  return store.transaction(async (transaction) => {
    const player = await transaction.findPlayer(playerId);
    if (!player) throw new RuleViolation('player.exists', 'Player not found');
    if (!await transaction.canManage(player.id, player.leagueId, actorAccountId)) {
      throw new RuleViolation('player_profile.approved_authority', 'Approved Player management authority required');
    }
    return player;
  });
}

export function createPlayerProfileService(
  store: PlayerProfileStore,
  dependencies: {now?: () => Date; newId?: () => string} = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;
  return (command: PlayerProfileCommand) => store.transaction(async (transaction) => {
    const player = await transaction.findPlayer(command.playerId);
    if (!player) throw new RuleViolation('player.exists', 'Player not found');
    if (!await transaction.canManage(player.id, player.leagueId, command.actorAccountId)) {
      throw new RuleViolation('player_profile.approved_authority', 'Approved Player management authority required');
    }
    const occurredAt = now();
    if (command.type === 'rename') {
      const displayName = normalizePlayerDisplayName(command.displayName);
      await transaction.updateDisplayName(player.id, player.version, displayName);
      await transaction.appendAudit({id: newId(), leagueId: player.leagueId, actorAccountId: command.actorAccountId, action: 'player.display_name_updated', playerId: player.id, previousValue: {displayName: player.displayName}, newValue: {displayName}, occurredAt});
    } else {
      const photo = command.type === 'set_photo'
        ? {objectKey: command.objectKey, contentType: command.contentType, byteSize: command.byteSize, updatedAt: occurredAt}
        : null;
      await transaction.updatePhoto(player.id, player.version, photo);
      await transaction.appendAudit({id: newId(), leagueId: player.leagueId, actorAccountId: command.actorAccountId, action: command.type === 'set_photo' ? 'player.profile_photo_updated' : 'player.profile_photo_cleared', playerId: player.id, previousValue: {objectKey: player.profilePhotoObjectKey}, newValue: {objectKey: photo?.objectKey ?? null}, occurredAt});
    }
    return {previousPhotoObjectKey: player.profilePhotoObjectKey};
  });
}

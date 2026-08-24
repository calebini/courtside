import {randomUUID} from 'node:crypto';

import type {ProfilePhotoType, ValidatedProfilePhoto} from '@/courtside/core/player-profile';

import {
  authorizePlayerProfileManagement,
  createPlayerProfileService,
  type PlayerProfileStore
} from './manage-player-profile';

export interface PlayerPhotoStorage {
  upload(input: {objectKey: string; bytes: Uint8Array; contentType: ProfilePhotoType}): Promise<void>;
  createSignedUrl(objectKey: string, expiresInSeconds: number): Promise<string>;
  removeObject(objectKey: string): Promise<void>;
  removePlayerObjectsExcept(playerId: string, retainedObjectKey: string | null): Promise<void>;
}

export async function replacePlayerPhoto(
  store: PlayerProfileStore,
  storage: PlayerPhotoStorage,
  input: {actorAccountId: string; playerId: string; photo: ValidatedProfilePhoto},
  dependencies: {newId?: () => string} = {}
) {
  await authorizePlayerProfileManagement(store, input.actorAccountId, input.playerId);
  const objectKey = `${input.playerId}/${(dependencies.newId ?? randomUUID)()}.${input.photo.extension}`;
  await storage.upload({
    objectKey,
    bytes: input.photo.bytes,
    contentType: input.photo.contentType
  });

  try {
    await createPlayerProfileService(store)({
      type: 'set_photo',
      actorAccountId: input.actorAccountId,
      playerId: input.playerId,
      objectKey,
      contentType: input.photo.contentType,
      byteSize: input.photo.bytes.byteLength
    });
  } catch (error) {
    try {
      await storage.removeObject(objectKey);
    } catch {
      // The database remains authoritative; later reconciliation may remove this orphan.
    }
    throw error;
  }

  try {
    await storage.removePlayerObjectsExcept(input.playerId, objectKey);
  } catch {
    // The new database reference is authoritative; cleanup is deliberately best effort.
  }
  return {objectKey};
}

export async function clearPlayerPhoto(
  store: PlayerProfileStore,
  storage: PlayerPhotoStorage,
  input: {actorAccountId: string; playerId: string}
) {
  await createPlayerProfileService(store)({
    type: 'clear_photo',
    actorAccountId: input.actorAccountId,
    playerId: input.playerId
  });
  try {
    await storage.removePlayerObjectsExcept(input.playerId, null);
  } catch {
    // Clearing the database reference remains authoritative; cleanup is best effort.
  }
}

import {describe, expect, it, vi} from 'vitest';

import {RuleViolation} from '@/courtside/core/errors';
import type {PlayerPhotoStorage} from '@/courtside/services/manage-player-photo';
import {clearPlayerPhoto, replacePlayerPhoto} from '@/courtside/services/manage-player-photo';
import type {PlayerProfileStore, PlayerProfileTransaction} from '@/courtside/services/manage-player-profile';

function profileStore(canManage: boolean) {
  const transaction: PlayerProfileTransaction = {
    findPlayer: vi.fn(async () => ({
      id: 'player-1',
      leagueId: 'league-1',
      displayName: 'Player One',
      version: 0,
      profilePhotoObjectKey: 'player-1/old.png',
      profilePhotoContentType: 'image/png' as const,
      profilePhotoByteSize: 12
    })),
    canManage: vi.fn(async () => canManage),
    updateDisplayName: vi.fn(async () => undefined),
    updatePhoto: vi.fn(async () => undefined),
    appendAudit: vi.fn(async () => undefined)
  };
  const store: PlayerProfileStore = {
    transaction: async (work) => work(transaction)
  };
  return {store, transaction};
}

function photoStorage(): PlayerPhotoStorage {
  return {
    upload: vi.fn(async () => undefined),
    createSignedUrl: vi.fn(async () => 'signed'),
    removeObject: vi.fn(async () => undefined),
    removePlayerObjectsExcept: vi.fn(async () => undefined)
  };
}

describe('server-mediated Player photos', () => {
  it('authorizes before privileged upload and rechecks authority during persistence', async () => {
    const {store, transaction} = profileStore(true);
    const storage = photoStorage();
    await replacePlayerPhoto(store, storage, {
      actorAccountId: 'account-1',
      playerId: 'player-1',
      photo: {
        bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
        contentType: 'image/jpeg',
        extension: 'jpg'
      }
    }, {newId: () => 'new-object'});

    expect(transaction.canManage).toHaveBeenCalledTimes(2);
    expect(storage.upload).toHaveBeenCalledWith({
      objectKey: 'player-1/new-object.jpg',
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
      contentType: 'image/jpeg'
    });
    expect(transaction.updatePhoto).toHaveBeenCalled();
    expect(storage.removePlayerObjectsExcept).toHaveBeenCalledWith('player-1', 'player-1/new-object.jpg');
  });

  it('never calls privileged Storage when application authority is absent', async () => {
    const {store} = profileStore(false);
    const storage = photoStorage();
    await expect(replacePlayerPhoto(store, storage, {
      actorAccountId: 'account-1',
      playerId: 'player-1',
      photo: {bytes: new Uint8Array([1]), contentType: 'image/png', extension: 'png'}
    })).rejects.toBeInstanceOf(RuleViolation);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('removes only the new object when the authoritative database write fails', async () => {
    const {store, transaction} = profileStore(true);
    const storage = photoStorage();
    vi.mocked(transaction.updatePhoto).mockRejectedValueOnce(new Error('database unavailable'));
    await expect(replacePlayerPhoto(store, storage, {
      actorAccountId: 'account-1',
      playerId: 'player-1',
      photo: {bytes: new Uint8Array([1]), contentType: 'image/png', extension: 'png'}
    }, {newId: () => 'new-object'})).rejects.toThrow('database unavailable');
    expect(storage.removeObject).toHaveBeenCalledWith('player-1/new-object.png');
    expect(storage.removePlayerObjectsExcept).not.toHaveBeenCalled();
  });

  it('clears the authoritative reference before pruning the private folder', async () => {
    const {store, transaction} = profileStore(true);
    const storage = photoStorage();
    await clearPlayerPhoto(store, storage, {actorAccountId: 'account-1', playerId: 'player-1'});
    expect(transaction.updatePhoto).toHaveBeenCalledWith('player-1', 0, null);
    expect(storage.removePlayerObjectsExcept).toHaveBeenCalledWith('player-1', null);
  });
});

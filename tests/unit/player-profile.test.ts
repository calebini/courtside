import {describe, expect, it} from 'vitest';

import {RuleViolation} from '../../src/courtside/core/errors';
import {
  MAX_PROFILE_PHOTO_BYTES,
  nextPlayerManagementStatus,
  validateProfilePhoto
} from '../../src/courtside/core/player-profile';
import {processPlayerAccessBatch} from '../../src/courtside/services/manage-player-access';

describe('private Player profiles', () => {
  it('accepts supported signatures only when the declared type agrees', () => {
    expect(validateProfilePhoto(new Uint8Array([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg')).toMatchObject({contentType: 'image/jpeg', extension: 'jpg'});
    expect(validateProfilePhoto(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png')).toMatchObject({contentType: 'image/png', extension: 'png'});
    expect(validateProfilePhoto(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), 'image/webp')).toMatchObject({contentType: 'image/webp', extension: 'webp'});
    expect(() => validateProfilePhoto(new Uint8Array([0xff, 0xd8, 0xff]), 'image/png')).toThrow(
      expect.objectContaining({rule: 'player_profile.photo_type'})
    );
  });

  it('rejects empty and oversized profile photos', () => {
    expect(() => validateProfilePhoto(new Uint8Array(), 'image/png')).toThrow(
      expect.objectContaining({rule: 'player_profile.photo_size'})
    );
    expect(() => validateProfilePhoto(new Uint8Array(MAX_PROFILE_PHOTO_BYTES + 1), 'image/png')).toThrow(
      expect.objectContaining({rule: 'player_profile.photo_size'})
    );
  });

  it('accepts a valid PNG at the size of the reported upload', () => {
    const reportedUpload = new Uint8Array(245633);
    reportedUpload.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(validateProfilePhoto(reportedUpload, 'image/png')).toMatchObject({
      contentType: 'image/png',
      extension: 'png'
    });
  });

  it('allows only requested-to-approved and active-to-revoked transitions', () => {
    expect(nextPlayerManagementStatus('requested', 'approve')).toBe('approved');
    expect(nextPlayerManagementStatus('requested', 'revoke')).toBe('revoked');
    expect(nextPlayerManagementStatus('requested', 'decline')).toBe('revoked');
    expect(nextPlayerManagementStatus('approved', 'revoke')).toBe('revoked');
    expect(() => nextPlayerManagementStatus('approved', 'approve')).toThrow(RuleViolation);
    expect(() => nextPlayerManagementStatus('approved', 'decline')).toThrow(RuleViolation);
    expect(() => nextPlayerManagementStatus('revoked', 'revoke')).toThrow(RuleViolation);
  });

  it('processes selected access decisions independently and deduplicates retries', async () => {
    const accepted: string[] = [];
    const result = await processPlayerAccessBatch(
      async (command) => {
        if ('relationshipId' in command && command.relationshipId === 'stale') throw new Error('stale');
        if ('relationshipId' in command) accepted.push(command.relationshipId);
      },
      {
        type: 'approve',
        actorAccountId: 'admin',
        relationshipIds: ['first', 'stale', 'first', 'second']
      }
    );

    expect(accepted).toEqual(['first', 'second']);
    expect(result).toEqual({attempted: 3, succeeded: 2, failed: 1});
  });

  it('bounds access batches', async () => {
    await expect(processPlayerAccessBatch(async () => undefined, {
      type: 'decline',
      actorAccountId: 'admin',
      relationshipIds: []
    })).rejects.toBeInstanceOf(RuleViolation);
  });
});

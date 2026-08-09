import {RuleViolation} from './errors';

export const MAX_PROFILE_PHOTO_BYTES = 1024 * 1024;

export type ProfilePhotoType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ValidatedProfilePhoto {
  readonly bytes: Uint8Array;
  readonly contentType: ProfilePhotoType;
  readonly extension: 'jpg' | 'png' | 'webp';
}

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function validateProfilePhoto(bytes: Uint8Array, declaredType: string): ValidatedProfilePhoto {
  if (bytes.byteLength < 1 || bytes.byteLength > MAX_PROFILE_PHOTO_BYTES) {
    throw new RuleViolation(
      'player_profile.photo_size',
      'A profile photo must contain between 1 byte and 1 MiB'
    );
  }

  let detected: ProfilePhotoType | null = null;
  let extension: ValidatedProfilePhoto['extension'] | null = null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    detected = 'image/jpeg';
    extension = 'jpg';
  } else if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    detected = 'image/png';
    extension = 'png';
  } else if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    detected = 'image/webp';
    extension = 'webp';
  }

  if (!detected || detected !== declaredType || !extension) {
    throw new RuleViolation(
      'player_profile.photo_type',
      'A profile photo must be a JPEG, PNG, or WebP whose content matches its declared type'
    );
  }
  return {bytes, contentType: detected, extension};
}

export type PlayerManagementStatus = 'requested' | 'approved' | 'revoked';

export function nextPlayerManagementStatus(
  current: PlayerManagementStatus,
  requested: 'approve' | 'revoke'
): PlayerManagementStatus {
  if (current === 'revoked' || (current === 'approved' && requested === 'approve')) {
    throw new RuleViolation(
      'player_management.valid_transition',
      `Cannot ${requested} a ${current} Player Management Relationship`
    );
  }
  return requested === 'approve' ? 'approved' : 'revoked';
}

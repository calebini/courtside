import 'server-only';

import sharp, {type Metadata} from 'sharp';

import {RuleViolation} from '@/courtside/core/errors';
import {
  MAX_PROFILE_PHOTO_BYTES,
  type ProfilePhotoType,
  type ValidatedProfilePhoto,
  validateProfilePhoto
} from '@/courtside/core/player-profile';

const MAX_PROFILE_PHOTO_PIXELS = 16_000_000;

const decodedFormats: Record<string, {contentType: ProfilePhotoType; extension: ValidatedProfilePhoto['extension']}> = {
  jpeg: {contentType: 'image/jpeg', extension: 'jpg'},
  png: {contentType: 'image/png', extension: 'png'},
  webp: {contentType: 'image/webp', extension: 'webp'}
};

function invalidType(): never {
  throw new RuleViolation(
    'player_profile.photo_type',
    'A profile photo must be a decodable JPEG, PNG, or WebP whose content matches its declared type'
  );
}

export async function processProfilePhoto(
  bytes: Uint8Array,
  declaredType: string
): Promise<ValidatedProfilePhoto> {
  if (bytes.byteLength < 1 || bytes.byteLength > MAX_PROFILE_PHOTO_BYTES) {
    throw new RuleViolation(
      'player_profile.photo_size',
      'A profile photo must contain between 1 byte and 1 MiB'
    );
  }

  const input = Buffer.from(bytes);
  let metadata: Metadata;
  try {
    metadata = await sharp(input, {
      failOn: 'warning',
      limitInputPixels: MAX_PROFILE_PHOTO_PIXELS,
      sequentialRead: true
    }).metadata();
  } catch {
    invalidType();
  }

  const decoded = metadata.format ? decodedFormats[metadata.format] : null;
  if (!decoded || decoded.contentType !== declaredType) invalidType();

  let pipeline = sharp(input, {
    failOn: 'warning',
    limitInputPixels: MAX_PROFILE_PHOTO_PIXELS,
    sequentialRead: true
  }).rotate();
  if (metadata.format === 'jpeg') pipeline = pipeline.jpeg({quality: 85, mozjpeg: true});
  if (metadata.format === 'png') pipeline = pipeline.png({compressionLevel: 9});
  if (metadata.format === 'webp') pipeline = pipeline.webp({quality: 85});

  try {
    const encoded = new Uint8Array(await pipeline.toBuffer());
    return validateProfilePhoto(encoded, decoded.contentType);
  } catch (error) {
    if (error instanceof RuleViolation) throw error;
    invalidType();
  }
}

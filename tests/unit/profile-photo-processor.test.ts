import sharp from 'sharp';
import {describe, expect, it} from 'vitest';

import {processProfilePhoto} from '@/courtside/adapters/images/sharp-profile-photo-processor';

describe('profile photo decoding and canonicalization', () => {
  it('decodes, normalizes, re-encodes, and strips metadata', async () => {
    const source = await sharp({
      create: {width: 2, height: 3, channels: 3, background: '#b6422d'}
    }).jpeg().withMetadata({orientation: 6}).toBuffer();

    const result = await processProfilePhoto(source, 'image/jpeg');
    const metadata = await sharp(result.bytes).metadata();
    expect(result).toMatchObject({contentType: 'image/jpeg', extension: 'jpg'});
    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(3);
    expect(metadata.height).toBe(2);
    expect(metadata.exif).toBeUndefined();
  });

  it('rejects malformed content even when its signature and declaration look valid', async () => {
    await expect(processProfilePhoto(
      new Uint8Array([0xff, 0xd8, 0xff, 0x00]),
      'image/jpeg'
    )).rejects.toMatchObject({rule: 'player_profile.photo_type'});
  });

  it('rejects decoded content that disagrees with the declared type', async () => {
    const png = await sharp({
      create: {width: 1, height: 1, channels: 4, background: '#00000000'}
    }).png().toBuffer();
    await expect(processProfilePhoto(png, 'image/webp')).rejects.toMatchObject({
      rule: 'player_profile.photo_type'
    });
  });
});

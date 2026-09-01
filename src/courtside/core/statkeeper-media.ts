import {RuleViolation} from './errors';

const PROVIDER_ASSET_ID = /^[A-Za-z0-9_-]{1,128}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be'
]);

export type YouTubeMediaReference =
  | {readonly kind: 'provider_asset_id'; readonly value: string}
  | {readonly kind: 'url'; readonly value: string};

export interface NormalizedGameMediaIdentity {
  readonly provider: 'youtube';
  readonly providerAssetId: string;
  readonly originalReference: string;
}

function normalizeAssetId(value: unknown) {
  if (typeof value !== 'string') {
    throw new RuleViolation('statkeeper.media.asset_identity', 'YouTube asset identity must be text');
  }
  const normalized = value.trim();
  if (!PROVIDER_ASSET_ID.test(normalized)) {
    throw new RuleViolation(
      'statkeeper.media.asset_identity',
      'YouTube asset identity contains unsupported characters or length'
    );
  }
  return normalized;
}

/**
 * Resolve the supported YouTube reference forms without network access. The provider asset
 * identity, not a generated URL, is the durable Media identity.
 */
export function normalizeYouTubeMediaReference(
  reference: YouTubeMediaReference
): NormalizedGameMediaIdentity {
  if (!reference || typeof reference !== 'object') {
    throw new RuleViolation('statkeeper.media.reference', 'YouTube Media reference is required');
  }
  if (reference.kind === 'provider_asset_id') {
    const value = normalizeAssetId(reference.value);
    return {provider: 'youtube', providerAssetId: value, originalReference: value};
  }
  if (reference.kind !== 'url' || typeof reference.value !== 'string') {
    throw new RuleViolation('statkeeper.media.reference', 'YouTube Media reference kind is unsupported');
  }
  const originalReference = reference.value.trim();
  if (!originalReference || originalReference.length > 2048) {
    throw new RuleViolation(
      'statkeeper.media.url',
      'YouTube Media URL must contain 1 through 2048 characters'
    );
  }
  let url: URL;
  try {
    url = new URL(originalReference);
  } catch {
    throw new RuleViolation('statkeeper.media.url', 'YouTube Media URL is invalid');
  }
  if (
    url.protocol !== 'https:'
    || url.port !== ''
    || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())
  ) {
    throw new RuleViolation('statkeeper.media.url', 'YouTube Media URL must use a supported HTTPS host');
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);
  let assetId: string | null = null;
  if (host === 'youtu.be') {
    assetId = segments[0] ?? null;
  } else if (url.pathname === '/watch') {
    assetId = url.searchParams.get('v');
  } else if (segments[0] === 'embed') {
    assetId = segments[1] ?? null;
  }
  if (!assetId) {
    throw new RuleViolation('statkeeper.media.url', 'YouTube Media URL form is unsupported');
  }
  return {
    provider: 'youtube',
    providerAssetId: normalizeAssetId(assetId),
    originalReference
  };
}

import {describe, expect, it} from 'vitest';

import {normalizeYouTubeMediaReference} from '@/courtside/core/statkeeper-media';

describe('Statkeeper YouTube Media normalization', () => {
  it.each([
    'https://www.youtube.com/watch?v=abc_DEF-123',
    'https://youtu.be/abc_DEF-123?t=42',
    'https://www.youtube-nocookie.com/embed/abc_DEF-123'
  ])('resolves %s to one provider-neutral identity', (value) => {
    expect(normalizeYouTubeMediaReference({kind: 'url', value})).toMatchObject({
      provider: 'youtube',
      providerAssetId: 'abc_DEF-123',
      originalReference: value
    });
  });

  it('accepts a provider asset identity and rejects unsupported hosts or URL forms', () => {
    expect(normalizeYouTubeMediaReference({kind: 'provider_asset_id', value: 'abc_DEF-123'}))
      .toEqual({
        provider: 'youtube',
        providerAssetId: 'abc_DEF-123',
        originalReference: 'abc_DEF-123'
      });
    expect(() => normalizeYouTubeMediaReference({kind: 'url', value: 'https://example.com/watch?v=x'}))
      .toThrow(/supported HTTPS host/);
    expect(() => normalizeYouTubeMediaReference({kind: 'url', value: 'https://youtube.com/shorts/x'}))
      .toThrow(/URL form is unsupported/);
  });
});

import {describe, expect, it} from 'vitest';

import {TemporalScheduledInstantResolver} from '@/courtside/adapters/temporal/scheduled-instant-resolver';

describe('League-local scheduled instant resolution', () => {
  const resolver = new TemporalScheduledInstantResolver();

  it('resolves a normal League-local wall time to one instant', () => {
    expect(
      resolver.resolve('2026-08-15T18:00', 'America/Los_Angeles')?.toISOString()
    ).toBe('2026-08-16T01:00:00.000Z');
  });

  it('rejects a nonexistent daylight-saving gap time', () => {
    expect(resolver.resolve('2026-03-08T02:30', 'America/Los_Angeles')).toBeNull();
  });

  it('rejects an ambiguous daylight-saving overlap time', () => {
    expect(resolver.resolve('2026-11-01T01:30', 'America/Los_Angeles')).toBeNull();
  });

  it('rejects malformed input and unsupported timezone identifiers', () => {
    expect(resolver.resolve('not-a-date', 'America/Los_Angeles')).toBeNull();
    expect(resolver.resolve('2026-08-15T18:00', 'Mars/Olympus_Mons')).toBeNull();
  });
});

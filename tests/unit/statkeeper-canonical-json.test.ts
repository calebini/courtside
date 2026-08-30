import {describe, expect, it} from 'vitest';

import {
  statkeeperCanonicalBytes,
  statkeeperCanonicalHash,
  statkeeperCanonicalJson
} from '@/courtside/core/statkeeper-canonical-json';

describe('Statkeeper canonical JSON', () => {
  it('preserves exact RFC 8785 text, UTF-8 bytes, and SHA-256 identity', () => {
    const value = {
      z: null,
      note: 'é "tir" \\ ligne\n',
      array: [0, true, 'français'],
      a: {omitted_is_not_present: 'présent'}
    };

    const canonical =
      '{"a":{"omitted_is_not_present":"présent"},"array":[0,true,"français"],"note":"é \\"tir\\" \\\\ ligne\\n","z":null}';
    expect(statkeeperCanonicalJson(value)).toBe(canonical);
    expect(Buffer.from(statkeeperCanonicalBytes(value)).toString('hex')).toBe(
      Buffer.from(canonical, 'utf8').toString('hex')
    );
    expect(statkeeperCanonicalHash(value)).toBe(
      'e2c3278df1915079495b384b26684ae74d0a78ff85cd2e029426f43d0c56094d'
    );
  });

  it('rejects unsafe numbers, undefined values, and unpaired surrogates', () => {
    expect(() => statkeeperCanonicalJson({value: Number.MAX_SAFE_INTEGER + 1})).toThrow(
      /safe integer/
    );
    expect(() => statkeeperCanonicalJson({value: undefined})).toThrow(/cannot be canonicalized/);
    expect(() => statkeeperCanonicalJson({value: '\ud800'})).toThrow(/unpaired/);
  });
});

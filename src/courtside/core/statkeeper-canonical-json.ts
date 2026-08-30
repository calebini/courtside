import {createHash} from 'node:crypto';

import {RuleViolation} from './errors';

export type StatkeeperJsonPrimitive = string | number | boolean | null;
export type StatkeeperJsonValue =
  | StatkeeperJsonPrimitive
  | readonly StatkeeperJsonValue[]
  | {[key: string]: StatkeeperJsonValue};

function assertUnicodeScalarString(value: string, path: string) {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new RuleViolation(
          'statkeeper.canonical_json.unicode',
          `${path} contains an unpaired UTF-16 surrogate`
        );
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new RuleViolation(
        'statkeeper.canonical_json.unicode',
        `${path} contains an unpaired UTF-16 surrogate`
      );
    }
  }
}

function normalize(value: unknown, path: string): StatkeeperJsonValue {
  if (value === null || typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    assertUnicodeScalarString(value, path);
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new RuleViolation(
        'statkeeper.canonical_json.number',
        `${path} must be a safe integer`
      );
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => normalize(item, `${path}[${index}]`));
  }

  if (typeof value === 'object' && value !== null) {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new RuleViolation(
        'statkeeper.canonical_json.shape',
        `${path} must be a plain JSON object`
      );
    }
    const record = value as Record<string, unknown>;
    const normalized: {[key: string]: StatkeeperJsonValue} = {};
    for (const key of Object.keys(record).sort()) {
      assertUnicodeScalarString(key, `${path} property name`);
      normalized[key] = normalize(record[key], `${path}.${key}`);
    }
    return normalized;
  }

  throw new RuleViolation(
    'statkeeper.canonical_json.shape',
    `${path} contains a value that cannot be canonicalized`
  );
}

/**
 * Serialize the constrained Statkeeper value domain using RFC 8785 ordering,
 * escaping, number rendering, and UTF-8-compatible scalar-string rules.
 */
export function statkeeperCanonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value, '$'));
}

export function statkeeperCanonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(statkeeperCanonicalJson(value));
}

export function statkeeperCanonicalHash(value: unknown): string {
  return createHash('sha256').update(statkeeperCanonicalJson(value), 'utf8').digest('hex');
}

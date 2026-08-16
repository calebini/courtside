import {RuleViolation} from './errors';

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;

function normalizeVisibleText(
  value: string,
  input: {field: string; rule: string; minimum: number; maximum: number}
) {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (
    normalized.length < input.minimum ||
    normalized.length > input.maximum ||
    CONTROL_CHARACTERS.test(normalized)
  ) {
    throw new RuleViolation(
      input.rule,
      `${input.field} must contain ${input.minimum} through ${input.maximum} visible characters`
    );
  }
  return normalized;
}

export function normalizeVenueName(value: string) {
  return normalizeVisibleText(value, {
    field: 'A Venue name',
    rule: 'venue.name',
    minimum: 2,
    maximum: 120
  });
}

export function normalizeVenueAddress(value: string) {
  return normalizeVisibleText(value, {
    field: 'A Venue address',
    rule: 'venue.address',
    minimum: 2,
    maximum: 240
  });
}

export function normalizeVenueNotes(value: string | null) {
  const normalized = value?.trim().replace(/\s+/gu, ' ') ?? '';
  if (normalized === '') {
    return null;
  }
  if (normalized.length > 1_000 || CONTROL_CHARACTERS.test(normalized)) {
    throw new RuleViolation(
      'venue.notes',
      'Venue notes must contain at most 1,000 visible characters'
    );
  }
  return normalized;
}

export function normalizeVenueDetails(input: {
  readonly name: string;
  readonly address: string;
  readonly notes: string | null;
}) {
  return {
    name: normalizeVenueName(input.name),
    address: normalizeVenueAddress(input.address),
    notes: normalizeVenueNotes(input.notes)
  };
}

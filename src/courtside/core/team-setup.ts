import {RuleViolation} from './errors';

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;

export function normalizeTeamName(value: string) {
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 120 || CONTROL_CHARACTERS.test(name)) {
    throw new RuleViolation(
      'team.name',
      'A Team name must contain 2 through 120 visible characters'
    );
  }
  return name;
}

export function normalizeTeamNameBatch(values: readonly string[]) {
  const names: string[] = [];
  const identities = new Set<string>();
  for (const value of values) {
    if (value.trim() === '') {
      continue;
    }
    const name = normalizeTeamName(value);
    const identity = name.toLowerCase();
    if (!identities.has(identity)) {
      identities.add(identity);
      names.push(name);
    }
  }

  if (names.length === 0) {
    throw new RuleViolation('team.batch_required', 'Enter at least one Team name');
  }
  if (names.length > 64) {
    throw new RuleViolation('team.batch_limit', 'A Team batch may contain at most 64 names');
  }
  return names;
}

import {RuleViolation} from './errors';
import {statkeeperCanonicalHash} from './statkeeper-canonical-json';

export interface StatkeeperPossessionSequence {
  readonly sequenceId: string;
  readonly possessingSeasonTeamId: string;
  readonly startMediaOffsetMs: number;
  readonly endMediaOffsetMs: number | null;
  readonly endingReasonKey: string | null;
  readonly transitionKind: 'manual' | 'automatic';
  readonly causingOccurrenceId: string | null;
  readonly causingOccurrenceRevisionId: string | null;
}

export interface StatkeeperPossessionContext {
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
}

export function possessionUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new RuleViolation('statkeeper.possession.identity', `${label} must be a UUID`);
  }
  return value.toLowerCase();
}

export function possessionOffset(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RuleViolation('statkeeper.possession.offset', 'Media offset must be a nonnegative safe integer');
  }
  return value as number;
}

/** Returns canonical start-time/identity order; explicit nulls remain part of the basis. */
export function normalizePossessionSequences(input: unknown): StatkeeperPossessionSequence[] {
  if (!Array.isArray(input)) throw new RuleViolation('statkeeper.possession.basis', 'Possession basis must be an array');
  const sequences = input.map((raw): StatkeeperPossessionSequence => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new RuleViolation('statkeeper.possession.basis', 'Each Possession Sequence must be an object');
    }
    const startMediaOffsetMs = possessionOffset(raw.startMediaOffsetMs);
    const endMediaOffsetMs = raw.endMediaOffsetMs === null ? null : possessionOffset(raw.endMediaOffsetMs);
    const endingReasonKey = raw.endingReasonKey;
    if (endingReasonKey !== null && (typeof endingReasonKey !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(endingReasonKey))) {
      throw new RuleViolation('statkeeper.possession.ending_reason', 'Ending reason must be a canonical key or null');
    }
    if ((endMediaOffsetMs === null && endingReasonKey !== null)
      || (endMediaOffsetMs !== null && endMediaOffsetMs < startMediaOffsetMs)) {
      throw new RuleViolation('statkeeper.possession.interval', 'Possession interval or open-sequence ending reason is invalid');
    }
    if (!['manual', 'automatic'].includes(raw.transitionKind)) {
      throw new RuleViolation('statkeeper.possession.transition', 'Possession transition kind is unsupported');
    }
    const causingOccurrenceId = raw.causingOccurrenceId === null ? null : possessionUuid(raw.causingOccurrenceId, 'Causing occurrence');
    const causingOccurrenceRevisionId = raw.causingOccurrenceRevisionId === null ? null : possessionUuid(raw.causingOccurrenceRevisionId, 'Causing occurrence revision');
    if (raw.transitionKind === 'manual'
      ? causingOccurrenceId !== null || causingOccurrenceRevisionId !== null
      : causingOccurrenceId === null || causingOccurrenceRevisionId === null) {
      throw new RuleViolation('statkeeper.possession.cause', 'Only automatic transitions must identify their causing occurrence and revision');
    }
    return {
      sequenceId: possessionUuid(raw.sequenceId, 'Possession Sequence'),
      possessingSeasonTeamId: possessionUuid(raw.possessingSeasonTeamId, 'Possessing Team'),
      startMediaOffsetMs, endMediaOffsetMs, endingReasonKey, transitionKind: raw.transitionKind,
      causingOccurrenceId, causingOccurrenceRevisionId
    };
  }).sort((left, right) => left.startMediaOffsetMs - right.startMediaOffsetMs
    || (left.sequenceId < right.sequenceId ? -1 : left.sequenceId > right.sequenceId ? 1 : 0));
  if (new Set(sequences.map((sequence) => sequence.sequenceId)).size !== sequences.length) {
    throw new RuleViolation('statkeeper.possession.identity', 'Possession Sequence identities must be unique within a basis');
  }
  const open = sequences.filter((sequence) => sequence.endMediaOffsetMs === null);
  if (open.length > 1) throw new RuleViolation('statkeeper.possession.one_open', 'At most one Possession Sequence may be open');
  let previousEnd = 0;
  // At a shared timestamp, validate zero-duration closures before a longer interval.
  // Storage/hash ordering remains the specified start-time/identity order.
  const closed = sequences.filter((item) => item.endMediaOffsetMs !== null)
    .sort((left, right) => left.startMediaOffsetMs - right.startMediaOffsetMs || left.endMediaOffsetMs! - right.endMediaOffsetMs!);
  for (const sequence of closed) {
    if (sequence.startMediaOffsetMs < previousEnd || (open[0] && sequence.endMediaOffsetMs! > open[0].startMediaOffsetMs)) {
      throw new RuleViolation('statkeeper.possession.overlap', 'Canonical Possession Sequences must not overlap');
    }
    previousEnd = sequence.endMediaOffsetMs!;
  }
  return sequences;
}

export function assertPossessionTeams(context: StatkeeperPossessionContext, sequences: readonly StatkeeperPossessionSequence[]) {
  for (const sequence of sequences) {
    if (![context.homeSeasonTeamId, context.awaySeasonTeamId].includes(sequence.possessingSeasonTeamId)) {
      throw new RuleViolation('statkeeper.possession.team', 'Possession must belong to a participating Season Team');
    }
  }
}

export function possessionBasisValue(sequences: readonly StatkeeperPossessionSequence[]) {
  return normalizePossessionSequences(sequences).map((sequence) => ({
    sequence_id: sequence.sequenceId,
    possessing_season_team_id: sequence.possessingSeasonTeamId,
    start_media_offset_ms: sequence.startMediaOffsetMs,
    end_media_offset_ms: sequence.endMediaOffsetMs,
    ending_reason_key: sequence.endingReasonKey,
    transition_kind: sequence.transitionKind,
    causing_occurrence_id: sequence.causingOccurrenceId,
    causing_occurrence_revision_id: sequence.causingOccurrenceRevisionId
  }));
}

export function possessionBasisHash(sequences: readonly StatkeeperPossessionSequence[]) {
  return statkeeperCanonicalHash({format: 'courtside.statkeeper.possession-basis/v1', sequences: possessionBasisValue(sequences)});
}

export function setCurrentPossession(input: {
  readonly context: StatkeeperPossessionContext;
  readonly sequences: readonly StatkeeperPossessionSequence[];
  readonly sequenceId: string;
  readonly seasonTeamId: string;
  readonly mediaOffsetMs: number;
  readonly automaticCause?: {readonly occurrenceId: string; readonly occurrenceRevisionId: string};
}): StatkeeperPossessionSequence[] {
  const sequences = normalizePossessionSequences(input.sequences);
  const open = sequences.find((sequence) => sequence.endMediaOffsetMs === null);
  const at = possessionOffset(input.mediaOffsetMs);
  const seasonTeamId = possessionUuid(input.seasonTeamId, 'Possessing Team');
  if (open?.possessingSeasonTeamId === seasonTeamId) {
    throw new RuleViolation('statkeeper.possession.no_change', 'This Team already has current possession; use explicit correction to change the timeline');
  }
  if (input.automaticCause && !open) {
    throw new RuleViolation('statkeeper.possession.open_required', 'Automatic switching requires an established possession');
  }
  const next = normalizePossessionSequences([
    ...sequences.map((sequence) => sequence === open ? {
      ...sequence, endMediaOffsetMs: at,
      endingReasonKey: input.automaticCause ? 'automatic_switch' : 'manual_switch'
    } : sequence),
    {
      sequenceId: input.sequenceId, possessingSeasonTeamId: seasonTeamId, startMediaOffsetMs: at,
      endMediaOffsetMs: null, endingReasonKey: null,
      transitionKind: input.automaticCause ? 'automatic' : 'manual',
      causingOccurrenceId: input.automaticCause?.occurrenceId ?? null,
      causingOccurrenceRevisionId: input.automaticCause?.occurrenceRevisionId ?? null
    }
  ]);
  assertPossessionTeams(input.context, next);
  return next;
}

export function correctPossessionBasis(input: {
  readonly context: StatkeeperPossessionContext;
  readonly previous: readonly StatkeeperPossessionSequence[];
  readonly replacement: readonly StatkeeperPossessionSequence[];
}): StatkeeperPossessionSequence[] {
  const previous = normalizePossessionSequences(input.previous);
  const replacement = normalizePossessionSequences(input.replacement);
  assertPossessionTeams(input.context, replacement);
  for (const sequence of replacement.filter((item) => item.transitionKind === 'automatic')) {
    const original = previous.find((item) => item.sequenceId === sequence.sequenceId);
    if (!original || original.transitionKind !== 'automatic'
      || original.causingOccurrenceId !== sequence.causingOccurrenceId
      || original.causingOccurrenceRevisionId !== sequence.causingOccurrenceRevisionId
      || original.possessingSeasonTeamId !== sequence.possessingSeasonTeamId
      || original.startMediaOffsetMs !== sequence.startMediaOffsetMs) {
      throw new RuleViolation('statkeeper.possession.automatic_provenance', 'An overridden transition must be declared manual; corrections cannot invent or alter automatic provenance');
    }
  }
  if (possessionBasisHash(previous) === possessionBasisHash(replacement)) {
    throw new RuleViolation('statkeeper.possession.no_change', 'Possession correction must change the current basis');
  }
  return replacement;
}

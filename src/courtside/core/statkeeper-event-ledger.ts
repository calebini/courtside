import {createHash} from 'node:crypto';

import {RuleViolation} from './errors';
import {
  statkeeperCanonicalHash,
  statkeeperCanonicalJson,
  type StatkeeperJsonValue
} from './statkeeper-canonical-json';

export const STATKEEPER_LEDGER_RECORD_FORMAT =
  'courtside.statkeeper.occurrence-ledger/v1';

const STATKEEPER_IDENTITY_NAMESPACE = '3b1c1247-a516-5c0e-9e1a-3a5ddf6f158f';
const CANONICAL_KEY = /^[a-z][a-z0-9_]{0,63}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function compareCanonicalStrings(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export type StatkeeperPeriod =
  | {readonly kind: 'regulation'; readonly ordinal: number}
  | {readonly kind: 'overtime'; readonly ordinal: number};

export type StatkeeperClockAnnotation =
  | {readonly state: 'exact'; readonly remainingMs: number}
  | {readonly state: 'estimated'; readonly remainingMs: number; readonly reason?: string | null}
  | {readonly state: 'unavailable'; readonly reason: string};

export interface StatkeeperEvidenceWindow {
  readonly startMs: number;
  readonly endMs: number;
}

export interface StatkeeperEventAssignmentInput {
  readonly roleKey: string;
  readonly rosterMembershipId: string;
}

export interface StatkeeperExpandedEventInput {
  readonly eventKey: string;
  readonly outcomeKey: string;
  readonly seasonTeamId: string;
  readonly assignments: readonly StatkeeperEventAssignmentInput[];
}

export interface StatkeeperOccurrenceInput {
  readonly occurrenceId: string;
  /** Present for the production Capture Action path; absent for the internal expanded-ledger port. */
  readonly captureActionKey?: string | null;
  readonly evidenceTimestampMs: number;
  readonly evidenceWindow: StatkeeperEvidenceWindow | null;
  readonly period: StatkeeperPeriod;
  readonly clock: StatkeeperClockAnnotation;
  readonly events: readonly StatkeeperExpandedEventInput[];
  readonly operatorNote: string | null;
}

export interface StatkeeperContributionDefinition {
  readonly statKey: string;
  readonly increment: number;
}

export interface StatkeeperOutcomeDefinition {
  readonly outcomeKey: string;
  readonly contributions: readonly StatkeeperContributionDefinition[];
}

export interface StatkeeperEventDefinition {
  readonly eventKey: string;
  readonly participantRoleKeys: readonly string[];
  readonly outcomes: readonly StatkeeperOutcomeDefinition[];
}

export interface StatkeeperLedgerParticipant {
  readonly rosterMembershipId: string;
  readonly playerId: string;
  readonly seasonTeamId: string;
  readonly participationStatus: 'appeared' | 'did_not_play';
}

export interface StatkeeperLedgerContext {
  readonly captureSessionId: string;
  readonly gameId: string;
  readonly profileVersionId: string;
  readonly profileContentHash: string;
  readonly mediaId: string;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly regulationPeriodCount: number;
  readonly regulationPeriodDurationMs: number;
  readonly overtimePeriodDurationMs: number;
  readonly eventDefinitions: readonly StatkeeperEventDefinition[];
  readonly participants: readonly StatkeeperLedgerParticipant[];
}

export interface NormalizedStatkeeperOccurrenceInput {
  readonly occurrenceId: string;
  readonly captureActionKey: string | null;
  readonly evidenceTimestampMs: number;
  readonly evidenceWindow: StatkeeperEvidenceWindow | null;
  readonly period: StatkeeperPeriod;
  readonly clock:
    | {readonly state: 'exact'; readonly remainingMs: number; readonly reason: null}
    | {readonly state: 'estimated'; readonly remainingMs: number; readonly reason: string | null}
    | {readonly state: 'unavailable'; readonly remainingMs: null; readonly reason: string};
  readonly events: readonly {
    readonly eventKey: string;
    readonly outcomeKey: string;
    readonly seasonTeamId: string;
    readonly assignments: readonly StatkeeperEventAssignmentInput[];
  }[];
  readonly operatorNote: string | null;
}

export interface StatkeeperLedgerEventRecord {
  readonly id: string;
  readonly emissionOrdinal: number;
  readonly eventKey: string;
  readonly outcomeKey: string;
  readonly seasonTeamId: string;
  readonly contentHash: string;
  readonly assignments: readonly {
    readonly roleKey: string;
    readonly rosterMembershipId: string;
    readonly playerId: string;
    readonly seasonTeamId: string;
  }[];
  readonly contributions: readonly {
    readonly statKey: string;
    readonly increment: number;
  }[];
}

export interface StatkeeperOccurrenceLedgerRecord {
  readonly occurrenceId: string;
  readonly occurrenceRevisionId: string;
  readonly revisionNumber: number;
  readonly previousOccurrenceRevisionId: string | null;
  readonly disposition: 'active' | 'void';
  readonly contentHash: string;
  readonly canonicalPayload: string;
  readonly events: readonly StatkeeperLedgerEventRecord[];
}

function requireSafeNonnegativeInteger(value: unknown, rule: string, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RuleViolation(rule, `${label} must be a nonnegative safe integer`);
  }
  return value as number;
}

function requirePositiveInteger(value: unknown, rule: string, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new RuleViolation(rule, `${label} must be a positive safe integer`);
  }
  return value as number;
}

function requireUuid(value: unknown, rule: string, label: string): string {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new RuleViolation(rule, `${label} must be a UUID`);
  }
  return value.toLowerCase();
}

function requireCanonicalKey(value: unknown, rule: string, label: string): string {
  if (typeof value !== 'string' || !CANONICAL_KEY.test(value)) {
    throw new RuleViolation(rule, `${label} must be a canonical key`);
  }
  return value;
}

function normalizeOptionalText(value: unknown, rule: string, label: string, maximum: number) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new RuleViolation(rule, `${label} must be text or null`);
  }
  const normalized = value.trim().normalize('NFC');
  if (!normalized) return null;
  if ([...normalized].length > maximum) {
    throw new RuleViolation(rule, `${label} must not exceed ${maximum} Unicode scalar values`);
  }
  return normalized;
}

function normalizeRequiredText(value: unknown, rule: string, label: string, maximum: number) {
  const normalized = normalizeOptionalText(value, rule, label, maximum);
  if (!normalized) throw new RuleViolation(rule, `${label} is required`);
  return normalized;
}

function uuidBytes(value: string) {
  return Buffer.from(value.replaceAll('-', ''), 'hex');
}

function deterministicUuid(name: string) {
  const digest = createHash('sha1')
    .update(uuidBytes(STATKEEPER_IDENTITY_NAMESPACE))
    .update(name, 'utf8')
    .digest();
  digest[6] = (digest[6]! & 0x0f) | 0x50;
  digest[8] = (digest[8]! & 0x3f) | 0x80;
  const hexadecimal = digest.subarray(0, 16).toString('hex');
  return [
    hexadecimal.slice(0, 8),
    hexadecimal.slice(8, 12),
    hexadecimal.slice(12, 16),
    hexadecimal.slice(16, 20),
    hexadecimal.slice(20)
  ].join('-');
}

export function normalizeStatkeeperOccurrenceInput(
  input: StatkeeperOccurrenceInput
): NormalizedStatkeeperOccurrenceInput {
  if (!input || typeof input !== 'object') {
    throw new RuleViolation('statkeeper.occurrence.shape', 'Occurrence input is required');
  }
  const runtimeInput = input as StatkeeperOccurrenceInput & Record<string, unknown>;
  if (
    'source' in runtimeInput ||
    'modelConfidence' in runtimeInput ||
    'modelProvenance' in runtimeInput
  ) {
    throw new RuleViolation(
      'statkeeper.occurrence.deferred_inference_input',
      'Source and model provenance are not accepted by the human event-ledger foundation'
    );
  }
  const occurrenceId = requireUuid(
    input.occurrenceId,
    'statkeeper.occurrence.identity',
    'Occurrence identity'
  );
  const evidenceTimestampMs = requireSafeNonnegativeInteger(
    input.evidenceTimestampMs,
    'statkeeper.occurrence.evidence_time',
    'Evidence timestamp'
  );
  let evidenceWindow: StatkeeperEvidenceWindow | null = null;
  if (input.evidenceWindow !== null) {
    if (!input.evidenceWindow || typeof input.evidenceWindow !== 'object') {
      throw new RuleViolation(
        'statkeeper.occurrence.evidence_window',
        'Evidence window must be an object or null'
      );
    }
    const startMs = requireSafeNonnegativeInteger(
      input.evidenceWindow.startMs,
      'statkeeper.occurrence.evidence_window',
      'Evidence-window start'
    );
    const endMs = requireSafeNonnegativeInteger(
      input.evidenceWindow.endMs,
      'statkeeper.occurrence.evidence_window',
      'Evidence-window end'
    );
    if (startMs > evidenceTimestampMs || evidenceTimestampMs > endMs) {
      throw new RuleViolation(
        'statkeeper.occurrence.evidence_window',
        'Evidence window must contain the evidence timestamp'
      );
    }
    evidenceWindow = {startMs, endMs};
  }

  if (!input.period || (input.period.kind !== 'regulation' && input.period.kind !== 'overtime')) {
    throw new RuleViolation('statkeeper.occurrence.period', 'Period kind is unsupported');
  }
  const period: StatkeeperPeriod = {
    kind: input.period.kind,
    ordinal: requirePositiveInteger(
      input.period.ordinal,
      'statkeeper.occurrence.period',
      'Period ordinal'
    )
  };

  if (!input.clock || !['exact', 'estimated', 'unavailable'].includes(input.clock.state)) {
    throw new RuleViolation('statkeeper.occurrence.clock', 'Clock annotation is required');
  }
  let clock: NormalizedStatkeeperOccurrenceInput['clock'];
  if (input.clock.state === 'unavailable') {
    clock = {
      state: 'unavailable',
      remainingMs: null,
      reason: normalizeRequiredText(
        input.clock.reason,
        'statkeeper.occurrence.clock',
        'Unavailable-clock reason',
        240
      )
    };
  } else {
    const remainingMs = requireSafeNonnegativeInteger(
      input.clock.remainingMs,
      'statkeeper.occurrence.clock',
      'Remaining clock time'
    );
    clock = input.clock.state === 'exact'
      ? {state: 'exact', remainingMs, reason: null}
      : {
          state: 'estimated',
          remainingMs,
          reason: normalizeOptionalText(
            input.clock.reason,
            'statkeeper.occurrence.clock',
            'Estimated-clock reason',
            240
          )
        };
  }

  if (!Array.isArray(input.events) || input.events.length === 0) {
    throw new RuleViolation(
      'statkeeper.occurrence.events',
      'An occurrence requires at least one Statistical Event'
    );
  }
  const events = input.events.map((event, eventIndex) => {
    if (!event || typeof event !== 'object') {
      throw new RuleViolation(
        'statkeeper.event.shape',
        `Statistical Event ${eventIndex} must be an object`
      );
    }
    if (!Array.isArray(event.assignments) || event.assignments.length === 0) {
      throw new RuleViolation(
        'statkeeper.event.assignments',
        `Statistical Event ${eventIndex} requires at least one Player assignment`
      );
    }
    const eventAssignments: readonly StatkeeperEventAssignmentInput[] = event.assignments;
    const assignments = eventAssignments.map((assignment, assignmentIndex) => ({
      roleKey: requireCanonicalKey(
        assignment?.roleKey,
        'statkeeper.event.assignment_role',
        `Assignment ${assignmentIndex} role`
      ),
      rosterMembershipId: requireUuid(
        assignment?.rosterMembershipId,
        'statkeeper.event.assignment_membership',
        `Assignment ${assignmentIndex} Roster Membership`
      )
    }));
    if (new Set(assignments.map((assignment) => assignment.roleKey)).size !== assignments.length) {
      throw new RuleViolation(
        'statkeeper.event.assignment_role',
        `Statistical Event ${eventIndex} cannot repeat a participant role`
      );
    }
    if (
      new Set(assignments.map((assignment) => assignment.rosterMembershipId)).size !==
      assignments.length
    ) {
      throw new RuleViolation(
        'statkeeper.event.assignment_player',
        `Statistical Event ${eventIndex} cannot assign one Player to multiple roles`
      );
    }
    assignments.sort((left, right) =>
      compareCanonicalStrings(left.roleKey, right.roleKey) ||
      compareCanonicalStrings(left.rosterMembershipId, right.rosterMembershipId)
    );
    return {
      eventKey: requireCanonicalKey(
        event.eventKey,
        'statkeeper.event.key',
        `Statistical Event ${eventIndex} key`
      ),
      outcomeKey: requireCanonicalKey(
        event.outcomeKey,
        'statkeeper.event.outcome',
        `Statistical Event ${eventIndex} outcome`
      ),
      seasonTeamId: requireUuid(
        event.seasonTeamId,
        'statkeeper.event.team',
        `Statistical Event ${eventIndex} Season Team`
      ),
      assignments
    };
  });

  return {
    occurrenceId,
    captureActionKey: input.captureActionKey === null || input.captureActionKey === undefined
      ? null
      : requireCanonicalKey(
          input.captureActionKey,
          'statkeeper.occurrence.capture_action',
          'Capture Action key'
        ),
    evidenceTimestampMs,
    evidenceWindow,
    period,
    clock,
    events,
    operatorNote: normalizeOptionalText(
      input.operatorNote,
      'statkeeper.occurrence.note',
      'Operator note',
      500
    )
  };
}

function canonicalInputValue(input: NormalizedStatkeeperOccurrenceInput): StatkeeperJsonValue {
  return {
    occurrence_id: input.occurrenceId,
    ...(input.captureActionKey === null ? {} : {capture_action_key: input.captureActionKey}),
    evidence_timestamp_ms: input.evidenceTimestampMs,
    evidence_window: input.evidenceWindow
      ? {start_ms: input.evidenceWindow.startMs, end_ms: input.evidenceWindow.endMs}
      : null,
    period: {kind: input.period.kind, ordinal: input.period.ordinal},
    clock_annotation: {
      state: input.clock.state,
      remaining_ms: input.clock.remainingMs,
      reason: input.clock.reason
    },
    events: input.events.map((event) => ({
      event_key: event.eventKey,
      outcome_key: event.outcomeKey,
      season_team_id: event.seasonTeamId,
      assignments: event.assignments.map((assignment) => ({
        role_key: assignment.roleKey,
        roster_membership_id: assignment.rosterMembershipId
      }))
    })),
    operator_note: input.operatorNote
  };
}

export function statkeeperOccurrenceCommandValue(
  input: NormalizedStatkeeperOccurrenceInput
): StatkeeperJsonValue {
  return canonicalInputValue(input);
}

function validateContext(context: StatkeeperLedgerContext) {
  const normalized = {
    ...context,
    captureSessionId: requireUuid(
      context.captureSessionId,
      'statkeeper.ledger.session',
      'Capture Session identity'
    ),
    gameId: requireUuid(context.gameId, 'statkeeper.ledger.game', 'Game identity'),
    profileVersionId: requireUuid(
      context.profileVersionId,
      'statkeeper.ledger.profile',
      'Profile Version identity'
    ),
    mediaId: requireUuid(context.mediaId, 'statkeeper.ledger.media', 'Media identity'),
    homeSeasonTeamId: requireUuid(
      context.homeSeasonTeamId,
      'statkeeper.ledger.team',
      'Home Season Team identity'
    ),
    awaySeasonTeamId: requireUuid(
      context.awaySeasonTeamId,
      'statkeeper.ledger.team',
      'Away Season Team identity'
    ),
    regulationPeriodCount: requirePositiveInteger(
      context.regulationPeriodCount,
      'statkeeper.ledger.period_configuration',
      'Regulation period count'
    ),
    regulationPeriodDurationMs: requirePositiveInteger(
      context.regulationPeriodDurationMs,
      'statkeeper.ledger.period_configuration',
      'Regulation period duration'
    ),
    overtimePeriodDurationMs: requirePositiveInteger(
      context.overtimePeriodDurationMs,
      'statkeeper.ledger.period_configuration',
      'Overtime period duration'
    )
  };
  if (!/^[0-9a-f]{64}$/.test(context.profileContentHash)) {
    throw new RuleViolation(
      'statkeeper.ledger.profile_hash',
      'Profile content hash must be lowercase SHA-256 hexadecimal'
    );
  }
  if (normalized.homeSeasonTeamId === normalized.awaySeasonTeamId) {
    throw new RuleViolation('statkeeper.ledger.team', 'Participating Season Teams must differ');
  }
  return normalized;
}

function definitionMap(definitions: readonly StatkeeperEventDefinition[]) {
  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new RuleViolation(
      'statkeeper.ledger.event_definitions',
      'The snapshotted profile requires at least one event definition'
    );
  }
  const result = new Map<string, {
    roles: Set<string>;
    outcomes: Map<string, readonly StatkeeperContributionDefinition[]>;
  }>();
  for (const definition of definitions) {
    if (!definition || typeof definition !== 'object') {
      throw new RuleViolation(
        'statkeeper.ledger.event_definitions',
        'Each event definition must be an object'
      );
    }
    const eventKey = requireCanonicalKey(
      definition?.eventKey,
      'statkeeper.ledger.event_definitions',
      'Event-definition key'
    );
    if (result.has(eventKey)) {
      throw new RuleViolation(
        'statkeeper.ledger.event_definitions',
        `Event definition ${eventKey} is duplicated`
      );
    }
    if (!Array.isArray(definition.participantRoleKeys) || definition.participantRoleKeys.length === 0) {
      throw new RuleViolation(
        'statkeeper.ledger.event_definitions',
        `Event definition ${eventKey} requires participant roles`
      );
    }
    const participantRoleKeys: readonly string[] = definition.participantRoleKeys;
    const roles = participantRoleKeys.map((role) =>
      requireCanonicalKey(
        role,
        'statkeeper.ledger.event_definitions',
        `Event definition ${eventKey} participant role`
      )
    );
    if (new Set(roles).size !== roles.length) {
      throw new RuleViolation(
        'statkeeper.ledger.event_definitions',
        `Event definition ${eventKey} repeats a participant role`
      );
    }
    if (!Array.isArray(definition.outcomes) || definition.outcomes.length === 0) {
      throw new RuleViolation(
        'statkeeper.ledger.event_definitions',
        `Event definition ${eventKey} requires outcomes`
      );
    }
    const outcomes = new Map<string, readonly StatkeeperContributionDefinition[]>();
    for (const outcome of definition.outcomes) {
      if (!outcome || typeof outcome !== 'object') {
        throw new RuleViolation(
          'statkeeper.ledger.event_definitions',
          `Every outcome for ${eventKey} must be an object`
        );
      }
      const outcomeKey = requireCanonicalKey(
        outcome?.outcomeKey,
        'statkeeper.ledger.event_definitions',
        `Event definition ${eventKey} outcome`
      );
      if (outcomes.has(outcomeKey)) {
        throw new RuleViolation(
          'statkeeper.ledger.event_definitions',
          `Event definition ${eventKey} repeats outcome ${outcomeKey}`
        );
      }
      if (!Array.isArray(outcome.contributions)) {
        throw new RuleViolation(
          'statkeeper.ledger.event_definitions',
          `Outcome ${eventKey}.${outcomeKey} contributions must be an array`
        );
      }
      const outcomeContributions: readonly StatkeeperContributionDefinition[] =
        outcome.contributions;
      const contributions = outcomeContributions.map((contribution) => {
        if (!contribution || typeof contribution !== 'object') {
          throw new RuleViolation(
            'statkeeper.ledger.event_definitions',
            `Every contribution for ${eventKey}.${outcomeKey} must be an object`
          );
        }
        return {
          statKey: requireCanonicalKey(
            contribution.statKey,
            'statkeeper.ledger.event_definitions',
            `Outcome ${eventKey}.${outcomeKey} Statistic key`
          ),
          increment: requirePositiveInteger(
            contribution.increment,
            'statkeeper.ledger.event_definitions',
            `Outcome ${eventKey}.${outcomeKey} contribution`
          )
        };
      });
      if (new Set(contributions.map((item) => item.statKey)).size !== contributions.length) {
        throw new RuleViolation(
          'statkeeper.ledger.event_definitions',
          `Outcome ${eventKey}.${outcomeKey} repeats a Statistic contribution`
        );
      }
      contributions.sort((left, right) =>
        compareCanonicalStrings(left.statKey, right.statKey)
      );
      outcomes.set(outcomeKey, contributions);
    }
    result.set(eventKey, {roles: new Set(roles), outcomes});
  }
  return result;
}

export function buildStatkeeperOccurrenceLedgerRecord(
  contextInput: StatkeeperLedgerContext,
  actorAccountIdInput: string,
  occurrenceInput: NormalizedStatkeeperOccurrenceInput,
  revision: {
    readonly revisionNumber?: number;
    readonly previousOccurrenceRevisionId?: string | null;
    readonly correctionReason?: string | null;
  } = {}
): StatkeeperOccurrenceLedgerRecord {
  if (!Array.isArray(contextInput.participants)) {
    throw new RuleViolation(
      'statkeeper.ledger.participant',
      'Capture Session participants must be an array'
    );
  }
  const context = validateContext(contextInput);
  const actorAccountId = requireUuid(
    actorAccountIdInput,
    'statkeeper.ledger.actor',
    'Recording actor identity'
  );
  const definitions = definitionMap(context.eventDefinitions);
  const participants = new Map(
    context.participants.map((participant) => {
      if (!participant || typeof participant !== 'object') {
        throw new RuleViolation(
          'statkeeper.ledger.participant',
          'Each Capture Session participant must be an object'
        );
      }
      const normalized = {
        rosterMembershipId: requireUuid(
          participant.rosterMembershipId,
          'statkeeper.ledger.participant',
          'Roster Membership identity'
        ),
        playerId: requireUuid(
          participant.playerId,
          'statkeeper.ledger.participant',
          'Player identity'
        ),
        seasonTeamId: requireUuid(
          participant.seasonTeamId,
          'statkeeper.ledger.participant',
          'Participant Season Team identity'
        ),
        participationStatus: participant.participationStatus
      };
      if (
        normalized.participationStatus !== 'appeared' &&
        normalized.participationStatus !== 'did_not_play'
      ) {
        throw new RuleViolation(
          'statkeeper.ledger.participant',
          'Participation status is unsupported'
        );
      }
      return [normalized.rosterMembershipId, normalized] as const;
    })
  );
  if (participants.size !== context.participants.length) {
    throw new RuleViolation(
      'statkeeper.ledger.participant',
      'The Capture Session cannot repeat a Roster Membership declaration'
    );
  }

  if (
    occurrenceInput.period.kind === 'regulation' &&
    occurrenceInput.period.ordinal > context.regulationPeriodCount
  ) {
    throw new RuleViolation(
      'statkeeper.occurrence.period',
      'Regulation Period exceeds the snapshotted profile configuration'
    );
  }
  const periodDuration = occurrenceInput.period.kind === 'regulation'
    ? context.regulationPeriodDurationMs
    : context.overtimePeriodDurationMs;
  if (
    occurrenceInput.clock.remainingMs !== null &&
    occurrenceInput.clock.remainingMs > periodDuration
  ) {
    throw new RuleViolation(
      'statkeeper.occurrence.clock',
      'Remaining clock time exceeds the configured Period duration'
    );
  }

  const revisionNumber = revision.revisionNumber ?? 1;
  if (!Number.isSafeInteger(revisionNumber) || revisionNumber < 1) {
    throw new RuleViolation('statkeeper.occurrence.revision', 'Occurrence revision number must be a positive safe integer');
  }
  const previousOccurrenceRevisionId = revision.previousOccurrenceRevisionId == null
    ? null
    : requireUuid(revision.previousOccurrenceRevisionId, 'statkeeper.occurrence.revision', 'Previous occurrence revision identity');
  if ((revisionNumber === 1) !== (previousOccurrenceRevisionId === null)) {
    throw new RuleViolation('statkeeper.occurrence.revision', 'Only an initial occurrence revision may omit its predecessor');
  }
  const correctionReason = normalizeOptionalText(
    revision.correctionReason, 'statkeeper.occurrence.correction_reason', 'Correction reason', 500
  );
  const occurrenceRevisionId = deterministicUuid(
    `${context.captureSessionId}:${occurrenceInput.occurrenceId}:revision:${revisionNumber}`
  );
  const eventRecords: StatkeeperLedgerEventRecord[] = occurrenceInput.events.map(
    (event, emissionOrdinal) => {
      if (
        event.seasonTeamId !== context.homeSeasonTeamId &&
        event.seasonTeamId !== context.awaySeasonTeamId
      ) {
        throw new RuleViolation(
          'statkeeper.event.team',
          'Statistical Event Season Team must participate in the Game'
        );
      }
      const definition = definitions.get(event.eventKey);
      if (!definition) {
        throw new RuleViolation(
          'statkeeper.event.definition',
          `Statistical Event ${event.eventKey} is absent from the snapshotted profile`
        );
      }
      const contributions = definition.outcomes.get(event.outcomeKey);
      if (!contributions) {
        throw new RuleViolation(
          'statkeeper.event.outcome',
          `Outcome ${event.outcomeKey} is invalid for Statistical Event ${event.eventKey}`
        );
      }
      const assignments = event.assignments.map((assignment) => {
        if (!definition.roles.has(assignment.roleKey)) {
          throw new RuleViolation(
            'statkeeper.event.assignment_role',
            `Role ${assignment.roleKey} is invalid for Statistical Event ${event.eventKey}`
          );
        }
        const participant = participants.get(assignment.rosterMembershipId);
        if (!participant || participant.participationStatus !== 'appeared') {
          throw new RuleViolation(
            'statkeeper.event.participation',
            'Statistical Events require an appeared Capture Session participant'
          );
        }
        if (participant.seasonTeamId !== event.seasonTeamId) {
          throw new RuleViolation(
            'statkeeper.event.team',
            'Player assignment Team must match the Statistical Event Team'
          );
        }
        return {
          roleKey: assignment.roleKey,
          rosterMembershipId: participant.rosterMembershipId,
          playerId: participant.playerId,
          seasonTeamId: participant.seasonTeamId
        };
      });
      const eventId = deterministicUuid(`${occurrenceRevisionId}:event:${emissionOrdinal}`);
      const eventContent = {
        id: eventId,
        emission_ordinal: emissionOrdinal,
        event_key: event.eventKey,
        outcome_key: event.outcomeKey,
        season_team_id: event.seasonTeamId,
        assignments: assignments.map((assignment) => ({
          role_key: assignment.roleKey,
          roster_membership_id: assignment.rosterMembershipId,
          player_id: assignment.playerId,
          season_team_id: assignment.seasonTeamId
        })),
        contributions: contributions.map((contribution) => ({
          stat_key: contribution.statKey,
          increment: contribution.increment
        }))
      };
      return {
        id: eventId,
        emissionOrdinal,
        eventKey: event.eventKey,
        outcomeKey: event.outcomeKey,
        seasonTeamId: event.seasonTeamId,
        contentHash: statkeeperCanonicalHash(eventContent),
        assignments,
        contributions
      };
    }
  );

  const payload = {
    format: STATKEEPER_LEDGER_RECORD_FORMAT,
    capture_session_id: context.captureSessionId,
    game_id: context.gameId,
    profile_version_id: context.profileVersionId,
    profile_content_hash: context.profileContentHash,
    media_id: context.mediaId,
    occurrence_id: occurrenceInput.occurrenceId,
    ...(occurrenceInput.captureActionKey === null
      ? {}
      : {capture_action_key: occurrenceInput.captureActionKey}),
    occurrence_revision_id: occurrenceRevisionId,
    revision_number: revisionNumber,
    ...(previousOccurrenceRevisionId === null ? {} : {
      previous_occurrence_revision_id: previousOccurrenceRevisionId,
      correction_reason: correctionReason
    }),
    evidence_timestamp_ms: occurrenceInput.evidenceTimestampMs,
    evidence_window: occurrenceInput.evidenceWindow
      ? {
          start_ms: occurrenceInput.evidenceWindow.startMs,
          end_ms: occurrenceInput.evidenceWindow.endMs
        }
      : null,
    period: {
      kind: occurrenceInput.period.kind,
      ordinal: occurrenceInput.period.ordinal
    },
    clock_annotation: {
      state: occurrenceInput.clock.state,
      remaining_ms: occurrenceInput.clock.remainingMs,
      reason: occurrenceInput.clock.reason
    },
    source: 'human',
    verification_state: 'recorded',
    disposition: 'active',
    operator_note: occurrenceInput.operatorNote,
    recorded_by_account_id: actorAccountId,
    events: eventRecords.map((event) => ({
      id: event.id,
      emission_ordinal: event.emissionOrdinal,
      event_key: event.eventKey,
      outcome_key: event.outcomeKey,
      season_team_id: event.seasonTeamId,
      content_hash: event.contentHash,
      assignments: event.assignments.map((assignment) => ({
        role_key: assignment.roleKey,
        roster_membership_id: assignment.rosterMembershipId,
        player_id: assignment.playerId,
        season_team_id: assignment.seasonTeamId
      })),
      contributions: event.contributions.map((contribution) => ({
        stat_key: contribution.statKey,
        increment: contribution.increment
      }))
    }))
  };
  return {
    occurrenceId: occurrenceInput.occurrenceId,
    occurrenceRevisionId,
    revisionNumber,
    previousOccurrenceRevisionId,
    disposition: 'active',
    contentHash: statkeeperCanonicalHash(payload),
    canonicalPayload: statkeeperCanonicalJson(payload),
    events: eventRecords
  };
}

export function buildStatkeeperVoidRevision(input: {
  readonly context: StatkeeperLedgerContext;
  readonly actorAccountId: string;
  readonly current: StatkeeperOccurrenceLedgerRecord;
  readonly revisionNumber: number;
  readonly reason: string | null;
}): StatkeeperOccurrenceLedgerRecord {
  const context = validateContext(input.context);
  const actorAccountId = requireUuid(input.actorAccountId, 'statkeeper.ledger.actor', 'Voiding actor identity');
  const revisionNumber = requirePositiveInteger(
    input.revisionNumber, 'statkeeper.occurrence.revision', 'Occurrence revision number'
  );
  if (revisionNumber !== input.current.revisionNumber + 1) {
    throw new RuleViolation('statkeeper.occurrence.revision', 'Void revision must immediately follow the current occurrence revision');
  }
  let currentPayload: Record<string, StatkeeperJsonValue>;
  try {
    const parsed = JSON.parse(input.current.canonicalPayload) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    currentPayload = parsed as Record<string, StatkeeperJsonValue>;
  } catch {
    throw new RuleViolation('statkeeper.occurrence.lineage', 'Current occurrence payload is not canonical JSON');
  }
  if (currentPayload.format !== STATKEEPER_LEDGER_RECORD_FORMAT
    || currentPayload.capture_session_id !== context.captureSessionId
    || currentPayload.game_id !== context.gameId
    || currentPayload.profile_version_id !== context.profileVersionId
    || currentPayload.media_id !== context.mediaId
    || currentPayload.occurrence_id !== input.current.occurrenceId
    || currentPayload.occurrence_revision_id !== input.current.occurrenceRevisionId
    || currentPayload.revision_number !== input.current.revisionNumber) {
    throw new RuleViolation('statkeeper.occurrence.lineage', 'Current occurrence payload does not match its immutable envelope');
  }
  const reason = normalizeOptionalText(
    input.reason, 'statkeeper.occurrence.correction_reason', 'Void reason', 500
  );
  const occurrenceRevisionId = deterministicUuid(
    `${context.captureSessionId}:${input.current.occurrenceId}:revision:${revisionNumber}`
  );
  const payload: Record<string, StatkeeperJsonValue> = {
    ...currentPayload,
    occurrence_revision_id: occurrenceRevisionId,
    revision_number: revisionNumber,
    previous_occurrence_revision_id: input.current.occurrenceRevisionId,
    correction_reason: reason,
    verification_state: 'recorded',
    disposition: 'void',
    recorded_by_account_id: actorAccountId,
    events: []
  };
  return {
    occurrenceId: input.current.occurrenceId,
    occurrenceRevisionId,
    revisionNumber,
    previousOccurrenceRevisionId: input.current.occurrenceRevisionId,
    disposition: 'void',
    contentHash: statkeeperCanonicalHash(payload),
    canonicalPayload: statkeeperCanonicalJson(payload),
    events: []
  };
}

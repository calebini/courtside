import {RuleViolation} from './errors';
import {statkeeperCanonicalHash} from './statkeeper-canonical-json';
import type {StatkeeperEventDefinition} from './statkeeper-event-ledger';

const CANONICAL_KEY = /^[a-z][a-z0-9_]{0,63}$/;

export interface LocalizedStatkeeperLabel {
  readonly en: string;
  readonly fr: string;
}

export interface StatkeeperProfileDefinition {
  readonly regulationPeriodCount: number;
  readonly regulationPeriodDurationMs: number;
  readonly overtimePeriodDurationMs: number;
  readonly coverageGroups: readonly {
    readonly coverageGroupKey: string;
    readonly label: LocalizedStatkeeperLabel;
    readonly displayOrder: number;
  }[];
  readonly projectedStatistics: readonly {
    readonly statKey: string;
    readonly fullLabel: LocalizedStatkeeperLabel;
    readonly shortLabel: LocalizedStatkeeperLabel;
    readonly displayOrder: number;
    readonly coverageGroupKey: string;
    readonly aggregation: 'sum';
    readonly semanticRole: 'player_points' | null;
    readonly showOnMemberGameLog: boolean;
    readonly showOnBoxScore: boolean;
  }[];
  readonly statisticalEvents: readonly {
    readonly eventKey: string;
    readonly label: LocalizedStatkeeperLabel;
    readonly outcomes: readonly {
      readonly outcomeKey: string;
      readonly label: LocalizedStatkeeperLabel;
      readonly contributions: readonly {
        readonly statKey: string;
        readonly increment: number;
      }[];
    }[];
  }[];
  readonly captureActions: readonly {
    readonly actionKey: string;
    readonly label: LocalizedStatkeeperLabel;
    readonly displayOrder: number;
    readonly availability: 'offense' | 'defense' | 'either';
    readonly participantSlots: readonly {
      readonly roleKey: string;
      readonly label: LocalizedStatkeeperLabel;
      readonly presence: 'required' | 'optional';
      readonly teamRelationship: 'possessing' | 'opposing' | 'either';
      readonly primary: boolean;
    }[];
    readonly eventEmissions: readonly {
      readonly eventKey: string;
      readonly outcomeKey: string;
      readonly actorRoleKey: string;
      readonly condition: 'always' | 'when_actor_present';
    }[];
    readonly possessionEffect: 'retain' | 'switch' | 'prompt';
    readonly allowDuplicatePlayerAssignments: boolean;
  }[];
}

export interface NormalizedStatkeeperProfile {
  readonly definition: StatkeeperProfileDefinition;
  readonly contentHash: string;
  readonly eventDefinitions: readonly StatkeeperEventDefinition[];
  readonly coverageGroupKeys: readonly string[];
}

function objectAt(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RuleViolation('statkeeper.profile.shape', `${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  optional: readonly string[] = []
) {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      throw new RuleViolation(
        'statkeeper.profile.unsupported_primitive',
        `${path}.${key} is not a supported profile primitive`
      );
    }
  }
  const optionalSet = new Set(optional);
  for (const key of allowed) {
    if (!optionalSet.has(key) && !(key in value)) {
      throw new RuleViolation('statkeeper.profile.shape', `${path}.${key} is required`);
    }
  }
}

function arrayAt(value: unknown, path: string, allowEmpty = false): readonly unknown[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new RuleViolation(
      'statkeeper.profile.shape',
      `${path} must be ${allowEmpty ? 'an array' : 'a nonempty array'}`
    );
  }
  return value;
}

function safeInteger(value: unknown, path: string, positive = false) {
  if (!Number.isSafeInteger(value) || (positive ? (value as number) <= 0 : (value as number) < 0)) {
    throw new RuleViolation(
      'statkeeper.profile.integer',
      `${path} must be a ${positive ? 'positive' : 'nonnegative'} safe integer`
    );
  }
  return value as number;
}

function canonicalKey(value: unknown, path: string) {
  if (typeof value !== 'string' || !CANONICAL_KEY.test(value)) {
    throw new RuleViolation('statkeeper.profile.canonical_key', `${path} must be a canonical key`);
  }
  return value;
}

function localizedLabel(value: unknown, path: string): LocalizedStatkeeperLabel {
  const label = objectAt(value, path);
  exactKeys(label, ['en', 'fr'], path);
  const normalize = (candidate: unknown, locale: string) => {
    if (typeof candidate !== 'string') {
      throw new RuleViolation('statkeeper.profile.localization', `${path}.${locale} must be text`);
    }
    const normalized = candidate.trim().normalize('NFC');
    if (!normalized || [...normalized].length > 80) {
      throw new RuleViolation(
        'statkeeper.profile.localization',
        `${path}.${locale} must contain 1 through 80 Unicode scalar values`
      );
    }
    return normalized;
  };
  return {en: normalize(label.en, 'en'), fr: normalize(label.fr, 'fr')};
}

function choice<T extends string>(value: unknown, choices: readonly T[], path: string): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new RuleViolation('statkeeper.profile.primitive', `${path} is unsupported`);
  }
  return value as T;
}

function booleanAt(value: unknown, path: string) {
  if (typeof value !== 'boolean') {
    throw new RuleViolation('statkeeper.profile.primitive', `${path} must be boolean`);
  }
  return value;
}

function uniqueKey(key: string, keys: Set<string>, path: string) {
  if (keys.has(key)) {
    throw new RuleViolation('statkeeper.profile.duplicate_key', `${path} repeats ${key}`);
  }
  keys.add(key);
}

function compareCanonicalKeys(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function byDisplayOrderThenKey<T>(key: (value: T) => string) {
  return (left: T & {displayOrder: number}, right: T & {displayOrder: number}) =>
    left.displayOrder - right.displayOrder || compareCanonicalKeys(key(left), key(right));
}

function profileCanonicalValue(definition: StatkeeperProfileDefinition) {
  return {
    capture_actions: definition.captureActions.map((action) => ({
      action_key: action.actionKey,
      allow_duplicate_player_assignments: action.allowDuplicatePlayerAssignments,
      availability: action.availability,
      display_order: action.displayOrder,
      event_emissions: action.eventEmissions.map((emission) => ({
        actor_role_key: emission.actorRoleKey,
        condition: emission.condition,
        event_key: emission.eventKey,
        outcome_key: emission.outcomeKey
      })),
      label: action.label,
      participant_slots: action.participantSlots.map((slot) => ({
        label: slot.label,
        presence: slot.presence,
        primary: slot.primary,
        role_key: slot.roleKey,
        team_relationship: slot.teamRelationship
      })),
      possession_effect: action.possessionEffect
    })),
    coverage_groups: definition.coverageGroups.map((group) => ({
      coverage_group_key: group.coverageGroupKey,
      display_order: group.displayOrder,
      label: group.label
    })),
    overtime_period_duration_ms: definition.overtimePeriodDurationMs,
    projected_statistics: definition.projectedStatistics.map((statistic) => ({
      aggregation: statistic.aggregation,
      coverage_group_key: statistic.coverageGroupKey,
      display_order: statistic.displayOrder,
      full_label: statistic.fullLabel,
      semantic_role: statistic.semanticRole,
      short_label: statistic.shortLabel,
      show_on_box_score: statistic.showOnBoxScore,
      show_on_member_game_log: statistic.showOnMemberGameLog,
      stat_key: statistic.statKey
    })),
    regulation_period_count: definition.regulationPeriodCount,
    regulation_period_duration_ms: definition.regulationPeriodDurationMs,
    statistical_events: definition.statisticalEvents.map((event) => ({
      event_key: event.eventKey,
      label: event.label,
      outcomes: event.outcomes.map((outcome) => ({
        contributions: outcome.contributions.map((contribution) => ({
          increment: contribution.increment,
          stat_key: contribution.statKey
        })),
        label: outcome.label,
        outcome_key: outcome.outcomeKey
      }))
    }))
  };
}

export function normalizeStatkeeperProfileDefinition(input: unknown): NormalizedStatkeeperProfile {
  const root = objectAt(input, 'profile');
  exactKeys(root, [
    'regulationPeriodCount',
    'regulationPeriodDurationMs',
    'overtimePeriodDurationMs',
    'coverageGroups',
    'projectedStatistics',
    'statisticalEvents',
    'captureActions'
  ], 'profile');

  const coverageKeys = new Set<string>();
  const coverageGroups = arrayAt(root.coverageGroups, 'profile.coverageGroups').map((raw, index) => {
    const path = `profile.coverageGroups[${index}]`;
    const value = objectAt(raw, path);
    exactKeys(value, ['coverageGroupKey', 'label', 'displayOrder'], path);
    const coverageGroupKey = canonicalKey(value.coverageGroupKey, `${path}.coverageGroupKey`);
    uniqueKey(coverageGroupKey, coverageKeys, path);
    return {
      coverageGroupKey,
      label: localizedLabel(value.label, `${path}.label`),
      displayOrder: safeInteger(value.displayOrder, `${path}.displayOrder`)
    };
  }).sort(byDisplayOrderThenKey((value) => value.coverageGroupKey));

  const statisticKeys = new Set<string>();
  let playerPointsCount = 0;
  const projectedStatistics = arrayAt(root.projectedStatistics, 'profile.projectedStatistics')
    .map((raw, index) => {
      const path = `profile.projectedStatistics[${index}]`;
      const value = objectAt(raw, path);
      exactKeys(value, [
        'statKey', 'fullLabel', 'shortLabel', 'displayOrder', 'coverageGroupKey',
        'aggregation', 'semanticRole', 'showOnMemberGameLog', 'showOnBoxScore'
      ], path, ['semanticRole']);
      const statKey = canonicalKey(value.statKey, `${path}.statKey`);
      uniqueKey(statKey, statisticKeys, path);
      const coverageGroupKey = canonicalKey(value.coverageGroupKey, `${path}.coverageGroupKey`);
      if (!coverageKeys.has(coverageGroupKey)) {
        throw new RuleViolation('statkeeper.profile.reference', `${path} references an unknown Coverage Group`);
      }
      const semanticRole = value.semanticRole === null || value.semanticRole === undefined
        ? null
        : choice(value.semanticRole, ['player_points'] as const, `${path}.semanticRole`);
      if (semanticRole === 'player_points') playerPointsCount += 1;
      return {
        statKey,
        fullLabel: localizedLabel(value.fullLabel, `${path}.fullLabel`),
        shortLabel: localizedLabel(value.shortLabel, `${path}.shortLabel`),
        displayOrder: safeInteger(value.displayOrder, `${path}.displayOrder`),
        coverageGroupKey,
        aggregation: choice(value.aggregation, ['sum'] as const, `${path}.aggregation`),
        semanticRole,
        showOnMemberGameLog: booleanAt(value.showOnMemberGameLog, `${path}.showOnMemberGameLog`),
        showOnBoxScore: booleanAt(value.showOnBoxScore, `${path}.showOnBoxScore`)
      };
    })
    .sort(byDisplayOrderThenKey((value) => value.statKey));
  if (playerPointsCount !== 1) {
    throw new RuleViolation(
      'statkeeper.profile.player_points',
      'Exactly one projected Statistic must have the player_points semantic role'
    );
  }

  const eventKeys = new Set<string>();
  const eventOutcomeKeys = new Map<string, Set<string>>();
  const statisticalEvents = arrayAt(root.statisticalEvents, 'profile.statisticalEvents')
    .map((raw, index) => {
      const path = `profile.statisticalEvents[${index}]`;
      const value = objectAt(raw, path);
      exactKeys(value, ['eventKey', 'label', 'outcomes'], path);
      const eventKey = canonicalKey(value.eventKey, `${path}.eventKey`);
      uniqueKey(eventKey, eventKeys, path);
      const outcomeKeys = new Set<string>();
      const outcomes = arrayAt(value.outcomes, `${path}.outcomes`).map((rawOutcome, outcomeIndex) => {
        const outcomePath = `${path}.outcomes[${outcomeIndex}]`;
        const outcome = objectAt(rawOutcome, outcomePath);
        exactKeys(outcome, ['outcomeKey', 'label', 'contributions'], outcomePath);
        const outcomeKey = canonicalKey(outcome.outcomeKey, `${outcomePath}.outcomeKey`);
        uniqueKey(outcomeKey, outcomeKeys, outcomePath);
        const contributionKeys = new Set<string>();
        const contributions = arrayAt(outcome.contributions, `${outcomePath}.contributions`, true)
          .map((rawContribution, contributionIndex) => {
            const contributionPath = `${outcomePath}.contributions[${contributionIndex}]`;
            const contribution = objectAt(rawContribution, contributionPath);
            exactKeys(contribution, ['statKey', 'increment'], contributionPath);
            const statKey = canonicalKey(contribution.statKey, `${contributionPath}.statKey`);
            if (!statisticKeys.has(statKey)) {
              throw new RuleViolation('statkeeper.profile.reference', `${contributionPath} references an unknown Statistic`);
            }
            uniqueKey(statKey, contributionKeys, contributionPath);
            return {statKey, increment: safeInteger(contribution.increment, `${contributionPath}.increment`, true)};
          })
          .sort((left, right) => compareCanonicalKeys(left.statKey, right.statKey));
        return {outcomeKey, label: localizedLabel(outcome.label, `${outcomePath}.label`), contributions};
      }).sort((left, right) => compareCanonicalKeys(left.outcomeKey, right.outcomeKey));
      eventOutcomeKeys.set(eventKey, new Set(outcomes.map((outcome) => outcome.outcomeKey)));
      return {eventKey, label: localizedLabel(value.label, `${path}.label`), outcomes};
    })
    .sort((left, right) => compareCanonicalKeys(left.eventKey, right.eventKey));

  const actionKeys = new Set<string>();
  const eventRoleKeys = new Map<string, Set<string>>();
  const captureActions = arrayAt(root.captureActions, 'profile.captureActions').map((raw, index) => {
    const path = `profile.captureActions[${index}]`;
    const value = objectAt(raw, path);
    exactKeys(value, [
      'actionKey', 'label', 'displayOrder', 'availability', 'participantSlots',
      'eventEmissions', 'possessionEffect', 'allowDuplicatePlayerAssignments'
    ], path, ['allowDuplicatePlayerAssignments']);
    const actionKey = canonicalKey(value.actionKey, `${path}.actionKey`);
    uniqueKey(actionKey, actionKeys, path);
    const roleKeys = new Set<string>();
    let primaryCount = 0;
    const participantSlots = arrayAt(value.participantSlots, `${path}.participantSlots`).map((rawSlot, slotIndex) => {
      const slotPath = `${path}.participantSlots[${slotIndex}]`;
      const slot = objectAt(rawSlot, slotPath);
      exactKeys(slot, ['roleKey', 'label', 'presence', 'teamRelationship', 'primary'], slotPath);
      const roleKey = canonicalKey(slot.roleKey, `${slotPath}.roleKey`);
      uniqueKey(roleKey, roleKeys, slotPath);
      const presence = choice(slot.presence, ['required', 'optional'] as const, `${slotPath}.presence`);
      const primary = booleanAt(slot.primary, `${slotPath}.primary`);
      if (primary) {
        primaryCount += 1;
        if (presence !== 'required') {
          throw new RuleViolation('statkeeper.profile.primary_slot', 'The primary participant slot must be required');
        }
      }
      return {
        roleKey,
        label: localizedLabel(slot.label, `${slotPath}.label`),
        presence,
        teamRelationship: choice(
          slot.teamRelationship,
          ['possessing', 'opposing', 'either'] as const,
          `${slotPath}.teamRelationship`
        ),
        primary
      };
    });
    if (primaryCount !== 1) {
      throw new RuleViolation('statkeeper.profile.primary_slot', `${path} must define exactly one required primary slot`);
    }
    const slotByKey = new Map(participantSlots.map((slot) => [slot.roleKey, slot]));
    const eventEmissions = arrayAt(value.eventEmissions, `${path}.eventEmissions`).map((rawEmission, emissionIndex) => {
      const emissionPath = `${path}.eventEmissions[${emissionIndex}]`;
      const emission = objectAt(rawEmission, emissionPath);
      exactKeys(emission, ['eventKey', 'outcomeKey', 'actorRoleKey', 'condition'], emissionPath);
      const eventKey = canonicalKey(emission.eventKey, `${emissionPath}.eventKey`);
      const outcomeKey = canonicalKey(emission.outcomeKey, `${emissionPath}.outcomeKey`);
      const actorRoleKey = canonicalKey(emission.actorRoleKey, `${emissionPath}.actorRoleKey`);
      const condition = choice(emission.condition, ['always', 'when_actor_present'] as const, `${emissionPath}.condition`);
      const slot = slotByKey.get(actorRoleKey);
      if (!eventKeys.has(eventKey) || !eventOutcomeKeys.get(eventKey)?.has(outcomeKey) || !slot) {
        throw new RuleViolation('statkeeper.profile.reference', `${emissionPath} contains an unknown reference`);
      }
      if (condition === 'always' && slot.presence !== 'required') {
        throw new RuleViolation('statkeeper.profile.emission', 'An always emission must use a required slot');
      }
      if (condition === 'when_actor_present' && slot.presence !== 'optional') {
        throw new RuleViolation('statkeeper.profile.emission', 'A conditional emission must use an optional slot');
      }
      const roles = eventRoleKeys.get(eventKey) ?? new Set<string>();
      roles.add(actorRoleKey);
      eventRoleKeys.set(eventKey, roles);
      return {eventKey, outcomeKey, actorRoleKey, condition};
    });
    if (!eventEmissions.some((emission) => emission.condition === 'always')) {
      throw new RuleViolation(
        'statkeeper.profile.action_expansion',
        `${path} must emit at least one event when optional participants are absent`
      );
    }
    const emittedRoleKeys = new Set(eventEmissions.map((emission) => emission.actorRoleKey));
    const unrepresentedSlot = participantSlots.find((slot) => !emittedRoleKeys.has(slot.roleKey));
    if (unrepresentedSlot) {
      throw new RuleViolation(
        'statkeeper.profile.action_expansion',
        `${path} participant role ${unrepresentedSlot.roleKey} is not represented by an Event Emission`
      );
    }
    return {
      actionKey,
      label: localizedLabel(value.label, `${path}.label`),
      displayOrder: safeInteger(value.displayOrder, `${path}.displayOrder`),
      availability: choice(value.availability, ['offense', 'defense', 'either'] as const, `${path}.availability`),
      participantSlots,
      eventEmissions,
      possessionEffect: choice(value.possessionEffect, ['retain', 'switch', 'prompt'] as const, `${path}.possessionEffect`),
      allowDuplicatePlayerAssignments: value.allowDuplicatePlayerAssignments === undefined
        ? false
        : booleanAt(value.allowDuplicatePlayerAssignments, `${path}.allowDuplicatePlayerAssignments`)
    };
  }).sort(byDisplayOrderThenKey((value) => value.actionKey));

  const definition: StatkeeperProfileDefinition = {
    regulationPeriodCount: safeInteger(root.regulationPeriodCount, 'profile.regulationPeriodCount', true),
    regulationPeriodDurationMs: safeInteger(root.regulationPeriodDurationMs, 'profile.regulationPeriodDurationMs', true),
    overtimePeriodDurationMs: safeInteger(root.overtimePeriodDurationMs, 'profile.overtimePeriodDurationMs', true),
    coverageGroups,
    projectedStatistics,
    statisticalEvents,
    captureActions
  };
  const eventDefinitions = statisticalEvents.map((event) => ({
    eventKey: event.eventKey,
    participantRoleKeys: [...(eventRoleKeys.get(event.eventKey) ?? [])].sort(),
    outcomes: event.outcomes.map((outcome) => ({
      outcomeKey: outcome.outcomeKey,
      contributions: outcome.contributions
    }))
  }));
  if (eventDefinitions.some((event) => event.participantRoleKeys.length === 0)) {
    throw new RuleViolation(
      'statkeeper.profile.unreachable_event',
      'Every Statistical Event must be emitted by at least one Capture Action'
    );
  }
  const canonicalValue = profileCanonicalValue(definition);
  return {
    definition,
    contentHash: statkeeperCanonicalHash(canonicalValue),
    eventDefinitions,
    coverageGroupKeys: coverageGroups.map((group) => group.coverageGroupKey)
  };
}

export function statkeeperProfileCommandValue(profile: NormalizedStatkeeperProfile) {
  return profileCanonicalValue(profile.definition);
}

function compatibilityHash(value: unknown) {
  return statkeeperCanonicalHash(value);
}

/** Preserve canonical-key meaning when a League promotes another immutable Profile Version. */
export function assertStatkeeperProfileLineageCompatibility(
  priorProfiles: readonly NormalizedStatkeeperProfile[],
  next: NormalizedStatkeeperProfile
) {
  const nextStatistics = new Map(next.definition.projectedStatistics.map((value) => [value.statKey, value]));
  const nextEvents = new Map(next.definition.statisticalEvents.map((value) => [value.eventKey, value]));
  const nextActions = new Map(next.definition.captureActions.map((value) => [value.actionKey, value]));

  for (const prior of priorProfiles) {
    for (const statistic of prior.definition.projectedStatistics) {
      const candidate = nextStatistics.get(statistic.statKey);
      if (!candidate) continue;
      const meaning = (value: typeof statistic) => ({
        aggregation: value.aggregation,
        coverage_group_key: value.coverageGroupKey,
        semantic_role: value.semanticRole,
        show_on_box_score: value.showOnBoxScore,
        show_on_member_game_log: value.showOnMemberGameLog
      });
      if (compatibilityHash(meaning(statistic)) !== compatibilityHash(meaning(candidate))) {
        throw new RuleViolation(
          'statkeeper.profile.lineage',
          `Statistic key ${statistic.statKey} changes established meaning`
        );
      }
    }

    for (const event of prior.definition.statisticalEvents) {
      const candidate = nextEvents.get(event.eventKey);
      if (!candidate) continue;
      const candidateOutcomes = new Map(candidate.outcomes.map((value) => [value.outcomeKey, value]));
      for (const outcome of event.outcomes) {
        const candidateOutcome = candidateOutcomes.get(outcome.outcomeKey);
        if (!candidateOutcome) continue;
        if (
          compatibilityHash(outcome.contributions)
          !== compatibilityHash(candidateOutcome.contributions)
        ) {
          throw new RuleViolation(
            'statkeeper.profile.lineage',
            `Outcome key ${event.eventKey}.${outcome.outcomeKey} changes fixed contributions`
          );
        }
      }
    }

    for (const action of prior.definition.captureActions) {
      const candidate = nextActions.get(action.actionKey);
      if (!candidate) continue;
      const meaning = (value: typeof action) => ({
        allow_duplicate_player_assignments: value.allowDuplicatePlayerAssignments,
        availability: value.availability,
        event_emissions: value.eventEmissions,
        participant_slots: value.participantSlots.map((slot) => ({
          presence: slot.presence,
          primary: slot.primary,
          role_key: slot.roleKey,
          team_relationship: slot.teamRelationship
        })),
        possession_effect: value.possessionEffect
      });
      if (compatibilityHash(meaning(action)) !== compatibilityHash(meaning(candidate))) {
        throw new RuleViolation(
          'statkeeper.profile.lineage',
          `Capture Action key ${action.actionKey} changes established behavior`
        );
      }
    }
  }
}

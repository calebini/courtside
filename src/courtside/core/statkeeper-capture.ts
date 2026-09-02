import {RuleViolation} from './errors';
import {
  normalizeStatkeeperOccurrenceInput,
  type NormalizedStatkeeperOccurrenceInput,
  type StatkeeperClockAnnotation,
  type StatkeeperEvidenceWindow,
  type StatkeeperLedgerParticipant,
  type StatkeeperPeriod
} from './statkeeper-event-ledger';
import type {NormalizedStatkeeperProfile} from './statkeeper-profile';

const CANONICAL_KEY = /^[a-z][a-z0-9_]{0,63}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface StatkeeperParticipantSelection {
  readonly roleKey: string;
  readonly playerId: string;
}

export interface StatkeeperOpenPossession {
  readonly sequenceId: string;
  readonly possessingSeasonTeamId: string;
  readonly startMediaOffsetMs: number;
}

export interface StatkeeperCaptureActionInput {
  readonly occurrenceId: string;
  readonly actionKey: string;
  readonly evidenceTimestampMs: number;
  readonly evidenceWindow: StatkeeperEvidenceWindow | null;
  readonly period: StatkeeperPeriod;
  readonly clock: StatkeeperClockAnnotation;
  readonly participantSelections: readonly StatkeeperParticipantSelection[];
  readonly operatorNote: string | null;
}

export type StatkeeperPossessionDirective =
  | {
      readonly effect: 'retain';
      readonly currentPossessingSeasonTeamId: string | null;
    }
  | {
      readonly effect: 'switch';
      readonly closingSequenceId: string;
      readonly fromSeasonTeamId: string;
      readonly toSeasonTeamId: string;
      readonly atMediaOffsetMs: number;
    }
  | {
      readonly effect: 'prompt';
      readonly currentPossessingSeasonTeamId: string | null;
      readonly candidateSeasonTeamIds: readonly [string, string];
    };

export interface ExpandedStatkeeperCaptureAction {
  readonly actionKey: string;
  readonly occurrence: NormalizedStatkeeperOccurrenceInput;
  readonly possession: StatkeeperPossessionDirective;
}

function canonicalKey(value: unknown, label: string) {
  if (typeof value !== 'string' || !CANONICAL_KEY.test(value)) {
    throw new RuleViolation('statkeeper.capture.action', `${label} must be a canonical key`);
  }
  return value;
}

function uuid(value: unknown, label: string) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new RuleViolation('statkeeper.capture.participant', `${label} must be a UUID`);
  }
  return value.toLowerCase();
}

function otherTeam(
  teamId: string,
  homeSeasonTeamId: string,
  awaySeasonTeamId: string
) {
  if (teamId === homeSeasonTeamId) return awaySeasonTeamId;
  if (teamId === awaySeasonTeamId) return homeSeasonTeamId;
  throw new RuleViolation(
    'statkeeper.capture.possession',
    'Open possession must belong to a participating Season Team'
  );
}

export function expandStatkeeperCaptureAction(input: {
  readonly profile: NormalizedStatkeeperProfile;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly participants: readonly StatkeeperLedgerParticipant[];
  readonly openPossession: StatkeeperOpenPossession | null;
  readonly capture: StatkeeperCaptureActionInput;
}): ExpandedStatkeeperCaptureAction {
  const homeSeasonTeamId = uuid(input.homeSeasonTeamId, 'Home Season Team identity');
  const awaySeasonTeamId = uuid(input.awaySeasonTeamId, 'Away Season Team identity');
  if (homeSeasonTeamId === awaySeasonTeamId) {
    throw new RuleViolation('statkeeper.capture.team', 'Participating Season Teams must differ');
  }
  if (!Array.isArray(input.participants)) {
    throw new RuleViolation('statkeeper.capture.participant', 'Session participants must be an array');
  }
  const participantsByPlayer = new Map<string, StatkeeperLedgerParticipant>();
  for (const participant of input.participants) {
    const playerId = uuid(participant?.playerId, 'Session Player identity');
    const rosterMembershipId = uuid(
      participant?.rosterMembershipId,
      'Session Roster Membership identity'
    );
    const seasonTeamId = uuid(participant?.seasonTeamId, 'Session participant Team identity');
    if (seasonTeamId !== homeSeasonTeamId && seasonTeamId !== awaySeasonTeamId) {
      throw new RuleViolation(
        'statkeeper.capture.team',
        'Session participant must belong to a participating Season Team'
      );
    }
    if (participantsByPlayer.has(playerId)) {
      throw new RuleViolation(
        'statkeeper.capture.participant',
        'A Player must resolve to exactly one Capture Session participation declaration'
      );
    }
    participantsByPlayer.set(playerId, {
      rosterMembershipId,
      playerId,
      seasonTeamId,
      participationStatus: participant.participationStatus
    });
  }

  const actionKey = canonicalKey(input.capture.actionKey, 'Capture Action key');
  const action = input.profile.definition.captureActions.find(
    (candidate) => candidate.actionKey === actionKey
  );
  if (!action) {
    throw new RuleViolation(
      'statkeeper.capture.action',
      `Capture Action ${actionKey} is absent from the snapshotted Profile Version`
    );
  }
  if (!Array.isArray(input.capture.participantSelections)) {
    throw new RuleViolation(
      'statkeeper.capture.participant',
      'Participant selections must be an array'
    );
  }
  const selections = new Map<string, StatkeeperLedgerParticipant>();
  for (const selection of input.capture.participantSelections) {
    const roleKey = canonicalKey(selection?.roleKey, 'Participant role key');
    if (selections.has(roleKey)) {
      throw new RuleViolation(
        'statkeeper.capture.participant_role',
        `Participant role ${roleKey} is supplied more than once`
      );
    }
    const slot = action.participantSlots.find((candidate) => candidate.roleKey === roleKey);
    if (!slot) {
      throw new RuleViolation(
        'statkeeper.capture.participant_role',
        `Participant role ${roleKey} is not declared by Capture Action ${actionKey}`
      );
    }
    const playerId = uuid(selection?.playerId, `Player identity for ${roleKey}`);
    const participant = participantsByPlayer.get(playerId);
    if (!participant || participant.participationStatus !== 'appeared') {
      throw new RuleViolation(
        'statkeeper.capture.participation',
        `Participant role ${roleKey} requires an appeared Capture Session Player`
      );
    }
    selections.set(roleKey, participant);
  }

  for (const slot of action.participantSlots) {
    if (slot.presence === 'required' && !selections.has(slot.roleKey)) {
      throw new RuleViolation(
        'statkeeper.capture.participant_required',
        `Capture Action ${actionKey} requires participant role ${slot.roleKey}`
      );
    }
  }
  if (
    !action.allowDuplicatePlayerAssignments
    && new Set([...selections.values()].map((participant) => participant.playerId)).size
      !== selections.size
  ) {
    throw new RuleViolation(
      'statkeeper.capture.duplicate_player',
      'One Player cannot fill multiple participant roles for this Capture Action'
    );
  }

  const possession = input.openPossession
    ? {
        sequenceId: uuid(input.openPossession.sequenceId, 'Open Possession Sequence identity'),
        possessingSeasonTeamId: uuid(
          input.openPossession.possessingSeasonTeamId,
          'Possessing Season Team identity'
        ),
        startMediaOffsetMs: input.openPossession.startMediaOffsetMs
      }
    : null;
  const opposingSeasonTeamId = possession
    ? otherTeam(possession.possessingSeasonTeamId, homeSeasonTeamId, awaySeasonTeamId)
    : null;
  const primarySlot = action.participantSlots.find((slot) => slot.primary)!;
  const primaryParticipant = selections.get(primarySlot.roleKey)!;
  if (action.availability !== 'either') {
    if (!possession || !opposingSeasonTeamId) {
      throw new RuleViolation(
        'statkeeper.capture.possession_required',
        `Capture Action ${actionKey} requires an established possession`
      );
    }
    const expectedTeamId = action.availability === 'offense'
      ? possession.possessingSeasonTeamId
      : opposingSeasonTeamId;
    if (primaryParticipant.seasonTeamId !== expectedTeamId) {
      throw new RuleViolation(
        'statkeeper.capture.action_availability',
        `Primary participant is not on the ${action.availability} Team`
      );
    }
  }

  for (const slot of action.participantSlots) {
    const participant = selections.get(slot.roleKey);
    if (!participant || slot.teamRelationship === 'either') continue;
    if (!possession || !opposingSeasonTeamId) {
      throw new RuleViolation(
        'statkeeper.capture.possession_required',
        `Participant role ${slot.roleKey} requires an established possession`
      );
    }
    const expectedTeamId = slot.teamRelationship === 'possessing'
      ? possession.possessingSeasonTeamId
      : opposingSeasonTeamId;
    if (participant.seasonTeamId !== expectedTeamId) {
      throw new RuleViolation(
        'statkeeper.capture.team_relationship',
        `Participant role ${slot.roleKey} violates its ${slot.teamRelationship} Team relationship`
      );
    }
  }

  const events = action.eventEmissions.flatMap((emission) => {
    const participant = selections.get(emission.actorRoleKey);
    if (!participant && emission.condition === 'when_actor_present') return [];
    if (!participant) {
      throw new RuleViolation(
        'statkeeper.capture.expansion',
        `Required emitted role ${emission.actorRoleKey} is unresolved`
      );
    }
    return [{
      eventKey: emission.eventKey,
      outcomeKey: emission.outcomeKey,
      seasonTeamId: participant.seasonTeamId,
      assignments: [{
        roleKey: emission.actorRoleKey,
        rosterMembershipId: participant.rosterMembershipId
      }]
    }];
  });
  const occurrence = normalizeStatkeeperOccurrenceInput({
    occurrenceId: input.capture.occurrenceId,
    captureActionKey: actionKey,
    evidenceTimestampMs: input.capture.evidenceTimestampMs,
    evidenceWindow: input.capture.evidenceWindow,
    period: input.capture.period,
    clock: input.capture.clock,
    events,
    operatorNote: input.capture.operatorNote
  });

  let possessionDirective: StatkeeperPossessionDirective;
  if (action.possessionEffect === 'retain') {
    possessionDirective = {
      effect: 'retain',
      currentPossessingSeasonTeamId: possession?.possessingSeasonTeamId ?? null
    };
  } else if (action.possessionEffect === 'prompt') {
    possessionDirective = {
      effect: 'prompt',
      currentPossessingSeasonTeamId: possession?.possessingSeasonTeamId ?? null,
      candidateSeasonTeamIds: [homeSeasonTeamId, awaySeasonTeamId]
    };
  } else {
    if (!possession || !opposingSeasonTeamId) {
      throw new RuleViolation(
        'statkeeper.capture.possession_required',
        `Capture Action ${actionKey} cannot switch an absent possession`
      );
    }
    if (
      !Number.isSafeInteger(possession.startMediaOffsetMs)
      || possession.startMediaOffsetMs < 0
      || occurrence.evidenceTimestampMs < possession.startMediaOffsetMs
    ) {
      throw new RuleViolation(
        'statkeeper.capture.possession_time',
        'Automatic possession switch cannot precede the open Possession Sequence'
      );
    }
    possessionDirective = {
      effect: 'switch',
      closingSequenceId: possession.sequenceId,
      fromSeasonTeamId: possession.possessingSeasonTeamId,
      toSeasonTeamId: opposingSeasonTeamId,
      atMediaOffsetMs: occurrence.evidenceTimestampMs
    };
  }

  return {actionKey, occurrence, possession: possessionDirective};
}

import {describe, expect, it} from 'vitest';

import {
  buildStatkeeperOccurrenceLedgerRecord,
  buildStatkeeperVoidRevision,
  normalizeStatkeeperOccurrenceInput,
  STATKEEPER_LEDGER_RECORD_FORMAT,
  type StatkeeperLedgerContext,
  type StatkeeperOccurrenceInput
} from '@/courtside/core/statkeeper-event-ledger';

const ids = {
  session: 'b1000000-0000-4000-8000-000000000001',
  game: 'b1000000-0000-4000-8000-000000000002',
  profile: 'b1000000-0000-4000-8000-000000000003',
  media: 'b1000000-0000-4000-8000-000000000004',
  homeTeam: 'b1000000-0000-4000-8000-000000000005',
  awayTeam: 'b1000000-0000-4000-8000-000000000006',
  shooter: 'b1000000-0000-4000-8000-000000000007',
  shooterMembership: 'b1000000-0000-4000-8000-000000000008',
  assister: 'b1000000-0000-4000-8000-000000000009',
  assisterMembership: 'b1000000-0000-4000-8000-000000000010',
  occurrence: 'b1000000-0000-4000-8000-000000000011',
  actor: 'b1000000-0000-4000-8000-000000000012'
};

const context: StatkeeperLedgerContext = {
  captureSessionId: ids.session,
  gameId: ids.game,
  profileVersionId: ids.profile,
  profileContentHash: 'a'.repeat(64),
  mediaId: ids.media,
  homeSeasonTeamId: ids.homeTeam,
  awaySeasonTeamId: ids.awayTeam,
  regulationPeriodCount: 4,
  regulationPeriodDurationMs: 600_000,
  overtimePeriodDurationMs: 300_000,
  eventDefinitions: [{
    eventKey: 'made_shot',
    participantRoleKeys: ['shooter', 'assister'],
    outcomes: [{
      outcomeKey: 'made_two',
      contributions: [
        {statKey: 'points', increment: 2},
        {statKey: 'field_goals_made', increment: 1}
      ]
    }]
  }],
  participants: [
    {
      rosterMembershipId: ids.shooterMembership,
      playerId: ids.shooter,
      seasonTeamId: ids.homeTeam,
      participationStatus: 'appeared'
    },
    {
      rosterMembershipId: ids.assisterMembership,
      playerId: ids.assister,
      seasonTeamId: ids.homeTeam,
      participationStatus: 'appeared'
    }
  ]
};

function input(assignments: StatkeeperOccurrenceInput['events'][number]['assignments'] = [
  {roleKey: 'shooter', rosterMembershipId: ids.shooterMembership},
  {roleKey: 'assister', rosterMembershipId: ids.assisterMembership}
]): StatkeeperOccurrenceInput {
  return {
    occurrenceId: ids.occurrence,
    evidenceTimestampMs: 123_456,
    evidenceWindow: {startMs: 122_000, endMs: 125_000},
    period: {kind: 'regulation', ordinal: 2},
    clock: {state: 'estimated', remainingMs: 412_000, reason: '  horloge décalée  '},
    events: [{
      eventKey: 'made_shot',
      outcomeKey: 'made_two',
      seasonTeamId: ids.homeTeam,
      assignments
    }],
    operatorNote: '  Tir réussi  '
  };
}

describe('Statkeeper occurrence ledger', () => {
  it('validates, normalizes, and deterministically identifies an immutable event record', () => {
    const first = buildStatkeeperOccurrenceLedgerRecord(
      context,
      ids.actor,
      normalizeStatkeeperOccurrenceInput(input())
    );
    const reordered = buildStatkeeperOccurrenceLedgerRecord(
      context,
      ids.actor,
      normalizeStatkeeperOccurrenceInput(input([
        {roleKey: 'assister', rosterMembershipId: ids.assisterMembership},
        {roleKey: 'shooter', rosterMembershipId: ids.shooterMembership}
      ]))
    );

    expect(reordered).toEqual(first);
    expect(first).toMatchObject({
      occurrenceId: ids.occurrence,
      revisionNumber: 1,
      occurrenceRevisionId: '1a0eab8b-656e-5231-ab6b-cb0ef95504df',
      contentHash: '4e8b36d4a9d31bbc16d927f95380d4b740095765327286962af973e18286a325',
      events: [{
        id: '4c40ab13-e265-5b4b-b8ba-71cb76731742',
        eventKey: 'made_shot',
        outcomeKey: 'made_two',
        contributions: [
          {statKey: 'field_goals_made', increment: 1},
          {statKey: 'points', increment: 2}
        ]
      }]
    });
    expect(JSON.parse(first.canonicalPayload)).toMatchObject({
      format: STATKEEPER_LEDGER_RECORD_FORMAT,
      source: 'human',
      verification_state: 'recorded',
      disposition: 'active',
      operator_note: 'Tir réussi',
      clock_annotation: {reason: 'horloge décalée'}
    });
  });

  it('rejects invalid evidence, clock, profile, Team, and participation input', () => {
    expect(() => normalizeStatkeeperOccurrenceInput({
      ...input(),
      evidenceWindow: {startMs: 124_000, endMs: 125_000}
    })).toThrow(/contain the evidence timestamp/);
    expect(() => buildStatkeeperOccurrenceLedgerRecord(
      context,
      ids.actor,
      normalizeStatkeeperOccurrenceInput({
        ...input(),
        clock: {state: 'exact', remainingMs: 700_000}
      })
    )).toThrow(/exceeds/);
    expect(() => buildStatkeeperOccurrenceLedgerRecord(
      context,
      ids.actor,
      normalizeStatkeeperOccurrenceInput({
        ...input(),
        events: [{...input().events[0]!, eventKey: 'unknown_event'}]
      })
    )).toThrow(/absent from the snapshotted profile/);
    expect(() => buildStatkeeperOccurrenceLedgerRecord(
      {
        ...context,
        participants: context.participants.map((participant) => ({
          ...participant,
          participationStatus: 'did_not_play' as const
        }))
      },
      ids.actor,
      normalizeStatkeeperOccurrenceInput(input())
    )).toThrow(/appeared/);
    expect(() => normalizeStatkeeperOccurrenceInput({
      ...input(),
      source: 'model'
    } as StatkeeperOccurrenceInput)).toThrow(/not accepted/);
  });

  it('creates deterministic active correction and non-contributing void lineage', () => {
    const first = buildStatkeeperOccurrenceLedgerRecord(context, ids.actor, normalizeStatkeeperOccurrenceInput(input()));
    const revised = buildStatkeeperOccurrenceLedgerRecord(context, ids.actor, normalizeStatkeeperOccurrenceInput({
      ...input(), evidenceTimestampMs: 124_000, evidenceWindow: null
    }), {revisionNumber: 2, previousOccurrenceRevisionId: first.occurrenceRevisionId, correctionReason: '  Revu à la vidéo  '});
    expect(revised).toMatchObject({revisionNumber: 2, previousOccurrenceRevisionId: first.occurrenceRevisionId,
      disposition: 'active', occurrenceRevisionId: 'bdbf8664-f0a3-5bc6-b250-065033981646'});
    expect(revised.events[0]!.id).not.toBe(first.events[0]!.id);
    expect(JSON.parse(revised.canonicalPayload)).toMatchObject({
      previous_occurrence_revision_id: first.occurrenceRevisionId,
      correction_reason: 'Revu à la vidéo', verification_state: 'recorded', disposition: 'active'
    });
    const voided = buildStatkeeperVoidRevision({context, actorAccountId: ids.actor, current: revised,
      revisionNumber: 3, reason: null});
    expect(voided).toMatchObject({revisionNumber: 3, previousOccurrenceRevisionId: revised.occurrenceRevisionId,
      disposition: 'void', events: []});
    expect(JSON.parse(voided.canonicalPayload)).toMatchObject({events: [], disposition: 'void',
      previous_occurrence_revision_id: revised.occurrenceRevisionId, correction_reason: null});
    expect(buildStatkeeperVoidRevision({context, actorAccountId: ids.actor, current: revised,
      revisionNumber: 3, reason: null})).toEqual(voided);
  });

  it('rejects skipped, detached, or malformed correction lineage', () => {
    const first = buildStatkeeperOccurrenceLedgerRecord(context, ids.actor, normalizeStatkeeperOccurrenceInput(input()));
    expect(() => buildStatkeeperOccurrenceLedgerRecord(context, ids.actor,
      normalizeStatkeeperOccurrenceInput(input()), {revisionNumber: 2})).toThrow(/predecessor/);
    expect(() => buildStatkeeperOccurrenceLedgerRecord(context, ids.actor,
      normalizeStatkeeperOccurrenceInput(input()), {revisionNumber: 1, previousOccurrenceRevisionId: first.occurrenceRevisionId})).toThrow(/initial/);
    expect(() => buildStatkeeperVoidRevision({context, actorAccountId: ids.actor, current: first,
      revisionNumber: 3, reason: null})).toThrow(/immediately/);
    expect(() => buildStatkeeperVoidRevision({context: {...context, mediaId: ids.game},
      actorAccountId: ids.actor, current: first, revisionNumber: 2, reason: null})).toThrow(/envelope/);
  });
});

import {describe, expect, it} from 'vitest';

import {expandStatkeeperCaptureAction} from '@/courtside/core/statkeeper-capture';
import {normalizeStatkeeperProfileDefinition} from '@/courtside/core/statkeeper-profile';
import {statkeeperProfileFixture} from '../fixtures/statkeeper-profile';

const ids = {
  home: 'f1000000-0000-4000-8000-000000000001',
  away: 'f1000000-0000-4000-8000-000000000002',
  shooter: 'f1000000-0000-4000-8000-000000000003',
  shooterMembership: 'f1000000-0000-4000-8000-000000000004',
  assister: 'f1000000-0000-4000-8000-000000000005',
  assisterMembership: 'f1000000-0000-4000-8000-000000000006',
  defender: 'f1000000-0000-4000-8000-000000000007',
  defenderMembership: 'f1000000-0000-4000-8000-000000000008',
  occurrence: 'f1000000-0000-4000-8000-000000000009',
  possession: 'f1000000-0000-4000-8000-000000000010'
};

const participants = [
  {
    rosterMembershipId: ids.shooterMembership,
    playerId: ids.shooter,
    seasonTeamId: ids.home,
    participationStatus: 'appeared' as const
  },
  {
    rosterMembershipId: ids.assisterMembership,
    playerId: ids.assister,
    seasonTeamId: ids.home,
    participationStatus: 'appeared' as const
  },
  {
    rosterMembershipId: ids.defenderMembership,
    playerId: ids.defender,
    seasonTeamId: ids.away,
    participationStatus: 'did_not_play' as const
  }
];

function compoundProfile() {
  const base = statkeeperProfileFixture();
  const points = base.projectedStatistics[0]!;
  const shot = base.statisticalEvents[0]!;
  return normalizeStatkeeperProfileDefinition({
    ...base,
    projectedStatistics: [
      points,
      {
        statKey: 'assists',
        fullLabel: {en: 'Assists', fr: 'Passes décisives'},
        shortLabel: {en: 'AST', fr: 'PDS'},
        displayOrder: 1,
        coverageGroupKey: 'scoring',
        aggregation: 'sum',
        semanticRole: null,
        showOnMemberGameLog: true,
        showOnBoxScore: true
      }
    ],
    statisticalEvents: [
      shot,
      {
        eventKey: 'assist',
        label: {en: 'Assist', fr: 'Passe décisive'},
        outcomes: [{
          outcomeKey: 'credited',
          label: {en: 'Credited', fr: 'Créditée'},
          contributions: [{statKey: 'assists', increment: 1}]
        }]
      }
    ],
    captureActions: [{
      actionKey: 'made_two_with_assist',
      label: {en: 'Made two', fr: 'Deux points réussis'},
      displayOrder: 0,
      availability: 'offense',
      participantSlots: [
        {
          roleKey: 'shooter',
          label: {en: 'Shooter', fr: 'Tireur'},
          presence: 'required',
          teamRelationship: 'possessing',
          primary: true
        },
        {
          roleKey: 'assister',
          label: {en: 'Assister', fr: 'Passeur'},
          presence: 'optional',
          teamRelationship: 'possessing',
          primary: false
        }
      ],
      eventEmissions: [
        {
          eventKey: 'two_point_shot',
          outcomeKey: 'made',
          actorRoleKey: 'shooter',
          condition: 'always'
        },
        {
          eventKey: 'assist',
          outcomeKey: 'credited',
          actorRoleKey: 'assister',
          condition: 'when_actor_present'
        }
      ],
      possessionEffect: 'switch',
      allowDuplicatePlayerAssignments: false
    }]
  });
}

function capture(participantSelections = [
  {roleKey: 'shooter', playerId: ids.shooter},
  {roleKey: 'assister', playerId: ids.assister}
]) {
  return {
    occurrenceId: ids.occurrence,
    actionKey: 'made_two_with_assist',
    evidenceTimestampMs: 42_000,
    evidenceWindow: {startMs: 41_000, endMs: 43_000},
    period: {kind: 'regulation' as const, ordinal: 1},
    clock: {state: 'exact' as const, remainingMs: 558_000},
    participantSelections,
    operatorNote: '  Passe décisive  '
  };
}

describe('Statkeeper Capture Action expansion', () => {
  it('resolves Players through participation, expands compound events, and calculates a switch', () => {
    const expanded = expandStatkeeperCaptureAction({
      profile: compoundProfile(),
      homeSeasonTeamId: ids.home,
      awaySeasonTeamId: ids.away,
      participants,
      openPossession: {
        sequenceId: ids.possession,
        possessingSeasonTeamId: ids.home,
        startMediaOffsetMs: 0
      },
      capture: capture()
    });

    expect(expanded.occurrence.captureActionKey).toBe('made_two_with_assist');
    expect(expanded.occurrence.operatorNote).toBe('Passe décisive');
    expect(expanded.occurrence.events).toEqual([
      {
        eventKey: 'two_point_shot',
        outcomeKey: 'made',
        seasonTeamId: ids.home,
        assignments: [{roleKey: 'shooter', rosterMembershipId: ids.shooterMembership}]
      },
      {
        eventKey: 'assist',
        outcomeKey: 'credited',
        seasonTeamId: ids.home,
        assignments: [{roleKey: 'assister', rosterMembershipId: ids.assisterMembership}]
      }
    ]);
    expect(expanded.possession).toEqual({
      effect: 'switch',
      closingSequenceId: ids.possession,
      fromSeasonTeamId: ids.home,
      toSeasonTeamId: ids.away,
      atMediaOffsetMs: 42_000
    });
  });

  it('omits an optional conditional event and returns a prompt without changing possession', () => {
    const profile = normalizeStatkeeperProfileDefinition(statkeeperProfileFixture());
    const expanded = expandStatkeeperCaptureAction({
      profile,
      homeSeasonTeamId: ids.home,
      awaySeasonTeamId: ids.away,
      participants,
      openPossession: {
        sequenceId: ids.possession,
        possessingSeasonTeamId: ids.home,
        startMediaOffsetMs: 0
      },
      capture: {
        ...capture([{roleKey: 'shooter', playerId: ids.shooter}]),
        actionKey: 'missed_two'
      }
    });

    expect(expanded.occurrence.events).toHaveLength(1);
    expect(expanded.possession).toEqual({
      effect: 'prompt',
      currentPossessingSeasonTeamId: ids.home,
      candidateSeasonTeamIds: [ids.home, ids.away]
    });
  });

  it('rejects missing possession, DNP attribution, wrong Team relationships, and duplicate Players', () => {
    const profile = compoundProfile();
    expect(() => expandStatkeeperCaptureAction({
      profile,
      homeSeasonTeamId: ids.home,
      awaySeasonTeamId: ids.away,
      participants,
      openPossession: null,
      capture: capture()
    })).toThrow(/requires an established possession/);

    expect(() => expandStatkeeperCaptureAction({
      profile,
      homeSeasonTeamId: ids.home,
      awaySeasonTeamId: ids.away,
      participants,
      openPossession: {
        sequenceId: ids.possession,
        possessingSeasonTeamId: ids.home,
        startMediaOffsetMs: 0
      },
      capture: capture([{roleKey: 'shooter', playerId: ids.defender}])
    })).toThrow(/appeared Capture Session Player/);

    expect(() => expandStatkeeperCaptureAction({
      profile,
      homeSeasonTeamId: ids.home,
      awaySeasonTeamId: ids.away,
      participants,
      openPossession: {
        sequenceId: ids.possession,
        possessingSeasonTeamId: ids.away,
        startMediaOffsetMs: 0
      },
      capture: capture([{roleKey: 'shooter', playerId: ids.shooter}])
    })).toThrow(/not on the offense Team/);

    expect(() => expandStatkeeperCaptureAction({
      profile,
      homeSeasonTeamId: ids.home,
      awaySeasonTeamId: ids.away,
      participants,
      openPossession: {
        sequenceId: ids.possession,
        possessingSeasonTeamId: ids.home,
        startMediaOffsetMs: 0
      },
      capture: capture([
        {roleKey: 'shooter', playerId: ids.shooter},
        {roleKey: 'assister', playerId: ids.shooter}
      ])
    })).toThrow(/cannot fill multiple participant roles/);
  });
});

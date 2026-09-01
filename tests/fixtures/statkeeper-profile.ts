import type {StatkeeperProfileDefinition} from '@/courtside/core/statkeeper-profile';

export function statkeeperProfileFixture(): StatkeeperProfileDefinition {
  return {
    regulationPeriodCount: 4,
    regulationPeriodDurationMs: 600_000,
    overtimePeriodDurationMs: 300_000,
    coverageGroups: [{
      coverageGroupKey: 'scoring',
      label: {en: 'Scoring', fr: 'Points'},
      displayOrder: 0
    }],
    projectedStatistics: [{
      statKey: 'points',
      fullLabel: {en: 'Points', fr: 'Points'},
      shortLabel: {en: 'PTS', fr: 'PTS'},
      displayOrder: 0,
      coverageGroupKey: 'scoring',
      aggregation: 'sum',
      semanticRole: 'player_points',
      showOnMemberGameLog: true,
      showOnBoxScore: true
    }],
    statisticalEvents: [{
      eventKey: 'two_point_shot',
      label: {en: 'Two-point shot', fr: 'Tir à deux points'},
      outcomes: [
        {
          outcomeKey: 'made',
          label: {en: 'Made', fr: 'Réussi'},
          contributions: [{statKey: 'points', increment: 2}]
        },
        {
          outcomeKey: 'missed',
          label: {en: 'Missed', fr: 'Manqué'},
          contributions: []
        }
      ]
    }],
    captureActions: [
      {
        actionKey: 'made_two',
        label: {en: 'Made two', fr: 'Deux points réussis'},
        displayOrder: 0,
        availability: 'offense',
        participantSlots: [{
          roleKey: 'shooter',
          label: {en: 'Shooter', fr: 'Tireur'},
          presence: 'required',
          teamRelationship: 'possessing',
          primary: true
        }],
        eventEmissions: [{
          eventKey: 'two_point_shot',
          outcomeKey: 'made',
          actorRoleKey: 'shooter',
          condition: 'always'
        }],
        possessionEffect: 'retain',
        allowDuplicatePlayerAssignments: false
      },
      {
        actionKey: 'missed_two',
        label: {en: 'Missed two', fr: 'Deux points manqués'},
        displayOrder: 1,
        availability: 'offense',
        participantSlots: [{
          roleKey: 'shooter',
          label: {en: 'Shooter', fr: 'Tireur'},
          presence: 'required',
          teamRelationship: 'possessing',
          primary: true
        }],
        eventEmissions: [{
          eventKey: 'two_point_shot',
          outcomeKey: 'missed',
          actorRoleKey: 'shooter',
          condition: 'always'
        }],
        possessionEffect: 'prompt',
        allowDuplicatePlayerAssignments: false
      }
    ]
  };
}

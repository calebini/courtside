import {readStandingsConfiguration} from './configuration';
import {RuleViolation} from './errors';

export function normalizeSeasonName(value: string) {
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 120) {
    throw new RuleViolation(
      'season.name',
      'A Season name must contain between 2 and 120 characters'
    );
  }
  return name;
}

export function createDefaultSeasonResultConfiguration() {
  const configuration = {
    standings: {
      points: {win: 2, loss: 0},
      ranking: [
        'league_points',
        'point_differential',
        'points_scored',
        'random_draw'
      ],
      eligible_phases: ['regular'],
      eligible_statuses: ['final', 'forfeit'],
      adjustments_enabled: false,
      forfeit_treatment: 'explicit_score'
    },
    playoffs: {rounds: []}
  } as const;

  readStandingsConfiguration(configuration);
  return configuration;
}

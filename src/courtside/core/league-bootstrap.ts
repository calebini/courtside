import {validateEmail} from './account-onboarding';
import {RuleViolation} from './errors';

export type LeagueLanguage = 'en' | 'fr';

export interface LeagueBootstrapInput {
  readonly adminEmail: string;
  readonly leagueName: string;
  readonly timezone: string;
  readonly defaultLanguage: LeagueLanguage;
}

export type ValidatedLeagueBootstrapInput = LeagueBootstrapInput;

export interface StagingDatabaseTarget {
  readonly environment: string;
  readonly connectionString: string;
  readonly confirmedProjectRef: string;
}

export function validateLeagueBootstrapInput(
  input: LeagueBootstrapInput
): ValidatedLeagueBootstrapInput {
  const leagueName = input.leagueName.trim().replace(/\s+/g, ' ');
  if (leagueName.length < 2 || leagueName.length > 160) {
    throw new RuleViolation(
      'bootstrap.league_name',
      'The League name must contain between 2 and 160 characters'
    );
  }

  const timezone = input.timezone.trim();
  try {
    new Intl.DateTimeFormat('en', {timeZone: timezone}).format();
  } catch {
    throw new RuleViolation(
      'bootstrap.timezone',
      'The League timezone must be a valid IANA timezone'
    );
  }

  if (input.defaultLanguage !== 'en' && input.defaultLanguage !== 'fr') {
    throw new RuleViolation(
      'bootstrap.default_language',
      'The default language must be en or fr'
    );
  }

  return {
    adminEmail: validateEmail(input.adminEmail),
    leagueName,
    timezone,
    defaultLanguage: input.defaultLanguage
  };
}

export function assertStagingDatabaseTarget(target: StagingDatabaseTarget) {
  if (target.environment !== 'staging') {
    throw new RuleViolation(
      'bootstrap.staging_only',
      'The bootstrap command is restricted to the staging environment'
    );
  }

  let url: URL;
  try {
    url = new URL(target.connectionString);
  } catch {
    throw new RuleViolation(
      'bootstrap.database_target',
      'DATABASE_URL must be a valid PostgreSQL connection string'
    );
  }

  const username = decodeURIComponent(url.username);
  const projectRef = username.startsWith('postgres.')
    ? username.slice('postgres.'.length)
    : '';
  const isTransactionPooler =
    (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
    url.hostname.endsWith('.pooler.supabase.com') &&
    url.port === '6543' &&
    projectRef.length > 0;

  if (!isTransactionPooler) {
    throw new RuleViolation(
      'bootstrap.database_target',
      'Bootstrap requires a Supabase transaction-pooler URL on port 6543'
    );
  }

  if (!target.confirmedProjectRef || target.confirmedProjectRef !== projectRef) {
    throw new RuleViolation(
      'bootstrap.project_confirmation',
      'The confirmed Supabase project reference does not match DATABASE_URL'
    );
  }

  return {projectRef};
}

import {randomUUID} from 'node:crypto';

import {PostgresBootstrapLeagueStore} from '@/courtside/adapters/postgres/bootstrap-league-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {assertStagingDatabaseTarget, type LeagueLanguage} from '@/courtside/core/league-bootstrap';
import {RuleViolation} from '@/courtside/core/errors';
import {createLeagueBootstrapService} from '@/courtside/services/bootstrap-league';

interface Arguments {
  readonly adminEmail: string;
  readonly leagueName: string;
  readonly timezone: string;
  readonly defaultLanguage: LeagueLanguage;
  readonly confirmedProjectRef: string;
  readonly environment: string;
  readonly apply: boolean;
}

function usage() {
  return `Usage:
  npm run bootstrap:staging -- \\
    --environment staging \\
    --confirm-project-ref <supabase-project-ref> \\
    --admin-email <registered-account-email> \\
    --league-name <league-name> \\
    --timezone Europe/Paris \\
    --default-language en|fr [--apply]

The command is a read-only plan unless --apply is present.`;
}

function parseArguments(values: readonly string[]): Arguments {
  const parsed = new Map<string, string>();
  let apply = false;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--apply') {
      apply = true;
      continue;
    }
    if (!value.startsWith('--')) {
      throw new RuleViolation('bootstrap.arguments', `Unexpected argument: ${value}`);
    }
    const next = values[index + 1];
    if (!next || next.startsWith('--')) {
      throw new RuleViolation('bootstrap.arguments', `Missing value for ${value}`);
    }
    parsed.set(value, next);
    index += 1;
  }

  const required = (name: string) => {
    const value = parsed.get(name);
    if (!value) {
      throw new RuleViolation('bootstrap.arguments', `Missing required argument: ${name}`);
    }
    return value;
  };
  const defaultLanguage = required('--default-language');
  if (defaultLanguage !== 'en' && defaultLanguage !== 'fr') {
    throw new RuleViolation('bootstrap.arguments', '--default-language must be en or fr');
  }

  return {
    adminEmail: required('--admin-email'),
    leagueName: required('--league-name'),
    timezone: required('--timezone'),
    defaultLanguage,
    confirmedProjectRef: required('--confirm-project-ref'),
    environment: required('--environment'),
    apply
  };
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(usage());
    return;
  }

  const args = parseArguments(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new RuleViolation(
      'bootstrap.database_url',
      'DATABASE_URL is required and must remain server-only'
    );
  }
  const {projectRef} = assertStagingDatabaseTarget({
    environment: args.environment,
    connectionString,
    confirmedProjectRef: args.confirmedProjectRef
  });

  const pool = createPostgresPool(connectionString);
  try {
    const bootstrap = createLeagueBootstrapService(new PostgresBootstrapLeagueStore(pool));
    const result = await bootstrap({
      commandId: randomUUID(),
      adminEmail: args.adminEmail,
      leagueName: args.leagueName,
      timezone: args.timezone,
      defaultLanguage: args.defaultLanguage,
      apply: args.apply
    });

    console.log(JSON.stringify({
      mode: args.apply ? 'apply' : 'plan',
      projectRef,
      ...result
    }, null, 2));
    if (!args.apply) {
      console.log('\nNo changes made. Re-run the same command with --apply after reviewing this plan.');
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap failure';
  const rule = error instanceof RuleViolation ? ` (${error.rule})` : '';
  console.error(`Bootstrap failed${rule}: ${message}`);
  process.exitCode = 1;
});

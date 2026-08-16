import {describe, expect, it} from 'vitest';

import {
  assertStagingDatabaseTarget,
  validateLeagueBootstrapInput
} from '@/courtside/core/league-bootstrap';

describe('initial League Administrator bootstrap validation', () => {
  it('normalizes explicit League and Account input', () => {
    expect(validateLeagueBootstrapInput({
      adminEmail: ' ADMIN@Example.test ',
      leagueName: '  Paris   Rec Basketball  ',
      timezone: 'Europe/Paris',
      defaultLanguage: 'fr'
    })).toEqual({
      adminEmail: 'admin@example.test',
      leagueName: 'Paris Rec Basketball',
      timezone: 'Europe/Paris',
      defaultLanguage: 'fr'
    });
  });

  it('rejects invalid or implicit League configuration', () => {
    expect(() => validateLeagueBootstrapInput({
      adminEmail: 'admin@example.test',
      leagueName: 'P',
      timezone: 'Europe/Paris',
      defaultLanguage: 'en'
    })).toThrow(/League name/);
    expect(() => validateLeagueBootstrapInput({
      adminEmail: 'admin@example.test',
      leagueName: 'Paris Rec Basketball',
      timezone: 'Paris-ish',
      defaultLanguage: 'en'
    })).toThrow(/IANA timezone/);
  });

  it('accepts only the explicitly confirmed staging transaction pooler', () => {
    expect(assertStagingDatabaseTarget({
      environment: 'staging',
      connectionString:
        'postgresql://postgres.projectref:secret@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
      confirmedProjectRef: 'projectref'
    })).toEqual({projectRef: 'projectref'});

    expect(() => assertStagingDatabaseTarget({
      environment: 'production',
      connectionString:
        'postgresql://postgres.projectref:secret@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
      confirmedProjectRef: 'projectref'
    })).toThrow(/staging environment/);
    expect(() => assertStagingDatabaseTarget({
      environment: 'staging',
      connectionString:
        'postgresql://postgres.projectref:secret@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
      confirmedProjectRef: 'different-project'
    })).toThrow(/does not match/);
    expect(() => assertStagingDatabaseTarget({
      environment: 'staging',
      connectionString: 'postgresql://postgres:secret@db.projectref.supabase.co:5432/postgres',
      confirmedProjectRef: 'projectref'
    })).toThrow(/transaction-pooler/);
  });
});

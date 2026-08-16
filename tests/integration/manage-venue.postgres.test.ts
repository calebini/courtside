import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {PostgresGameOperationStore} from '@/courtside/adapters/postgres/game-operation-store';
import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresVenueStore} from '@/courtside/adapters/postgres/venue-store';
import {createDefaultSeasonResultConfiguration} from '@/courtside/core/season-setup';
import {createGameOperationsService} from '@/courtside/services/manage-game';
import {createVenueService} from '@/courtside/services/manage-venue';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: '99000000-0000-4000-8000-000000000001',
  admin: '99000000-0000-4000-8000-000000000002',
  outsider: '99000000-0000-4000-8000-000000000003',
  assignment: '99000000-0000-4000-8000-000000000004',
  venue: '99000000-0000-4000-8000-000000000005',
  season: '99000000-0000-4000-8000-000000000006',
  teamA: '99000000-0000-4000-8000-000000000007',
  teamB: '99000000-0000-4000-8000-000000000008',
  seasonTeamA: '99000000-0000-4000-8000-000000000009',
  seasonTeamB: '99000000-0000-4000-8000-000000000010'
};

describeWithDatabase('PostgreSQL Venue administration', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createPostgresPool(connectionString!);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`
      truncate table
        player_management_relationships,
        roster_memberships,
        players,
        command_receipts,
        audit_records,
        games,
        venues,
        season_configuration_versions,
        season_teams,
        teams,
        league_admin_assignments,
        user_accounts,
        seasons,
        leagues
      restart identity cascade
    `);
    await pool.query(
      `insert into leagues (id, name, timezone, default_language)
       values ($1, 'Chatel Cup', 'Europe/Paris', 'en')`,
      [ids.league]
    );
    await pool.query(
      `insert into user_accounts (id, display_name)
       values ($1, 'League Admin'), ($2, 'Outsider')`,
      [ids.admin, ids.outsider]
    );
    await pool.query(
      `insert into league_admin_assignments (id, league_id, user_account_id)
       values ($1, $2, $3)`,
      [ids.assignment, ids.league, ids.admin]
    );
  });

  it('creates normalized Venue details, audit, dashboard projection, and one retry receipt', async () => {
    const generatedIds = [
      '99000000-0000-4000-8000-000000000011',
      ids.venue
    ];
    const manage = createVenueService(new PostgresVenueStore(pool), {
      now: () => new Date('2026-08-16T06:00:00Z'),
      newId: () => generatedIds.shift()!
    });
    const command = {
      type: 'create' as const,
      commandId: '99000000-0000-4000-8000-000000000012',
      actorAccountId: ids.admin,
      leagueId: ids.league,
      name: ' Gymnase  Saint-Merri ',
      address: ' 16 Rue du Renard,  Paris ',
      notes: ' Entrée côté cour '
    };

    const first = await manage(command);
    expect(first).toMatchObject({
      receiptReused: false,
      venue: {
        id: ids.venue,
        name: 'Gymnase Saint-Merri',
        address: '16 Rue du Renard, Paris',
        notes: 'Entrée côté cour',
        archivedAt: null
      }
    });
    await expect(manage(command)).resolves.toEqual({...first, receiptReused: true});
    expect((await pool.query('select id from venues')).rowCount).toBe(1);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(1);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(1);

    const dashboard = await new PostgresAdminDashboardStore(pool).load(ids.admin);
    expect(dashboard[0]?.venues).toEqual([{
      id: ids.venue,
      name: 'Gymnase Saint-Merri',
      address: '16 Rue du Renard, Paris',
      notes: 'Entrée côté cour',
      archivedAt: null
    }]);
  });

  it('corrects and then archives a Venue while retaining durable identity', async () => {
    await pool.query(
      `insert into venues (id, league_id, name, address)
       values ($1, $2, 'Gymnase Saint-Merri', '16 Rue du Renard, Paris')`,
      [ids.venue, ids.league]
    );
    const auditIds = [
      '99000000-0000-4000-8000-000000000013',
      '99000000-0000-4000-8000-000000000014'
    ];
    const manage = createVenueService(new PostgresVenueStore(pool), {
      now: () => new Date('2026-08-16T06:30:00Z'),
      newId: () => auditIds.shift()!
    });

    await manage({
      type: 'update',
      commandId: '99000000-0000-4000-8000-000000000015',
      actorAccountId: ids.admin,
      venueId: ids.venue,
      name: 'Gymnase Saint-Merri',
      address: '16 Rue du Renard, 75004 Paris',
      notes: 'Entrée côté cour'
    });
    await manage({
      type: 'archive',
      commandId: '99000000-0000-4000-8000-000000000016',
      actorAccountId: ids.admin,
      venueId: ids.venue
    });

    const stored = await pool.query<{
      address: string;
      notes: string | null;
      archived_at: Date | null;
    }>('select address, notes, archived_at from venues where id = $1', [ids.venue]);
    expect(stored.rows[0]).toMatchObject({
      address: '16 Rue du Renard, 75004 Paris',
      notes: 'Entrée côté cour',
      archived_at: new Date('2026-08-16T06:30:00Z')
    });
    expect((await pool.query(
      `select id from audit_records where action in ('venue.updated', 'venue.archived')`
    )).rowCount).toBe(2);
  });

  it('rejects unauthorized and active duplicate creation without mutation', async () => {
    await pool.query(
      `insert into venues (id, league_id, name, address)
       values ($1, $2, 'Gymnase Saint-Merri', '16 Rue du Renard, Paris')`,
      [ids.venue, ids.league]
    );
    const manage = createVenueService(new PostgresVenueStore(pool));
    await expect(manage({
      type: 'create',
      commandId: '99000000-0000-4000-8000-000000000017',
      actorAccountId: ids.outsider,
      leagueId: ids.league,
      name: 'Second Gym',
      address: '2 Rue de Rivoli, Paris',
      notes: null
    })).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
    await expect(manage({
      type: 'create',
      commandId: '99000000-0000-4000-8000-000000000018',
      actorAccountId: ids.admin,
      leagueId: ids.league,
      name: 'GYMNASE SAINT-MERRI',
      address: 'Another address',
      notes: null
    })).rejects.toMatchObject({report: {violatedRule: 'venue.active_name_unique_per_league'}});
    expect((await pool.query('select id from venues')).rowCount).toBe(1);
    expect((await pool.query('select id from audit_records')).rowCount).toBe(0);
  });

  it('preserves archived Venue reads while excluding it from future scheduling', async () => {
    await pool.query(
      `insert into venues (id, league_id, name, address)
       values ($1, $2, 'Gymnase Saint-Merri', '16 Rue du Renard, Paris')`,
      [ids.venue, ids.league]
    );
    await pool.query(
      `insert into seasons (id, league_id, name, result_configuration)
       values ($1, $2, '2026 Season', $3::jsonb)`,
      [ids.season, ids.league, JSON.stringify(createDefaultSeasonResultConfiguration())]
    );
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $3, 'Paris A'), ($2, $3, 'Paris B')`,
      [ids.teamA, ids.teamB, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id)
       values ($1, $3, $4), ($2, $3, $5)`,
      [ids.seasonTeamA, ids.seasonTeamB, ids.season, ids.teamA, ids.teamB]
    );
    await pool.query(
      `insert into games
        (season_id, phase, status, home_season_team_id, away_season_team_id,
         scheduled_at, venue_id)
       values ($1, 'regular', 'scheduled', $2, $3, '2026-09-01T18:00:00Z', $4)`,
      [ids.season, ids.seasonTeamA, ids.seasonTeamB, ids.venue]
    );
    await createVenueService(new PostgresVenueStore(pool), {
      now: () => new Date('2026-08-16T06:30:00Z'),
      newId: () => '99000000-0000-4000-8000-000000000020'
    })({
      type: 'archive',
      commandId: '99000000-0000-4000-8000-000000000021',
      actorAccountId: ids.admin,
      venueId: ids.venue
    });

    const dashboard = await new PostgresAdminDashboardStore(pool).load(ids.admin);
    expect(dashboard[0]?.venues[0]).toMatchObject({id: ids.venue});
    expect(dashboard[0]?.venues[0]?.archivedAt).toBeInstanceOf(Date);
    expect(dashboard[0]?.seasons[0]?.scheduledGames[0]).toMatchObject({
      venueId: ids.venue,
      venueName: 'Gymnase Saint-Merri'
    });

    const manageGame = createGameOperationsService(
      new PostgresGameOperationStore(pool),
      {resolve: () => new Date('2026-09-01T18:00:00Z')}
    );
    await expect(manageGame({
      type: 'schedule',
      commandId: '99000000-0000-4000-8000-000000000019',
      actorAccountId: ids.admin,
      seasonId: ids.season,
      homeSeasonTeamId: ids.seasonTeamA,
      awaySeasonTeamId: ids.seasonTeamB,
      localScheduledAt: '2026-09-01T20:00',
      venueId: ids.venue,
      venueInstructions: null
    })).rejects.toMatchObject({report: {violatedRule: 'game.venue_belongs_to_league'}});
    expect((await pool.query('select id from games')).rowCount).toBe(1);
  });
});

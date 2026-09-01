import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresStatkeeperPreflightStore} from '@/courtside/adapters/postgres/statkeeper-preflight-store';
import {createStatkeeperProfileActivationService} from '@/courtside/services/activate-statkeeper-profile';
import {
  createStatkeeperSessionStartService,
  StatkeeperSessionStartRejected
} from '@/courtside/services/start-statkeeper-session';
import {statkeeperProfileFixture} from '../fixtures/statkeeper-profile';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ids = {
  league: 'e1000000-0000-4000-8000-000000000001',
  actor: 'e1000000-0000-4000-8000-000000000002',
  admin: 'e1000000-0000-4000-8000-000000000003',
  season: 'e1000000-0000-4000-8000-000000000004',
  teamA: 'e1000000-0000-4000-8000-000000000005',
  teamB: 'e1000000-0000-4000-8000-000000000006',
  seasonTeamA: 'e1000000-0000-4000-8000-000000000007',
  seasonTeamB: 'e1000000-0000-4000-8000-000000000008',
  playerA: 'e1000000-0000-4000-8000-000000000009',
  playerB: 'e1000000-0000-4000-8000-000000000010',
  membershipA: 'e1000000-0000-4000-8000-000000000011',
  membershipB: 'e1000000-0000-4000-8000-000000000012',
  configurationVersion: 'e1000000-0000-4000-8000-000000000013',
  game: 'e1000000-0000-4000-8000-000000000014',
  profile: 'e1000000-0000-4000-8000-000000000015',
  audit: 'e1000000-0000-4000-8000-000000000016',
  session: 'e1000000-0000-4000-8000-000000000017',
  workingRevision: 'e1000000-0000-4000-8000-000000000018',
  media: 'e1000000-0000-4000-8000-000000000019'
};

const resultConfiguration = {
  standings: {
    points: {win: 2, loss: 0},
    ranking: ['league_points', 'point_differential', 'points_scored', 'random_draw'],
    eligible_phases: ['regular'],
    eligible_statuses: ['final', 'forfeit'],
    adjustments_enabled: false,
    forfeit_treatment: 'explicit_score'
  },
  playoffs: {rounds: []}
};

describeWithDatabase('PostgreSQL Statkeeper profile and Capture Session preflight', () => {
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
        statkeeper_statistical_event_contributions,
        statkeeper_statistical_event_assignments,
        statkeeper_statistical_events,
        statkeeper_occurrence_revisions,
        statkeeper_capture_session_coverage,
        statkeeper_event_ledger_participants,
        statkeeper_event_ledger_heads,
        statkeeper_capture_sessions,
        game_media,
        league_statkeeping_profile_versions,
        player_stat_lines,
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
       values ($1, 'Courtside', 'Europe/Paris', 'fr')`,
      [ids.league]
    );
    await pool.query(
      `insert into user_accounts (id, display_name)
       values ($1, 'Statkeeper')`,
      [ids.actor]
    );
    await pool.query(
      `insert into league_admin_assignments (id, league_id, user_account_id)
       values ($1, $2, $3)`,
      [ids.admin, ids.league, ids.actor]
    );
    await pool.query(
      `insert into seasons (id, league_id, name, result_configuration)
       values ($1, $2, '2026', $3::jsonb)`,
      [ids.season, ids.league, JSON.stringify(resultConfiguration)]
    );
    await pool.query(
      `insert into teams (id, league_id, name)
       values ($1, $3, 'AA'), ($2, $3, 'BB')`,
      [ids.teamA, ids.teamB, ids.league]
    );
    await pool.query(
      `insert into season_teams (id, season_id, team_id)
       values ($1, $3, $4), ($2, $3, $5)`,
      [ids.seasonTeamA, ids.seasonTeamB, ids.season, ids.teamA, ids.teamB]
    );
    await pool.query(
      `insert into players (id, league_id, display_name)
       values ($1, $3, 'Avery'), ($2, $3, 'Jordan')`,
      [ids.playerA, ids.playerB, ids.league]
    );
    await pool.query(
      `insert into roster_memberships
        (id, player_id, season_id, season_team_id, effective_from)
       values ($1, $3, $5, $6, '2026-06-01T00:00:00Z'),
              ($2, $4, $5, $7, '2026-06-01T00:00:00Z')`,
      [
        ids.membershipA,
        ids.membershipB,
        ids.playerA,
        ids.playerB,
        ids.season,
        ids.seasonTeamA,
        ids.seasonTeamB
      ]
    );
    await pool.query(
      `insert into season_configuration_versions
        (id, season_id, version_number, configuration, basis_hash, frozen_at)
       values ($1, $2, 1, $3::jsonb, repeat('a', 64), '2026-08-01T00:00:00Z')`,
      [ids.configurationVersion, ids.season, JSON.stringify(resultConfiguration)]
    );
    await pool.query(
      'update seasons set frozen_configuration_version_id = $2 where id = $1',
      [ids.season, ids.configurationVersion]
    );
    await pool.query(
      `insert into games
        (id, season_id, phase, status, home_season_team_id, away_season_team_id,
         scheduled_at, started_at, competition_eligibility_at, finalized_at,
         home_score, away_score, winning_season_team_id, configuration_version_id)
       values ($1, $2, 'regular', 'final', $3, $4,
               '2026-08-30T18:00:00Z', '2026-08-30T18:05:00Z',
               '2026-08-30T18:05:00Z', '2026-08-30T20:00:00Z',
               80, 70, $3, $5)`,
      [ids.game, ids.season, ids.seasonTeamA, ids.seasonTeamB, ids.configurationVersion]
    );
  });

  function services() {
    const store = new PostgresStatkeeperPreflightStore(pool);
    const profileIds = [ids.profile, ids.audit];
    const sessionIds = [ids.session, ids.workingRevision, ids.media];
    return {
      activateProfile: createStatkeeperProfileActivationService(store, {
        now: () => new Date('2026-08-30T20:01:00Z'),
        newId: () => profileIds.shift()!
      }),
      startSession: createStatkeeperSessionStartService(store, {
        now: () => new Date('2026-08-30T20:02:00Z'),
        newId: () => sessionIds.shift()!
      })
    };
  }

  async function activateAndStart() {
    const service = services();
    const profileCommand = {
      type: 'activate_statkeeper_profile',
      commandId: 'e2000000-0000-4000-8000-000000000001',
      actorAccountId: ids.actor,
      leagueId: ids.league,
      expectedCurrentProfileVersionId: null,
      definition: statkeeperProfileFixture()
    } as const;
    const profile = await service.activateProfile(profileCommand);
    const command = {
      type: 'start_statkeeper_session' as const,
      commandId: 'e2000000-0000-4000-8000-000000000002',
      actorAccountId: ids.actor,
      gameId: ids.game,
      youtubeMedia: {
        kind: 'url' as const,
        value: 'https://www.youtube.com/watch?v=abc_DEF-123&t=42'
      },
      didNotPlayRosterMembershipIds: [ids.membershipB]
    };
    return {service, profile, profileCommand, command, session: await service.startSession(command)};
  }

  it('activates an immutable profile and atomically creates the canonical preflight snapshot', async () => {
    const {service, profile, profileCommand, command, session} = await activateAndStart();

    expect(profile).toMatchObject({
      receiptReused: false,
      profileVersionId: ids.profile,
      versionNumber: 1,
      previousProfileVersionId: null
    });
    await expect(service.activateProfile(profileCommand)).resolves.toEqual({
      ...profile,
      receiptReused: true
    });
    expect(session).toMatchObject({
      receiptReused: false,
      captureSessionId: ids.session,
      profileVersionId: ids.profile,
      mediaId: ids.media,
      ledgerVersion: 1,
      progressVersion: 0,
      appearedCount: 1,
      didNotPlayCount: 1
    });
    await expect(service.startSession(command)).resolves.toEqual({...session, receiptReused: true});

    const persisted = await pool.query<{
      lifecycle_status: string;
      progress_version: string;
      playback_offset_ms: string;
      active_period_kind: string;
      active_clock_remaining_ms: string;
      ledger_version: string;
      participant_count: number;
      dnp_count: number;
      coverage_count: number;
      media_provider: string;
      provider_asset_id: string;
      receipt_count: number;
      audit_count: number;
    }>(
      `select session.lifecycle_status,
              session.progress_version,
              session.playback_offset_ms,
              session.active_period_kind,
              session.active_clock_remaining_ms,
              head.ledger_version,
              (select count(*)::int from statkeeper_event_ledger_participants) as participant_count,
              (select count(*)::int from statkeeper_event_ledger_participants
                where participation_status = 'did_not_play') as dnp_count,
              (select count(*)::int from statkeeper_capture_session_coverage
                where review_status = 'not_reviewed') as coverage_count,
              media.provider as media_provider,
              media.provider_asset_id,
              (select count(*)::int from command_receipts) as receipt_count,
              (select count(*)::int from audit_records) as audit_count
         from statkeeper_capture_sessions session
         join statkeeper_event_ledger_heads head on head.capture_session_id = session.id
         join game_media media on media.id = session.media_id`
    );
    expect(persisted.rows[0]).toMatchObject({
      lifecycle_status: 'capturing',
      progress_version: '0',
      playback_offset_ms: '0',
      active_period_kind: 'regulation',
      active_clock_remaining_ms: '600000',
      ledger_version: '1',
      participant_count: 2,
      dnp_count: 1,
      coverage_count: 1,
      media_provider: 'youtube',
      provider_asset_id: 'abc_DEF-123',
      receipt_count: 2,
      audit_count: 1
    });
  });

  it('rejects invalid participation and a second session without partial state or receipts', async () => {
    const initial = services();
    await initial.activateProfile({
      type: 'activate_statkeeper_profile',
      commandId: 'e2000000-0000-4000-8000-000000000011',
      actorAccountId: ids.actor,
      leagueId: ids.league,
      expectedCurrentProfileVersionId: null,
      definition: statkeeperProfileFixture()
    });
    await expect(initial.startSession({
      type: 'start_statkeeper_session',
      commandId: 'e2000000-0000-4000-8000-000000000012',
      actorAccountId: ids.actor,
      gameId: ids.game,
      youtubeMedia: {kind: 'provider_asset_id', value: 'abc_DEF-123'},
      didNotPlayRosterMembershipIds: ['e1000000-0000-4000-8000-000000000099']
    })).rejects.toMatchObject({
      report: {violatedRule: 'statkeeper.session.participation_eligible'}
    });
    expect((await pool.query('select count(*)::int as count from statkeeper_capture_sessions')).rows[0].count)
      .toBe(0);

    const clean = services();
    await clean.startSession({
      type: 'start_statkeeper_session',
      commandId: 'e2000000-0000-4000-8000-000000000013',
      actorAccountId: ids.actor,
      gameId: ids.game,
      youtubeMedia: {kind: 'provider_asset_id', value: 'abc_DEF-123'},
      didNotPlayRosterMembershipIds: []
    });
    await expect(clean.startSession({
      type: 'start_statkeeper_session',
      commandId: 'e2000000-0000-4000-8000-000000000014',
      actorAccountId: ids.actor,
      gameId: ids.game,
      youtubeMedia: {kind: 'provider_asset_id', value: 'different_asset'},
      didNotPlayRosterMembershipIds: [ids.membershipB]
    })).rejects.toBeInstanceOf(StatkeeperSessionStartRejected);
    expect((await pool.query('select count(*)::int as count from statkeeper_capture_sessions')).rows[0].count)
      .toBe(1);
    expect((await pool.query('select count(*)::int as count from command_receipts')).rows[0].count)
      .toBe(2);
  });
});

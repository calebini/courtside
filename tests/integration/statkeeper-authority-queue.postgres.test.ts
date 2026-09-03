import type {Pool} from 'pg';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import {createPostgresPool} from '@/courtside/adapters/postgres/pool';
import {PostgresMemberStatisticsStore} from '@/courtside/adapters/postgres/member-statistics-store';
import {PostgresRoleAssignmentStore} from '@/courtside/adapters/postgres/role-assignment-store';
import {PostgresStatkeeperGameQueueStore} from '@/courtside/adapters/postgres/statkeeper-game-queue-store';
import {PostgresStatkeeperOccurrenceStore} from '@/courtside/adapters/postgres/statkeeper-occurrence-store';
import {PostgresStatkeeperPreflightStore} from '@/courtside/adapters/postgres/statkeeper-preflight-store';
import {createDefaultSeasonResultConfiguration} from '@/courtside/core/season-setup';
import {createStatkeeperProfileActivationService} from '@/courtside/services/activate-statkeeper-profile';
import {createRoleAssignmentService} from '@/courtside/services/manage-role-assignments';
import {createStatkeeperGameQueueReader} from '@/courtside/services/read-statkeeper-game-queue';
import {createStatkeeperOccurrenceRecordService} from '@/courtside/services/record-statkeeper-occurrence';
import {createStatkeeperSessionStartService} from '@/courtside/services/start-statkeeper-session';
import {statkeeperProfileFixture} from '../fixtures/statkeeper-profile';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;
const id = (n: number) => `fc000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ids = {
  league: id(1), otherLeague: id(2), admin: id(3), keeper: id(4), captain: id(5),
  manager: id(6), ordinary: id(7), foreignAdmin: id(8), season: id(11), otherSeason: id(12),
  home: id(17), away: id(18), player: id(23), membership: id(25)
};

describeWithDatabase('PostgreSQL Statkeeper authority and authorized Game queue', () => {
  let pool: Pool;
  let keeperAssignmentId: string;
  let profileVersionId: string;
  beforeAll(() => { pool = createPostgresPool(connectionString!); });
  afterAll(async () => { await pool.end(); });

  beforeEach(async () => {
    await pool.query('truncate table command_receipts, leagues, user_accounts restart identity cascade');
    await pool.query(`insert into leagues (id, name, timezone, default_language)
      values ($1, 'Courtside', 'Europe/Paris', 'fr'), ($2, 'Other League', 'Europe/Paris', 'en')`, [ids.league, ids.otherLeague]);
    await pool.query(`insert into user_accounts (id, display_name, contact_email)
      values ($1, 'Admin', 'admin@example.com'), ($2, 'Keeper', 'keeper@example.com'),
             ($3, 'Captain', 'captain@example.com'), ($4, 'Manager', 'manager@example.com'),
             ($5, 'Member', 'member@example.com'), ($6, 'Foreign Admin', 'foreign@example.com')`,
    [ids.admin, ids.keeper, ids.captain, ids.manager, ids.ordinary, ids.foreignAdmin]);
    await pool.query(`insert into league_admin_assignments (id, league_id, user_account_id)
      values ($1, $3, $5), ($2, $4, $6)`, [id(9), id(10), ids.league, ids.otherLeague, ids.admin, ids.foreignAdmin]);
    const configuration = JSON.stringify(createDefaultSeasonResultConfiguration());
    await pool.query(`insert into seasons (id, league_id, name, result_configuration)
      values ($1, $3, '2026', $5), ($2, $4, '2026', $5)`, [ids.season, ids.otherSeason, ids.league, ids.otherLeague, configuration]);
    await pool.query(`insert into teams (id, league_id, name)
      values ($1, $5, 'Home'), ($2, $5, 'Away'), ($3, $6, 'Other Home'), ($4, $6, 'Other Away')`, [id(13), id(14), id(15), id(16), ids.league, ids.otherLeague]);
    await pool.query(`insert into season_teams (id, season_id, team_id)
      values ($1, $5, $7), ($2, $5, $8), ($3, $6, $9), ($4, $6, $10)`, [ids.home, ids.away, id(19), id(20), ids.season, ids.otherSeason, id(13), id(14), id(15), id(16)]);
    await pool.query(`insert into season_configuration_versions
      (id, season_id, version_number, configuration, basis_hash, frozen_at)
      values ($1, $3, 1, $5, repeat('a', 64), '2026-08-01T00:00:00Z'),
             ($2, $4, 1, $5, repeat('a', 64), '2026-08-01T00:00:00Z')`, [id(21), id(22), ids.season, ids.otherSeason, configuration]);
    await pool.query('update seasons set frozen_configuration_version_id = $2 where id = $1', [ids.season, id(21)]);
    await pool.query('update seasons set frozen_configuration_version_id = $2 where id = $1', [ids.otherSeason, id(22)]);
    await pool.query(`insert into players (id, league_id, display_name)
      values ($1, $3, 'Player Home'), ($2, $3, 'Player Away')`, [ids.player, id(24), ids.league]);
    await pool.query(`insert into roster_memberships (id, player_id, season_id, season_team_id, effective_from)
      values ($1, $3, $5, $6, '2026-08-01T00:00:00Z'), ($2, $4, $5, $7, '2026-08-01T00:00:00Z')`, [ids.membership, id(26), ids.player, id(24), ids.season, ids.home, ids.away]);
    await pool.query(`insert into season_team_captain_assignments
      (id, season_team_id, user_account_id, assigned_by_account_id, assigned_at)
      values ($1, $2, $3, $4, '2026-08-01T00:00:00Z')`, [id(27), ids.home, ids.captain, ids.admin]);
    await pool.query(`insert into player_management_relationships
      (id, player_id, user_account_id, status, requested_at, requested_by_account_id, approved_at, approved_by_account_id)
      values ($1, $2, $3, 'approved', '2026-08-01T00:00:00Z', $3, '2026-08-02T00:00:00Z', $4)`, [id(28), ids.player, ids.manager, ids.admin]);
    keeperAssignmentId = (await manageRoles()({type: 'grant_league_statkeeper', commandId: id(30), actorAccountId: ids.admin, leagueId: ids.league, targetEmail: 'keeper@example.com'})).assignmentId;
    profileVersionId = (await createStatkeeperProfileActivationService(new PostgresStatkeeperPreflightStore(pool))({
      type: 'activate_statkeeper_profile', commandId: id(31), actorAccountId: ids.admin,
      leagueId: ids.league, expectedCurrentProfileVersionId: null, definition: statkeeperProfileFixture()
    })).profileVersionId;
    for (let n = 101; n <= 107; n++) await completedGame(n, n === 102 ? 'forfeit' : 'final');
    await completedGame(108, 'final', true);
    await pool.query(`insert into games
      (id, season_id, phase, status, home_season_team_id, away_season_team_id, scheduled_at)
      values ($1, $2, 'regular', 'scheduled', $3, $4, '2026-09-10T18:00:00Z')`, [id(109), ids.season, ids.home, ids.away]);
  });

  function manageRoles() { return createRoleAssignmentService(new PostgresRoleAssignmentStore(pool)); }
  function readQueue() { return createStatkeeperGameQueueReader(new PostgresStatkeeperGameQueueStore(pool)); }
  function start() { return createStatkeeperSessionStartService(new PostgresStatkeeperPreflightStore(pool)); }
  function startCommand(game: number, actorAccountId = ids.keeper, commandId = id(game + 1000)) {
    return {type: 'start_statkeeper_session' as const, commandId, actorAccountId, gameId: id(game),
      youtubeMedia: {kind: 'provider_asset_id' as const, value: `fixture_${game}`}, didNotPlayRosterMembershipIds: []};
  }
  async function completedGame(n: number, status: 'final' | 'forfeit', foreign = false) {
    await pool.query(`insert into games
      (id, season_id, phase, status, home_season_team_id, away_season_team_id, scheduled_at,
       started_at, competition_eligibility_at, finalized_at, home_score, away_score,
       winning_season_team_id, configuration_version_id)
      values ($1, $2, 'regular', $3, $4, $5, '2026-08-30T18:00:00Z', '2026-08-30T18:05:00Z',
       '2026-08-30T18:05:00Z', '2026-08-30T20:00:00Z', 80, 70, $4, $6)`,
    [id(n), foreign ? ids.otherSeason : ids.season, status, foreign ? id(19) : ids.home, foreign ? id(20) : ids.away, foreign ? id(22) : id(21)]);
  }

  it('returns only completed Games in the authorized League, prioritized with canonical session summaries', async () => {
    for (const [n, status] of [[103, 'capturing'], [104, 'in_review'], [105, 'verified'], [106, 'published'], [107, 'abandoned']] as const) {
      const accepted = await start()(startCommand(n));
      // Read-only fixtures for later lifecycle slices; no review/publication commands are introduced.
      await pool.query(`update statkeeper_capture_sessions set lifecycle_status = $2,
        playback_offset_ms = 42000, progress_version = 1 where id = $1`, [accepted.captureSessionId, status]);
    }
    const countsBefore = (await pool.query(`select (select count(*) from command_receipts) as receipts,
      (select count(*) from audit_records) as audits`)).rows[0];
    const queue = await readQueue()({actorAccountId: ids.keeper, leagueId: ids.league});
    expect(queue.hasAccess).toBe(true);
    expect(queue.canManageStatkeeperAssignments).toBe(false);
    expect(queue.games.map((game) => game.group)).toEqual(['resume_capture', 'not_started', 'not_started', 'awaiting_review', 'awaiting_review', 'published', 'abandoned']);
    expect(queue.games.map((game) => game.gameId)).not.toContain(id(108));
    expect(queue.games.map((game) => game.gameId)).not.toContain(id(109));
    expect(queue.games.find((game) => game.gameId === id(102))).toMatchObject({status: 'forfeit', canStartSession: true, session: null});
    expect(queue.games[0]).toMatchObject({homeTeamName: 'Home', homeScore: 80, awayScore: 70, session: {profileVersionId, playbackOffsetMs: 42000, ledgerVersion: 1, progressVersion: 1}, canResumeSession: true});
    expect(queue.games.find((game) => game.group === 'abandoned')).toMatchObject({canStartSession: false, canResumeSession: false});
    expect(JSON.stringify(queue)).not.toMatch(/contactEmail|contact_email|assignedBy|created_by|actorAccount|keeper@example/);
    await expect(readQueue()({actorAccountId: ids.admin, leagueId: ids.league})).resolves.toMatchObject({hasAccess: true, canManageStatkeeperAssignments: true});
    expect((await pool.query(`select (select count(*) from command_receipts) as receipts,
      (select count(*) from audit_records) as audits`)).rows[0]).toEqual(countsBefore);
  });

  it('denies captains, Player managers, ordinary members, and other-League administrators without revealing queue data', async () => {
    for (const actorAccountId of [ids.captain, ids.manager, ids.ordinary, ids.foreignAdmin, id(999)]) {
      await expect(readQueue()({actorAccountId, leagueId: ids.league})).resolves.toEqual({hasAccess: false, canManageStatkeeperAssignments: false, league: null, games: []});
      await expect(start()(startCommand(101, actorAccountId))).rejects.toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
    }
    await expect(readQueue()({actorAccountId: ids.keeper, leagueId: ids.otherLeague})).resolves.toMatchObject({hasAccess: false, league: null, games: []});
    await expect(start()(startCommand(108))).rejects.toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
    await expect(manageRoles()({type: 'revoke_league_statkeeper', commandId: id(300), actorAccountId: ids.foreignAdmin, assignmentId: keeperAssignmentId})).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
    expect((await pool.query('select id from statkeeper_capture_sessions')).rowCount).toBe(0);
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(2);
  });

  it('admits both current roles to preflight but keeps Profile activation administrator-only', async () => {
    const accepted = await start()(startCommand(101));
    await expect(start()(startCommand(101))).resolves.toEqual({...accepted, receiptReused: true});
    await expect(start()(startCommand(102, ids.admin))).resolves.toMatchObject({gameId: id(102), appearedCount: 2});
    await expect(start()(startCommand(101, ids.keeper, id(301)))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.session.existing_session_conflict', canonicalCaptureSessionId: accepted.captureSessionId}});
    await expect(createStatkeeperProfileActivationService(new PostgresStatkeeperPreflightStore(pool))({
      type: 'activate_statkeeper_profile', commandId: id(302), actorAccountId: ids.keeper,
      leagueId: ids.league, expectedCurrentProfileVersionId: profileVersionId, definition: statkeeperProfileFixture()
    })).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
  });

  it('revocation closes queue, member-statistics, preflight, and occurrence access without exposing existing-session identity', async () => {
    const accepted = await start()(startCommand(101));
    const memberReads = new PostgresMemberStatisticsStore(pool);
    await expect(memberReads.load(ids.keeper)).resolves.toMatchObject({hasAccess: true, hasAdministrativeAccess: false});
    await manageRoles()({type: 'revoke_league_statkeeper', commandId: id(310), actorAccountId: ids.admin, assignmentId: keeperAssignmentId});
    await expect(readQueue()({actorAccountId: ids.keeper, leagueId: ids.league})).resolves.toMatchObject({hasAccess: false, league: null, games: []});
    await expect(memberReads.hasAccess(ids.keeper)).resolves.toBe(false);
    const rejection = await start()(startCommand(101, ids.keeper, id(311))).catch((error: unknown) => error);
    expect(rejection).toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
    expect(rejection).not.toHaveProperty('report.canonicalCaptureSessionId');
    await expect(start()(startCommand(102, ids.keeper, id(312)))).rejects.toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
    await expect(createStatkeeperOccurrenceRecordService(new PostgresStatkeeperOccurrenceStore(pool))({
      type: 'record_statkeeper_occurrence', commandId: id(313), actorAccountId: ids.keeper,
      captureSessionId: accepted.captureSessionId, expectedLedgerVersion: 1, occurrenceId: id(314),
      actionKey: 'made_two', evidenceTimestampMs: 42000, evidenceWindow: null,
      period: {kind: 'regulation', ordinal: 1}, clock: {state: 'exact', remainingMs: 558000},
      participantSelections: [{roleKey: 'shooter', playerId: ids.player}], operatorNote: null
    })).rejects.toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
    expect((await pool.query('select id from statkeeper_capture_sessions')).rowCount).toBe(1);
    expect((await pool.query('select occurrence_id from statkeeper_occurrence_revisions')).rowCount).toBe(0);
    // Prior receipt replay acknowledges an already accepted write; it grants no new read/mutation authority.
    await expect(start()(startCommand(101))).resolves.toEqual({...accepted, receiptReused: true});
    expect((await pool.query('select command_id from command_receipts')).rowCount).toBe(4);
  });

  it('keeps existing sessions resumable when no active profile is available for new starts', async () => {
    await start()(startCommand(101));
    await pool.query('update leagues set active_statkeeping_profile_version_id = null where id = $1', [ids.league]);
    const queue = await readQueue()({actorAccountId: ids.keeper, leagueId: ids.league});
    expect(queue.league?.activeProfileVersionId).toBeNull();
    expect(queue.games[0]).toMatchObject({canResumeSession: true, session: {profileVersionId}});
    expect(queue.games.some((game) => game.canStartSession)).toBe(false);
    await expect(start()(startCommand(102))).rejects.toMatchObject({report: {violatedRule: 'statkeeper.session.active_profile_required'}});
  });

  it('revokes Administrator-only capture access and preserves access through a separate active role', async () => {
    const manage = manageRoles();
    const promoted = await manage({type: 'grant_league_admin', commandId: id(320), actorAccountId: ids.admin, leagueId: ids.league, targetEmail: 'foreign@example.com'});
    await manage({type: 'revoke_league_admin', commandId: id(321), actorAccountId: ids.foreignAdmin, assignmentId: id(9)});
    await expect(readQueue()({actorAccountId: ids.admin, leagueId: ids.league})).resolves.toMatchObject({hasAccess: false});
    await expect(start()(startCommand(101, ids.admin))).rejects.toMatchObject({report: {violatedRule: 'authorization.statkeeper_or_league_admin_required'}});
    // Statkeeper admission does not depend on some unrelated administrator assignment remaining active.
    await expect(readQueue()({actorAccountId: ids.keeper, leagueId: ids.league})).resolves.toMatchObject({hasAccess: true, canManageStatkeeperAssignments: false});
    const secondKeeper = await manage({type: 'grant_league_statkeeper', commandId: id(322), actorAccountId: ids.foreignAdmin, leagueId: ids.league, targetEmail: 'foreign@example.com'});
    expect((await pool.query('select id from league_statkeeper_assignments where revoked_at is null')).rowCount).toBe(2);
    await manage({type: 'revoke_league_statkeeper', commandId: id(323), actorAccountId: ids.foreignAdmin, assignmentId: secondKeeper.assignmentId});
    await expect(readQueue()({actorAccountId: ids.foreignAdmin, leagueId: ids.league})).resolves.toMatchObject({hasAccess: true, canManageStatkeeperAssignments: true});
    expect((await pool.query('select revoked_at from league_admin_assignments where id = $1', [promoted.assignmentId])).rows[0].revoked_at).toBeNull();
  });
});

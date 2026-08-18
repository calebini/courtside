'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {PostgresGameResultStore} from '@/courtside/adapters/postgres/finalize-game-store';
import {PostgresGameOperationStore} from '@/courtside/adapters/postgres/game-operation-store';
import {PostgresRoleAssignmentStore} from '@/courtside/adapters/postgres/role-assignment-store';
import {PostgresPlayerPointsStore} from '@/courtside/adapters/postgres/player-points-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresDeleteSeasonStore} from '@/courtside/adapters/postgres/season-deletion-store';
import {PostgresCreateSeasonStore} from '@/courtside/adapters/postgres/season-setup-store';
import {PostgresSeasonTeamStore} from '@/courtside/adapters/postgres/season-team-store';
import {PostgresSeasonConfigurationStore} from '@/courtside/adapters/postgres/season-configuration-store';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {PostgresVenueStore} from '@/courtside/adapters/postgres/venue-store';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {TemporalScheduledInstantResolver} from '@/courtside/adapters/temporal/scheduled-instant-resolver';
import {
  createGameResultService,
  MutationRejected,
  type GameResultCommand
} from '@/courtside/services/finalize-game';
import {
  createGameOperationsService,
  GameOperationRejected,
  type GameOperationCommand
} from '@/courtside/services/manage-game';
import {
  createRoleAssignmentService,
  RoleAssignmentRejected,
  type RoleAssignmentCommand
} from '@/courtside/services/manage-role-assignments';
import {
  createPlayerPointsService,
  PlayerPointsRejected
} from '@/courtside/services/manage-player-points';
import {
  createSeasonService,
  CreateSeasonRejected
} from '@/courtside/services/create-season';
import {
  createDeleteSeasonService,
  DeleteSeasonRejected
} from '@/courtside/services/delete-season';
import {
  createSeasonTeamService,
  SeasonTeamRejected
} from '@/courtside/services/manage-season-teams';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';
import {
  createVenueService,
  VenueRejected,
  type VenueCommand
} from '@/courtside/services/manage-venue';
import {
  createSeasonConfigurationService,
  SeasonConfigurationRejected
} from '@/courtside/services/update-season-configuration';
import type {RankingCriterion} from '@/courtside/core/configuration';

type PendingGameOperationCommand = GameOperationCommand extends infer Command
  ? Command extends GameOperationCommand
    ? Omit<Command, 'actorAccountId'>
    : never
  : never;

type PendingGameResultCommand = GameResultCommand extends infer Command
  ? Command extends GameResultCommand
    ? Omit<Command, 'actorAccountId'>
    : never
  : never;

type PendingVenueCommand = VenueCommand extends infer Command
  ? Command extends VenueCommand
    ? Omit<Command, 'actorAccountId'>
    : never
  : never;

type PendingRoleAssignmentCommand = RoleAssignmentCommand extends infer Command
  ? Command extends RoleAssignmentCommand
    ? Omit<Command, 'actorAccountId' | 'commandId' | 'reason'>
    : never
  : never;

function supportedLocale(value: FormDataEntryValue | null) {
  return value === 'fr' ? 'fr' : 'en';
}

function nonnegativeInteger(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const number = Number(text);
  return Number.isSafeInteger(number) ? number : null;
}

function unknownOrNonnegativeInteger(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (text === '') return {valid: true as const, value: null};
  const number = nonnegativeInteger(text);
  return number === null
    ? {valid: false as const, value: null}
    : {valid: true as const, value: number};
}

function commandIdentity(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function entityIdentity(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function localDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) ? text : null;
}

function optionalVenue(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  return text === '' ? {valid: true, value: null} : {valid: Boolean(entityIdentity(text)), value: entityIdentity(text)};
}

function venueInstructions(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text || null;
}

type AdminSection = 'games' | 'setup';

function adminLocation(
  locale: string,
  section: AdminSection,
  formData: FormData,
  message: {error: string} | {result: string}
) {
  const query = new URLSearchParams();
  const contextSeasonId = entityIdentity(formData.get('contextSeasonId'));
  if (contextSeasonId) query.set('season', contextSeasonId);
  if ('error' in message) query.set('error', message.error);
  else query.set('result', message.result);
  return `/${locale}/admin/${section}?${query.toString()}`;
}

function revalidateAdmin(locale: string) {
  revalidatePath(`/${locale}/admin`, 'layout');
}

async function authenticatedAccount() {
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {account} = await resolveAuthenticatedAccount(
    new SupabaseVerifiedIdentityProvider(supabase),
    new PostgresUserAccountDirectory(pool)
  );
  return {pool, account};
}

async function runGameOperation(
  locale: string,
  command: PendingGameOperationCommand,
  formData: FormData
) {
  const {pool, account} = await authenticatedAccount();
  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome: string = command.type;
  let errorCode: string | null = null;
  try {
    const manageGame = createGameOperationsService(
      new PostgresGameOperationStore(pool),
      new TemporalScheduledInstantResolver()
    );
    await manageGame({...command, actorAccountId: account.id} as GameOperationCommand);
  } catch (error) {
    if (
      error instanceof GameOperationRejected &&
      error.report.violatedRule === 'game.scheduled_instant_unambiguous'
    ) {
      errorCode = 'invalid_schedule';
    } else {
      outcome = error instanceof GameOperationRejected ? 'rejected' : 'unexpected';
    }
  }

  revalidateAdmin(locale);
  redirect(
    errorCode
      ? adminLocation(locale, 'games', formData, {error: errorCode})
      : adminLocation(locale, 'games', formData, {result: outcome})
  );
}

export async function scheduleGameAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const seasonId = entityIdentity(formData.get('seasonId'));
  const homeSeasonTeamId = entityIdentity(formData.get('homeSeasonTeamId'));
  const awaySeasonTeamId = entityIdentity(formData.get('awaySeasonTeamId'));
  const scheduledAt = localDateTime(formData.get('scheduledAt'));
  const venue = optionalVenue(formData.get('venueId'));
  const instructions = venueInstructions(formData.get('venueInstructions'));

  if (
    !commandId ||
    !seasonId ||
    !homeSeasonTeamId ||
    !awaySeasonTeamId ||
    !scheduledAt ||
    !venue.valid
  ) {
    redirect(adminLocation(locale, 'games', formData, {error: 'invalid_schedule'}));
  }

  await runGameOperation(locale, {
    type: 'schedule',
    commandId,
    seasonId,
    homeSeasonTeamId,
    awaySeasonTeamId,
    localScheduledAt: scheduledAt,
    venueId: venue.value,
    venueInstructions: instructions
  }, formData);
}

export async function createSeasonAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const leagueId = entityIdentity(formData.get('leagueId'));
  const name = String(formData.get('name') ?? '');
  if (!commandId || !leagueId) {
    redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_season'}));
  }

  const {pool, account} = await authenticatedAccount();
  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome = 'season_created';
  try {
    await createSeasonService(new PostgresCreateSeasonStore(pool))({
      commandId,
      actorAccountId: account.id,
      leagueId,
      name
    });
  } catch (error) {
    outcome = error instanceof CreateSeasonRejected ? 'season_rejected' : 'unexpected';
  }

  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'setup', formData, {result: outcome}));
}

export async function deleteSeasonAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const seasonId = entityIdentity(formData.get('seasonId'));
  const confirmationName = String(formData.get('confirmationName') ?? '');
  const reason = String(formData.get('reason') ?? '').trim() || null;
  if (!commandId || !seasonId || confirmationName.length === 0) {
    redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_season_deletion'}));
  }

  const {pool, account} = await authenticatedAccount();
  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome = 'season_deleted';
  try {
    await createDeleteSeasonService(new PostgresDeleteSeasonStore(pool))({
      commandId,
      actorAccountId: account.id,
      seasonId,
      confirmationName,
      reason
    });
  } catch (error) {
    outcome = error instanceof DeleteSeasonRejected ? 'season_delete_rejected' : 'unexpected';
  }

  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'setup', formData, {result: outcome}));
}

export async function updateSeasonConfigurationAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const seasonId = entityIdentity(formData.get('seasonId'));
  const winPoints = nonnegativeInteger(formData.get('winPoints'));
  const lossPoints = nonnegativeInteger(formData.get('lossPoints'));
  const scoreCriteria = formData.getAll('ranking').map(String);
  if (
    !commandId ||
    !seasonId ||
    winPoints === null ||
    lossPoints === null ||
    scoreCriteria.length !== 3
  ) {
    redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_configuration'}));
  }

  const {pool, account} = await authenticatedAccount();
  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome = 'configuration_updated';
  try {
    await createSeasonConfigurationService(new PostgresSeasonConfigurationStore(pool))({
      commandId,
      actorAccountId: account.id,
      seasonId,
      winPoints,
      lossPoints,
      ranking: [...scoreCriteria, 'random_draw'] as RankingCriterion[]
    });
  } catch (error) {
    outcome = error instanceof SeasonConfigurationRejected
      ? 'configuration_rejected'
      : 'unexpected';
  }

  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'setup', formData, {result: outcome}));
}

export async function addSeasonTeamsAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const seasonId = entityIdentity(formData.get('seasonId'));
  const names = String(formData.get('names') ?? '').split(/\r?\n/u);
  if (!commandId || !seasonId) {
    redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_team'}));
  }

  const {pool, account} = await authenticatedAccount();
  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome = 'teams_updated';
  try {
    await createSeasonTeamService(new PostgresSeasonTeamStore(pool))({
      type: 'add_teams',
      commandId,
      actorAccountId: account.id,
      seasonId,
      names
    });
  } catch (error) {
    outcome = error instanceof SeasonTeamRejected ? 'team_rejected' : 'unexpected';
  }

  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'setup', formData, {result: outcome}));
}

export async function removeSeasonTeamAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const seasonTeamId = entityIdentity(formData.get('seasonTeamId'));
  if (!commandId || !seasonTeamId) {
    redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_team'}));
  }

  const {pool, account} = await authenticatedAccount();
  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome = 'team_removed';
  try {
    await createSeasonTeamService(new PostgresSeasonTeamStore(pool))({
      type: 'remove_team',
      commandId,
      actorAccountId: account.id,
      seasonTeamId
    });
  } catch (error) {
    outcome = error instanceof SeasonTeamRejected ? 'team_rejected' : 'unexpected';
  }

  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'setup', formData, {result: outcome}));
}

async function runVenueOperation(
  locale: string,
  command: PendingVenueCommand,
  formData: FormData
) {
  const {pool, account} = await authenticatedAccount();
  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome = `venue_${command.type === 'create' ? 'created' : command.type === 'update' ? 'updated' : 'archived'}`;
  try {
    await createVenueService(new PostgresVenueStore(pool))({
      ...command,
      actorAccountId: account.id
    } as VenueCommand);
  } catch (error) {
    outcome = error instanceof VenueRejected ? 'venue_rejected' : 'unexpected';
  }

  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'setup', formData, {result: outcome}));
}

export async function createVenueAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const leagueId = entityIdentity(formData.get('leagueId'));
  if (!commandId || !leagueId) {
    redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_venue'}));
  }
  await runVenueOperation(locale, {
    type: 'create',
    commandId,
    leagueId,
    name: String(formData.get('name') ?? ''),
    address: String(formData.get('address') ?? ''),
    notes: String(formData.get('notes') ?? '')
  }, formData);
}

export async function updateVenueAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const venueId = entityIdentity(formData.get('venueId'));
  if (!commandId || !venueId) {
    redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_venue'}));
  }
  await runVenueOperation(locale, {
    type: 'update',
    commandId,
    venueId,
    name: String(formData.get('name') ?? ''),
    address: String(formData.get('address') ?? ''),
    notes: String(formData.get('notes') ?? '')
  }, formData);
}

export async function archiveVenueAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const venueId = entityIdentity(formData.get('venueId'));
  if (!commandId || !venueId) {
    redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_venue'}));
  }
  await runVenueOperation(locale, {type: 'archive', commandId, venueId}, formData);
}

export async function rescheduleGameAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const gameId = entityIdentity(formData.get('gameId'));
  const scheduledAt = localDateTime(formData.get('scheduledAt'));
  const venue = optionalVenue(formData.get('venueId'));
  const instructions = venueInstructions(formData.get('venueInstructions'));

  if (!commandId || !gameId || !scheduledAt || !venue.valid) {
    redirect(adminLocation(locale, 'games', formData, {error: 'invalid_schedule'}));
  }

  await runGameOperation(locale, {
    type: 'reschedule',
    commandId,
    gameId,
    localScheduledAt: scheduledAt,
    venueId: venue.value,
    venueInstructions: instructions
  }, formData);
}

async function transitionGameAction(
  type: 'postpone' | 'cancel' | 'start',
  formData: FormData
) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const gameId = entityIdentity(formData.get('gameId'));
  if (!commandId || !gameId) {
    redirect(adminLocation(locale, 'games', formData, {error: 'invalid_game'}));
  }
  await runGameOperation(locale, {type, commandId, gameId}, formData);
}

export async function postponeGameAction(formData: FormData) {
  await transitionGameAction('postpone', formData);
}

export async function cancelGameAction(formData: FormData) {
  await transitionGameAction('cancel', formData);
}

export async function startGameAction(formData: FormData) {
  await transitionGameAction('start', formData);
}

export async function finalizeGameAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const gameId = entityIdentity(formData.get('gameId'));
  const homeScore = nonnegativeInteger(formData.get('homeScore'));
  const awayScore = nonnegativeInteger(formData.get('awayScore'));

  if (!commandId || !gameId || homeScore === null || awayScore === null || homeScore === awayScore) {
    redirect(adminLocation(locale, 'games', formData, {error: 'invalid_score'}));
  }

  await runGameResult(locale, {
    type: 'finalize',
    commandId,
    gameId,
    homeScore,
    awayScore
  }, formData);
}

async function runGameResult(
  locale: string,
  command: PendingGameResultCommand,
  formData: FormData
) {
  const {pool, account} = await authenticatedAccount();

  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome: string =
    command.type === 'finalize'
      ? 'finalized'
      : command.type === 'forfeit'
        ? 'forfeited'
        : 'corrected';
  try {
    const manageResult = createGameResultService(new PostgresGameResultStore(pool));
    await manageResult({...command, actorAccountId: account.id} as GameResultCommand);
  } catch (error) {
    outcome = error instanceof MutationRejected ? 'rejected' : 'unexpected';
  }

  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'games', formData, {result: outcome}));
}

export async function forfeitGameAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const gameId = entityIdentity(formData.get('gameId'));
  const winningSeasonTeamId = entityIdentity(formData.get('winningSeasonTeamId'));
  const homeScore = nonnegativeInteger(formData.get('homeScore'));
  const awayScore = nonnegativeInteger(formData.get('awayScore'));
  const reason = String(formData.get('reason') ?? '').trim() || null;

  if (
    !commandId ||
    !gameId ||
    !winningSeasonTeamId ||
    homeScore === null ||
    awayScore === null ||
    homeScore === awayScore
  ) {
    redirect(adminLocation(locale, 'games', formData, {error: 'invalid_score'}));
  }

  await runGameResult(locale, {
    type: 'forfeit',
    commandId,
    gameId,
    homeScore,
    awayScore,
    winningSeasonTeamId,
    reason
  }, formData);
}

export async function correctGameResultAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const gameId = entityIdentity(formData.get('gameId'));
  const winningSeasonTeamId = entityIdentity(formData.get('winningSeasonTeamId'));
  const homeScore = nonnegativeInteger(formData.get('homeScore'));
  const awayScore = nonnegativeInteger(formData.get('awayScore'));
  const reason = String(formData.get('reason') ?? '').trim();

  if (
    !commandId ||
    !gameId ||
    !winningSeasonTeamId ||
    homeScore === null ||
    awayScore === null ||
    homeScore === awayScore ||
    !reason
  ) {
    redirect(adminLocation(locale, 'games', formData, {error: 'invalid_correction'}));
  }

  await runGameResult(locale, {
    type: 'correct',
    commandId,
    gameId,
    homeScore,
    awayScore,
    winningSeasonTeamId,
    reason
  }, formData);
}

export async function recordPlayerPointsAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const gameId = entityIdentity(formData.get('gameId'));
  const verificationStatus = formData.get('verificationStatus') === 'confirmed'
    ? 'confirmed' as const
    : formData.get('verificationStatus') === 'provisional'
      ? 'provisional' as const
      : null;
  const membershipValues = formData.getAll('rosterMembershipId');
  const entries = membershipValues.map((value) => {
    const rosterMembershipId = entityIdentity(value);
    const points = rosterMembershipId
      ? unknownOrNonnegativeInteger(formData.get(`points-${rosterMembershipId}`))
      : {valid: false as const, value: null};
    return {rosterMembershipId, points};
  });

  if (
    !commandId ||
    !gameId ||
    !verificationStatus ||
    entries.length === 0 ||
    entries.some((entry) => !entry.rosterMembershipId || !entry.points.valid)
  ) {
    redirect(adminLocation(locale, 'games', formData, {error: 'invalid_player_points'}));
  }

  const {pool, account} = await authenticatedAccount();
  if (!account) redirect(`/${locale}/sign-in`);

  let outcome = 'player_points_saved';
  try {
    await createPlayerPointsService(new PostgresPlayerPointsStore(pool))({
      type: 'record_player_points',
      commandId,
      actorAccountId: account.id,
      gameId,
      verificationStatus,
      entries: entries.map((entry) => ({
        rosterMembershipId: entry.rosterMembershipId!,
        points: entry.points.value
      })),
      reason: String(formData.get('reason') ?? '').trim() || null
    });
  } catch (error) {
    outcome = error instanceof PlayerPointsRejected
      ? error.report.violatedRule === 'player_stat_line.material_change'
        ? 'player_points_unchanged'
        : 'player_points_rejected'
      : 'unexpected';
  }

  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'games', formData, {result: outcome}));
}

function roleError(error: unknown) {
  if (!(error instanceof RoleAssignmentRejected)) return 'unexpected';
  if (error.report.violatedRule === 'account.email') return 'invalid_role';
  if (error.report.violatedRule === 'user_account.exists') return 'account_not_registered';
  if (error.report.violatedRule === 'league_admin.final_active_preserved') return 'final_admin';
  if (error.report.violatedRule === 'league_admin.active_unique' || error.report.violatedRule === 'team_captain.no_op') return 'role_no_change';
  return 'role_rejected';
}

async function runRoleAssignment(formData: FormData, command: PendingRoleAssignmentCommand) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  if (!commandId) redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_role'}));
  const {pool, account} = await authenticatedAccount();
  if (!account) redirect(`/${locale}/sign-in`);

  let outcome: string;
  try {
    const result = await createRoleAssignmentService(new PostgresRoleAssignmentStore(pool))({
      ...command,
      commandId,
      actorAccountId: account.id,
      reason: String(formData.get('reason') ?? '')
    } as RoleAssignmentCommand);
    outcome = result.operation === 'grant_league_admin'
      ? 'league_admin_granted'
      : result.operation === 'revoke_league_admin'
        ? 'league_admin_revoked'
        : result.operation === 'assign_team_captain'
          ? 'captain_assigned'
          : 'captain_revoked';
  } catch (error) {
    redirect(adminLocation(locale, 'setup', formData, {error: roleError(error)}));
  }
  revalidateAdmin(locale);
  redirect(adminLocation(locale, 'setup', formData, {result: outcome}));
}

export async function grantLeagueAdministratorAction(formData: FormData) {
  const leagueId = entityIdentity(formData.get('leagueId'));
  const targetEmail = String(formData.get('targetEmail') ?? '');
  const locale = supportedLocale(formData.get('locale'));
  if (!leagueId || !targetEmail.trim()) redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_role'}));
  await runRoleAssignment(formData, {type: 'grant_league_admin', leagueId, targetEmail});
}

export async function revokeLeagueAdministratorAction(formData: FormData) {
  const assignmentId = entityIdentity(formData.get('assignmentId'));
  const locale = supportedLocale(formData.get('locale'));
  if (!assignmentId) redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_role'}));
  await runRoleAssignment(formData, {type: 'revoke_league_admin', assignmentId});
}

export async function assignTeamCaptainAction(formData: FormData) {
  const seasonTeamId = entityIdentity(formData.get('seasonTeamId'));
  const targetEmail = String(formData.get('targetEmail') ?? '');
  const locale = supportedLocale(formData.get('locale'));
  if (!seasonTeamId || !targetEmail.trim()) redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_role'}));
  await runRoleAssignment(formData, {type: 'assign_team_captain', seasonTeamId, targetEmail});
}

export async function revokeTeamCaptainAction(formData: FormData) {
  const assignmentId = entityIdentity(formData.get('assignmentId'));
  const locale = supportedLocale(formData.get('locale'));
  if (!assignmentId) redirect(adminLocation(locale, 'setup', formData, {error: 'invalid_role'}));
  await runRoleAssignment(formData, {type: 'revoke_team_captain', assignmentId});
}

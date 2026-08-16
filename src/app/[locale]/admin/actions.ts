'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {PostgresGameResultStore} from '@/courtside/adapters/postgres/finalize-game-store';
import {PostgresGameOperationStore} from '@/courtside/adapters/postgres/game-operation-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresCreateSeasonStore} from '@/courtside/adapters/postgres/season-setup-store';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
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
  createSeasonService,
  CreateSeasonRejected
} from '@/courtside/services/create-season';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

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

async function authenticatedAccount() {
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {account} = await resolveAuthenticatedAccount(
    new SupabaseVerifiedIdentityProvider(supabase),
    new PostgresUserAccountDirectory(pool)
  );
  return {pool, account};
}

async function runGameOperation(locale: string, command: PendingGameOperationCommand) {
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

  revalidatePath(`/${locale}/admin`);
  redirect(
    errorCode
      ? `/${locale}/admin?error=${errorCode}`
      : `/${locale}/admin?result=${outcome}`
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
    redirect(`/${locale}/admin?error=invalid_schedule`);
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
  });
}

export async function createSeasonAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const leagueId = entityIdentity(formData.get('leagueId'));
  const name = String(formData.get('name') ?? '');
  if (!commandId || !leagueId) {
    redirect(`/${locale}/admin?error=invalid_season`);
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

  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin?result=${outcome}`);
}

export async function rescheduleGameAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const gameId = entityIdentity(formData.get('gameId'));
  const scheduledAt = localDateTime(formData.get('scheduledAt'));
  const venue = optionalVenue(formData.get('venueId'));
  const instructions = venueInstructions(formData.get('venueInstructions'));

  if (!commandId || !gameId || !scheduledAt || !venue.valid) {
    redirect(`/${locale}/admin?error=invalid_schedule`);
  }

  await runGameOperation(locale, {
    type: 'reschedule',
    commandId,
    gameId,
    localScheduledAt: scheduledAt,
    venueId: venue.value,
    venueInstructions: instructions
  });
}

async function transitionGameAction(
  type: 'postpone' | 'cancel' | 'start',
  formData: FormData
) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = commandIdentity(formData.get('commandId'));
  const gameId = entityIdentity(formData.get('gameId'));
  if (!commandId || !gameId) {
    redirect(`/${locale}/admin?error=invalid_game`);
  }
  await runGameOperation(locale, {type, commandId, gameId});
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
    redirect(`/${locale}/admin?error=invalid_score`);
  }

  await runGameResult(locale, {
    type: 'finalize',
    commandId,
    gameId,
    homeScore,
    awayScore
  });
}

async function runGameResult(locale: string, command: PendingGameResultCommand) {
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

  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin?result=${outcome}`);
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
    redirect(`/${locale}/admin?error=invalid_score`);
  }

  await runGameResult(locale, {
    type: 'forfeit',
    commandId,
    gameId,
    homeScore,
    awayScore,
    winningSeasonTeamId,
    reason
  });
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
    redirect(`/${locale}/admin?error=invalid_correction`);
  }

  await runGameResult(locale, {
    type: 'correct',
    commandId,
    gameId,
    homeScore,
    awayScore,
    winningSeasonTeamId,
    reason
  });
}

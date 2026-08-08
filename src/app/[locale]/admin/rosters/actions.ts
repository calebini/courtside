'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresRosterManagementStore} from '@/courtside/adapters/postgres/roster-management-store';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {TemporalScheduledInstantResolver} from '@/courtside/adapters/temporal/scheduled-instant-resolver';
import {
  createRosterManagementService,
  RosterManagementRejected,
  type RosterManagementCommand
} from '@/courtside/services/manage-roster';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

type PendingRosterCommand = RosterManagementCommand extends infer Command
  ? Command extends RosterManagementCommand
    ? Omit<Command, 'actorAccountId'>
    : never
  : never;

function supportedLocale(value: FormDataEntryValue | null) {
  return value === 'fr' ? 'fr' : 'en';
}

function identity(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function localDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) ? text : null;
}

function displayName(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text && [...text].length <= 120 ? text : null;
}

function reason(value: FormDataEntryValue | null) {
  return String(value ?? '').trim() || null;
}

async function runRosterCommand(locale: string, command: PendingRosterCommand) {
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {account} = await resolveAuthenticatedAccount(
    new SupabaseVerifiedIdentityProvider(supabase),
    new PostgresUserAccountDirectory(pool)
  );
  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  let outcome: string = command.type;
  let errorCode: string | null = null;
  try {
    const manageRoster = createRosterManagementService(
      new PostgresRosterManagementStore(pool),
      new TemporalScheduledInstantResolver()
    );
    await manageRoster({...command, actorAccountId: account.id} as RosterManagementCommand);
  } catch (error) {
    if (
      error instanceof RosterManagementRejected &&
      error.report.violatedRule === 'roster_membership.effective_instant_unambiguous'
    ) {
      errorCode = 'invalid_effective_time';
    } else {
      outcome = error instanceof RosterManagementRejected ? 'rejected' : 'unexpected';
    }
  }

  revalidatePath(`/${locale}/admin/rosters`);
  redirect(
    errorCode
      ? `/${locale}/admin/rosters?error=${errorCode}`
      : `/${locale}/admin/rosters?result=${outcome}`
  );
}

export async function createPlayerAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = identity(formData.get('commandId'));
  const leagueId = identity(formData.get('leagueId'));
  const name = displayName(formData.get('displayName'));
  if (!commandId || !leagueId || !name) {
    redirect(`/${locale}/admin/rosters?error=invalid_player`);
  }
  await runRosterCommand(locale, {
    type: 'create_player',
    commandId,
    leagueId,
    displayName: name,
    reason: reason(formData.get('reason'))
  });
}

export async function renamePlayerAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = identity(formData.get('commandId'));
  const playerId = identity(formData.get('playerId'));
  const name = displayName(formData.get('displayName'));
  if (!commandId || !playerId || !name) {
    redirect(`/${locale}/admin/rosters?error=invalid_player`);
  }
  await runRosterCommand(locale, {
    type: 'rename_player',
    commandId,
    playerId,
    displayName: name,
    reason: reason(formData.get('reason'))
  });
}

export async function addRosterMembershipAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = identity(formData.get('commandId'));
  const playerId = identity(formData.get('playerId'));
  const seasonTeamId = identity(formData.get('seasonTeamId'));
  const effectiveAt = localDateTime(formData.get('effectiveAt'));
  if (!commandId || !playerId || !seasonTeamId || !effectiveAt) {
    redirect(`/${locale}/admin/rosters?error=invalid_membership`);
  }
  await runRosterCommand(locale, {
    type: 'add_membership',
    commandId,
    playerId,
    seasonTeamId,
    localEffectiveAt: effectiveAt,
    reason: reason(formData.get('reason'))
  });
}

export async function endRosterMembershipAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = identity(formData.get('commandId'));
  const membershipId = identity(formData.get('membershipId'));
  const effectiveAt = localDateTime(formData.get('effectiveAt'));
  if (!commandId || !membershipId || !effectiveAt) {
    redirect(`/${locale}/admin/rosters?error=invalid_membership`);
  }
  await runRosterCommand(locale, {
    type: 'end_membership',
    commandId,
    membershipId,
    localEffectiveAt: effectiveAt,
    reason: reason(formData.get('reason'))
  });
}

export async function transferRosterMembershipAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const commandId = identity(formData.get('commandId'));
  const membershipId = identity(formData.get('membershipId'));
  const targetSeasonTeamId = identity(formData.get('targetSeasonTeamId'));
  const effectiveAt = localDateTime(formData.get('effectiveAt'));
  if (!commandId || !membershipId || !targetSeasonTeamId || !effectiveAt) {
    redirect(`/${locale}/admin/rosters?error=invalid_membership`);
  }
  await runRosterCommand(locale, {
    type: 'transfer_membership',
    commandId,
    membershipId,
    targetSeasonTeamId,
    localEffectiveAt: effectiveAt,
    reason: reason(formData.get('reason'))
  });
}

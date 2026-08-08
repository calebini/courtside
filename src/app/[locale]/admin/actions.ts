'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {PostgresFinalizeGameStore} from '@/courtside/adapters/postgres/finalize-game-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {createFinalizeGameService, MutationRejected} from '@/courtside/services/finalize-game';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

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

export async function finalizeGameAction(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const gameId = String(formData.get('gameId') ?? '');
  const commandId = commandIdentity(formData.get('commandId'));
  const homeScore = nonnegativeInteger(formData.get('homeScore'));
  const awayScore = nonnegativeInteger(formData.get('awayScore'));
  let outcome = 'unexpected';

  if (!commandId || !gameId || homeScore === null || awayScore === null || homeScore === awayScore) {
    redirect(`/${locale}/admin?error=invalid_score`);
  }

  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {account} = await resolveAuthenticatedAccount(
    new SupabaseVerifiedIdentityProvider(supabase),
    new PostgresUserAccountDirectory(pool)
  );

  if (!account) {
    redirect(`/${locale}/sign-in`);
  }

  try {
    const finalizeGame = createFinalizeGameService(new PostgresFinalizeGameStore(pool));
    await finalizeGame({
      commandId,
      actorAccountId: account.id,
      gameId,
      homeScore,
      awayScore
    });
    outcome = 'finalized';
  } catch (error) {
    outcome = error instanceof MutationRejected ? 'rejected' : 'unexpected';
  }

  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin?result=${outcome}`);
}

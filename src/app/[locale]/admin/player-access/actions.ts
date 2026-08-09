'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {PostgresPlayerAccessStore} from '@/courtside/adapters/postgres/player-access-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {
  createPlayerAccessService,
  processPlayerAccessBatch,
  type PlayerAccessCommand
} from '@/courtside/services/manage-player-access';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

function localeOf(value: FormDataEntryValue | null) {
  return value === 'fr' ? 'fr' : 'en';
}

function uuid(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

async function authenticatedService(locale: string) {
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {account} = await resolveAuthenticatedAccount(
    new SupabaseVerifiedIdentityProvider(supabase),
    new PostgresUserAccountDirectory(pool)
  );
  if (!account) redirect(`/${locale}/sign-in`);
  return {
    account,
    manageAccess: createPlayerAccessService(new PostgresPlayerAccessStore(pool))
  };
}

function refresh(locale: string) {
  revalidatePath(`/${locale}/admin/player-access`);
  revalidatePath(`/${locale}/players`);
}

async function batchDecision(formData: FormData, type: 'approve' | 'decline') {
  const locale = localeOf(formData.get('locale'));
  const relationshipIds = formData.getAll('relationshipId').map(uuid).filter((value): value is string => Boolean(value));
  if (relationshipIds.length === 0) {
    redirect(`/${locale}/admin/player-access?result=no_selection`);
  }
  const {account, manageAccess} = await authenticatedService(locale);
  const result = await processPlayerAccessBatch(manageAccess, {
    type,
    actorAccountId: account.id,
    relationshipIds,
    reason: String(formData.get('reason') ?? '')
  });
  refresh(locale);
  redirect(
    `/${locale}/admin/player-access?result=batch&decision=${type}&succeeded=${result.succeeded}&failed=${result.failed}`
  );
}

export async function approveSelectedPlayerAccessAction(formData: FormData) {
  await batchDecision(formData, 'approve');
}

export async function declineSelectedPlayerAccessAction(formData: FormData) {
  await batchDecision(formData, 'decline');
}

export async function revokePlayerAccessAction(formData: FormData) {
  const locale = localeOf(formData.get('locale'));
  const relationshipId = uuid(formData.get('relationshipId'));
  if (!relationshipId) redirect(`/${locale}/admin/player-access?result=rejected`);
  const {account, manageAccess} = await authenticatedService(locale);
  let result = 'revoke';
  try {
    await manageAccess({
      type: 'revoke',
      actorAccountId: account.id,
      relationshipId,
      reason: String(formData.get('reason') ?? '')
    } satisfies PlayerAccessCommand);
  } catch {
    result = 'rejected';
  }
  refresh(locale);
  redirect(`/${locale}/admin/player-access?result=${result}`);
}

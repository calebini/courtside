'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {PostgresPlayerAccessStore} from '@/courtside/adapters/postgres/player-access-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {createPlayerAccessService, type PlayerAccessCommand} from '@/courtside/services/manage-player-access';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

function localeOf(value: FormDataEntryValue | null) { return value === 'fr' ? 'fr' : 'en'; }
function uuid(value: FormDataEntryValue | null) { const text = String(value ?? ''); return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null; }

async function run(locale: string, command: Omit<Extract<PlayerAccessCommand, {type: 'grant'}>, 'actorAccountId'> | Omit<Extract<PlayerAccessCommand, {type: 'approve' | 'revoke'}>, 'actorAccountId'>) {
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {account} = await resolveAuthenticatedAccount(new SupabaseVerifiedIdentityProvider(supabase), new PostgresUserAccountDirectory(pool));
  if (!account) redirect(`/${locale}/sign-in`);
  let result: string = command.type;
  try { await createPlayerAccessService(new PostgresPlayerAccessStore(pool))({...command, actorAccountId: account.id} as PlayerAccessCommand); }
  catch { result = 'rejected'; }
  revalidatePath(`/${locale}/admin/player-access`); revalidatePath(`/${locale}/players`);
  redirect(`/${locale}/admin/player-access?result=${result}`);
}

export async function grantPlayerAccessAction(formData: FormData) {
  const locale = localeOf(formData.get('locale')); const playerId = uuid(formData.get('playerId')); const userAccountId = uuid(formData.get('userAccountId'));
  if (!playerId || !userAccountId) redirect(`/${locale}/admin/player-access?result=rejected`);
  await run(locale, {type: 'grant', playerId, userAccountId, reason: String(formData.get('reason') ?? '')});
}
export async function approvePlayerAccessAction(formData: FormData) { const locale = localeOf(formData.get('locale')); const relationshipId = uuid(formData.get('relationshipId')); if (!relationshipId) redirect(`/${locale}/admin/player-access?result=rejected`); await run(locale, {type: 'approve', relationshipId, reason: String(formData.get('reason') ?? '')}); }
export async function revokePlayerAccessAction(formData: FormData) { const locale = localeOf(formData.get('locale')); const relationshipId = uuid(formData.get('relationshipId')); if (!relationshipId) redirect(`/${locale}/admin/player-access?result=rejected`); await run(locale, {type: 'revoke', relationshipId, reason: String(formData.get('reason') ?? '')}); }

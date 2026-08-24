'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {processProfilePhoto} from '@/courtside/adapters/images/sharp-profile-photo-processor';
import {PostgresPlayerAccessStore} from '@/courtside/adapters/postgres/player-access-store';
import {PostgresPlayerProfileStore} from '@/courtside/adapters/postgres/player-profile-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {SupabasePlayerPhotoStorage} from '@/courtside/adapters/supabase/player-photo-storage';
import {RuleViolation} from '@/courtside/core/errors';
import {createPlayerAccessService} from '@/courtside/services/manage-player-access';
import {clearPlayerPhoto, replacePlayerPhoto} from '@/courtside/services/manage-player-photo';
import {createPlayerProfileService} from '@/courtside/services/manage-player-profile';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

function localeOf(value: FormDataEntryValue | null) { return value === 'fr' ? 'fr' : 'en'; }
function uuid(value: FormDataEntryValue | null) {
  const text = String(value ?? '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null;
}

async function actor() {
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {account} = await resolveAuthenticatedAccount(new SupabaseVerifiedIdentityProvider(supabase), new PostgresUserAccountDirectory(pool));
  return {pool, account};
}

function finish(locale: string, result: string): never {
  revalidatePath(`/${locale}/players`);
  redirect(`/${locale}/players?result=${result}`);
}

export async function requestPlayerAccessAction(formData: FormData) {
  const locale = localeOf(formData.get('locale'));
  const playerId = uuid(formData.get('playerId'));
  const {pool, account} = await actor();
  if (!account) redirect(`/${locale}/sign-in`);
  if (!playerId) finish(locale, 'invalid_reference');
  try {
    await createPlayerAccessService(new PostgresPlayerAccessStore(pool))({type: 'request', actorAccountId: account.id, playerId});
  } catch { finish(locale, 'rejected'); }
  finish(locale, 'requested');
}

export async function renameManagedPlayerAction(formData: FormData) {
  const locale = localeOf(formData.get('locale'));
  const playerId = uuid(formData.get('playerId'));
  const displayName = String(formData.get('displayName') ?? '').trim();
  const {pool, account} = await actor();
  if (!account) redirect(`/${locale}/sign-in`);
  if (!playerId || !displayName) finish(locale, 'invalid_profile');
  try {
    await createPlayerProfileService(new PostgresPlayerProfileStore(pool))({type: 'rename', actorAccountId: account.id, playerId, displayName});
  } catch { finish(locale, 'rejected'); }
  finish(locale, 'profile_updated');
}

export async function uploadPlayerPhotoAction(formData: FormData) {
  const locale = localeOf(formData.get('locale'));
  const playerId = uuid(formData.get('playerId'));
  const fileValue = formData.get('photo');
  const {pool, account} = await actor();
  if (!account) redirect(`/${locale}/sign-in`);
  if (!playerId || !(fileValue instanceof File)) finish(locale, 'invalid_photo');
  const file = fileValue;

  let validated: Awaited<ReturnType<typeof processProfilePhoto>>;
  try {
    validated = await processProfilePhoto(new Uint8Array(await file.arrayBuffer()), file.type);
  } catch (error) {
    if (error instanceof RuleViolation && error.rule === 'player_profile.photo_size') {
      finish(locale, 'photo_too_large');
    }
    if (error instanceof RuleViolation && error.rule === 'player_profile.photo_type') {
      finish(locale, 'unsupported_photo');
    }
    finish(locale, 'invalid_photo');
  }

  try {
    await replacePlayerPhoto(
      new PostgresPlayerProfileStore(pool),
      new SupabasePlayerPhotoStorage(),
      {actorAccountId: account.id, playerId, photo: validated}
    );
  } catch {
    finish(locale, 'photo_upload_failed');
  }
  finish(locale, 'photo_updated');
}

export async function clearPlayerPhotoAction(formData: FormData) {
  const locale = localeOf(formData.get('locale'));
  const playerId = uuid(formData.get('playerId'));
  const {pool, account} = await actor();
  if (!account) redirect(`/${locale}/sign-in`);
  if (!playerId) finish(locale, 'rejected');
  try {
    await clearPlayerPhoto(
      new PostgresPlayerProfileStore(pool),
      new SupabasePlayerPhotoStorage(),
      {actorAccountId: account.id, playerId}
    );
  } catch { finish(locale, 'rejected'); }
  finish(locale, 'photo_cleared');
}

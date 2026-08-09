'use server';

import {redirect} from 'next/navigation';

import {PostgresPlayerAccessDashboardStore} from '@/courtside/adapters/postgres/player-access-dashboard-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';

function supportedLocale(value: FormDataEntryValue | null) {
  return value === 'fr' ? 'fr' : 'en';
}

export async function signIn(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect(`/${locale}/sign-in?error=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const {data, error} = await supabase.auth.signInWithPassword({email, password});
  if (error) {
    redirect(`/${locale}/sign-in?error=invalid`);
  }

  const pool = getRuntimePostgresPool();
  const account = await new PostgresUserAccountDirectory(pool).findByExternalAuthId(data.user.id);
  const isAdmin = account
    ? await new PostgresPlayerAccessDashboardStore(pool).hasAdministrativeAccess(account.id)
    : false;
  redirect(`/${locale}/${isAdmin ? 'admin' : 'players'}`);
}

export async function signOut(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/sign-in`);
}

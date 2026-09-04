'use server';

import {redirect} from 'next/navigation';

import {getCourtsideSiteUrl, isRegistrationOpen} from '@/courtside/adapters/config/auth-config';
import {clearPasswordRecoveryCookie, readPasswordRecoveryCookie} from '@/courtside/adapters/next/password-recovery-cookie';
import {PostgresMemberStatisticsStore} from '@/courtside/adapters/postgres/member-statistics-store';
import {PostgresPasswordRecoveryAuthorizationStore} from '@/courtside/adapters/postgres/password-recovery-authorization-store';
import {PostgresPlayerAccessDashboardStore} from '@/courtside/adapters/postgres/player-access-dashboard-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {
  normalizeAccountLocale,
  validateEmail,
  validatePassword,
  validateRegistration
} from '@/courtside/core/account-onboarding';
import {provisionAuthenticatedUserAccount} from '@/courtside/services/provision-user-account';
import {resolveAccountLanding} from '@/courtside/services/resolve-account-landing';
import {consumePasswordRecoveryAuthorization} from '@/courtside/services/password-recovery-authorization';

function supportedLocale(value: FormDataEntryValue | null) {
  return normalizeAccountLocale(value);
}

function callbackUrl(locale: 'en' | 'fr', next: 'players' | 'update-password') {
  const callback = new URL(`/${locale}/auth/callback`, getCourtsideSiteUrl());
  callback.searchParams.set('next', `/${locale}/${next}`);
  return callback.toString();
}

async function provisionCurrentIdentity(locale: 'en' | 'fr') {
  const supabase = await createSupabaseServerClient();
  const account = await provisionAuthenticatedUserAccount(
    new SupabaseVerifiedIdentityProvider(supabase),
    new PostgresUserAccountDirectory(getRuntimePostgresPool()),
    locale
  );
  return {account, supabase};
}

export async function signIn(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect(`/${locale}/sign-in?error=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) {
    redirect(`/${locale}/sign-in?error=invalid`);
  }

  let account;
  try {
    ({account} = await provisionCurrentIdentity(locale));
  } catch {
    await supabase.auth.signOut();
    redirect(`/${locale}/sign-in?error=account`);
  }

  const pool = getRuntimePostgresPool();
  const playerAccess = new PostgresPlayerAccessDashboardStore(pool);
  const memberStatistics = new PostgresMemberStatisticsStore(pool);
  const destination = await resolveAccountLanding(account, {
    hasAdministrativeAccess: (accountId) => playerAccess.hasAdministrativeAccess(accountId),
    hasMemberStatisticsAccess: (accountId) => memberStatistics.hasAccess(accountId)
  }, (error) => console.error('Could not resolve the post-sign-in destination', error));
  redirect(destination);
}

export async function signUp(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  if (!isRegistrationOpen()) redirect(`/${locale}/register?error=closed`);

  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('passwordConfirmation') ?? '');
  let registration;
  try {
    registration = validateRegistration({
      displayName: String(formData.get('displayName') ?? ''),
      email: String(formData.get('email') ?? ''),
      password,
      locale
    });
  } catch {
    redirect(`/${locale}/register?error=invalid`);
  }
  if (password !== confirmation) redirect(`/${locale}/register?error=password_match`);

  const supabase = await createSupabaseServerClient();
  const {data, error} = await supabase.auth.signUp({
    email: registration.email,
    password: registration.password,
    options: {
      data: {
        display_name: registration.displayName,
        preferred_locale: registration.locale
      },
      emailRedirectTo: callbackUrl(locale, 'players')
    }
  });
  if (error) redirect(`/${locale}/register?error=unavailable`);

  if (data.session) {
    try {
      await provisionCurrentIdentity(locale);
    } catch {
      await supabase.auth.signOut();
      redirect(`/${locale}/register?error=unavailable`);
    }
    redirect(`/${locale}/players`);
  }
  redirect(`/${locale}/register?result=check_email`);
}

export async function requestPasswordReset(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  let email: string | null = null;
  try {
    email = validateEmail(String(formData.get('email') ?? ''));
  } catch {
    // Preserve the same response for syntactically invalid and unknown addresses.
  }
  if (email) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl(locale, 'update-password')
      });
    } catch {
      // Recovery is deliberately non-enumerating, including provider failures.
    }
  }
  redirect(`/${locale}/forgot-password?result=sent`);
}

export async function updatePassword(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const password = String(formData.get('password') ?? '');
  if (password !== String(formData.get('passwordConfirmation') ?? '')) {
    redirect(`/${locale}/update-password?error=password_match`);
  }
  try {
    validatePassword(password);
  } catch {
    redirect(`/${locale}/update-password?error=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const {data: verified} = await supabase.auth.getUser();
  const recoveryToken = await readPasswordRecoveryCookie();
  const authorized = verified.user && await consumePasswordRecoveryAuthorization(
    new PostgresPasswordRecoveryAuthorizationStore(getRuntimePostgresPool()),
    verified.user.id,
    recoveryToken
  );
  if (!verified.user || !authorized) {
    await clearPasswordRecoveryCookie();
    await supabase.auth.signOut();
    redirect(`/${locale}/sign-in?error=recovery`);
  }
  const {error} = await supabase.auth.updateUser({password});
  await clearPasswordRecoveryCookie();
  if (error) {
    await supabase.auth.signOut();
    redirect(`/${locale}/sign-in?error=recovery`);
  }
  await supabase.auth.signOut();
  redirect(`/${locale}/sign-in?result=password_updated`);
}

export async function signOut(formData: FormData) {
  const locale = supportedLocale(formData.get('locale'));
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/sign-in`);
}

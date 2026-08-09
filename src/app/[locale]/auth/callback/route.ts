import {redirect} from 'next/navigation';
import {type NextRequest} from 'next/server';

import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {normalizeAccountLocale} from '@/courtside/core/account-onboarding';
import {provisionAuthenticatedUserAccount} from '@/courtside/services/provision-user-account';

function safeDestination(value: string | null, locale: 'en' | 'fr') {
  const allowed = new Set([`/${locale}/players`, `/${locale}/update-password`]);
  return value && allowed.has(value) ? value : `/${locale}/players`;
}

export async function GET(
  request: NextRequest,
  context: {params: Promise<{locale: string}>}
) {
  const {locale: requestedLocale} = await context.params;
  const locale = normalizeAccountLocale(requestedLocale);
  const destination = safeDestination(request.nextUrl.searchParams.get('next'), locale);
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    redirect(`/${locale}/sign-in?error=callback`);
  }

  const supabase = await createSupabaseServerClient();
  const {error} = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    redirect(`/${locale}/sign-in?error=callback`);
  }

  try {
    await provisionAuthenticatedUserAccount(
      new SupabaseVerifiedIdentityProvider(supabase),
      new PostgresUserAccountDirectory(getRuntimePostgresPool()),
      locale
    );
  } catch {
    await supabase.auth.signOut();
    redirect(`/${locale}/sign-in?error=account`);
  }
  redirect(destination);
}

import {getTranslations} from 'next-intl/server';
import {redirect} from 'next/navigation';

import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';

import {updatePassword} from '../auth-actions';

export const dynamic = 'force-dynamic';

export default async function UpdatePasswordPage({params, searchParams}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string}>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('PasswordRecovery')
  ]);
  const supabase = await createSupabaseServerClient();
  const {data} = await supabase.auth.getUser();
  if (!data.user) redirect(`/${locale}/sign-in?error=recovery`);
  const errors: Record<string, string> = {
    invalid: 'invalidPassword',
    password_match: 'passwordMatch',
    unavailable: 'unavailable'
  };
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="wordmark" href={`/${locale}`}>COURTSIDE</a>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('updateTitle')}</h1>
        <p className="lede">{t('updateSummary')}</p>
        {query.error && errors[query.error] ? <p className="notice notice-error">{t(errors[query.error])}</p> : null}
        <form action={updatePassword} className="stack-form">
          <input name="locale" type="hidden" value={locale} />
          <label><span>{t('password')}</span><input autoComplete="new-password" minLength={8} name="password" required type="password" /></label>
          <p className="field-help">{t('passwordHelp')}</p>
          <label><span>{t('passwordConfirmation')}</span><input autoComplete="new-password" minLength={8} name="passwordConfirmation" required type="password" /></label>
          <button type="submit">{t('update')}</button>
        </form>
      </section>
    </main>
  );
}

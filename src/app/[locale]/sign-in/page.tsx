import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

import {isRegistrationOpen} from '@/courtside/adapters/config/auth-config';
import {signIn} from '../auth-actions';

export const dynamic = 'force-dynamic';

export default async function SignInPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; result?: string}>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('Auth')
  ]);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="wordmark" href={`/${locale}`}>
          COURTSIDE
        </a>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="lede">{t('summary')}</p>
        {query.result === 'password_updated' ? (
          <p className="notice notice-success">{t('passwordUpdated')}</p>
        ) : null}
        {query.error ? <p className="notice notice-error">{t(query.error === 'account' ? 'accountUnavailable' : query.error === 'recovery' ? 'recoveryExpired' : 'invalid')}</p> : null}
        <form action={signIn} className="stack-form">
          <input name="locale" type="hidden" value={locale} />
          <label>
            <span>{t('email')}</span>
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            <span>{t('password')}</span>
            <input autoComplete="current-password" name="password" required type="password" />
          </label>
          <button type="submit">{t('submit')}</button>
        </form>
        <div className="auth-links">
          <Link href={`/${locale}/forgot-password`}>{t('forgotPassword')}</Link>
          {isRegistrationOpen() ? <Link href={`/${locale}/register`}>{t('createAccount')}</Link> : null}
        </div>
        {process.env.NODE_ENV !== 'production' ? (
          <p className="local-note">{t('localCredentials')}</p>
        ) : null}
      </section>
    </main>
  );
}

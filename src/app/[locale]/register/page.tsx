import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

import {isRegistrationOpen} from '@/courtside/adapters/config/auth-config';

import {signUp} from '../auth-actions';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; result?: string}>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('Registration')
  ]);
  const open = isRegistrationOpen();
  const errors: Record<string, string> = {
    closed: 'closed',
    invalid: 'invalid',
    password_match: 'passwordMatch',
    unavailable: 'unavailable'
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="wordmark" href={`/${locale}`}>COURTSIDE</Link>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="lede">{t('summary')}</p>
        {query.result === 'check_email' ? (
          <p className="notice notice-success">{t('checkEmail')}</p>
        ) : null}
        {query.error && errors[query.error] ? (
          <p className="notice notice-error">{t(errors[query.error])}</p>
        ) : null}
        {open && query.result !== 'check_email' ? (
          <form action={signUp} className="stack-form">
            <input name="locale" type="hidden" value={locale} />
            <label><span>{t('displayName')}</span><input autoComplete="name" maxLength={120} name="displayName" required /></label>
            <label><span>{t('email')}</span><input autoComplete="email" maxLength={254} name="email" required type="email" /></label>
            <label><span>{t('password')}</span><input autoComplete="new-password" minLength={8} name="password" required type="password" /></label>
            <p className="field-help">{t('passwordHelp')}</p>
            <label><span>{t('passwordConfirmation')}</span><input autoComplete="new-password" minLength={8} name="passwordConfirmation" required type="password" /></label>
            <button type="submit">{t('submit')}</button>
          </form>
        ) : null}
        <div className="auth-links"><Link href={`/${locale}/sign-in`}>{t('signIn')}</Link></div>
      </section>
    </main>
  );
}

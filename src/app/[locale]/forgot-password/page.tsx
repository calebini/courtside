import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

import {requestPasswordReset} from '../auth-actions';

export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage({params, searchParams}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{result?: string}>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('PasswordRecovery')
  ]);
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="wordmark" href={`/${locale}`}>COURTSIDE</Link>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('requestTitle')}</h1>
        <p className="lede">{t('requestSummary')}</p>
        {query.result === 'sent' ? <p className="notice notice-success">{t('sent')}</p> : (
          <form action={requestPasswordReset} className="stack-form">
            <input name="locale" type="hidden" value={locale} />
            <label><span>{t('email')}</span><input autoComplete="email" name="email" required type="email" /></label>
            <button type="submit">{t('send')}</button>
          </form>
        )}
        <div className="auth-links"><Link href={`/${locale}/sign-in`}>{t('signIn')}</Link></div>
      </section>
    </main>
  );
}

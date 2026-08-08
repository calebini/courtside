import {getTranslations} from 'next-intl/server';
import Link from 'next/link';
import type {ReactNode} from 'react';

export default async function PublicLayout({
  children,
  params
}: Readonly<{
  children: ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;
  const t = await getTranslations('Public');

  return (
    <div className="public-shell">
      <header className="public-topbar">
        <Link className="wordmark" href={`/${locale}`}>COURTSIDE</Link>
        <nav aria-label={t('primaryNavigation')} className="public-nav">
          <Link href={`/${locale}/schedule`}>{t('schedule')}</Link>
          <Link href={`/${locale}/results`}>{t('results')}</Link>
          <Link href={`/${locale}/standings`}>{t('standings')}</Link>
        </nav>
        <Link className="admin-link" href={`/${locale}/admin`}>{t('leagueDesk')}</Link>
      </header>
      {children}
      <footer className="public-footer">
        <span>{t('footer')}</span>
        <nav aria-label={t('languageLabel')}>
          <Link href="/en">English</Link>
          <Link href="/fr">Français</Link>
        </nav>
      </footer>
    </div>
  );
}

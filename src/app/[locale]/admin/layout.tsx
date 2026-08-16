import type {ReactNode} from 'react';
import {Suspense} from 'react';

import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

import {signOut} from '../auth-actions';
import {AdminNavigation} from './admin-navigation';
import {requireAdminSession} from './admin-session';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const [{identity, account}, t] = await Promise.all([
    requireAdminSession(locale),
    getTranslations('Admin')
  ]);

  return (
    <main className="dashboard-shell admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand-row">
          <Link className="wordmark" href={`/${locale}`}>COURTSIDE</Link>
          <div className="account-actions">
            <Link className="button-link" href={`/${locale}/players`}>{t('myPlayers')}</Link>
            <span>{account?.displayName ?? identity.email}</span>
            <form action={signOut}>
              <input name="locale" type="hidden" value={locale} />
              <button className="button-link" type="submit">{t('signOut')}</button>
            </form>
          </div>
        </div>
        <Suspense fallback={<div className="admin-navigation-placeholder" />}>
          <AdminNavigation
            labels={{
              desk: t('navDesk'),
              games: t('navGames'),
              people: t('navPeople'),
              access: t('navAccess'),
              setup: t('navSetup')
            }}
            locale={locale}
          />
        </Suspense>
      </header>
      {children}
    </main>
  );
}

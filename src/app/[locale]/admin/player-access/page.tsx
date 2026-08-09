import {getTranslations} from 'next-intl/server';
import Link from 'next/link';
import {redirect} from 'next/navigation';

import {PostgresPlayerAccessDashboardStore} from '@/courtside/adapters/postgres/player-access-dashboard-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

import {signOut} from '../../auth-actions';
import {approvePlayerAccessAction, grantPlayerAccessAction, revokePlayerAccessAction} from './actions';

export const dynamic = 'force-dynamic';

export default async function PlayerAccessPage({params, searchParams}: {params: Promise<{locale: string}>; searchParams: Promise<{result?: string}>}) {
  const [{locale}, query, t] = await Promise.all([params, searchParams, getTranslations('PlayerAccessAdmin')]);
  const pool = getRuntimePostgresPool(); const supabase = await createSupabaseServerClient();
  const {identity, account} = await resolveAuthenticatedAccount(new SupabaseVerifiedIdentityProvider(supabase), new PostgresUserAccountDirectory(pool));
  if (!identity) redirect(`/${locale}/sign-in`);
  const leagues = account ? await new PostgresPlayerAccessDashboardStore(pool).loadAdmin(account.id) : [];
  const messages: Record<string, string> = {grant: 'granted', approve: 'approvedResult', revoke: 'revokedResult', rejected: 'rejected'};
  return <main className="dashboard-shell access-dashboard">
    <header className="topbar"><Link className="wordmark" href={`/${locale}`}>COURTSIDE</Link><div className="account-actions"><Link className="button-link" href={`/${locale}/players`}>{t('myPlayers')}</Link><Link className="button-link" href={`/${locale}/admin`}>{t('leagueDesk')}</Link><span>{account?.displayName ?? identity.email}</span><form action={signOut}><input name="locale" type="hidden" value={locale}/><button className="button-link" type="submit">{t('signOut')}</button></form></div></header>
    <section className="dashboard-heading"><p className="eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1><p className="lede">{t('summary')}</p></section>
    {query.result && messages[query.result] ? <p className={`notice ${query.result === 'rejected' ? 'notice-error' : 'notice-success'}`}>{t(messages[query.result])}</p> : null}
    {leagues.length === 0 ? <section className="empty-state"><h2>{t('noAccessTitle')}</h2><p>{t('noAccessSummary')}</p></section> : null}
    {leagues.map((league) => <section className="league" key={league.leagueId}><div className="league-heading"><div><p className="eyebrow">{t('league')}</p><h2>{league.leagueName}</h2></div></div>
      <section className="panel"><p className="panel-kicker">{t('grantKicker')}</p><h3>{t('grantTitle')}</h3><form action={grantPlayerAccessAction} className="stack-form compact-form"><input name="locale" type="hidden" value={locale}/><div className="participant-fields"><label><span>{t('account')}</span><select name="userAccountId">{league.accounts.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label><label><span>{t('player')}</span><select name="playerId">{league.players.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label></div><label><span>{t('reason')}</span><input name="reason"/></label><button type="submit">{t('grant')}</button></form></section>
      <section className="access-list"><div className="section-heading"><div><p className="panel-kicker">{t('historyKicker')}</p><h3>{t('relationships')}</h3></div></div>{league.relationships.length === 0 ? <p className="empty-copy">{t('none')}</p> : league.relationships.map((relationship) => <article className="panel access-row" key={relationship.id}><div><strong>{relationship.playerDisplayName}</strong><p>{relationship.accountDisplayName}</p><span className="status-pill">{t(relationship.status)}</span></div><div className="access-row-actions">{relationship.status === 'requested' ? <form action={approvePlayerAccessAction}><input name="locale" type="hidden" value={locale}/><input name="relationshipId" type="hidden" value={relationship.id}/><button type="submit">{t('approve')}</button></form> : null}{relationship.status !== 'revoked' ? <form action={revokePlayerAccessAction}><input name="locale" type="hidden" value={locale}/><input name="relationshipId" type="hidden" value={relationship.id}/><button className="button-danger" type="submit">{t('revoke')}</button></form> : null}</div></article>)}</section>
    </section>)}
  </main>;
}

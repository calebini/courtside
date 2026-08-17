import {getTranslations} from 'next-intl/server';
import Link from 'next/link';
import {redirect} from 'next/navigation';

import {PostgresPlayerAccessDashboardStore} from '@/courtside/adapters/postgres/player-access-dashboard-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

import {signOut} from '../auth-actions';
import {clearPlayerPhotoAction, renameManagedPlayerAction, requestPlayerAccessAction, uploadPlayerPhotoAction} from './actions';
import {PlayerRequestPicker} from './player-request-picker';

export const dynamic = 'force-dynamic';
const BUCKET = 'player-profile-photos';

export default async function PlayersPage({params, searchParams}: {params: Promise<{locale: string}>; searchParams: Promise<{result?: string}>}) {
  const [{locale}, query, t] = await Promise.all([params, searchParams, getTranslations('MyPlayers')]);
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {identity, account} = await resolveAuthenticatedAccount(new SupabaseVerifiedIdentityProvider(supabase), new PostgresUserAccountDirectory(pool));
  if (!identity || !account) redirect(`/${locale}/sign-in`);
  const store = new PostgresPlayerAccessDashboardStore(pool);
  const [players, requestablePlayers, isAdmin] = await Promise.all([
    store.loadManagedPlayers(account.id),
    store.loadRequestablePlayers(account.id),
    store.hasAdministrativeAccess(account.id)
  ]);
  const signedPhotos = new Map<string, string>();
  await Promise.all(players.filter((player) => player.status === 'approved' && player.profilePhotoObjectKey).map(async (player) => {
    const result = await supabase.storage.from(BUCKET).createSignedUrl(player.profilePhotoObjectKey!, 300);
    if (result.data?.signedUrl) signedPhotos.set(player.playerId, result.data.signedUrl);
  }));
  const messages: Record<string, string> = {requested: 'requested', profile_updated: 'profileUpdated', photo_updated: 'photoUpdated', photo_cleared: 'photoCleared', invalid_reference: 'invalidReference', invalid_profile: 'invalidProfile', invalid_photo: 'invalidPhoto', photo_too_large: 'photoTooLarge', unsupported_photo: 'unsupportedPhoto', photo_upload_failed: 'photoUploadFailed', rejected: 'rejected'};

  return <main className="dashboard-shell player-portal">
    <header className="topbar"><Link className="wordmark" href={`/${locale}`}>COURTSIDE</Link><div className="account-actions">{isAdmin ? <Link className="button-link" href={`/${locale}/admin`}>{t('leagueDesk')}</Link> : null}<span>{account.displayName}</span><form action={signOut}><input name="locale" type="hidden" value={locale}/><button className="button-link" type="submit">{t('signOut')}</button></form></div></header>
    <section className="dashboard-heading"><p className="eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1><p className="lede">{t('summary')}</p></section>
    {query.result && messages[query.result] ? <p className={`notice ${['requested','profile_updated','photo_updated','photo_cleared'].includes(query.result) ? 'notice-success' : 'notice-error'}`}>{t(messages[query.result])}</p> : null}
    <section className="panel access-request-panel"><p className="panel-kicker">{t('requestKicker')}</p><h2>{t('requestTitle')}</h2><p>{t('requestSummary')}</p>{requestablePlayers.length > 0 ? <form action={requestPlayerAccessAction} className="stack-form compact-form"><input name="locale" type="hidden" value={locale}/><PlayerRequestPicker labels={{noCurrentTeam: t('noCurrentTeam'), noMatches: t('noMatches'), search: t('searchPlayers'), select: t('selectPlayer'), startTyping: t('startTyping')}} players={requestablePlayers}/><button type="submit">{t('requestAccess')}</button></form> : <p className="empty-copy">{t('noRequestablePlayers')}</p>}</section>
    <section className="managed-player-grid">
      {players.length === 0 ? <div className="empty-state"><h2>{t('emptyTitle')}</h2><p>{t('emptySummary')}</p></div> : null}
      {players.map((player) => <article className="panel managed-player-card" key={player.relationshipId}>
        <div className="managed-player-heading"><div>{signedPhotos.get(player.playerId) ? <img alt="" className="profile-photo" src={signedPhotos.get(player.playerId)}/> : <div className="profile-photo profile-photo-placeholder" aria-hidden="true">{player.displayName.slice(0, 1).toUpperCase()}</div>}</div><div><p className="panel-kicker">{player.leagueName}</p><h2>{player.displayName}</h2><span className="status-pill">{t(player.status)}</span></div></div> {/* eslint-disable-line @next/next/no-img-element -- private signed Storage URLs are intentionally not sent through the Next image optimizer */}
        {player.status === 'approved' ? <div className="profile-actions"><form action={renameManagedPlayerAction} className="stack-form compact-form"><input name="locale" type="hidden" value={locale}/><input name="playerId" type="hidden" value={player.playerId}/><label><span>{t('displayName')}</span><input defaultValue={player.displayName} maxLength={120} name="displayName" required/></label><button type="submit">{t('saveName')}</button></form><form action={uploadPlayerPhotoAction} className="stack-form compact-form"><input name="locale" type="hidden" value={locale}/><input name="playerId" type="hidden" value={player.playerId}/><label><span>{t('profilePhoto')}</span><input accept="image/jpeg,image/png,image/webp" name="photo" required type="file"/></label><p className="field-help">{t('photoHelp')}</p><button type="submit">{t('uploadPhoto')}</button></form>{player.profilePhotoObjectKey ? <form action={clearPlayerPhotoAction}><input name="locale" type="hidden" value={locale}/><input name="playerId" type="hidden" value={player.playerId}/><button className="button-link" type="submit">{t('clearPhoto')}</button></form> : null}</div> : <p>{t('awaitingApproval')}</p>}
      </article>)}
    </section>
  </main>;
}

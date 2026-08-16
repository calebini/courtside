import {getTranslations} from 'next-intl/server';

import {PostgresPlayerAccessDashboardStore} from '@/courtside/adapters/postgres/player-access-dashboard-store';
import {requireAdminSession} from '../admin-session';
import {
  approveSelectedPlayerAccessAction,
  declineSelectedPlayerAccessAction,
  revokePlayerAccessAction
} from './actions';

export const dynamic = 'force-dynamic';

function count(value: string | undefined) {
  return /^\d+$/.test(value ?? '') ? Number(value) : 0;
}

export default async function PlayerAccessPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{
    decision?: string;
    failed?: string;
    result?: string;
    succeeded?: string;
  }>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('PlayerAccessAdmin')
  ]);
  const {pool, account} = await requireAdminSession(locale);
  const leagues = account ? await new PostgresPlayerAccessDashboardStore(pool).loadAdmin(account.id) : [];
  const succeeded = count(query.succeeded);
  const failed = count(query.failed);
  const batchMessage = query.result === 'batch'
    ? t(query.decision === 'decline' ? 'batchDeclined' : 'batchApproved', {failed, succeeded})
    : null;
  const simpleMessages: Record<string, string> = {
    no_selection: 'noSelection',
    rejected: 'rejected',
    revoke: 'revokedResult'
  };

  return (
    <div className="admin-route access-dashboard">
      <section className="dashboard-heading">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="lede">{t('summary')}</p>
      </section>

      {batchMessage ? (
        <p className={`notice ${failed > 0 ? 'notice-error' : 'notice-success'}`}>{batchMessage}</p>
      ) : null}
      {query.result && simpleMessages[query.result] ? (
        <p className="notice notice-error">{t(simpleMessages[query.result])}</p>
      ) : null}

      {leagues.length === 0 ? (
        <section className="empty-state">
          <h2>{t('noAccessTitle')}</h2>
          <p>{t('noAccessSummary')}</p>
        </section>
      ) : null}

      {leagues.map((league) => {
        const pending = league.relationships.filter((relationship) => relationship.status === 'requested');
        const history = league.relationships.filter((relationship) => relationship.status !== 'requested');
        return (
          <section className="league" key={league.leagueId}>
            <div className="league-heading">
              <div><p className="eyebrow">{t('league')}</p><h2>{league.leagueName}</h2></div>
              <span className="status-pill">{t('pendingCount', {count: pending.length})}</span>
            </div>

            <section className="pending-access-section">
              <div className="section-heading">
                <div><p className="panel-kicker">{t('queueKicker')}</p><h3>{t('pendingRequests')}</h3></div>
              </div>
              {pending.length === 0 ? <p className="empty-copy">{t('noPending')}</p> : (
                <form className="pending-access-form">
                  <input name="locale" type="hidden" value={locale} />
                  <div className="pending-access-list">
                    {pending.map((relationship) => (
                      <label className="panel pending-access-row" key={relationship.id}>
                        <input
                          aria-label={t('selectRequest', {
                            account: relationship.accountDisplayName,
                            player: relationship.playerDisplayName
                          })}
                          name="relationshipId"
                          type="checkbox"
                          value={relationship.id}
                        />
                        <span>
                          <strong>{relationship.playerDisplayName}</strong>
                          <small>{relationship.accountDisplayName}</small>
                          {relationship.accountContactEmail ? <small>{relationship.accountContactEmail}</small> : null}
                        </span>
                      </label>
                    ))}
                  </div>
                  <label>
                    <span>{t('decisionReason')}</span>
                    <input name="reason" type="text" />
                  </label>
                  <div className="batch-actions">
                    <button formAction={approveSelectedPlayerAccessAction} type="submit">
                      {t('approveSelected')}
                    </button>
                    <button
                      className="button-danger"
                      formAction={declineSelectedPlayerAccessAction}
                      type="submit"
                    >
                      {t('declineSelected')}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="access-list">
              <div className="section-heading">
                <div><p className="panel-kicker">{t('historyKicker')}</p><h3>{t('relationships')}</h3></div>
              </div>
              {history.length === 0 ? <p className="empty-copy">{t('none')}</p> : history.map((relationship) => (
                <article className="panel access-row" key={relationship.id}>
                  <div>
                    <strong>{relationship.playerDisplayName}</strong>
                    <p>{relationship.accountDisplayName}</p>
                    {relationship.accountContactEmail ? <small>{relationship.accountContactEmail}</small> : null}
                    <span className="status-pill">{t(relationship.outcome)}</span>
                  </div>
                  {relationship.status === 'approved' ? (
                    <form action={revokePlayerAccessAction}>
                      <input name="locale" type="hidden" value={locale} />
                      <input name="relationshipId" type="hidden" value={relationship.id} />
                      <button className="button-danger" type="submit">{t('revoke')}</button>
                    </form>
                  ) : null}
                </article>
              ))}
            </section>
          </section>
        );
      })}
    </div>
  );
}

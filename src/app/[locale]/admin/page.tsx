import {randomUUID} from 'node:crypto';

import {getTranslations} from 'next-intl/server';
import {redirect} from 'next/navigation';

import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

import {signOut} from '../auth-actions';
import {finalizeGameAction} from './actions';

export const dynamic = 'force-dynamic';

function resultMessageKey(result: string | undefined) {
  if (result === 'finalized') return 'finalized';
  if (result === 'rejected') return 'rejected';
  if (result === 'unexpected') return 'unexpected';
  return null;
}

export default async function AdminPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; result?: string}>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('Admin')
  ]);
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {identity, account} = await resolveAuthenticatedAccount(
    new SupabaseVerifiedIdentityProvider(supabase),
    new PostgresUserAccountDirectory(pool)
  );

  if (!identity) {
    redirect(`/${locale}/sign-in`);
  }

  const leagues = account ? await new PostgresAdminDashboardStore(pool).load(account.id) : [];
  const resultKey = resultMessageKey(query.result);

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="wordmark" href={`/${locale}`}>
          COURTSIDE
        </a>
        <div className="account-actions">
          <span>{account?.displayName ?? identity.email}</span>
          <form action={signOut}>
            <input name="locale" type="hidden" value={locale} />
            <button className="button-link" type="submit">
              {t('signOut')}
            </button>
          </form>
        </div>
      </header>

      <section className="dashboard-heading">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="lede">{t('summary')}</p>
      </section>

      {query.error === 'invalid_score' ? (
        <p className="notice notice-error">{t('invalidScore')}</p>
      ) : null}
      {resultKey ? (
        <p className={`notice ${resultKey === 'finalized' ? 'notice-success' : 'notice-error'}`}>
          {t(resultKey)}
        </p>
      ) : null}

      {!account || leagues.length === 0 ? (
        <section className="empty-state">
          <h2>{t('noAccessTitle')}</h2>
          <p>{t('noAccessSummary')}</p>
        </section>
      ) : null}

      {leagues.map((league) => (
        <section className="league" key={league.id}>
          <div className="league-heading">
            <div>
              <p className="eyebrow">{t('league')}</p>
              <h2>{league.name}</h2>
            </div>
            <span className="timezone">{league.timezone}</span>
          </div>

          {league.seasons.map((season) => (
            <div className="season-grid" key={season.id}>
              <section className="panel score-panel">
                <div className="panel-heading">
                  <div>
                    <p className="panel-kicker">{season.name}</p>
                    <h3>{t('gamesToFinalize')}</h3>
                  </div>
                  <span className={`status-pill ${season.configurationFrozen ? 'frozen' : ''}`}>
                    {season.configurationFrozen ? t('rulesFrozen') : t('rulesMutable')}
                  </span>
                </div>

                {season.games.length === 0 ? (
                  <p className="empty-copy">{t('noGames')}</p>
                ) : (
                  <div className="game-list">
                    {season.games.map((game) => (
                      <form action={finalizeGameAction} className="game-card" key={game.id}>
                        <input name="locale" type="hidden" value={locale} />
                        <input name="gameId" type="hidden" value={game.id} />
                        <input name="commandId" type="hidden" value={randomUUID()} />
                        <p className="game-time">
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: league.timezone
                          }).format(game.scheduledAt)}
                        </p>
                        <div className="score-row">
                          <label>
                            <span>{game.homeTeamName}</span>
                            <input
                              aria-label={`${game.homeTeamName} ${t('score')}`}
                              inputMode="numeric"
                              min="0"
                              name="homeScore"
                              required
                              step="1"
                              type="number"
                            />
                          </label>
                          <span className="versus">{t('versus')}</span>
                          <label>
                            <span>{game.awayTeamName}</span>
                            <input
                              aria-label={`${game.awayTeamName} ${t('score')}`}
                              inputMode="numeric"
                              min="0"
                              name="awayScore"
                              required
                              step="1"
                              type="number"
                            />
                          </label>
                        </div>
                        <button type="submit">{t('finalize')}</button>
                      </form>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel standings-panel">
                <div className="panel-heading">
                  <div>
                    <p className="panel-kicker">{season.name}</p>
                    <h3>{t('standings')}</h3>
                  </div>
                  {season.unresolvedTieCount > 0 ? (
                    <span className="status-pill">{t('provisional')}</span>
                  ) : null}
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('rank')}</th>
                        <th>{t('team')}</th>
                        <th>{t('played')}</th>
                        <th>{t('wins')}</th>
                        <th>{t('losses')}</th>
                        <th>{t('leaguePoints')}</th>
                        <th>{t('differential')}</th>
                        <th>{t('pointsFor')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {season.standings.map((standing) => (
                        <tr key={standing.seasonTeamId}>
                          <td>{standing.rank ?? '—'}</td>
                          <th scope="row">{standing.teamName}</th>
                          <td>{standing.gamesPlayed}</td>
                          <td>{standing.wins}</td>
                          <td>{standing.losses}</td>
                          <td>{standing.leaguePoints}</td>
                          <td>{standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}</td>
                          <td>{standing.pointsFor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}

import {randomUUID} from 'node:crypto';

import {getTranslations} from 'next-intl/server';
import {redirect} from 'next/navigation';

import {
  PostgresAdminDashboardStore,
  type AdminGame,
  type AdminVenue
} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

import {signOut} from '../auth-actions';
import {
  cancelGameAction,
  finalizeGameAction,
  postponeGameAction,
  rescheduleGameAction,
  scheduleGameAction,
  startGameAction
} from './actions';

export const dynamic = 'force-dynamic';

function resultMessageKey(result: string | undefined) {
  const keys: Record<string, string> = {
    finalized: 'finalized',
    schedule: 'scheduled',
    reschedule: 'rescheduled',
    postpone: 'postponed',
    cancel: 'cancelled',
    start: 'started',
    rejected: 'rejected',
    unexpected: 'unexpected'
  };
  return result ? keys[result] ?? null : null;
}

function formatSchedule(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone
  }).format(date);
}

function formatLocalInput(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

function CommandFields({locale, gameId}: {locale: string; gameId?: string}) {
  return (
    <>
      <input name="locale" type="hidden" value={locale} />
      <input name="commandId" type="hidden" value={randomUUID()} />
      {gameId ? <input name="gameId" type="hidden" value={gameId} /> : null}
    </>
  );
}

function VenueFields({
  venues,
  selectedVenueId,
  instructions,
  venueLabel,
  noVenueLabel,
  instructionsLabel
}: {
  venues: readonly AdminVenue[];
  selectedVenueId?: string | null;
  instructions?: string | null;
  venueLabel: string;
  noVenueLabel: string;
  instructionsLabel: string;
}) {
  return (
    <div className="venue-fields">
      <label>
        <span>{venueLabel}</span>
        <select defaultValue={selectedVenueId ?? ''} name="venueId">
          <option value="">{noVenueLabel}</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name} — {venue.address}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{instructionsLabel}</span>
        <input
          defaultValue={instructions ?? ''}
          name="venueInstructions"
          type="text"
        />
      </label>
    </div>
  );
}

function GameSummary({
  game,
  locale,
  timeZone,
  versus,
  noVenue
}: {
  game: AdminGame;
  locale: string;
  timeZone: string;
  versus: string;
  noVenue: string;
}) {
  return (
    <div className="game-summary">
      <p className="game-matchup">
        <strong>{game.homeTeamName}</strong> {versus} <strong>{game.awayTeamName}</strong>
      </p>
      <p className="game-time">{formatSchedule(game.scheduledAt, locale, timeZone)}</p>
      <p className="venue-copy">
        {game.venueName ?? noVenue}
        {game.venueInstructions ? ` · ${game.venueInstructions}` : ''}
      </p>
    </div>
  );
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
  const resultIsSuccess = query.result !== 'rejected' && query.result !== 'unexpected';

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
      {query.error === 'invalid_schedule' ? (
        <p className="notice notice-error">{t('invalidSchedule')}</p>
      ) : null}
      {query.error === 'invalid_game' ? (
        <p className="notice notice-error">{t('invalidGame')}</p>
      ) : null}
      {resultKey ? (
        <p className={`notice ${resultIsSuccess ? 'notice-success' : 'notice-error'}`}>
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
            <section className="season-workspace" key={season.id}>
              <div className="season-heading">
                <h3>{season.name}</h3>
                <span className={`status-pill ${season.configurationFrozen ? 'frozen' : ''}`}>
                  {season.configurationFrozen ? t('rulesFrozen') : t('rulesMutable')}
                </span>
              </div>

              <div className="operations-grid">
                <section className="panel schedule-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="panel-kicker">{t('scheduleKicker')}</p>
                      <h3>{t('scheduleGame')}</h3>
                    </div>
                  </div>
                  <form action={scheduleGameAction} className="stack-form compact-form">
                    <CommandFields locale={locale} />
                    <input name="seasonId" type="hidden" value={season.id} />
                    <div className="participant-fields">
                      <label>
                        <span>{t('homeTeam')}</span>
                        <select name="homeSeasonTeamId" required>
                          {season.teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>{t('awayTeam')}</span>
                        <select defaultValue={season.teams[1]?.id} name="awaySeasonTeamId" required>
                          {season.teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      <span>{t('scheduledLocalTime', {timeZone: league.timezone})}</span>
                      <input name="scheduledAt" required type="datetime-local" />
                    </label>
                    <VenueFields
                      instructionsLabel={t('venueInstructions')}
                      noVenueLabel={t('noVenue')}
                      venueLabel={t('venue')}
                      venues={league.venues}
                    />
                    <button type="submit">{t('schedule')}</button>
                  </form>
                </section>

                <section className="panel operations-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="panel-kicker">{t('operationsKicker')}</p>
                      <h3>{t('scheduledGames')}</h3>
                    </div>
                  </div>
                  {season.scheduledGames.length === 0 && season.postponedGames.length === 0 ? (
                    <p className="empty-copy">{t('noScheduledGames')}</p>
                  ) : null}
                  <div className="game-list">
                    {season.scheduledGames.map((game) => (
                      <article className="game-card operation-card" key={game.id}>
                        <GameSummary
                          game={game}
                          locale={locale}
                          noVenue={t('noVenue')}
                          timeZone={league.timezone}
                          versus={t('versus')}
                        />
                        <div className="button-row">
                          <form action={startGameAction}>
                            <CommandFields gameId={game.id} locale={locale} />
                            <button type="submit">{t('start')}</button>
                          </form>
                          <form action={postponeGameAction}>
                            <CommandFields gameId={game.id} locale={locale} />
                            <button className="button-secondary" type="submit">{t('postpone')}</button>
                          </form>
                          <form action={cancelGameAction}>
                            <CommandFields gameId={game.id} locale={locale} />
                            <button className="button-danger" type="submit">{t('cancel')}</button>
                          </form>
                        </div>
                        <details>
                          <summary>{t('reschedule')}</summary>
                          <form action={rescheduleGameAction} className="stack-form compact-form">
                            <CommandFields gameId={game.id} locale={locale} />
                            <label>
                              <span>{t('newScheduledLocalTime', {timeZone: league.timezone})}</span>
                              <input
                                defaultValue={formatLocalInput(game.scheduledAt, league.timezone)}
                                name="scheduledAt"
                                required
                                type="datetime-local"
                              />
                            </label>
                            <VenueFields
                              instructions={game.venueInstructions}
                              instructionsLabel={t('venueInstructions')}
                              noVenueLabel={t('noVenue')}
                              selectedVenueId={game.venueId}
                              venueLabel={t('venue')}
                              venues={league.venues}
                            />
                            <button type="submit">{t('saveReschedule')}</button>
                          </form>
                        </details>
                      </article>
                    ))}
                    {season.postponedGames.map((game) => (
                      <article className="game-card operation-card postponed-card" key={game.id}>
                        <span className="status-pill">{t('postponedStatus')}</span>
                        <GameSummary
                          game={game}
                          locale={locale}
                          noVenue={t('noVenue')}
                          timeZone={league.timezone}
                          versus={t('versus')}
                        />
                        <form action={rescheduleGameAction} className="stack-form compact-form">
                          <CommandFields gameId={game.id} locale={locale} />
                          <label>
                            <span>{t('newScheduledLocalTime', {timeZone: league.timezone})}</span>
                            <input name="scheduledAt" required type="datetime-local" />
                          </label>
                          <VenueFields
                            instructions={game.venueInstructions}
                            instructionsLabel={t('venueInstructions')}
                            noVenueLabel={t('noVenue')}
                            selectedVenueId={game.venueId}
                            venueLabel={t('venue')}
                            venues={league.venues}
                          />
                          <div className="button-row">
                            <button type="submit">{t('returnToSchedule')}</button>
                          </div>
                        </form>
                        <form action={cancelGameAction}>
                          <CommandFields gameId={game.id} locale={locale} />
                          <button className="button-danger" type="submit">{t('cancel')}</button>
                        </form>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <div className="season-grid">
                <section className="panel score-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="panel-kicker">{t('resultsKicker')}</p>
                      <h3>{t('gamesToFinalize')}</h3>
                    </div>
                  </div>

                  {season.inProgressGames.length === 0 ? (
                    <p className="empty-copy">{t('noGames')}</p>
                  ) : (
                    <div className="game-list">
                      {season.inProgressGames.map((game) => (
                        <form action={finalizeGameAction} className="game-card" key={game.id}>
                          <CommandFields gameId={game.id} locale={locale} />
                          <GameSummary
                            game={game}
                            locale={locale}
                            noVenue={t('noVenue')}
                            timeZone={league.timezone}
                            versus={t('versus')}
                          />
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
            </section>
          ))}
        </section>
      ))}
    </main>
  );
}

import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {PostgresPlayerPointsDashboardStore} from '@/courtside/adapters/postgres/player-points-dashboard-store';

import {selectAdminContext} from '../admin-context';
import {
  AdminContextHeader,
  AdminFeedback,
  AdminPageHeading,
  NoAdminAccess
} from '../admin-shared';
import {requireAdminSession} from '../admin-session';
import {
  CompletedGameCard,
  FinalizeGameCard,
  PostponedGameCard,
  ScheduleGamePanel,
  ScheduledGameCard
} from '../game-controls';

export const dynamic = 'force-dynamic';

export default async function GamesPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; result?: string; season?: string}>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('Admin')
  ]);
  const {pool, account} = await requireAdminSession(locale);
  const leagues = account ? await new PostgresAdminDashboardStore(pool).load(account.id) : [];
  const {league, season} = selectAdminContext(leagues, query.season);
  const playerPointsByGame = account && season
    ? await new PostgresPlayerPointsDashboardStore(pool).loadForSeason(account.id, season.id)
    : new Map();
  const forfeitLabels = {
    forfeit: t('forfeit'),
    forfeitGame: t('forfeitGame'),
    winner: t('winner'),
    optionalReason: t('optionalReason'),
    score: t('score')
  };
  const completedLabels = {
    auditHistory: t('auditHistory'),
    correctResult: t('correctResult'),
    correctionReason: t('correctionReason'),
    finalStatus: t('finalStatus'),
    forfeitStatus: t('forfeitStatus'),
    noVenue: t('noVenue'),
    recordedBy: t('recordedBy'),
    score: t('score'),
    versus: t('versus'),
    winner: t('winner')
  };
  const playerPointLabels = {
    summary: t('playerPoints'),
    help: t('playerPointsHelp'),
    noEligiblePlayers: t('noEligiblePlayers'),
    points: t('individualPoints'),
    unknown: t('pointsUnknown'),
    provisional: t('pointsProvisional'),
    confirmed: t('pointsConfirmed'),
    verification: t('pointsVerification'),
    saveProvisional: t('savePointsProvisional'),
    saveConfirmed: t('savePointsConfirmed'),
    optionalReason: t('optionalReason'),
    submit: t('savePlayerPoints')
  };

  return (
    <div className="admin-route admin-games-route">
      <AdminPageHeading eyebrow={t('gamesPageEyebrow')} summary={t('gamesPageSummary')} title={t('gamesPageTitle')} />
      <AdminFeedback error={query.error} result={query.result} translate={(key) => t(key)} />
      {!account || !league ? <NoAdminAccess summary={t('noAccessSummary')} title={t('noAccessTitle')} /> : null}
      {league ? (
        <AdminContextHeader
          labels={{
            league: t('league'),
            season: t('seasonContext'),
            chooseSeason: t('chooseSeason'),
            applySelection: t('applySeasonSelection'),
            openGames: t('openGames'),
            noSeason: t('noSeasonsSummary'),
            mutable: t('rulesMutable'),
            frozen: t('rulesFrozen')
          }}
          league={league}
          leagues={leagues}
          locale={locale}
          route="games"
          season={season}
        />
      ) : null}
      {league && !season ? (
        <section className="empty-state">
          <h2>{t('noSeasonsTitle')}</h2>
          <p>{t('noSeasonsSummary')}</p>
          <Link className="button-link primary-link" href={`/${locale}/admin/setup`}>{t('openSetup')}</Link>
        </section>
      ) : null}
      {league && season ? (
        <>
          <div className="route-action-row">
            <a className="button-link primary-link" href="#schedule-game">{t('scheduleGame')}</a>
            <Link className="button-link" href={`/${locale}/schedule`}>{t('viewPublicSchedule')}</Link>
            <Link className="button-link" href={`/${locale}/results`}>{t('viewPublicResults')}</Link>
          </div>

          <section className="attention-section" id="in-progress">
            <div className="section-heading">
              <div><p className="panel-kicker">{t('attentionKicker')}</p><h3>{t('needsAttention')}</h3></div>
              <span>{season.inProgressGames.length + season.postponedGames.length}</span>
            </div>
            {season.inProgressGames.length === 0 && season.postponedGames.length === 0 ? (
              <p className="empty-copy">{t('nothingNeedsAttention')}</p>
            ) : (
              <div className="attention-grid">
                {season.inProgressGames.map((game) => (
                  <FinalizeGameCard
                    contextSeasonId={season.id}
                    forfeitLabels={forfeitLabels}
                    game={game}
                    key={game.id}
                    labels={{noVenue: t('noVenue'), versus: t('versus'), score: t('score'), finalize: t('finalize')}}
                    locale={locale}
                    timeZone={league.timezone}
                  />
                ))}
                {season.postponedGames.map((game) => (
                  <PostponedGameCard
                    contextSeasonId={season.id}
                    forfeitLabels={forfeitLabels}
                    game={game}
                    key={game.id}
                    labels={{
                      noVenue: t('noVenue'),
                      versus: t('versus'),
                      start: t('start'),
                      postpone: t('postpone'),
                      postponedStatus: t('postponedStatus'),
                      cancel: t('cancel'),
                      reschedule: t('reschedule'),
                      newScheduledTime: t('newScheduledLocalTime', {timeZone: league.timezone}),
                      venue: t('venue'),
                      instructions: t('venueInstructions'),
                      archived: t('archivedVenue'),
                      saveReschedule: t('saveReschedule'),
                      returnToSchedule: t('returnToSchedule')
                    }}
                    locale={locale}
                    timeZone={league.timezone}
                    venues={league.venues}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="panel operations-panel" id="upcoming">
            <div className="panel-heading"><div><p className="panel-kicker">{t('operationsKicker')}</p><h3>{t('scheduledGames')}</h3></div><span className="status-pill">{season.scheduledGames.length}</span></div>
            {season.scheduledGames.length === 0 ? <p className="empty-copy">{t('noScheduledGames')}</p> : (
              <div className="game-list">
                {season.scheduledGames.map((game) => (
                  <ScheduledGameCard
                    contextSeasonId={season.id}
                    forfeitLabels={forfeitLabels}
                    game={game}
                    key={game.id}
                    labels={{
                      noVenue: t('noVenue'),
                      versus: t('versus'),
                      start: t('start'),
                      postpone: t('postpone'),
                      postponedStatus: t('postponedStatus'),
                      cancel: t('cancel'),
                      reschedule: t('reschedule'),
                      newScheduledTime: t('newScheduledLocalTime', {timeZone: league.timezone}),
                      venue: t('venue'),
                      instructions: t('venueInstructions'),
                      archived: t('archivedVenue'),
                      saveReschedule: t('saveReschedule'),
                      returnToSchedule: t('returnToSchedule')
                    }}
                    locale={locale}
                    timeZone={league.timezone}
                    venues={league.venues}
                  />
                ))}
              </div>
            )}
          </section>

          <ScheduleGamePanel
            labels={{
              kicker: t('scheduleKicker'),
              title: t('scheduleGame'),
              homeTeam: t('homeTeam'),
              awayTeam: t('awayTeam'),
              scheduledTime: t('scheduledLocalTime', {timeZone: league.timezone}),
              venue: t('venue'),
              noVenue: t('noVenue'),
              instructions: t('venueInstructions'),
              archived: t('archivedVenue'),
              submit: t('schedule'),
              needsTeams: t('scheduleNeedsTeams')
            }}
            locale={locale}
            seasonId={season.id}
            teams={season.teams}
            venues={league.venues}
          />

          <section className="panel standings-panel">
            <div className="panel-heading"><div><p className="panel-kicker">{season.name}</p><h3>{t('standings')}</h3></div>{season.unresolvedTieCount > 0 ? <span className="status-pill">{t('provisional')}</span> : null}</div>
            <div className="table-wrap"><table><thead><tr><th>{t('rank')}</th><th>{t('team')}</th><th>{t('played')}</th><th>{t('wins')}</th><th>{t('losses')}</th><th>{t('leaguePoints')}</th><th>{t('differential')}</th><th>{t('pointsFor')}</th></tr></thead><tbody>
              {season.standings.map((standing) => <tr key={standing.seasonTeamId}><td>{standing.rank ?? '—'}</td><th scope="row">{standing.teamName}</th><td>{standing.gamesPlayed}</td><td>{standing.wins}</td><td>{standing.losses}</td><td>{standing.leaguePoints}</td><td>{standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}</td><td>{standing.pointsFor}</td></tr>)}
            </tbody></table></div>
          </section>

          <section className="panel completed-panel" id="completed">
            <div className="panel-heading"><div><p className="panel-kicker">{t('completedKicker')}</p><h3>{t('completedGames')}</h3></div><span className="status-pill">{season.completedGames.length}</span></div>
            {season.completedGames.length === 0 ? <p className="empty-copy">{t('noCompletedGames')}</p> : (
              <div className="completed-grid">{[...season.completedGames].reverse().map((game) => <CompletedGameCard contextSeasonId={season.id} game={game} key={game.id} labels={completedLabels} locale={locale} playerPointLabels={playerPointLabels} playerPoints={playerPointsByGame.get(game.id) ?? []} timeZone={league.timezone} />)}</div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

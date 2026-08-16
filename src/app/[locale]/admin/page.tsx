import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';
import {PostgresPlayerAccessDashboardStore} from '@/courtside/adapters/postgres/player-access-dashboard-store';

import {selectAdminContext} from './admin-context';
import {
  AdminContextHeader,
  AdminFeedback,
  AdminPageHeading,
  formatSchedule,
  NoAdminAccess
} from './admin-shared';
import {requireAdminSession} from './admin-session';
import {GameSummary} from './game-controls';

export const dynamic = 'force-dynamic';

export default async function AdminPage({
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
  const [leagues, accessLeagues] = account
    ? await Promise.all([
        new PostgresAdminDashboardStore(pool).load(account.id),
        new PostgresPlayerAccessDashboardStore(pool).loadAdmin(account.id)
      ])
    : [[], []];
  const {league, season} = selectAdminContext(leagues, query.season);
  const pendingAccessCount = league
    ? accessLeagues
        .find((candidate) => candidate.leagueId === league.id)
        ?.relationships.filter((relationship) => relationship.status === 'requested').length ?? 0
    : 0;
  const gameCount = season
    ? season.scheduledGames.length + season.postponedGames.length + season.inProgressGames.length + season.completedGames.length
    : 0;
  const setupIncomplete = !season || season.teams.length < 2 || gameCount === 0;
  const recentResults = season ? [...season.completedGames].reverse().slice(0, 4) : [];

  return (
    <div className="admin-route admin-desk-route">
      <AdminPageHeading eyebrow={t('deskPageEyebrow')} summary={t('deskPageSummary')} title={t('deskPageTitle')} />
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
          route="admin"
          season={season}
        />
      ) : null}

      {league && setupIncomplete ? (
        <section className="setup-prompt">
          <div><p className="panel-kicker">{t('setupPromptKicker')}</p><h3>{t('setupPromptTitle')}</h3><p>{t('setupPromptSummary')}</p></div>
          <div className="setup-prompt-status">
            <span data-complete={Boolean(season)}>{season ? '✓' : '○'} {t('readinessSeason')}</span>
            <span data-complete={Boolean(season && season.teams.length >= 2)}>{season && season.teams.length >= 2 ? '✓' : '○'} {t('readinessTeams')}</span>
            <span data-complete={gameCount > 0}>{gameCount > 0 ? '✓' : '○'} {t('readinessGame')}</span>
          </div>
          <Link className="button-link primary-link" href={`/${locale}/admin/setup${season ? `?season=${season.id}` : ''}`}>{t('openSetup')}</Link>
        </section>
      ) : null}

      {league && season ? (
        <>
          <div className="route-action-row desk-actions">
            <Link className="button-link primary-link" href={`/${locale}/admin/games?season=${season.id}#schedule-game`}>{t('scheduleGame')}</Link>
            <Link className="button-link" href={`/${locale}/admin/rosters`}>{t('manageRosters')}</Link>
            <Link className="button-link" href={`/${locale}/schedule`}>{t('viewPublicSchedule')}</Link>
          </div>

          <section className="desk-metrics" aria-label={t('seasonSnapshot')}>
            <Link href={`/${locale}/admin/games?season=${season.id}#in-progress`}><span>{t('inProgressMetric')}</span><strong>{season.inProgressGames.length}</strong></Link>
            <Link href={`/${locale}/admin/games?season=${season.id}#upcoming`}><span>{t('upcomingMetric')}</span><strong>{season.scheduledGames.length}</strong></Link>
            <Link href={`/${locale}/admin/player-access`}><span>{t('pendingAccessMetric')}</span><strong>{pendingAccessCount}</strong></Link>
            <Link href={`/${locale}/admin/games?season=${season.id}#completed`}><span>{t('completedMetric')}</span><strong>{season.completedGames.length}</strong></Link>
          </section>

          <section className="attention-section desk-attention">
            <div className="section-heading"><div><p className="panel-kicker">{t('attentionKicker')}</p><h3>{t('needsAttention')}</h3></div><span>{season.inProgressGames.length + season.postponedGames.length + pendingAccessCount}</span></div>
            {season.inProgressGames.length === 0 && season.postponedGames.length === 0 && pendingAccessCount === 0 ? (
              <p className="empty-copy">{t('nothingNeedsAttention')}</p>
            ) : (
              <div className="attention-summary-grid">
                {season.inProgressGames.length > 0 ? <Link className="attention-summary-card urgent" href={`/${locale}/admin/games?season=${season.id}#in-progress`}><span>{t('inProgressMetric')}</span><strong>{t('finalizeCount', {count: season.inProgressGames.length})}</strong><small>{t('openGames')}</small></Link> : null}
                {season.postponedGames.length > 0 ? <Link className="attention-summary-card" href={`/${locale}/admin/games?season=${season.id}#in-progress`}><span>{t('postponedStatus')}</span><strong>{t('postponedCount', {count: season.postponedGames.length})}</strong><small>{t('resolvePostponed')}</small></Link> : null}
                {pendingAccessCount > 0 ? <Link className="attention-summary-card" href={`/${locale}/admin/player-access`}><span>{t('pendingAccessMetric')}</span><strong>{t('accessRequestCount', {count: pendingAccessCount})}</strong><small>{t('reviewRequests')}</small></Link> : null}
              </div>
            )}
          </section>

          <div className="desk-overview-grid">
            <section className="panel desk-upcoming-panel">
              <div className="panel-heading"><div><p className="panel-kicker">{t('operationsKicker')}</p><h3>{t('upNext')}</h3></div><Link href={`/${locale}/admin/games?season=${season.id}#upcoming`}>{t('viewAll')}</Link></div>
              {season.scheduledGames.length === 0 ? <p className="empty-copy">{t('noScheduledGames')}</p> : (
                <div className="desk-game-list">{season.scheduledGames.slice(0, 4).map((game) => <article className="desk-game-row" key={game.id}><GameSummary game={game} locale={locale} noVenue={t('noVenue')} timeZone={league.timezone} versus={t('versus')} /></article>)}</div>
              )}
            </section>

            <section className="panel desk-standings-panel">
              <div className="panel-heading"><div><p className="panel-kicker">{season.name}</p><h3>{t('standings')}</h3></div><Link href={`/${locale}/standings`}>{t('publicView')}</Link></div>
              {season.standings.length === 0 ? <p className="empty-copy">{t('noStandingsYet')}</p> : (
                <ol className="standings-snapshot">{season.standings.slice(0, 6).map((standing) => <li key={standing.seasonTeamId}><span>{standing.rank ?? '—'}</span><strong>{standing.teamName}</strong><span>{standing.leaguePoints} {t('pointsShort')}</span></li>)}</ol>
              )}
            </section>
          </div>

          <section className="panel recent-results-panel">
            <div className="panel-heading"><div><p className="panel-kicker">{t('completedKicker')}</p><h3>{t('recentResults')}</h3></div><Link href={`/${locale}/admin/games?season=${season.id}#completed`}>{t('viewAll')}</Link></div>
            {recentResults.length === 0 ? <p className="empty-copy">{t('noCompletedGames')}</p> : (
              <div className="recent-result-list">{recentResults.map((game) => <article key={game.id}><span className="status-pill">{game.status === 'forfeit' ? t('forfeitStatus') : t('finalStatus')}</span><strong>{game.homeTeamName} {game.homeScore}–{game.awayScore} {game.awayTeamName}</strong><small>{formatSchedule(game.scheduledAt, locale, league.timezone)}</small></article>)}</div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

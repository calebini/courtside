import {getTranslations} from 'next-intl/server';

import {PostgresAdminDashboardStore} from '@/courtside/adapters/postgres/admin-dashboard-store';

import {selectAdminContext} from '../admin-context';
import {
  AdminContextHeader,
  AdminFeedback,
  AdminPageHeading,
  NoAdminAccess
} from '../admin-shared';
import {requireAdminSession} from '../admin-session';
import {
  SeasonConfigurationPanel,
  SeasonSetupForm,
  TeamParticipationPanel,
  VenueManagementPanel
} from '../setup-controls';

export const dynamic = 'force-dynamic';

export default async function SetupPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; result?: string; season?: string; league?: string}>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('Admin')
  ]);
  const {pool, account} = await requireAdminSession(locale);
  const leagues = account ? await new PostgresAdminDashboardStore(pool).load(account.id) : [];
  const {league, season} = selectAdminContext(leagues, query.season, query.league);
  const gameCount = season
    ? season.scheduledGames.length + season.postponedGames.length + season.inProgressGames.length + season.completedGames.length
    : 0;

  return (
    <div className="admin-route admin-setup-route">
      <AdminPageHeading eyebrow={t('setupPageEyebrow')} summary={t('setupPageSummary')} title={t('setupPageTitle')} />
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
          route="setup"
          season={season}
        />
      ) : null}

      {league ? (
        <section className="setup-readiness panel">
          <div className="panel-heading"><div><p className="panel-kicker">{t('readinessKicker')}</p><h3>{t('readinessTitle')}</h3></div></div>
          <ul className="readiness-list">
            <li data-complete={Boolean(season)}><span>{season ? '✓' : '○'}</span>{t('readinessSeason')}</li>
            <li data-complete={Boolean(season && season.teams.length >= 2)}><span>{season && season.teams.length >= 2 ? '✓' : '○'}</span>{t('readinessTeams')}</li>
            <li data-complete={league.venues.some((venue) => !venue.archivedAt)}><span>{league.venues.some((venue) => !venue.archivedAt) ? '✓' : '○'}</span>{t('readinessVenues')}</li>
            <li data-complete={gameCount > 0}><span>{gameCount > 0 ? '✓' : '○'}</span>{t('readinessGame')}</li>
          </ul>
        </section>
      ) : null}

      {league && season ? (
        <section className="setup-group">
          <div className="section-heading"><div><p className="panel-kicker">{t('seasonSetupGroupKicker')}</p><h2>{t('seasonSetupGroupTitle', {season: season.name})}</h2></div></div>
          <SeasonConfigurationPanel
            labels={{
              kicker: t('configurationKicker'),
              title: t('seasonConfiguration'),
              mutable: t('rulesMutable'),
              frozen: t('rulesFrozen'),
              winPoints: t('winPoints'),
              lossPoints: t('lossPoints'),
              ranking: t('rankingOrder'),
              rankingPriority: (position) => t('rankingPriority', {position}),
              criteria: {
                league_points: t('criterionLeaguePoints'),
                point_differential: t('criterionPointDifferential'),
                points_scored: t('criterionPointsScored'),
                random_draw: t('criterionRandomDraw')
              },
              randomDrawFixed: t('randomDrawFixed'),
              fixedRules: t('fixedConfigurationRules'),
              playoffRounds: (count) => t('playoffRoundCount', {count}),
              save: t('saveConfiguration'),
              frozenSummary: t('frozenConfigurationSummary')
            }}
            locale={locale}
            season={season}
          />
          <TeamParticipationPanel
            labels={{
              kicker: t('teamSetupKicker'),
              title: t('manageSeasonTeams'),
              names: t('teamNames'),
              placeholder: t('teamNamesPlaceholder'),
              entrySummary: t('teamEntrySummary'),
              add: t('addTeams'),
              participating: t('participatingTeams'),
              none: t('noParticipatingTeams'),
              remove: t('removeFromSeason'),
              removalSummary: t('teamRemovalSummary')
            }}
            locale={locale}
            season={season}
          />
        </section>
      ) : null}

      {league ? (
        <section className="setup-group league-setup-group">
          <div className="section-heading"><div><p className="panel-kicker">{t('leagueSetupGroupKicker')}</p><h2>{t('leagueSetupGroupTitle')}</h2></div></div>
          <VenueManagementPanel
            contextSeasonId={season?.id}
            labels={{
              kicker: t('venueSetupKicker'),
              title: t('manageVenues'),
              name: t('venueName'),
              address: t('venueAddress'),
              notes: t('venueNotes'),
              create: t('createVenue'),
              directory: t('leagueVenues'),
              none: t('noLeagueVenues'),
              archived: t('archivedVenue'),
              correct: t('correctVenue'),
              save: t('saveVenue'),
              archive: t('archiveVenue'),
              archiveWarning: t('archiveVenueWarning'),
              confirmArchive: t('confirmArchiveVenue'),
              archiveSummary: t('venueArchiveSummary')
            }}
            leagueId={league.id}
            locale={locale}
            venues={league.venues}
          />
          <details className="panel create-season-disclosure" open={!season}>
            <summary>{season ? t('createAnotherSeason') : t('createFirstSeason')}</summary>
            <SeasonSetupForm
              actionLabel={t('createSeason')}
              leagueId={league.id}
              locale={locale}
              nameLabel={t('seasonName')}
              namePlaceholder={t('seasonNamePlaceholder')}
              rulesSummary={t('defaultSeasonRules')}
            />
          </details>
        </section>
      ) : null}
    </div>
  );
}

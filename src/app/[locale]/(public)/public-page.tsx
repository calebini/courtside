import {getTranslations} from 'next-intl/server';

import {PostgresPublicLeagueStore} from '@/courtside/adapters/postgres/public-league-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';

import {PublicPortal, type PublicPortalLabels, type PublicPortalMode} from './portal';

export async function PublicDataPage({
  locale,
  mode
}: {
  locale: string;
  mode: PublicPortalMode;
}) {
  const t = await getTranslations('Public');
  const leagues = await new PostgresPublicLeagueStore(getRuntimePostgresPool()).load();
  const labels: PublicPortalLabels = {
    emptyLeagues: t('emptyLeagues'),
    emptySchedule: t('emptySchedule'),
    emptyResults: t('emptyResults'),
    final: t('final'),
    forfeit: t('forfeit'),
    scheduled: t('scheduled'),
    postponed: t('postponed'),
    cancelled: t('cancelled'),
    inProgress: t('inProgress'),
    regularSeason: t('regularSeason'),
    playoffs: t('playoffs'),
    noVenue: t('noVenue'),
    provisional: t('provisional'),
    rank: t('rank'),
    team: t('team'),
    played: t('played'),
    wins: t('wins'),
    losses: t('losses'),
    leaguePoints: t('leaguePoints'),
    differential: t('differential'),
    pointsFor: t('pointsFor'),
    versus: t('versus')
  };

  return (
    <main className="public-main">
      <header className="public-page-heading">
        <p className="eyebrow">{t(`${mode}Kicker`)}</p>
        <h1>{t(`${mode}Title`)}</h1>
        <p className="lede">{t(`${mode}Summary`)}</p>
      </header>
      <PublicPortal labels={labels} leagues={leagues} locale={locale} mode={mode} />
    </main>
  );
}

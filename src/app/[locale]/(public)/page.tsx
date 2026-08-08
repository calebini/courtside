import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('Home');

  return (
    <main className="public-main public-home">
      <section className="public-hero">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="lede">{t('summary')}</p>
      </section>
      <section className="public-route-grid" aria-label={t('exploreLeague')}>
        <Link href={`/${locale}/schedule`}>
          <span>{t('scheduleKicker')}</span>
          <strong>{t('scheduleTitle')}</strong>
          <p>{t('scheduleSummary')}</p>
        </Link>
        <Link href={`/${locale}/results`}>
          <span>{t('resultsKicker')}</span>
          <strong>{t('resultsTitle')}</strong>
          <p>{t('resultsSummary')}</p>
        </Link>
        <Link href={`/${locale}/standings`}>
          <span>{t('standingsKicker')}</span>
          <strong>{t('standingsTitle')}</strong>
          <p>{t('standingsSummary')}</p>
        </Link>
      </section>
    </main>
  );
}

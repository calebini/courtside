import {getTranslations} from 'next-intl/server';
import Link from 'next/link';

export default async function HomePage() {
  const t = await getTranslations('Home');

  return (
    <main>
      <p className="eyebrow">{t('eyebrow')}</p>
      <h1>{t('title')}</h1>
      <p>{t('summary')}</p>
      <nav aria-label={t('languageLabel')}>
        <Link href="/en">English</Link>
        <Link href="/fr">Français</Link>
      </nav>
    </main>
  );
}

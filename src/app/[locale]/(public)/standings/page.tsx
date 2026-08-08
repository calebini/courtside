import {PublicDataPage} from '../public-page';

export const dynamic = 'force-dynamic';

export default async function StandingsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return <PublicDataPage locale={locale} mode="standings" />;
}

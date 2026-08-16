'use client';

import Link from 'next/link';
import {usePathname, useSearchParams} from 'next/navigation';

interface NavigationItem {
  readonly href: string;
  readonly label: string;
  readonly match: (pathname: string) => boolean;
}

export function AdminNavigation({
  locale,
  labels
}: {
  locale: string;
  labels: {
    desk: string;
    games: string;
    people: string;
    access: string;
    setup: string;
  };
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const seasonId = searchParams.get('season');
  const base = `/${locale}/admin`;
  const items: NavigationItem[] = [
    {href: base, label: labels.desk, match: (value) => value === base},
    {href: `${base}/games`, label: labels.games, match: (value) => value.startsWith(`${base}/games`)},
    {
      href: `${base}/rosters`,
      label: labels.people,
      match: (value) => value.startsWith(`${base}/rosters`)
    },
    {
      href: `${base}/player-access`,
      label: labels.access,
      match: (value) => value.startsWith(`${base}/player-access`)
    },
    {href: `${base}/setup`, label: labels.setup, match: (value) => value.startsWith(`${base}/setup`)}
  ];

  return (
    <nav aria-label="League administration" className="admin-navigation">
      {items.map((item) => {
        const href = seasonId && !item.href.includes('player-access') && !item.href.includes('rosters')
          ? `${item.href}?season=${encodeURIComponent(seasonId)}`
          : item.href;
        const active = item.match(pathname);
        return (
          <Link aria-current={active ? 'page' : undefined} href={href} key={item.href}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

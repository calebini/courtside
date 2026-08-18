import {getTranslations} from 'next-intl/server';
import Link from 'next/link';
import {redirect} from 'next/navigation';

import {
  PostgresMemberStatisticsStore,
  type MemberBoxScoreEntry
} from '@/courtside/adapters/postgres/member-statistics-store';
import {getRuntimePostgresPool} from '@/courtside/adapters/postgres/runtime-pool';
import {PostgresUserAccountDirectory} from '@/courtside/adapters/postgres/user-account-directory';
import {SupabaseVerifiedIdentityProvider} from '@/courtside/adapters/supabase/identity-provider';
import {createSupabaseServerClient} from '@/courtside/adapters/supabase/server-client';
import {resolveAuthenticatedAccount} from '@/courtside/services/resolve-authenticated-account';

import {signOut} from '../auth-actions';

export const dynamic = 'force-dynamic';

interface StatsSearchParams {
  season?: string;
  player?: string;
  game?: string;
  q?: string;
}

function statsHref(locale: string, values: StatsSearchParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, value);
  }
  const serialized = query.toString();
  return `/${locale}/stats${serialized ? `?${serialized}` : ''}`;
}

export default async function MemberStatisticsPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<StatsSearchParams>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('MemberStats')
  ]);
  const pool = getRuntimePostgresPool();
  const supabase = await createSupabaseServerClient();
  const {identity, account} = await resolveAuthenticatedAccount(
    new SupabaseVerifiedIdentityProvider(supabase),
    new PostgresUserAccountDirectory(pool)
  );
  if (!identity || !account) redirect(`/${locale}/sign-in`);

  const dashboard = await new PostgresMemberStatisticsStore(pool).load(account.id, query.season);
  const header = <header className="topbar">
    <Link className="wordmark" href={`/${locale}`}>COURTSIDE</Link>
    <div className="account-actions">
      <Link className="button-link" href={`/${locale}/players`}>{t('myPlayers')}</Link>
      {dashboard.hasAdministrativeAccess ? <Link className="button-link" href={`/${locale}/admin`}>{t('leagueDesk')}</Link> : null}
      <span>{account.displayName}</span>
      <form action={signOut}><input name="locale" type="hidden" value={locale}/><button className="button-link" type="submit">{t('signOut')}</button></form>
    </div>
  </header>;

  if (!dashboard.hasAccess) {
    return <main className="dashboard-shell member-stats-shell">
      {header}
      <section className="dashboard-heading"><p className="eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1><p className="lede">{t('summary')}</p></section>
      <section className="empty-state"><h2>{t('noAccessTitle')}</h2><p>{t('noAccessSummary')}</p><Link className="primary-link" href={`/${locale}/players`}>{t('requestAccess')}</Link></section>
    </main>;
  }

  const season = dashboard.selectedSeason;
  if (!season) {
    return <main className="dashboard-shell member-stats-shell">
      {header}
      <section className="dashboard-heading"><p className="eyebrow">{dashboard.league?.name}</p><h1>{t('title')}</h1><p className="lede">{t('summary')}</p></section>
      <section className="empty-state"><h2>{t('noSeasonTitle')}</h2><p>{t('noSeasonSummary')}</p></section>
    </main>;
  }

  const normalizedSearch = query.q?.trim().toLocaleLowerCase(locale) ?? '';
  const visiblePlayers = normalizedSearch
    ? season.players.filter((player) => `${player.displayName} ${player.teamNames.join(' ')}`.toLocaleLowerCase(locale).includes(normalizedSearch))
    : season.players;
  const selectedPlayer = season.players.find((player) => player.id === query.player) ??
    season.players.find((player) => player.id === season.leaderboard[0]?.playerId) ??
    season.players[0] ?? null;
  const selectedGame = season.completedGames.find((game) => game.id === query.game) ??
    season.completedGames[0] ?? null;
  const dateFormatter = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: dashboard.league?.timezone
  });
  const averageFormatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-CA', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  const commonQuery = {season: season.id, q: query.q, player: selectedPlayer?.id};

  const boxScoreTable = (teamName: string, entries: readonly MemberBoxScoreEntry[]) => <section className="box-score-team">
    <h3>{teamName}</h3>
    <div className="table-wrap">
      <table>
        <thead><tr><th scope="col">{t('player')}</th><th scope="col">{t('points')}</th><th scope="col">{t('status')}</th></tr></thead>
        <tbody>{entries.map((entry) => <tr key={entry.rosterMembershipId}>
          <th scope="row"><Link href={statsHref(locale, {...commonQuery, player: entry.playerId, game: selectedGame?.id})}>{entry.playerName}</Link></th>
          <td>{entry.points ?? '—'}</td>
          <td>{entry.points === null ? t('notRecorded') : t(entry.verificationStatus === 'confirmed' ? 'confirmed' : 'provisional')}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;

  return <main className="dashboard-shell member-stats-shell">
    {header}
    <section className="dashboard-heading member-stats-heading">
      <div><p className="eyebrow">{dashboard.league?.name}</p><h1>{t('title')}</h1><p className="lede">{t('summary')}</p></div>
      <form className="season-context-form" method="get">
        <label><span>{t('season')}</span><select defaultValue={season.id} name="season">{dashboard.seasons.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></label>
        <button type="submit">{t('viewSeason')}</button>
      </form>
    </section>

    <section className="panel member-leaderboard">
      <p className="panel-kicker">{t('leaderboardKicker')}</p><h2>{t('leaderboardTitle')}</h2><p>{t('leaderboardSummary')}</p>
      {season.leaderboard.length === 0 ? <p className="empty-copy">{t('emptyLeaderboard')}</p> : <div className="table-wrap"><table>
        <thead><tr><th scope="col">{t('rank')}</th><th scope="col">{t('player')}</th><th scope="col">{t('team')}</th><th scope="col">{t('totalPoints')}</th><th scope="col">{t('recordedGames')}</th><th scope="col">{t('average')}</th></tr></thead>
        <tbody>{season.leaderboard.map((row) => {
          const player = season.players.find((candidate) => candidate.id === row.playerId);
          return <tr key={row.playerId}><td>{row.rank}</td><th scope="row"><Link href={statsHref(locale, {...commonQuery, player: row.playerId, game: selectedGame?.id})}>{row.playerName}</Link></th><td>{player?.teamNames.join(' · ')}</td><td>{row.confirmedTotalPoints}</td><td>{row.confirmedRecordedPointsGames}</td><td>{averageFormatter.format(row.pointsPerRecordedPointsGame)}</td></tr>;
        })}</tbody>
      </table></div>}
    </section>

    <div className="member-stats-grid">
      <section className="panel member-game-list">
        <p className="panel-kicker">{t('gamesKicker')}</p><h2>{t('gamesTitle')}</h2>
        {season.completedGames.length === 0 ? <p className="empty-copy">{t('emptyGames')}</p> : <ol>{season.completedGames.map((game) => <li className={game.id === selectedGame?.id ? 'selected' : undefined} key={game.id}>
          <div><strong>{game.homeTeamName} {game.homeScore}–{game.awayScore} {game.awayTeamName}</strong><span>{dateFormatter.format(game.scheduledAt)} · {t(game.status)} · {t(game.phase)}</span></div>
          <Link href={statsHref(locale, {...commonQuery, game: game.id})}>{t('viewBoxScore')}</Link>
        </li>)}</ol>}
      </section>
      {selectedGame ? <section className="panel member-box-score">
        <p className="panel-kicker">{dateFormatter.format(selectedGame.scheduledAt)} · {t(selectedGame.status)}</p><h2>{t('boxScore')}</h2>
        <p className="official-score"><span>{t('officialScore')}</span><strong>{selectedGame.homeTeamName} {selectedGame.homeScore}–{selectedGame.awayScore} {selectedGame.awayTeamName}</strong></p>
        <p className="field-help">{t('boxScoreNote')}</p>
        <div className="box-score-grid">{boxScoreTable(selectedGame.homeTeamName, selectedGame.homePlayers)}{boxScoreTable(selectedGame.awayTeamName, selectedGame.awayPlayers)}</div>
      </section> : null}
    </div>

    <div className="member-stats-grid member-directory-grid">
      <section className="panel member-player-directory">
        <p className="panel-kicker">{t('directoryKicker')}</p><h2>{t('directoryTitle')}</h2><p>{t('directorySummary')}</p>
        <form className="member-search" method="get"><input name="season" type="hidden" value={season.id}/><label><span>{t('searchPlayers')}</span><input defaultValue={query.q} name="q" type="search"/></label><button type="submit">{t('search')}</button></form>
        {visiblePlayers.length === 0 ? <p className="empty-copy">{t('noPlayers')}</p> : <ol>{visiblePlayers.map((player) => <li className={player.id === selectedPlayer?.id ? 'selected' : undefined} key={player.id}><div><strong>{player.displayName}</strong><span>{player.teamNames.join(' · ')}</span></div><Link href={statsHref(locale, {season: season.id, q: query.q, player: player.id, game: selectedGame?.id})}>{t('viewPlayer')}</Link></li>)}</ol>}
      </section>
      {selectedPlayer ? <section className="panel member-player-summary">
        <p className="panel-kicker">{t('playerSummary')}</p><h2>{selectedPlayer.displayName}</h2><p>{t('seasonTeams')}: <strong>{selectedPlayer.teamNames.join(' · ')}</strong></p>
        <dl className="player-stat-metrics"><div><dt>{t('totalPoints')}</dt><dd>{selectedPlayer.leaderboard?.confirmedTotalPoints ?? '—'}</dd></div><div><dt>{t('recordedGames')}</dt><dd>{selectedPlayer.leaderboard?.confirmedRecordedPointsGames ?? '—'}</dd></div><div><dt>{t('average')}</dt><dd>{selectedPlayer.leaderboard ? averageFormatter.format(selectedPlayer.leaderboard.pointsPerRecordedPointsGame) : '—'}</dd></div></dl>
        <h3>{t('gameLog')}</h3><p className="field-help">{t('gameLogNote')}</p>
        {selectedPlayer.gameLog.length === 0 ? <p className="empty-copy">{t('noGameLog')}</p> : <div className="table-wrap"><table><thead><tr><th scope="col">{t('opponent')}</th><th scope="col">{t('result')}</th><th scope="col">{t('points')}</th><th scope="col">{t('status')}</th></tr></thead><tbody>{selectedPlayer.gameLog.map((entry) => <tr key={entry.gameId}><th scope="row"><Link href={statsHref(locale, {season: season.id, player: selectedPlayer.id, game: entry.gameId})}>{entry.opponentTeamName}</Link></th><td>{entry.teamScore}–{entry.opponentScore}</td><td>{entry.points ?? '—'}</td><td>{entry.points === null ? t('notRecorded') : t(entry.verificationStatus === 'confirmed' ? 'confirmed' : 'provisional')}</td></tr>)}</tbody></table></div>}
      </section> : null}
    </div>
  </main>;
}

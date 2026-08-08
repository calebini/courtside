import type {
  PublicGame,
  PublicLeague
} from '@/courtside/adapters/postgres/public-league-store';

export type PublicPortalMode = 'schedule' | 'results' | 'standings';

export interface PublicPortalLabels {
  readonly emptyLeagues: string;
  readonly emptySchedule: string;
  readonly emptyResults: string;
  readonly final: string;
  readonly forfeit: string;
  readonly scheduled: string;
  readonly postponed: string;
  readonly cancelled: string;
  readonly inProgress: string;
  readonly regularSeason: string;
  readonly playoffs: string;
  readonly noVenue: string;
  readonly provisional: string;
  readonly rank: string;
  readonly team: string;
  readonly played: string;
  readonly wins: string;
  readonly losses: string;
  readonly leaguePoints: string;
  readonly differential: string;
  readonly pointsFor: string;
  readonly versus: string;
}

function formatDate(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone
  }).format(date);
}

function gameStatus(game: PublicGame, labels: PublicPortalLabels) {
  const statuses = {
    scheduled: labels.scheduled,
    postponed: labels.postponed,
    cancelled: labels.cancelled,
    in_progress: labels.inProgress,
    final: labels.final,
    forfeit: labels.forfeit
  };
  return statuses[game.status];
}

function GameCard({
  game,
  labels,
  locale,
  timeZone,
  showScore
}: {
  game: PublicGame;
  labels: PublicPortalLabels;
  locale: string;
  timeZone: string;
  showScore: boolean;
}) {
  return (
    <article className={`public-game-card status-${game.status}`}>
      <div className="public-game-meta">
        <span className="status-pill">{gameStatus(game, labels)}</span>
        <span>{game.phase === 'playoff' ? labels.playoffs : labels.regularSeason}</span>
      </div>
      <div className="public-matchup">
        <span>{game.homeTeamName}</span>
        {showScore ? <strong>{game.homeScore}–{game.awayScore}</strong> : <strong>{labels.versus}</strong>}
        <span>{game.awayTeamName}</span>
      </div>
      <time dateTime={game.scheduledAt.toISOString()}>
        {formatDate(game.scheduledAt, locale, timeZone)}
      </time>
      <p className="public-venue">
        {game.venueName
          ? `${game.venueName}${game.venueAddress ? ` · ${game.venueAddress}` : ''}`
          : labels.noVenue}
        {game.venueInstructions ? ` · ${game.venueInstructions}` : ''}
      </p>
    </article>
  );
}

export function PublicPortal({
  labels,
  leagues,
  locale,
  mode
}: {
  labels: PublicPortalLabels;
  leagues: readonly PublicLeague[];
  locale: string;
  mode: PublicPortalMode;
}) {
  if (leagues.length === 0) {
    return <p className="public-empty">{labels.emptyLeagues}</p>;
  }

  return (
    <div className="public-leagues">
      {leagues.map((league) => (
        <section className="public-league" key={league.id}>
          <header className="public-league-heading">
            <h2>{league.name}</h2>
            <span>{league.timezone}</span>
          </header>
          {league.seasons.map((season) => (
            <section className="public-season" key={season.id}>
              <div className="public-season-heading">
                <h3>{season.name}</h3>
                {mode === 'standings' && season.unresolvedTieCount > 0 ? (
                  <span className="status-pill">{labels.provisional}</span>
                ) : null}
              </div>
              {mode === 'schedule' ? (
                season.schedule.length === 0 ? (
                  <p className="public-empty">{labels.emptySchedule}</p>
                ) : (
                  <div className="public-game-list">
                    {season.schedule.map((game) => (
                      <GameCard
                        game={game}
                        key={game.id}
                        labels={labels}
                        locale={locale}
                        showScore={false}
                        timeZone={league.timezone}
                      />
                    ))}
                  </div>
                )
              ) : null}
              {mode === 'results' ? (
                season.results.length === 0 ? (
                  <p className="public-empty">{labels.emptyResults}</p>
                ) : (
                  <div className="public-game-list">
                    {season.results.map((game) => (
                      <GameCard
                        game={game}
                        key={game.id}
                        labels={labels}
                        locale={locale}
                        showScore
                        timeZone={league.timezone}
                      />
                    ))}
                  </div>
                )
              ) : null}
              {mode === 'standings' ? (
                <div className="table-wrap public-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{labels.rank}</th>
                        <th>{labels.team}</th>
                        <th>{labels.played}</th>
                        <th>{labels.wins}</th>
                        <th>{labels.losses}</th>
                        <th>{labels.leaguePoints}</th>
                        <th>{labels.differential}</th>
                        <th>{labels.pointsFor}</th>
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
                          <td>
                            {standing.pointDifferential > 0 ? '+' : ''}
                            {standing.pointDifferential}
                          </td>
                          <td>{standing.pointsFor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}

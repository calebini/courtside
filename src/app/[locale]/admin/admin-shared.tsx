import {randomUUID} from 'node:crypto';

import Link from 'next/link';

import type {
  AdminLeague,
  AdminSeason
} from '@/courtside/adapters/postgres/admin-dashboard-store';

const resultMessageKeys: Record<string, string> = {
  finalized: 'finalized',
  forfeited: 'forfeited',
  corrected: 'corrected',
  schedule: 'scheduled',
  reschedule: 'rescheduled',
  postpone: 'postponed',
  cancel: 'cancelled',
  start: 'started',
  season_created: 'seasonCreated',
  season_rejected: 'seasonRejected',
  teams_updated: 'teamsUpdated',
  team_removed: 'teamRemoved',
  team_rejected: 'teamRejected',
  venue_created: 'venueCreated',
  venue_updated: 'venueUpdated',
  venue_archived: 'venueArchived',
  venue_rejected: 'venueRejected',
  configuration_updated: 'configurationUpdated',
  configuration_rejected: 'configurationRejected',
  rejected: 'rejected',
  unexpected: 'unexpected'
};

const rejectedResults = new Set([
  'rejected',
  'season_rejected',
  'team_rejected',
  'venue_rejected',
  'configuration_rejected',
  'unexpected'
]);

const errorMessageKeys: Record<string, string> = {
  invalid_score: 'invalidScore',
  invalid_schedule: 'invalidSchedule',
  invalid_game: 'invalidGame',
  invalid_correction: 'invalidCorrection',
  invalid_season: 'invalidSeason',
  invalid_team: 'invalidTeam',
  invalid_venue: 'invalidVenue',
  invalid_configuration: 'invalidConfiguration'
};

export function formatSchedule(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone
  }).format(date);
}

export function formatLocalInput(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export function CommandFields({
  locale,
  gameId,
  contextSeasonId
}: {
  locale: string;
  gameId?: string;
  contextSeasonId?: string;
}) {
  return (
    <>
      <input name="locale" type="hidden" value={locale} />
      <input name="commandId" type="hidden" value={randomUUID()} />
      {gameId ? <input name="gameId" type="hidden" value={gameId} /> : null}
      {contextSeasonId ? (
        <input name="contextSeasonId" type="hidden" value={contextSeasonId} />
      ) : null}
    </>
  );
}

export function AdminFeedback({
  error,
  result,
  translate
}: {
  error?: string;
  result?: string;
  translate: (key: string) => string;
}) {
  const errorKey = error ? errorMessageKeys[error] : null;
  const resultKey = result ? resultMessageKeys[result] : null;
  return (
    <>
      {errorKey ? <p className="notice notice-error">{translate(errorKey)}</p> : null}
      {resultKey ? (
        <p className={`notice ${rejectedResults.has(result ?? '') ? 'notice-error' : 'notice-success'}`}>
          {translate(resultKey)}
        </p>
      ) : null}
    </>
  );
}

export function AdminPageHeading({
  eyebrow,
  title,
  summary
}: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <section className="dashboard-heading admin-page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lede">{summary}</p>
    </section>
  );
}

export function NoAdminAccess({title, summary}: {title: string; summary: string}) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{summary}</p>
    </section>
  );
}

export function AdminContextHeader({
  leagues,
  league,
  season,
  locale,
  route,
  labels
}: {
  leagues: readonly AdminLeague[];
  league: AdminLeague;
  season: AdminSeason | null;
  locale: string;
  route: 'admin' | 'games' | 'setup';
  labels: {
    league: string;
    season: string;
    chooseSeason: string;
    applySelection: string;
    openGames: string;
    noSeason: string;
    mutable: string;
    frozen: string;
  };
}) {
  const routePath = route === 'admin' ? `/${locale}/admin` : `/${locale}/admin/${route}`;
  const allSeasons = leagues.flatMap((candidateLeague) =>
    candidateLeague.seasons.map((candidateSeason) => ({
      league: candidateLeague,
      season: candidateSeason
    }))
  );
  return (
    <section className="admin-context-bar">
      <div className="admin-context-title">
        <p className="eyebrow">{labels.league}</p>
        <h2>{league.name}</h2>
        <span>{league.timezone}</span>
      </div>
      {season ? (
        <div className="admin-context-season">
          <span>{labels.season}</span>
          <strong>{season.name}</strong>
          <span className={`status-pill ${season.configurationFrozen ? 'frozen' : ''}`}>
            {season.configurationFrozen ? labels.frozen : labels.mutable}
          </span>
        </div>
      ) : <p className="empty-copy">{labels.noSeason}</p>}
      {allSeasons.length > 1 ? (
        <form action={routePath} className="season-context-form" method="get">
          <label>
            <span>{labels.chooseSeason}</span>
            <select defaultValue={season?.id} name="season">
              {leagues.map((candidateLeague) => (
                <optgroup key={candidateLeague.id} label={candidateLeague.name}>
                  {candidateLeague.seasons.map((candidateSeason) => (
                    <option key={candidateSeason.id} value={candidateSeason.id}>
                      {candidateSeason.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <button className="button-secondary" type="submit">{labels.applySelection}</button>
        </form>
      ) : null}
      {season && route !== 'games' ? (
        <Link className="context-quick-link" href={`/${locale}/admin/games?season=${season.id}`}>
          {labels.openGames}
        </Link>
      ) : null}
    </section>
  );
}

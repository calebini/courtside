import type {
  AdminSeason,
  AdminVenue
} from '@/courtside/adapters/postgres/admin-dashboard-store';

import {
  addSeasonTeamsAction,
  archiveVenueAction,
  createSeasonAction,
  createVenueAction,
  removeSeasonTeamAction,
  updateSeasonConfigurationAction,
  updateVenueAction
} from './actions';
import {CommandFields} from './admin-shared';

export function SeasonSetupForm({
  actionLabel,
  leagueId,
  locale,
  nameLabel,
  namePlaceholder,
  rulesSummary,
  contextSeasonId
}: {
  actionLabel: string;
  leagueId: string;
  locale: string;
  nameLabel: string;
  namePlaceholder: string;
  rulesSummary: string;
  contextSeasonId?: string;
}) {
  return (
    <form action={createSeasonAction} className="stack-form compact-form">
      <CommandFields contextSeasonId={contextSeasonId} locale={locale} />
      <input name="leagueId" type="hidden" value={leagueId} />
      <label>
        <span>{nameLabel}</span>
        <input autoComplete="off" maxLength={120} minLength={2} name="name" placeholder={namePlaceholder} required />
      </label>
      <p className="empty-copy">{rulesSummary}</p>
      <button type="submit">{actionLabel}</button>
    </form>
  );
}

function VenueDetailFields({
  venue,
  labels
}: {
  venue?: AdminVenue;
  labels: {name: string; address: string; notes: string};
}) {
  return (
    <>
      <label><span>{labels.name}</span><input autoComplete="off" defaultValue={venue?.name ?? ''} maxLength={120} minLength={2} name="name" required /></label>
      <label><span>{labels.address}</span><input autoComplete="street-address" defaultValue={venue?.address ?? ''} maxLength={240} minLength={2} name="address" required /></label>
      <label><span>{labels.notes}</span><textarea defaultValue={venue?.notes ?? ''} maxLength={1000} name="notes" rows={3} /></label>
    </>
  );
}

const scoreRankingCriteria = [
  'league_points',
  'point_differential',
  'points_scored'
] as const;

export function SeasonConfigurationPanel({
  season,
  locale,
  labels
}: {
  season: AdminSeason;
  locale: string;
  labels: {
    kicker: string;
    title: string;
    mutable: string;
    frozen: string;
    winPoints: string;
    lossPoints: string;
    ranking: string;
    rankingPriority: (position: number) => string;
    criteria: Record<(typeof scoreRankingCriteria)[number] | 'random_draw', string>;
    randomDrawFixed: string;
    fixedRules: string;
    playoffRounds: (count: number) => string;
    save: string;
    frozenSummary: string;
  };
}) {
  const configuration = season.configuration;
  return (
    <section className="panel configuration-panel">
      <div className="panel-heading">
        <div><p className="panel-kicker">{labels.kicker}</p><h3>{labels.title}</h3></div>
        <span className={`status-pill ${season.configurationFrozen ? 'frozen' : ''}`}>
          {season.configurationFrozen ? labels.frozen : labels.mutable}
        </span>
      </div>
      {season.configurationFrozen ? (
        <p className="empty-copy">{labels.frozenSummary}</p>
      ) : (
        <form action={updateSeasonConfigurationAction} className="stack-form compact-form">
          <CommandFields contextSeasonId={season.id} locale={locale} />
          <input name="seasonId" type="hidden" value={season.id} />
          <div className="configuration-points-grid">
            <label><span>{labels.winPoints}</span><input defaultValue={configuration.winPoints} inputMode="numeric" min="0" name="winPoints" required step="1" type="number" /></label>
            <label><span>{labels.lossPoints}</span><input defaultValue={configuration.lossPoints} inputMode="numeric" min="0" name="lossPoints" required step="1" type="number" /></label>
          </div>
          <fieldset className="ranking-editor">
            <legend>{labels.ranking}</legend>
            {configuration.ranking.slice(0, -1).map((criterion, index) => (
              <label key={`${index}-${criterion}`}>
                <span>{labels.rankingPriority(index + 1)}</span>
                <select defaultValue={criterion} name="ranking" required>
                  {scoreRankingCriteria.map((option) => <option key={option} value={option}>{labels.criteria[option]}</option>)}
                </select>
              </label>
            ))}
            <div className="fixed-ranking-row"><span>{labels.rankingPriority(4)}</span><strong>{labels.criteria.random_draw}</strong><small>{labels.randomDrawFixed}</small></div>
          </fieldset>
          <button type="submit">{labels.save}</button>
        </form>
      )}
      <dl className="configuration-summary">
        <div><dt>{labels.winPoints}</dt><dd>{configuration.winPoints}</dd></div>
        <div><dt>{labels.lossPoints}</dt><dd>{configuration.lossPoints}</dd></div>
        <div><dt>{labels.ranking}</dt><dd>{configuration.ranking.map((criterion) => labels.criteria[criterion as keyof typeof labels.criteria]).join(' → ')}</dd></div>
      </dl>
      <p className="empty-copy">{labels.fixedRules}</p>
      <p className="empty-copy">{labels.playoffRounds(configuration.playoffRoundCount)}</p>
    </section>
  );
}

export function VenueManagementPanel({
  leagueId,
  venues,
  locale,
  contextSeasonId,
  labels
}: {
  leagueId: string;
  venues: readonly AdminVenue[];
  locale: string;
  contextSeasonId?: string;
  labels: {
    kicker: string;
    title: string;
    name: string;
    address: string;
    notes: string;
    create: string;
    directory: string;
    none: string;
    archived: string;
    correct: string;
    save: string;
    archive: string;
    archiveWarning: string;
    confirmArchive: string;
    archiveSummary: string;
  };
}) {
  const detailLabels = {name: labels.name, address: labels.address, notes: labels.notes};
  return (
    <section className="panel venue-admin-panel">
      <div className="panel-heading"><div><p className="panel-kicker">{labels.kicker}</p><h3>{labels.title}</h3></div></div>
      <div className="venue-admin-grid">
        <form action={createVenueAction} className="stack-form compact-form">
          <CommandFields contextSeasonId={contextSeasonId} locale={locale} />
          <input name="leagueId" type="hidden" value={leagueId} />
          <VenueDetailFields labels={detailLabels} />
          <button type="submit">{labels.create}</button>
        </form>
        <div className="venue-directory">
          <h4>{labels.directory}</h4>
          {venues.length === 0 ? <p className="empty-copy">{labels.none}</p> : (
            <div className="venue-admin-list">
              {venues.map((venue) => (
                <article className={`venue-admin-card ${venue.archivedAt ? 'archived' : ''}`} key={venue.id}>
                  <div className="venue-admin-heading"><div><strong>{venue.name}</strong><span>{venue.address}</span></div>{venue.archivedAt ? <span className="status-pill">{labels.archived}</span> : null}</div>
                  {venue.notes ? <p className="empty-copy">{venue.notes}</p> : null}
                  {!venue.archivedAt ? (
                    <>
                      <details><summary>{labels.correct}</summary><form action={updateVenueAction} className="stack-form compact-form"><CommandFields contextSeasonId={contextSeasonId} locale={locale} /><input name="venueId" type="hidden" value={venue.id} /><VenueDetailFields labels={detailLabels} venue={venue} /><button type="submit">{labels.save}</button></form></details>
                      <details><summary>{labels.archive}</summary><p className="empty-copy">{labels.archiveWarning}</p><form action={archiveVenueAction} className="archive-venue-form"><CommandFields contextSeasonId={contextSeasonId} locale={locale} /><input name="venueId" type="hidden" value={venue.id} /><button className="button-danger" type="submit">{labels.confirmArchive}</button></form></details>
                    </>
                  ) : null}
                </article>
              ))}
            </div>
          )}
          <p className="empty-copy">{labels.archiveSummary}</p>
        </div>
      </div>
    </section>
  );
}

export function TeamParticipationPanel({
  season,
  locale,
  labels
}: {
  season: AdminSeason;
  locale: string;
  labels: {
    kicker: string;
    title: string;
    names: string;
    placeholder: string;
    entrySummary: string;
    add: string;
    participating: string;
    none: string;
    remove: string;
    removalSummary: string;
  };
}) {
  return (
    <section className="panel team-setup-panel">
      <div className="panel-heading"><div><p className="panel-kicker">{labels.kicker}</p><h3>{labels.title}</h3></div><span className="status-pill">{season.teams.length}</span></div>
      <div className="team-setup-grid">
        <form action={addSeasonTeamsAction} className="stack-form compact-form">
          <CommandFields contextSeasonId={season.id} locale={locale} />
          <input name="seasonId" type="hidden" value={season.id} />
          <label><span>{labels.names}</span><textarea autoComplete="off" name="names" placeholder={labels.placeholder} required rows={5} /></label>
          <p className="empty-copy">{labels.entrySummary}</p>
          <button type="submit">{labels.add}</button>
        </form>
        <div className="participating-team-list">
          <h4>{labels.participating}</h4>
          {season.teams.length === 0 ? <p className="empty-copy">{labels.none}</p> : (
            <ul>{season.teams.map((team) => (
              <li key={team.id}><span>{team.name}</span><form action={removeSeasonTeamAction}><CommandFields contextSeasonId={season.id} locale={locale} /><input name="seasonTeamId" type="hidden" value={team.id} /><button className="button-link" type="submit">{labels.remove}</button></form></li>
            ))}</ul>
          )}
          <p className="empty-copy">{labels.removalSummary}</p>
        </div>
      </div>
    </section>
  );
}

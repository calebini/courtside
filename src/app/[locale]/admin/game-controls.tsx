import type {
  AdminCompletedGame,
  AdminGame,
  AdminVenue
} from '@/courtside/adapters/postgres/admin-dashboard-store';
import type {AdminPlayerPointEntry} from '@/courtside/adapters/postgres/player-points-dashboard-store';

import {
  cancelGameAction,
  correctGameResultAction,
  finalizeGameAction,
  forfeitGameAction,
  postponeGameAction,
  rescheduleGameAction,
  recordPlayerPointsAction,
  scheduleGameAction,
  startGameAction
} from './actions';
import {CommandFields, formatLocalInput, formatSchedule} from './admin-shared';

export interface ForfeitLabels {
  readonly forfeit: string;
  readonly forfeitGame: string;
  readonly winner: string;
  readonly optionalReason: string;
  readonly score: string;
}

export interface CompletedLabels {
  readonly auditHistory: string;
  readonly correctResult: string;
  readonly correctionReason: string;
  readonly finalStatus: string;
  readonly forfeitStatus: string;
  readonly noVenue: string;
  readonly recordedBy: string;
  readonly score: string;
  readonly versus: string;
  readonly winner: string;
}

export interface PlayerPointLabels {
  readonly summary: string;
  readonly help: string;
  readonly noEligiblePlayers: string;
  readonly points: string;
  readonly unknown: string;
  readonly provisional: string;
  readonly confirmed: string;
  readonly verification: string;
  readonly saveProvisional: string;
  readonly saveConfirmed: string;
  readonly optionalReason: string;
  readonly submit: string;
}

export function VenueFields({
  venues,
  selectedVenueId,
  instructions,
  venueLabel,
  noVenueLabel,
  instructionsLabel,
  archivedLabel
}: {
  venues: readonly AdminVenue[];
  selectedVenueId?: string | null;
  instructions?: string | null;
  venueLabel: string;
  noVenueLabel: string;
  instructionsLabel: string;
  archivedLabel: string;
}) {
  const selectableVenues = venues.filter(
    (venue) => venue.archivedAt === null || venue.id === selectedVenueId
  );
  return (
    <div className="venue-fields">
      <label>
        <span>{venueLabel}</span>
        <select defaultValue={selectedVenueId ?? ''} name="venueId">
          <option value="">{noVenueLabel}</option>
          {selectableVenues.map((venue) => (
            <option disabled={venue.archivedAt !== null} key={venue.id} value={venue.id}>
              {venue.name} — {venue.address}{venue.archivedAt ? ` (${archivedLabel})` : ''}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{instructionsLabel}</span>
        <input defaultValue={instructions ?? ''} name="venueInstructions" type="text" />
      </label>
    </div>
  );
}

export function GameSummary({
  game,
  locale,
  timeZone,
  versus,
  noVenue
}: {
  game: AdminGame;
  locale: string;
  timeZone: string;
  versus: string;
  noVenue: string;
}) {
  return (
    <div className="game-summary">
      <p className="game-matchup">
        <strong>{game.homeTeamName}</strong> {versus} <strong>{game.awayTeamName}</strong>
      </p>
      <p className="game-time">{formatSchedule(game.scheduledAt, locale, timeZone)}</p>
      <p className="venue-copy">
        {game.venueName ?? noVenue}
        {game.venueInstructions ? ` · ${game.venueInstructions}` : ''}
      </p>
    </div>
  );
}

export function ForfeitForm({
  game,
  locale,
  contextSeasonId,
  labels
}: {
  game: AdminGame;
  locale: string;
  contextSeasonId: string;
  labels: ForfeitLabels;
}) {
  return (
    <details className="result-details">
      <summary>{labels.forfeit}</summary>
      <form action={forfeitGameAction} className="stack-form compact-form">
        <CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} />
        <div className="score-row">
          <label>
            <span>{game.homeTeamName}</span>
            <input
              aria-label={`${game.homeTeamName} ${labels.score}`}
              inputMode="numeric"
              min="0"
              name="homeScore"
              required
              step="1"
              type="number"
            />
          </label>
          <span className="versus">—</span>
          <label>
            <span>{game.awayTeamName}</span>
            <input
              aria-label={`${game.awayTeamName} ${labels.score}`}
              inputMode="numeric"
              min="0"
              name="awayScore"
              required
              step="1"
              type="number"
            />
          </label>
        </div>
        <label>
          <span>{labels.winner}</span>
          <select name="winningSeasonTeamId" required>
            <option value={game.homeSeasonTeamId}>{game.homeTeamName}</option>
            <option value={game.awaySeasonTeamId}>{game.awayTeamName}</option>
          </select>
        </label>
        <label>
          <span>{labels.optionalReason}</span>
          <input name="reason" type="text" />
        </label>
        <button className="button-danger" type="submit">{labels.forfeitGame}</button>
      </form>
    </details>
  );
}

export function CompletedGameCard({
  game,
  locale,
  contextSeasonId,
  timeZone,
  labels,
  playerPoints,
  playerPointLabels
}: {
  game: AdminCompletedGame;
  locale: string;
  contextSeasonId: string;
  timeZone: string;
  labels: CompletedLabels;
  playerPoints: readonly AdminPlayerPointEntry[];
  playerPointLabels: PlayerPointLabels;
}) {
  const playerPointsByTeam = new Map<string, AdminPlayerPointEntry[]>();
  for (const entry of playerPoints) {
    const teamEntries = playerPointsByTeam.get(entry.seasonTeamId) ?? [];
    teamEntries.push(entry);
    playerPointsByTeam.set(entry.seasonTeamId, teamEntries);
  }
  return (
    <article className="game-card completed-card">
      <div className="completed-heading">
        <span className="status-pill">
          {game.status === 'forfeit' ? labels.forfeitStatus : labels.finalStatus}
        </span>
        <strong>{game.homeScore}–{game.awayScore}</strong>
      </div>
      <GameSummary
        game={game}
        locale={locale}
        noVenue={labels.noVenue}
        timeZone={timeZone}
        versus={labels.versus}
      />
      <details className="player-points-details">
        <summary>{playerPointLabels.summary}</summary>
        {playerPoints.length === 0 ? (
          <p className="empty-copy">{playerPointLabels.noEligiblePlayers}</p>
        ) : (
          <form action={recordPlayerPointsAction} className="stack-form compact-form player-points-form">
            <CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} />
            <p className="form-help">{playerPointLabels.help}</p>
            {[game.homeSeasonTeamId, game.awaySeasonTeamId].map((seasonTeamId) => {
              const teamEntries = playerPointsByTeam.get(seasonTeamId) ?? [];
              if (teamEntries.length === 0) return null;
              return (
                <fieldset className="player-points-team" key={seasonTeamId}>
                  <legend>{teamEntries[0].teamName}</legend>
                  {teamEntries.map((entry) => (
                    <label className="player-point-row" key={entry.rosterMembershipId}>
                      <input name="rosterMembershipId" type="hidden" value={entry.rosterMembershipId} />
                      <span className="player-point-name">{entry.playerName}</span>
                      <input
                        aria-label={`${entry.playerName} ${playerPointLabels.points}`}
                        defaultValue={entry.points ?? ''}
                        inputMode="numeric"
                        min="0"
                        name={`points-${entry.rosterMembershipId}`}
                        placeholder="—"
                        step="1"
                        type="number"
                      />
                      <span className={`stat-verification ${entry.verificationStatus ?? 'unknown'}`}>
                        {entry.verificationStatus === 'confirmed'
                          ? playerPointLabels.confirmed
                          : entry.verificationStatus === 'provisional'
                            ? playerPointLabels.provisional
                            : playerPointLabels.unknown}
                      </span>
                    </label>
                  ))}
                </fieldset>
              );
            })}
            <label>
              <span>{playerPointLabels.verification}</span>
              <select defaultValue="provisional" name="verificationStatus">
                <option value="provisional">{playerPointLabels.saveProvisional}</option>
                <option value="confirmed">{playerPointLabels.saveConfirmed}</option>
              </select>
            </label>
            <label>
              <span>{playerPointLabels.optionalReason}</span>
              <input name="reason" type="text" />
            </label>
            <button type="submit">{playerPointLabels.submit}</button>
          </form>
        )}
      </details>
      <details className="result-details">
        <summary>{labels.correctResult}</summary>
        <form action={correctGameResultAction} className="stack-form compact-form">
          <CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} />
          <div className="score-row">
            <label>
              <span>{game.homeTeamName}</span>
              <input
                aria-label={`${game.homeTeamName} ${labels.score}`}
                defaultValue={game.homeScore}
                min="0"
                name="homeScore"
                required
                step="1"
                type="number"
              />
            </label>
            <span className="versus">—</span>
            <label>
              <span>{game.awayTeamName}</span>
              <input
                aria-label={`${game.awayTeamName} ${labels.score}`}
                defaultValue={game.awayScore}
                min="0"
                name="awayScore"
                required
                step="1"
                type="number"
              />
            </label>
          </div>
          <label>
            <span>{labels.winner}</span>
            <select defaultValue={game.winningSeasonTeamId} name="winningSeasonTeamId" required>
              <option value={game.homeSeasonTeamId}>{game.homeTeamName}</option>
              <option value={game.awaySeasonTeamId}>{game.awayTeamName}</option>
            </select>
          </label>
          <label>
            <span>{labels.correctionReason}</span>
            <input name="reason" required type="text" />
          </label>
          <button type="submit">{labels.correctResult}</button>
        </form>
      </details>
      <details className="audit-details">
        <summary>{labels.auditHistory} ({game.audits.length})</summary>
        <ol className="audit-list">
          {game.audits.map((audit) => (
            <li key={audit.id}>
              <strong>
                {audit.previousHomeScore === null
                  ? `${audit.newHomeScore}–${audit.newAwayScore}`
                  : `${audit.previousHomeScore}–${audit.previousAwayScore} → ${audit.newHomeScore}–${audit.newAwayScore}`}
              </strong>
              <span>
                {labels.recordedBy} {audit.actorName} · {formatSchedule(audit.createdAt, locale, timeZone)}
              </span>
              {audit.reason ? <span>{audit.reason}</span> : null}
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}

export function ScheduleGamePanel({
  seasonId,
  teams,
  venues,
  locale,
  labels
}: {
  seasonId: string;
  teams: readonly {id: string; name: string}[];
  venues: readonly AdminVenue[];
  locale: string;
  labels: {
    kicker: string;
    title: string;
    homeTeam: string;
    awayTeam: string;
    scheduledTime: string;
    venue: string;
    noVenue: string;
    instructions: string;
    archived: string;
    submit: string;
    needsTeams: string;
  };
}) {
  return (
    <section className="panel schedule-panel" id="schedule-game">
      <div className="panel-heading"><div><p className="panel-kicker">{labels.kicker}</p><h3>{labels.title}</h3></div></div>
      {teams.length >= 2 ? (
        <form action={scheduleGameAction} className="stack-form compact-form">
          <CommandFields contextSeasonId={seasonId} locale={locale} />
          <input name="seasonId" type="hidden" value={seasonId} />
          <div className="participant-fields">
            <label><span>{labels.homeTeam}</span><select name="homeSeasonTeamId" required>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select></label>
            <label><span>{labels.awayTeam}</span><select defaultValue={teams[1]?.id} name="awaySeasonTeamId" required>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select></label>
          </div>
          <label><span>{labels.scheduledTime}</span><input name="scheduledAt" required type="datetime-local" /></label>
          <VenueFields
            archivedLabel={labels.archived}
            instructionsLabel={labels.instructions}
            noVenueLabel={labels.noVenue}
            venueLabel={labels.venue}
            venues={venues}
          />
          <button type="submit">{labels.submit}</button>
        </form>
      ) : <p className="empty-copy">{labels.needsTeams}</p>}
    </section>
  );
}

export function ScheduledGameCard({
  game,
  contextSeasonId,
  locale,
  timeZone,
  venues,
  labels,
  forfeitLabels
}: {
  game: AdminGame;
  contextSeasonId: string;
  locale: string;
  timeZone: string;
  venues: readonly AdminVenue[];
  labels: {
    noVenue: string;
    versus: string;
    start: string;
    postpone: string;
    postponedStatus: string;
    cancel: string;
    reschedule: string;
    newScheduledTime: string;
    venue: string;
    instructions: string;
    archived: string;
    saveReschedule: string;
    returnToSchedule: string;
  };
  forfeitLabels: ForfeitLabels;
}) {
  return (
    <article className="game-card operation-card">
      <GameSummary game={game} locale={locale} noVenue={labels.noVenue} timeZone={timeZone} versus={labels.versus} />
      <div className="button-row">
        <form action={startGameAction}><CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} /><button type="submit">{labels.start}</button></form>
        <form action={postponeGameAction}><CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} /><button className="button-secondary" type="submit">{labels.postpone}</button></form>
        <form action={cancelGameAction}><CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} /><button className="button-danger" type="submit">{labels.cancel}</button></form>
      </div>
      <details>
        <summary>{labels.reschedule}</summary>
        <form action={rescheduleGameAction} className="stack-form compact-form">
          <CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} />
          <label><span>{labels.newScheduledTime}</span><input defaultValue={formatLocalInput(game.scheduledAt, timeZone)} name="scheduledAt" required type="datetime-local" /></label>
          <VenueFields archivedLabel={labels.archived} instructions={game.venueInstructions} instructionsLabel={labels.instructions} noVenueLabel={labels.noVenue} selectedVenueId={game.venueId} venueLabel={labels.venue} venues={venues} />
          <button type="submit">{labels.saveReschedule}</button>
        </form>
      </details>
      <ForfeitForm contextSeasonId={contextSeasonId} game={game} labels={forfeitLabels} locale={locale} />
    </article>
  );
}

export function PostponedGameCard({
  game,
  contextSeasonId,
  locale,
  timeZone,
  venues,
  labels,
  forfeitLabels
}: Parameters<typeof ScheduledGameCard>[0]) {
  return (
    <article className="game-card operation-card postponed-card">
      <span className="status-pill">{labels.postponedStatus}</span>
      <GameSummary game={game} locale={locale} noVenue={labels.noVenue} timeZone={timeZone} versus={labels.versus} />
      <form action={rescheduleGameAction} className="stack-form compact-form">
        <CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} />
        <label><span>{labels.newScheduledTime}</span><input name="scheduledAt" required type="datetime-local" /></label>
        <VenueFields archivedLabel={labels.archived} instructions={game.venueInstructions} instructionsLabel={labels.instructions} noVenueLabel={labels.noVenue} selectedVenueId={game.venueId} venueLabel={labels.venue} venues={venues} />
        <button type="submit">{labels.returnToSchedule}</button>
      </form>
      <form action={cancelGameAction}><CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} /><button className="button-danger" type="submit">{labels.cancel}</button></form>
      <ForfeitForm contextSeasonId={contextSeasonId} game={game} labels={forfeitLabels} locale={locale} />
    </article>
  );
}

export function FinalizeGameCard({
  game,
  contextSeasonId,
  locale,
  timeZone,
  labels,
  forfeitLabels
}: {
  game: AdminGame;
  contextSeasonId: string;
  locale: string;
  timeZone: string;
  labels: {noVenue: string; versus: string; score: string; finalize: string};
  forfeitLabels: ForfeitLabels;
}) {
  return (
    <article className="game-card">
      <GameSummary game={game} locale={locale} noVenue={labels.noVenue} timeZone={timeZone} versus={labels.versus} />
      <form action={finalizeGameAction} className="stack-form compact-form">
        <CommandFields contextSeasonId={contextSeasonId} gameId={game.id} locale={locale} />
        <div className="score-row">
          <label><span>{game.homeTeamName}</span><input aria-label={`${game.homeTeamName} ${labels.score}`} inputMode="numeric" min="0" name="homeScore" required step="1" type="number" /></label>
          <span className="versus">{labels.versus}</span>
          <label><span>{game.awayTeamName}</span><input aria-label={`${game.awayTeamName} ${labels.score}`} inputMode="numeric" min="0" name="awayScore" required step="1" type="number" /></label>
        </div>
        <button type="submit">{labels.finalize}</button>
      </form>
      <ForfeitForm contextSeasonId={contextSeasonId} game={game} labels={forfeitLabels} locale={locale} />
    </article>
  );
}

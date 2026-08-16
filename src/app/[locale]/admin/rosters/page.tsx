import {randomUUID} from 'node:crypto';

import {getTranslations} from 'next-intl/server';

import {
  PostgresRosterDashboardStore,
  type AdminRosterMembership,
  type AdminRosterSeason
} from '@/courtside/adapters/postgres/roster-dashboard-store';
import {requireAdminSession} from '../admin-session';
import {
  addRosterMembershipAction,
  createPlayerAction,
  endRosterMembershipAction,
  renamePlayerAction,
  transferRosterMembershipAction
} from './actions';

export const dynamic = 'force-dynamic';

function CommandFields({
  locale,
  membershipId,
  playerId
}: {
  locale: string;
  membershipId?: string;
  playerId?: string;
}) {
  return (
    <>
      <input name="locale" type="hidden" value={locale} />
      <input name="commandId" type="hidden" value={randomUUID()} />
      {membershipId ? <input name="membershipId" type="hidden" value={membershipId} /> : null}
      {playerId ? <input name="playerId" type="hidden" value={playerId} /> : null}
    </>
  );
}

function formatInstant(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone
  }).format(date);
}

function resultMessageKey(result: string | undefined) {
  const keys: Record<string, string> = {
    create_player: 'playerCreated',
    rename_player: 'playerRenamed',
    add_membership: 'membershipAdded',
    end_membership: 'membershipEnded',
    transfer_membership: 'membershipTransferred',
    rejected: 'rejected',
    unexpected: 'unexpected'
  };
  return result ? keys[result] ?? null : null;
}

function MembershipCard({
  locale,
  membership,
  season,
  teamId,
  timeZone,
  labels
}: {
  locale: string;
  membership: AdminRosterMembership;
  season: AdminRosterSeason;
  teamId: string;
  timeZone: string;
  labels: {
    active: string;
    ended: string;
    endMembership: string;
    effectiveAt: string;
    from: string;
    optionalReason: string;
    saveEnd: string;
    saveTransfer: string;
    to: string;
    transfer: string;
    transferTo: string;
  };
}) {
  return (
    <article className={`roster-member ${membership.effectiveUntil ? 'roster-member-ended' : ''}`}>
      <div className="roster-member-heading">
        <strong>{membership.playerDisplayName}</strong>
        <span className="status-pill">
          {membership.effectiveUntil ? labels.ended : labels.active}
        </span>
      </div>
      <p className="membership-period">
        {labels.from} {formatInstant(membership.effectiveFrom, locale, timeZone)}
        {membership.effectiveUntil
          ? ` · ${labels.to} ${formatInstant(membership.effectiveUntil, locale, timeZone)}`
          : null}
      </p>
      {!membership.effectiveUntil ? (
        <div className="roster-member-actions">
          <details>
            <summary>{labels.transfer}</summary>
            <form action={transferRosterMembershipAction} className="stack-form compact-form">
              <CommandFields locale={locale} membershipId={membership.id} />
              <label>
                <span>{labels.transferTo}</span>
                <select name="targetSeasonTeamId" required>
                  {season.teams
                    .filter((team) => team.id !== teamId)
                    .map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
              </label>
              <label>
                <span>{labels.effectiveAt}</span>
                <input name="effectiveAt" required type="datetime-local" />
              </label>
              <label>
                <span>{labels.optionalReason}</span>
                <input name="reason" type="text" />
              </label>
              <button type="submit">{labels.saveTransfer}</button>
            </form>
          </details>
          <details>
            <summary>{labels.endMembership}</summary>
            <form action={endRosterMembershipAction} className="stack-form compact-form">
              <CommandFields locale={locale} membershipId={membership.id} />
              <label>
                <span>{labels.effectiveAt}</span>
                <input name="effectiveAt" required type="datetime-local" />
              </label>
              <label>
                <span>{labels.optionalReason}</span>
                <input name="reason" type="text" />
              </label>
              <button className="button-danger" type="submit">{labels.saveEnd}</button>
            </form>
          </details>
        </div>
      ) : null}
    </article>
  );
}

export default async function RostersPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; result?: string}>;
}) {
  const [{locale}, query, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('RosterAdmin')
  ]);
  const {pool, account} = await requireAdminSession(locale);

  const leagues = account ? await new PostgresRosterDashboardStore(pool).load(account.id) : [];
  const resultKey = resultMessageKey(query.result);
  const resultIsSuccess = query.result !== 'rejected' && query.result !== 'unexpected';
  const membershipLabels = {
    active: t('active'),
    ended: t('ended'),
    endMembership: t('endMembership'),
    effectiveAt: t('effectiveAt'),
    from: t('from'),
    optionalReason: t('optionalReason'),
    saveEnd: t('saveEnd'),
    saveTransfer: t('saveTransfer'),
    to: t('to'),
    transfer: t('transfer'),
    transferTo: t('transferTo')
  };

  return (
    <div className="admin-route roster-dashboard">
      <section className="dashboard-heading">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p className="lede">{t('summary')}</p>
      </section>

      {query.error === 'invalid_player' ? (
        <p className="notice notice-error">{t('invalidPlayer')}</p>
      ) : null}
      {query.error === 'invalid_membership' ? (
        <p className="notice notice-error">{t('invalidMembership')}</p>
      ) : null}
      {query.error === 'invalid_effective_time' ? (
        <p className="notice notice-error">{t('invalidEffectiveTime')}</p>
      ) : null}
      {resultKey ? (
        <p className={`notice ${resultIsSuccess ? 'notice-success' : 'notice-error'}`}>
          {t(resultKey)}
        </p>
      ) : null}

      {!account || leagues.length === 0 ? (
        <section className="empty-state">
          <h2>{t('noAccessTitle')}</h2>
          <p>{t('noAccessSummary')}</p>
        </section>
      ) : null}

      {leagues.map((league) => (
        <section className="league" key={league.id}>
          <div className="league-heading">
            <div>
              <p className="eyebrow">{t('league')}</p>
              <h2>{league.name}</h2>
            </div>
            <span className="timezone">{league.timezone}</span>
          </div>

          <div className="roster-command-grid">
            <section className="panel create-player-panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">{t('playerDirectory')}</p>
                  <h3>{t('createPlayer')}</h3>
                </div>
              </div>
              <form action={createPlayerAction} className="stack-form compact-form">
                <CommandFields locale={locale} />
                <input name="leagueId" type="hidden" value={league.id} />
                <label>
                  <span>{t('displayName')}</span>
                  <input maxLength={120} name="displayName" required type="text" />
                </label>
                <label>
                  <span>{t('optionalReason')}</span>
                  <input name="reason" type="text" />
                </label>
                <button type="submit">{t('createPlayer')}</button>
              </form>
            </section>

            <section className="panel add-membership-panel">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">{t('seasonParticipation')}</p>
                  <h3>{t('addMembership')}</h3>
                </div>
              </div>
              {league.players.length === 0 ? (
                <p className="empty-copy">{t('createPlayerFirst')}</p>
              ) : (
                <form action={addRosterMembershipAction} className="stack-form compact-form">
                  <CommandFields locale={locale} />
                  <label>
                    <span>{t('player')}</span>
                    <select name="playerId" required>
                      {league.players.map((player) => (
                        <option key={player.id} value={player.id}>{player.displayName}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{t('seasonTeam')}</span>
                    <select name="seasonTeamId" required>
                      {league.seasons.map((season) => (
                        <optgroup key={season.id} label={season.name}>
                          {season.teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{t('effectiveAtWithZone', {timeZone: league.timezone})}</span>
                    <input name="effectiveAt" required type="datetime-local" />
                  </label>
                  <label>
                    <span>{t('optionalReason')}</span>
                    <input name="reason" type="text" />
                  </label>
                  <button type="submit">{t('addMembership')}</button>
                </form>
              )}
            </section>
          </div>

          <section className="roster-section player-directory-section">
            <div className="section-heading">
              <div>
                <p className="panel-kicker">{t('durableIdentity')}</p>
                <h3>{t('players')}</h3>
              </div>
              <span>{league.players.length}</span>
            </div>
            {league.players.length === 0 ? <p className="empty-copy">{t('noPlayers')}</p> : null}
            <div className="player-directory-grid">
              {league.players.map((player) => (
                <article className="player-directory-card" key={player.id}>
                  <strong>{player.displayName}</strong>
                  <span>{t('identityPersists')}</span>
                  <details>
                    <summary>{t('renamePlayer')}</summary>
                    <form action={renamePlayerAction} className="stack-form compact-form">
                      <CommandFields locale={locale} playerId={player.id} />
                      <label>
                        <span>{t('displayName')}</span>
                        <input
                          defaultValue={player.displayName}
                          maxLength={120}
                          name="displayName"
                          required
                          type="text"
                        />
                      </label>
                      <label>
                        <span>{t('optionalReason')}</span>
                        <input name="reason" type="text" />
                      </label>
                      <button type="submit">{t('saveName')}</button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          </section>

          {league.seasons.map((season) => (
            <section className="roster-section" key={season.id}>
              <div className="section-heading">
                <div>
                  <p className="panel-kicker">{t('seasonRoster')}</p>
                  <h3>{season.name}</h3>
                </div>
              </div>
              <div className="team-roster-grid">
                {season.teams.map((team) => (
                  <section className="team-roster" key={team.id}>
                    <div className="team-roster-heading">
                      <h4>{team.name}</h4>
                      <span>{team.memberships.length}</span>
                    </div>
                    {team.memberships.length === 0 ? (
                      <p className="empty-copy">{t('noMemberships')}</p>
                    ) : (
                      <div className="roster-member-list">
                        {team.memberships.map((membership) => (
                          <MembershipCard
                            key={membership.id}
                            labels={membershipLabels}
                            locale={locale}
                            membership={membership}
                            season={season}
                            teamId={team.id}
                            timeZone={league.timezone}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </section>
          ))}

          <section className="roster-section audit-section">
            <div className="section-heading">
              <div>
                <p className="panel-kicker">{t('accountability')}</p>
                <h3>{t('auditHistory')}</h3>
              </div>
            </div>
            {league.audits.length === 0 ? (
              <p className="empty-copy">{t('noAuditHistory')}</p>
            ) : (
              <ol className="roster-audit-list">
                {league.audits.map((audit) => (
                  <li key={audit.id}>
                    <strong>{t(`actions.${audit.action}`)} · {audit.playerDisplayName}</strong>
                    <span>
                      {audit.actorDisplayName} · {formatInstant(audit.createdAt, locale, league.timezone)}
                    </span>
                    {audit.reason ? <span>{audit.reason}</span> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </section>
      ))}
    </div>
  );
}

'use client';

import {useMemo, useState} from 'react';

interface RequestablePlayer {
  readonly playerId: string;
  readonly displayName: string;
  readonly leagueName: string;
  readonly teamName: string | null;
  readonly seasonName: string | null;
}

export function PlayerRequestPicker({
  players,
  labels
}: {
  players: readonly RequestablePlayer[];
  labels: {
    noCurrentTeam: string;
    noMatches: string;
    search: string;
    select: string;
    startTyping: string;
  };
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredPlayers = useMemo(
    () => normalizedQuery
      ? players.filter((player) => {
        return [player.displayName, player.teamName]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery));
      })
      : [],
    [normalizedQuery, players]
  );

  return (
    <div className="player-request-picker">
      <label>
        <span>{labels.search}</span>
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          value={query}
        />
      </label>
      <fieldset>
        <legend>{labels.select}</legend>
        <div className="request-player-options">
          {filteredPlayers.map((player) => (
            <label className="request-player-option" key={player.playerId}>
              <input name="playerId" required type="radio" value={player.playerId} />
              <span>
                <strong>{player.displayName}</strong>
                <small>
                  {player.teamName && player.seasonName
                    ? `${player.teamName} · ${player.seasonName}`
                    : labels.noCurrentTeam}
                </small>
              </span>
            </label>
          ))}
          {!normalizedQuery ? <p className="empty-copy">{labels.startTyping}</p> : null}
          {normalizedQuery && filteredPlayers.length === 0
            ? <p className="empty-copy">{labels.noMatches}</p>
            : null}
        </div>
      </fieldset>
    </div>
  );
}

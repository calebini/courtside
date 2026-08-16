import type {AdminLeague, AdminSeason} from '@/courtside/adapters/postgres/admin-dashboard-store';

export interface SelectedAdminContext {
  readonly league: AdminLeague | null;
  readonly season: AdminSeason | null;
}

export function selectAdminContext(
  leagues: readonly AdminLeague[],
  requestedSeasonId?: string,
  requestedLeagueId?: string
): SelectedAdminContext {
  if (requestedSeasonId) {
    for (const league of leagues) {
      const season = league.seasons.find((candidate) => candidate.id === requestedSeasonId);
      if (season) return {league, season};
    }
  }

  const league =
    leagues.find((candidate) => candidate.id === requestedLeagueId) ??
    leagues.find((candidate) => candidate.seasons.length > 0) ??
    leagues[0] ??
    null;
  return {league, season: league?.seasons[0] ?? null};
}

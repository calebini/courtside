export interface StatkeeperAuthority {
  readonly isLeagueAdministrator: boolean;
  readonly isLeagueStatkeeper: boolean;
}

export function hasStatkeeperAccess(authority: StatkeeperAuthority) {
  return authority.isLeagueAdministrator || authority.isLeagueStatkeeper;
}

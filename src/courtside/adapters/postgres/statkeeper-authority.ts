import type {Pool, PoolClient} from 'pg';

import type {StatkeeperAuthority} from '@/courtside/core/statkeeper-authority';

/** Current domain assignments only; Auth metadata and other member roles grant no capture access. */
export async function loadStatkeeperAuthority(
  database: Pool | PoolClient,
  leagueId: string,
  accountId: string
): Promise<StatkeeperAuthority> {
  const result = await database.query<StatkeeperAuthority>(
    `select exists (
       select 1 from league_admin_assignments
        where league_id = $1 and user_account_id = $2 and revoked_at is null
     ) as "isLeagueAdministrator",
     exists (
       select 1 from league_statkeeper_assignments
        where league_id = $1 and user_account_id = $2 and revoked_at is null
     ) as "isLeagueStatkeeper"`,
    [leagueId, accountId]
  );
  return result.rows[0]!;
}

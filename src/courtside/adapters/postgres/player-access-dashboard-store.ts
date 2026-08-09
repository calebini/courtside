import type {Pool} from 'pg';

import type {PlayerManagementStatus, ProfilePhotoType} from '@/courtside/core/player-profile';

export interface ManagedPlayerView {
  readonly relationshipId: string;
  readonly status: PlayerManagementStatus;
  readonly playerId: string;
  readonly displayName: string;
  readonly leagueName: string;
  readonly profilePhotoObjectKey: string | null;
  readonly profilePhotoContentType: ProfilePhotoType | null;
}

export interface AdminPlayerAccessView {
  readonly leagueId: string;
  readonly leagueName: string;
  readonly players: readonly {id: string; displayName: string}[];
  readonly accounts: readonly {id: string; displayName: string}[];
  readonly relationships: readonly {
    id: string; playerId: string; playerDisplayName: string; accountDisplayName: string;
    status: PlayerManagementStatus; requestedAt: Date;
  }[];
}

export class PostgresPlayerAccessDashboardStore {
  constructor(private readonly pool: Pool) {}

  async hasAdministrativeAccess(accountId: string) {
    const result = await this.pool.query('select 1 from league_admin_assignments where user_account_id = $1 and revoked_at is null limit 1', [accountId]);
    return result.rowCount === 1;
  }

  async loadManagedPlayers(accountId: string): Promise<ManagedPlayerView[]> {
    const result = await this.pool.query<{
      relationship_id: string; status: PlayerManagementStatus; player_id: string;
      display_name: string; league_name: string; profile_photo_object_key: string | null;
      profile_photo_content_type: ProfilePhotoType | null;
    }>(
      `select pmr.id relationship_id, pmr.status, p.id player_id, p.display_name, l.name league_name,
              p.profile_photo_object_key, p.profile_photo_content_type
         from player_management_relationships pmr
         join players p on p.id = pmr.player_id join leagues l on l.id = p.league_id
        where pmr.user_account_id = $1 and pmr.status in ('requested', 'approved')
        order by l.name, p.display_name`, [accountId]
    );
    return result.rows.map((row) => ({relationshipId: row.relationship_id, status: row.status, playerId: row.player_id, displayName: row.display_name, leagueName: row.league_name, profilePhotoObjectKey: row.profile_photo_object_key, profilePhotoContentType: row.profile_photo_content_type}));
  }

  async loadAdmin(accountId: string): Promise<AdminPlayerAccessView[]> {
    const [leagueResult, playerResult, accountResult, relationshipResult] = await Promise.all([
      this.pool.query<{id: string; name: string}>(`select l.id, l.name from leagues l join league_admin_assignments la on la.league_id = l.id where la.user_account_id = $1 and la.revoked_at is null order by l.name`, [accountId]),
      this.pool.query<{league_id: string; id: string; display_name: string}>(`select p.league_id, p.id, p.display_name from players p join league_admin_assignments la on la.league_id = p.league_id where la.user_account_id = $1 and la.revoked_at is null order by p.display_name`, [accountId]),
      this.pool.query<{id: string; display_name: string}>(`select id, display_name from user_accounts order by display_name`),
      this.pool.query<{league_id: string; id: string; player_id: string; player_display_name: string; account_display_name: string; status: PlayerManagementStatus; requested_at: Date}>(
        `select p.league_id, pmr.id, p.id player_id, p.display_name player_display_name, ua.display_name account_display_name, pmr.status, pmr.requested_at
           from player_management_relationships pmr join players p on p.id = pmr.player_id join user_accounts ua on ua.id = pmr.user_account_id
           join league_admin_assignments la on la.league_id = p.league_id
          where la.user_account_id = $1 and la.revoked_at is null order by pmr.requested_at desc`, [accountId]
      )
    ]);
    return leagueResult.rows.map((league) => ({
      leagueId: league.id, leagueName: league.name,
      players: playerResult.rows.filter((row) => row.league_id === league.id).map((row) => ({id: row.id, displayName: row.display_name})),
      accounts: accountResult.rows.map((row) => ({id: row.id, displayName: row.display_name})),
      relationships: relationshipResult.rows.filter((row) => row.league_id === league.id).map((row) => ({id: row.id, playerId: row.player_id, playerDisplayName: row.player_display_name, accountDisplayName: row.account_display_name, status: row.status, requestedAt: row.requested_at}))
    }));
  }
}

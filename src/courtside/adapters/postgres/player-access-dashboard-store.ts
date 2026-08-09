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

export interface RequestablePlayerView {
  readonly playerId: string;
  readonly displayName: string;
  readonly leagueName: string;
  readonly teamName: string | null;
  readonly seasonName: string | null;
}

export interface AdminPlayerAccessView {
  readonly leagueId: string;
  readonly leagueName: string;
  readonly relationships: readonly {
    id: string; playerId: string; playerDisplayName: string; accountDisplayName: string;
    accountContactEmail: string | null;
    status: PlayerManagementStatus; outcome: PlayerManagementStatus | 'declined'; requestedAt: Date;
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

  async loadRequestablePlayers(accountId: string): Promise<RequestablePlayerView[]> {
    const result = await this.pool.query<{
      player_id: string;
      display_name: string;
      league_name: string;
      team_name: string | null;
      season_name: string | null;
    }>(
      `with deployment_league as (
         select id from leagues
          where (select count(*) from leagues) = 1
       )
       select p.id player_id,
              p.display_name,
              l.name league_name,
              current_roster.team_name,
              current_roster.season_name
         from players p
         join deployment_league dl on dl.id = p.league_id
         join leagues l on l.id = p.league_id
         left join lateral (
           select t.name team_name, s.name season_name
             from roster_memberships rm
             join season_teams st on st.id = rm.season_team_id
             join teams t on t.id = st.team_id
             join seasons s on s.id = rm.season_id
            where rm.player_id = p.id
              and rm.effective_until is null
            order by rm.effective_from desc
            limit 1
         ) current_roster on true
        where not exists (
          select 1
            from player_management_relationships pmr
           where pmr.player_id = p.id
             and pmr.user_account_id = $1
             and pmr.status in ('requested', 'approved')
        )
        order by p.display_name, p.id`,
      [accountId]
    );
    return result.rows.map((row) => ({
      playerId: row.player_id,
      displayName: row.display_name,
      leagueName: row.league_name,
      teamName: row.team_name,
      seasonName: row.season_name
    }));
  }

  async loadAdmin(accountId: string): Promise<AdminPlayerAccessView[]> {
    const [leagueResult, relationshipResult] = await Promise.all([
      this.pool.query<{id: string; name: string}>(`select l.id, l.name from leagues l join league_admin_assignments la on la.league_id = l.id where la.user_account_id = $1 and la.revoked_at is null order by l.name`, [accountId]),
      this.pool.query<{league_id: string; id: string; player_id: string; player_display_name: string; account_display_name: string; account_contact_email: string | null; status: PlayerManagementStatus; latest_action: string | null; requested_at: Date}>(
        `select p.league_id, pmr.id, p.id player_id, p.display_name player_display_name,
                ua.display_name account_display_name, ua.contact_email account_contact_email,
                pmr.status, pmr.requested_at,
                (select ar.action from audit_records ar
                  where ar.entity_type = 'PlayerManagementRelationship'
                    and ar.entity_id = pmr.id
                  order by ar.created_at desc, ar.id desc limit 1) latest_action
           from player_management_relationships pmr join players p on p.id = pmr.player_id join user_accounts ua on ua.id = pmr.user_account_id
           join league_admin_assignments la on la.league_id = p.league_id
          where la.user_account_id = $1 and la.revoked_at is null order by pmr.requested_at desc`, [accountId]
      )
    ]);
    return leagueResult.rows.map((league) => ({
      leagueId: league.id, leagueName: league.name,
      relationships: relationshipResult.rows.filter((row) => row.league_id === league.id).map((row) => ({
        id: row.id,
        playerId: row.player_id,
        playerDisplayName: row.player_display_name,
        accountDisplayName: row.account_display_name,
        accountContactEmail: row.account_contact_email,
        status: row.status,
        outcome: row.status === 'revoked' && row.latest_action === 'player_management.declined'
          ? 'declined'
          : row.status,
        requestedAt: row.requested_at
      }))
    }));
  }
}

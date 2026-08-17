import type {Pool} from 'pg';

export interface RoleHolderView {
  readonly assignmentId: string;
  readonly accountId: string;
  readonly displayName: string;
  readonly contactEmail: string | null;
}

export interface CaptainRoleView extends RoleHolderView {
  readonly seasonTeamId: string;
  readonly teamName: string;
}

export interface RoleAdministrationView {
  readonly administrators: readonly RoleHolderView[];
  readonly captains: readonly CaptainRoleView[];
}

export class PostgresRoleAdministrationDashboardStore {
  constructor(private readonly pool: Pool) {}

  async load(actorAccountId: string, leagueId: string, seasonId: string | null): Promise<RoleAdministrationView | null> {
    const authorized = await this.pool.query(
      `select 1 from league_admin_assignments
        where league_id = $1 and user_account_id = $2 and revoked_at is null`,
      [leagueId, actorAccountId]
    );
    if (authorized.rowCount !== 1) return null;

    const [administratorResult, captainResult] = await Promise.all([
      this.pool.query<{assignment_id: string; account_id: string; display_name: string; contact_email: string | null}>(
        `select la.id assignment_id, ua.id account_id, ua.display_name, ua.contact_email
           from league_admin_assignments la
           join user_accounts ua on ua.id = la.user_account_id
          where la.league_id = $1 and la.revoked_at is null
          order by ua.display_name, ua.id`,
        [leagueId]
      ),
      seasonId ? this.pool.query<{assignment_id: string; account_id: string; display_name: string; contact_email: string | null; season_team_id: string; team_name: string}>(
        `select tca.id assignment_id, ua.id account_id, ua.display_name, ua.contact_email,
                st.id season_team_id, t.name team_name
           from season_team_captain_assignments tca
           join user_accounts ua on ua.id = tca.user_account_id
           join season_teams st on st.id = tca.season_team_id
           join seasons s on s.id = st.season_id
           join teams t on t.id = st.team_id
          where st.season_id = $1 and s.league_id = $2 and tca.revoked_at is null
          order by t.name, st.id`,
        [seasonId, leagueId]
      ) : Promise.resolve({rows: []})
    ]);

    return {
      administrators: administratorResult.rows.map((row) => ({assignmentId: row.assignment_id, accountId: row.account_id, displayName: row.display_name, contactEmail: row.contact_email})),
      captains: captainResult.rows.map((row) => ({assignmentId: row.assignment_id, accountId: row.account_id, displayName: row.display_name, contactEmail: row.contact_email, seasonTeamId: row.season_team_id, teamName: row.team_name}))
    };
  }
}

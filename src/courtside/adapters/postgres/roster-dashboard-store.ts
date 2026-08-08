import type {Pool} from 'pg';

export interface AdminRosterPlayer {
  readonly id: string;
  readonly displayName: string;
  readonly version: number;
}

export interface AdminRosterMembership {
  readonly id: string;
  readonly playerId: string;
  readonly playerDisplayName: string;
  readonly effectiveFrom: Date;
  readonly effectiveUntil: Date | null;
  readonly version: number;
}

export interface AdminRosterTeam {
  readonly id: string;
  readonly name: string;
  readonly memberships: readonly AdminRosterMembership[];
}

export interface AdminRosterSeason {
  readonly id: string;
  readonly name: string;
  readonly teams: readonly AdminRosterTeam[];
}

export interface AdminRosterAudit {
  readonly id: string;
  readonly action: string;
  readonly playerDisplayName: string;
  readonly actorDisplayName: string;
  readonly reason: string | null;
  readonly createdAt: Date;
}

export interface AdminRosterLeague {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
  readonly players: readonly AdminRosterPlayer[];
  readonly seasons: readonly AdminRosterSeason[];
  readonly audits: readonly AdminRosterAudit[];
}

interface LeagueRow {
  id: string;
  name: string;
  timezone: string;
}

interface SeasonTeamRow {
  league_id: string;
  season_id: string;
  season_name: string;
  season_created_at: Date;
  season_team_id: string;
  team_name: string;
}

interface PlayerRow {
  league_id: string;
  id: string;
  display_name: string;
  version: number;
}

interface MembershipRow {
  league_id: string;
  season_id: string;
  season_team_id: string;
  id: string;
  player_id: string;
  display_name: string;
  effective_from: Date;
  effective_until: Date | null;
  version: number;
}

interface AuditRow {
  id: string;
  league_id: string;
  action: string;
  player_display_name: string;
  actor_display_name: string;
  reason: string | null;
  created_at: Date;
}

export class PostgresRosterDashboardStore {
  constructor(private readonly pool: Pool) {}

  async load(accountId: string): Promise<AdminRosterLeague[]> {
    const [leagueResult, seasonTeamResult, playerResult, membershipResult, auditResult] =
      await Promise.all([
        this.pool.query<LeagueRow>(
          `select l.id, l.name, l.timezone
             from league_admin_assignments laa
             join leagues l on l.id = laa.league_id
            where laa.user_account_id = $1
              and laa.revoked_at is null
            order by l.name, l.id`,
          [accountId]
        ),
        this.pool.query<SeasonTeamRow>(
          `select s.league_id,
                  s.id as season_id,
                  s.name as season_name,
                  s.created_at as season_created_at,
                  st.id as season_team_id,
                  t.name as team_name
             from league_admin_assignments laa
             join seasons s on s.league_id = laa.league_id
             join season_teams st on st.season_id = s.id
             join teams t on t.id = st.team_id
            where laa.user_account_id = $1
              and laa.revoked_at is null
            order by s.created_at desc, s.id, t.name, st.id`,
          [accountId]
        ),
        this.pool.query<PlayerRow>(
          `select p.league_id, p.id, p.display_name, p.version
             from league_admin_assignments laa
             join players p on p.league_id = laa.league_id
            where laa.user_account_id = $1
              and laa.revoked_at is null
            order by p.display_name, p.id`,
          [accountId]
        ),
        this.pool.query<MembershipRow>(
          `select p.league_id,
                  rm.season_id,
                  rm.season_team_id,
                  rm.id,
                  rm.player_id,
                  p.display_name,
                  rm.effective_from,
                  rm.effective_until,
                  rm.version
             from league_admin_assignments laa
             join players p on p.league_id = laa.league_id
             join roster_memberships rm on rm.player_id = p.id
            where laa.user_account_id = $1
              and laa.revoked_at is null
            order by rm.effective_from desc, rm.id desc`,
          [accountId]
        ),
        this.pool.query<AuditRow>(
          `select ar.id,
                  ar.league_id,
                  ar.action,
                  coalesce(direct_player.display_name, membership_player.display_name, 'Unknown Player')
                    as player_display_name,
                  actor.display_name as actor_display_name,
                  ar.reason,
                  ar.created_at
             from league_admin_assignments laa
             join audit_records ar on ar.league_id = laa.league_id
             join user_accounts actor on actor.id = ar.actor_account_id
             left join players direct_player
               on ar.entity_type = 'Player' and direct_player.id = ar.entity_id
             left join roster_memberships membership
               on ar.entity_type = 'RosterMembership' and membership.id = ar.entity_id
             left join players membership_player on membership_player.id = membership.player_id
            where laa.user_account_id = $1
              and laa.revoked_at is null
              and ar.action in (
                'player.created',
                'player.display_name_updated',
                'roster_membership.created',
                'roster_membership.ended',
                'roster_membership.transferred'
              )
            order by ar.created_at desc, ar.id desc`,
          [accountId]
        )
      ]);

    const membershipsByTeam = new Map<string, AdminRosterMembership[]>();
    for (const membership of membershipResult.rows) {
      const memberships = membershipsByTeam.get(membership.season_team_id) ?? [];
      memberships.push({
        id: membership.id,
        playerId: membership.player_id,
        playerDisplayName: membership.display_name,
        effectiveFrom: membership.effective_from,
        effectiveUntil: membership.effective_until,
        version: membership.version
      });
      membershipsByTeam.set(membership.season_team_id, memberships);
    }

    const seasonsByLeague = new Map<string, AdminRosterSeason[]>();
    const seasonIndex = new Map<string, AdminRosterSeason & {teams: AdminRosterTeam[]}>();
    for (const row of seasonTeamResult.rows) {
      let season = seasonIndex.get(row.season_id);
      if (!season) {
        season = {id: row.season_id, name: row.season_name, teams: []};
        seasonIndex.set(row.season_id, season);
        const seasons = seasonsByLeague.get(row.league_id) ?? [];
        seasons.push(season);
        seasonsByLeague.set(row.league_id, seasons);
      }
      season.teams.push({
        id: row.season_team_id,
        name: row.team_name,
        memberships: membershipsByTeam.get(row.season_team_id) ?? []
      });
    }

    const playersByLeague = new Map<string, AdminRosterPlayer[]>();
    for (const player of playerResult.rows) {
      const players = playersByLeague.get(player.league_id) ?? [];
      players.push({id: player.id, displayName: player.display_name, version: player.version});
      playersByLeague.set(player.league_id, players);
    }

    const auditsByLeague = new Map<string, AdminRosterAudit[]>();
    for (const audit of auditResult.rows) {
      const audits = auditsByLeague.get(audit.league_id) ?? [];
      audits.push({
        id: audit.id,
        action: audit.action,
        playerDisplayName: audit.player_display_name,
        actorDisplayName: audit.actor_display_name,
        reason: audit.reason,
        createdAt: audit.created_at
      });
      auditsByLeague.set(audit.league_id, audits);
    }

    return leagueResult.rows.map((league) => ({
      id: league.id,
      name: league.name,
      timezone: league.timezone,
      players: playersByLeague.get(league.id) ?? [],
      seasons: seasonsByLeague.get(league.id) ?? [],
      audits: auditsByLeague.get(league.id) ?? []
    }));
  }
}

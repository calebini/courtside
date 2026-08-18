import type {Pool} from 'pg';

import type {PlayerStatVerification} from '@/courtside/core/player-stat-line';

export interface AdminPlayerPointEntry {
  readonly rosterMembershipId: string;
  readonly playerId: string;
  readonly playerName: string;
  readonly seasonTeamId: string;
  readonly teamName: string;
  readonly points: number | null;
  readonly verificationStatus: PlayerStatVerification | null;
  readonly updatedAt: Date | null;
}

interface PlayerPointRow {
  game_id: string;
  roster_membership_id: string;
  player_id: string;
  player_name: string;
  season_team_id: string;
  team_name: string;
  points: number | null;
  verification_status: PlayerStatVerification | null;
  updated_at: Date | null;
}

export class PostgresPlayerPointsDashboardStore {
  constructor(private readonly pool: Pool) {}

  async loadForSeason(accountId: string, seasonId: string) {
    const result = await this.pool.query<PlayerPointRow>(
      `select g.id as game_id,
              rm.id as roster_membership_id,
              p.id as player_id,
              p.display_name as player_name,
              rm.season_team_id,
              t.name as team_name,
              psl.points,
              psl.verification_status,
              psl.updated_at
         from league_admin_assignments laa
         join seasons s on s.league_id = laa.league_id
         join games g on g.season_id = s.id
         join roster_memberships rm
           on rm.season_id = g.season_id
          and rm.season_team_id in (g.home_season_team_id, g.away_season_team_id)
          and rm.effective_from <= g.competition_eligibility_at
          and (rm.effective_until is null or rm.effective_until > g.competition_eligibility_at)
         join players p on p.id = rm.player_id
         join season_teams st on st.id = rm.season_team_id
         join teams t on t.id = st.team_id
         left join player_stat_lines psl
           on psl.game_id = g.id
          and psl.roster_membership_id = rm.id
        where laa.user_account_id = $1
          and laa.revoked_at is null
          and s.id = $2
          and g.status in ('final', 'forfeit')
          and g.competition_eligibility_at is not null
        order by g.scheduled_at desc, g.id, rm.season_team_id, p.display_name, p.id`,
      [accountId, seasonId]
    );

    const entriesByGame = new Map<string, AdminPlayerPointEntry[]>();
    for (const row of result.rows) {
      const entries = entriesByGame.get(row.game_id) ?? [];
      entries.push({
        rosterMembershipId: row.roster_membership_id,
        playerId: row.player_id,
        playerName: row.player_name,
        seasonTeamId: row.season_team_id,
        teamName: row.team_name,
        points: row.points,
        verificationStatus: row.verification_status,
        updatedAt: row.updated_at
      });
      entriesByGame.set(row.game_id, entries);
    }
    return entriesByGame;
  }
}

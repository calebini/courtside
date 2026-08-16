import type {Pool, PoolClient} from 'pg';

import type {
  SeasonTeamResult,
  SeasonTeamStore,
  SeasonTeamTransaction,
  StoredLeagueTeam,
  StoredSeasonTeam,
  StoredSeasonTeamReceipt,
  StoredSeasonTeamSeason
} from '@/courtside/services/manage-season-teams';

class PostgresSeasonTeamTransaction implements SeasonTeamTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredSeasonTeamReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: SeasonTeamResult;
    }>(
      `select command_type, payload_hash, result
         from command_receipts
        where command_id = $1`,
      [commandId]
    );
    const row = result.rows[0];
    return row
      ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result}
      : null;
  }

  async findSeasonForUpdate(seasonId: string): Promise<StoredSeasonTeamSeason | null> {
    const result = await this.client.query<{id: string; league_id: string}>(
      `select s.id, s.league_id
         from seasons s
         join leagues l on l.id = s.league_id
        where s.id = $1
        for update of s, l`,
      [seasonId]
    );
    const row = result.rows[0];
    return row ? {id: row.id, leagueId: row.league_id} : null;
  }

  async findSeasonTeamForUpdate(seasonTeamId: string): Promise<StoredSeasonTeam | null> {
    const result = await this.client.query<{
      id: string;
      season_id: string;
      league_id: string;
      team_id: string;
      name: string;
    }>(
      `select st.id, st.season_id, s.league_id, st.team_id, t.name
         from season_teams st
         join seasons s on s.id = st.season_id
         join leagues l on l.id = s.league_id
         join teams t on t.id = st.team_id
        where st.id = $1
        for update of st, s, l, t`,
      [seasonTeamId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          seasonId: row.season_id,
          leagueId: row.league_id,
          teamId: row.team_id,
          name: row.name
        }
      : null;
  }

  async hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string) {
    const result = await this.client.query(
      `select 1
         from league_admin_assignments
        where league_id = $1
          and user_account_id = $2
          and revoked_at is null
        limit 1`,
      [leagueId, actorAccountId]
    );
    return result.rowCount !== 0;
  }

  async findLeagueTeamsByNames(
    leagueId: string,
    names: readonly string[]
  ): Promise<readonly StoredLeagueTeam[]> {
    const identities = names.map((name) => name.toLowerCase());
    const result = await this.client.query<{id: string; name: string}>(
      `select id, name
         from teams
        where league_id = $1
          and lower(name) = any($2::text[])
        order by id
        for update`,
      [leagueId, identities]
    );
    return result.rows;
  }

  async findSeasonParticipations(seasonId: string, teamIds: readonly string[]) {
    const result = await this.client.query<{id: string; team_id: string}>(
      `select id, team_id
         from season_teams
        where season_id = $1
          and team_id = any($2::uuid[])
        order by id
        for update`,
      [seasonId, teamIds]
    );
    return new Map(result.rows.map((row) => [row.team_id, row.id]));
  }

  async insertTeam(input: {
    id: string;
    leagueId: string;
    name: string;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into teams (id, league_id, name, created_at)
       values ($1, $2, $3, $4)`,
      [input.id, input.leagueId, input.name, input.createdAt]
    );
  }

  async insertSeasonTeam(input: {
    id: string;
    seasonId: string;
    teamId: string;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into season_teams (id, season_id, team_id, created_at)
       values ($1, $2, $3, $4)`,
      [input.id, input.seasonId, input.teamId, input.createdAt]
    );
  }

  async hasSeasonTeamDependencies(seasonTeamId: string) {
    const result = await this.client.query<{has_dependencies: boolean}>(
      `select exists (
          select 1 from roster_memberships where season_team_id = $1
        ) or exists (
          select 1
            from games
           where home_season_team_id = $1
              or away_season_team_id = $1
        ) as has_dependencies`,
      [seasonTeamId]
    );
    return result.rows[0]?.has_dependencies === true;
  }

  async deleteSeasonTeam(seasonTeamId: string) {
    await this.client.query('delete from season_teams where id = $1', [seasonTeamId]);
  }

  async appendAuditRecord(input: {
    id: string;
    leagueId: string;
    actorAccountId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into audit_records
        (id, league_id, actor_account_id, action, entity_type, entity_id,
         previous_value, new_value, reason, created_at)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
      [
        input.id,
        input.leagueId,
        input.actorAccountId,
        input.action,
        input.entityType,
        input.entityId,
        JSON.stringify(input.previousValue),
        JSON.stringify(input.newValue),
        input.reason,
        input.createdAt
      ]
    );
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: SeasonTeamResult;
    createdAt: Date;
  }) {
    await this.client.query(
      `insert into command_receipts
        (command_id, command_type, payload_hash, result, created_at)
       values ($1, $2, $3, $4::jsonb, $5)`,
      [
        input.commandId,
        input.commandType,
        input.payloadHash,
        JSON.stringify(input.result),
        input.createdAt
      ]
    );
  }
}

export class PostgresSeasonTeamStore implements SeasonTeamStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: SeasonTeamTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresSeasonTeamTransaction(client));
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }
}

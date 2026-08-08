import type {Pool, PoolClient} from 'pg';

import {RuleViolation} from '@/courtside/core/errors';
import type {RosterMembershipState} from '@/courtside/core/roster';
import type {
  RosterManagementResult,
  RosterManagementStore,
  RosterManagementTransaction,
  StoredRosterLeague,
  StoredRosterMembership,
  StoredRosterPlayer,
  StoredRosterReceipt,
  StoredRosterSeasonTeam
} from '@/courtside/services/manage-roster';

class PostgresRosterManagementTransaction implements RosterManagementTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findCommandReceipt(commandId: string): Promise<StoredRosterReceipt | null> {
    const result = await this.client.query<{
      command_type: string;
      payload_hash: string;
      result: RosterManagementResult;
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

  async findLeagueForUpdate(leagueId: string): Promise<StoredRosterLeague | null> {
    const result = await this.client.query<{id: string; timezone: string}>(
      `select id, timezone from leagues where id = $1 for update`,
      [leagueId]
    );
    const row = result.rows[0];
    return row ? {id: row.id, timezone: row.timezone} : null;
  }

  async findPlayerForUpdate(playerId: string): Promise<StoredRosterPlayer | null> {
    const result = await this.client.query<{
      id: string;
      league_id: string;
      display_name: string;
      version: number;
    }>(
      `select id, league_id, display_name, version
         from players
        where id = $1
        for update`,
      [playerId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          leagueId: row.league_id,
          displayName: row.display_name,
          version: row.version
        }
      : null;
  }

  async findSeasonTeamForUpdate(seasonTeamId: string): Promise<StoredRosterSeasonTeam | null> {
    const result = await this.client.query<{
      id: string;
      season_id: string;
      league_id: string;
      timezone: string;
    }>(
      `select st.id, st.season_id, s.league_id, l.timezone
         from season_teams st
         join seasons s on s.id = st.season_id
         join leagues l on l.id = s.league_id
        where st.id = $1
        for update of st, s, l`,
      [seasonTeamId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          seasonId: row.season_id,
          leagueId: row.league_id,
          leagueTimezone: row.timezone
        }
      : null;
  }

  async findMembershipForUpdate(membershipId: string): Promise<StoredRosterMembership | null> {
    const result = await this.client.query<{
      id: string;
      player_id: string;
      player_league_id: string;
      display_name: string;
      player_version: number;
      season_id: string;
      season_team_id: string;
      effective_from: Date;
      effective_until: Date | null;
      version: number;
      timezone: string;
    }>(
      `select rm.id,
              rm.player_id,
              p.league_id as player_league_id,
              p.display_name,
              p.version as player_version,
              rm.season_id,
              rm.season_team_id,
              rm.effective_from,
              rm.effective_until,
              rm.version,
              l.timezone
         from roster_memberships rm
         join players p on p.id = rm.player_id
         join seasons s on s.id = rm.season_id
         join leagues l on l.id = s.league_id
        where rm.id = $1
        for update of rm, p, l`,
      [membershipId]
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          playerId: row.player_id,
          seasonId: row.season_id,
          seasonTeamId: row.season_team_id,
          effectiveFrom: row.effective_from,
          effectiveUntil: row.effective_until,
          version: row.version,
          leagueId: row.player_league_id,
          leagueTimezone: row.timezone,
          player: {
            id: row.player_id,
            leagueId: row.player_league_id,
            displayName: row.display_name,
            version: row.player_version
          }
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
    return result.rowCount === 1;
  }

  async hasOverlappingMembership(input: {
    playerId: string;
    seasonId: string;
    effectiveFrom: Date;
    effectiveUntil: Date | null;
    excludeMembershipId?: string;
  }) {
    const result = await this.client.query(
      `select 1
         from roster_memberships
        where player_id = $1
          and season_id = $2
          and ($5::uuid is null or id <> $5)
          and tstzrange(effective_from, coalesce(effective_until, 'infinity'::timestamptz), '[)')
              && tstzrange($3, coalesce($4, 'infinity'::timestamptz), '[)')
        limit 1`,
      [
        input.playerId,
        input.seasonId,
        input.effectiveFrom,
        input.effectiveUntil,
        input.excludeMembershipId ?? null
      ]
    );
    return result.rowCount === 1;
  }

  async insertPlayer(player: StoredRosterPlayer) {
    await this.client.query(
      `insert into players (id, league_id, display_name, version)
       values ($1, $2, $3, $4)`,
      [player.id, player.leagueId, player.displayName, player.version]
    );
  }

  async updatePlayerDisplayName(input: {
    playerId: string;
    expectedVersion: number;
    displayName: string;
  }) {
    const result = await this.client.query(
      `update players
          set display_name = $3,
              version = version + 1
        where id = $1
          and version = $2`,
      [input.playerId, input.expectedVersion, input.displayName]
    );
    if (result.rowCount !== 1) {
      throw new Error(`Player ${input.playerId} changed during display-name update`);
    }
  }

  async insertMembership(membership: RosterMembershipState) {
    try {
      await this.client.query(
        `insert into roster_memberships
          (id, player_id, season_id, season_team_id, effective_from, effective_until, version)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          membership.id,
          membership.playerId,
          membership.seasonId,
          membership.seasonTeamId,
          membership.effectiveFrom,
          membership.effectiveUntil,
          membership.version
        ]
      );
    } catch (error) {
      if ((error as {code?: string}).code === '23P01') {
        throw new RuleViolation(
          'roster_membership.no_overlap',
          'The Player already has an overlapping Roster Membership in this Season'
        );
      }
      throw error;
    }
  }

  async closeMembership(input: {
    membershipId: string;
    expectedVersion: number;
    effectiveUntil: Date;
  }) {
    const result = await this.client.query(
      `update roster_memberships
          set effective_until = $3,
              version = version + 1
        where id = $1
          and version = $2
          and effective_until is null`,
      [input.membershipId, input.expectedVersion, input.effectiveUntil]
    );
    if (result.rowCount !== 1) {
      throw new Error(`Roster Membership ${input.membershipId} changed while being closed`);
    }
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
    result: RosterManagementResult;
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

export class PostgresRosterManagementStore implements RosterManagementStore {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(work: (transaction: RosterManagementTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresRosterManagementTransaction(client));
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

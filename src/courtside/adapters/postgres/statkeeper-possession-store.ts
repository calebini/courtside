import type {Pool, PoolClient} from 'pg';

import {hasStatkeeperAccess} from '@/courtside/core/statkeeper-authority';
import type {
  StatkeeperPossessionStore, StatkeeperPossessionTransaction, StoredPossessionSession,
  SetStatkeeperPossessionResult
} from '@/courtside/services/set-statkeeper-possession';
import {loadStatkeeperAuthority} from './statkeeper-authority';
import {appendPossessionBasis, loadPossessionBasis} from './statkeeper-possession-basis';

class PostgresStatkeeperPossessionTransaction implements StatkeeperPossessionTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockCommand(commandId: string) {
    await this.client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [commandId]);
  }

  async findReceipt(commandId: string) {
    const result = await this.client.query<{command_type: string; payload_hash: string; result: SetStatkeeperPossessionResult}>(
      'select command_type, payload_hash, result from command_receipts where command_id = $1', [commandId]
    );
    const row = result.rows[0];
    return row ? {commandType: row.command_type, payloadHash: row.payload_hash, result: row.result} : null;
  }

  async lockSession(captureSessionId: string): Promise<StoredPossessionSession | null> {
    const result = await this.client.query<{
      league_id: string; working_revision_id: string; lifecycle_status: StoredPossessionSession['lifecycleStatus'];
      home_season_team_id: string; away_season_team_id: string; ledger_version: string;
    }>(
      `select session.league_id, session.working_revision_id, session.lifecycle_status,
              session.home_season_team_id, session.away_season_team_id, head.ledger_version
         from statkeeper_capture_sessions session
         join statkeeper_event_ledger_heads head on head.capture_session_id = session.id
        where session.id = $1 for update of session, head`, [captureSessionId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      captureSessionId, leagueId: row.league_id, workingRevisionId: row.working_revision_id,
      lifecycleStatus: row.lifecycle_status, ledgerVersion: Number(row.ledger_version),
      homeSeasonTeamId: row.home_season_team_id, awaySeasonTeamId: row.away_season_team_id,
      ...await loadPossessionBasis(this.client, captureSessionId, row.working_revision_id)
    };
  }

  async hasCaptureAuthority(leagueId: string, actorAccountId: string) {
    return hasStatkeeperAccess(await loadStatkeeperAuthority(this.client, leagueId, actorAccountId));
  }

  async persist(input: Parameters<StatkeeperPossessionTransaction['persist']>[0]) {
    const {session, result, command, acceptedAt} = input;
    const advanced = await this.client.query(
      `update statkeeper_event_ledger_heads set ledger_version = ledger_version + 1, updated_at = $3
        where capture_session_id = $1 and ledger_version = $2`,
      [session.captureSessionId, session.ledgerVersion, acceptedAt]
    );
    if (advanced.rowCount !== 1) throw new Error('Possession ledger changed concurrently');
    await appendPossessionBasis(this.client, {
      id: input.basisId, captureSessionId: session.captureSessionId, workingRevisionId: session.workingRevisionId,
      ledgerVersion: result.ledgerVersion, previousBasisId: session.basisId, sequences: input.sequences,
      operation: command.change.kind === 'set_current' ? 'manual_set' : 'manual_correction',
      mediaOffsetMs: command.change.mediaOffsetMs,
      actorAccountId: command.actorAccountId, reason: command.reason ?? null, createdAt: acceptedAt
    });
    const updated = await this.client.query(
      `update statkeeper_capture_sessions set lifecycle_status = $3, updated_at = $4
        where id = $1 and lifecycle_status = $2`,
      [session.captureSessionId, session.lifecycleStatus, result.lifecycleStatus, acceptedAt]
    );
    if (updated.rowCount !== 1) throw new Error('Possession Capture Session changed concurrently');
    await this.client.query(
      `insert into command_receipts (command_id, command_type, payload_hash, result, created_at)
       values ($1, 'statkeeper.possession_set', $2, $3::jsonb, $4)`,
      [command.commandId, input.payloadHash, JSON.stringify(result), acceptedAt]
    );
  }
}

export class PostgresStatkeeperPossessionStore implements StatkeeperPossessionStore {
  constructor(private readonly pool: Pool) {}
  async transaction<T>(work: (transaction: StatkeeperPossessionTransaction) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(new PostgresStatkeeperPossessionTransaction(client));
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally { client.release(); }
  }
}

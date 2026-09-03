import type {PoolClient} from 'pg';

import {normalizePossessionSequences, type StatkeeperPossessionSequence} from '@/courtside/core/statkeeper-possession';

/** Caller holds the session/head lock. No row means the initial, unknown possession basis. */
export async function loadPossessionBasis(client: PoolClient, captureSessionId: string, workingRevisionId: string) {
  const result = await client.query<{id: string; sequences: unknown}>(
    `select id, sequences from statkeeper_possession_bases
      where capture_session_id = $1 and working_revision_id = $2
      order by ledger_version desc limit 1`,
    [captureSessionId, workingRevisionId]
  );
  const row = result.rows[0];
  return {basisId: row?.id ?? null, sequences: normalizePossessionSequences(row?.sequences ?? [])};
}

export async function appendPossessionBasis(client: PoolClient, input: {
  id: string; captureSessionId: string; workingRevisionId: string; ledgerVersion: number;
  previousBasisId: string | null; sequences: readonly StatkeeperPossessionSequence[];
  operation: 'manual_set' | 'manual_correction' | 'automatic_switch' | 'occurrence_correction';
  mediaOffsetMs: number;
  actorAccountId: string; reason: string | null; createdAt: Date;
}) {
  await client.query(
    `insert into statkeeper_possession_bases
      (id, capture_session_id, working_revision_id, ledger_version, previous_basis_id,
       sequences, operation, created_by_account_id, reason, created_at, change_media_offset_ms)
     values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11)`,
    [input.id, input.captureSessionId, input.workingRevisionId, input.ledgerVersion,
      input.previousBasisId, JSON.stringify(normalizePossessionSequences(input.sequences)),
      input.operation, input.actorAccountId, input.reason, input.createdAt, input.mediaOffsetMs]
  );
}

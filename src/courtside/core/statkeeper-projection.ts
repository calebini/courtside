import {RuleViolation} from './errors';
import {statkeeperCanonicalHash, statkeeperCanonicalJson} from './statkeeper-canonical-json';
import {compareStatkeeperKeys, normalizeStatkeeperCoverage, statkeeperCoverageValue, type StatkeeperCoverageDeclaration} from './statkeeper-coverage';
import {buildStatkeeperOccurrenceLedgerRecord, normalizeStatkeeperOccurrenceInput, type StatkeeperClockAnnotation, type StatkeeperLedgerContext, type StatkeeperPeriod} from './statkeeper-event-ledger';
import {assertPossessionTeams, normalizePossessionSequences, possessionBasisValue, type StatkeeperPossessionSequence} from './statkeeper-possession';
import type {NormalizedStatkeeperProfile} from './statkeeper-profile';

export const STATKEEPER_PROJECTOR_IDENTITY = 'courtside.statkeeper.player-stat-projection/v1';

export interface StatkeeperProjectionOccurrence {
  readonly occurrenceId: string;
  readonly occurrenceRevisionId: string;
  readonly revisionNumber: number;
  readonly disposition: 'active' | 'void';
  readonly verificationState: 'recorded' | 'verified';
  readonly contentHash: string;
  readonly canonicalPayload: string;
}
export interface StatkeeperProjectionBasis {
  readonly context: StatkeeperLedgerContext & {readonly ledgerVersion: number};
  readonly workingRevisionId: string;
  readonly seasonId: string;
  readonly profile: NormalizedStatkeeperProfile;
  readonly media: {readonly provider: string; readonly providerAssetId: string};
  readonly scores: {readonly home: number; readonly away: number};
  /** Current revisions only. Superseded revisions must be excluded by the store. */
  readonly occurrences: readonly StatkeeperProjectionOccurrence[];
  readonly possession: {
    readonly basisId: string | null;
    readonly ledgerVersion: number | null;
    readonly previousBasisId: string | null;
    readonly operation: string | null;
    readonly sequences: readonly StatkeeperPossessionSequence[];
  };
  readonly coverage: {
    readonly reviewedLedgerVersion: number | null;
    readonly declarations: readonly StatkeeperCoverageDeclaration[];
  };
}

interface PayloadEvent {
  id: string; emission_ordinal: number; event_key: string; outcome_key: string; season_team_id: string; content_hash: string;
  assignments: {role_key: string; roster_membership_id: string; player_id: string; season_team_id: string}[];
  contributions: {stat_key: string; increment: number}[];
}
interface OccurrencePayload {
  format: string; capture_session_id: string; game_id: string; profile_version_id: string; profile_content_hash: string;
  media_id: string; occurrence_id: string; occurrence_revision_id: string; revision_number: number;
  previous_occurrence_revision_id?: string; correction_reason?: string | null; capture_action_key?: string;
  disposition: 'active' | 'void'; verification_state: string; recorded_by_account_id: string;
  evidence_timestamp_ms: number; evidence_window: {start_ms: number; end_ms: number} | null;
  period: StatkeeperPeriod; clock_annotation: {state: 'exact' | 'estimated' | 'unavailable'; remaining_ms: number | null; reason: string | null};
  operator_note: string | null; events: PayloadEvent[];
}
export interface StatkeeperPreviewWarning {
  readonly code: 'coverage_not_reviewed' | 'coverage_stale' | 'scoring_discrepancy' | 'clock_estimated' | 'clock_unavailable'
    | 'clock_order' | 'media_order' | 'possession_missing' | 'possession_mismatch';
  readonly occurrenceId?: string;
  readonly coverageGroupKey?: string;
  readonly seasonTeamId?: string;
}
export interface StatkeeperProjectedValue {
  readonly statKey: string;
  readonly recordedValue: number | null;
  readonly coverageStatus: 'not_recorded' | 'partial' | 'complete';
  readonly contributions: readonly {occurrenceId: string; occurrenceRevisionId: string; eventId: string; increment: number}[];
}

function invalid(message: string): never { throw new RuleViolation('statkeeper.projection.invalid_ledger', message); }
function nullable(a: number | null | undefined, b: number | null | undefined) {
  return a == null ? b == null ? 0 : 1 : b == null ? -1 : a - b;
}
function compareOccurrences(a: OccurrencePayload, b: OccurrencePayload) {
  const clockOrder = {exact: 0, estimated: 1, unavailable: 2};
  return (a.period.kind === 'regulation' ? 0 : 1) - (b.period.kind === 'regulation' ? 0 : 1)
    || a.period.ordinal - b.period.ordinal || a.evidence_timestamp_ms - b.evidence_timestamp_ms
    || nullable(a.evidence_window?.start_ms, b.evidence_window?.start_ms)
    || nullable(a.evidence_window?.end_ms, b.evidence_window?.end_ms)
    || clockOrder[a.clock_annotation.state] - clockOrder[b.clock_annotation.state]
    || nullable(a.clock_annotation.remaining_ms === null ? null : -a.clock_annotation.remaining_ms,
      b.clock_annotation.remaining_ms === null ? null : -b.clock_annotation.remaining_ms)
    || compareStatkeeperKeys(a.occurrence_id, b.occurrence_id)
    || compareStatkeeperKeys(a.occurrence_revision_id, b.occurrence_revision_id);
}

function readOccurrence(row: StatkeeperProjectionOccurrence, basis: StatkeeperProjectionBasis): OccurrencePayload {
  let payload: OccurrencePayload;
  try { payload = JSON.parse(row.canonicalPayload); } catch { invalid('Invalid occurrence JSON'); }
  if (!payload || statkeeperCanonicalHash(payload) !== row.contentHash
    || statkeeperCanonicalJson(payload) !== row.canonicalPayload
    || payload.occurrence_id !== row.occurrenceId || payload.occurrence_revision_id !== row.occurrenceRevisionId
    || payload.revision_number !== row.revisionNumber || payload.disposition !== row.disposition
    || !['active', 'void'].includes(row.disposition) || !['recorded', 'verified'].includes(row.verificationState)
    || payload.capture_session_id !== basis.context.captureSessionId || payload.game_id !== basis.context.gameId
    || payload.profile_version_id !== basis.context.profileVersionId || payload.profile_content_hash !== basis.profile.contentHash
    || payload.media_id !== basis.context.mediaId || !Array.isArray(payload.events)) invalid('Occurrence envelope or content hash mismatch');
  if (row.disposition === 'void') {
    if (payload.events.length || !payload.previous_occurrence_revision_id) invalid('Void must retain lineage without events');
    return payload;
  }
  const clock = payload.clock_annotation;
  const rebuilt = buildStatkeeperOccurrenceLedgerRecord(basis.context, payload.recorded_by_account_id, normalizeStatkeeperOccurrenceInput({
    occurrenceId: row.occurrenceId, captureActionKey: payload.capture_action_key,
    evidenceTimestampMs: payload.evidence_timestamp_ms,
    evidenceWindow: payload.evidence_window ? {startMs: payload.evidence_window.start_ms, endMs: payload.evidence_window.end_ms} : null,
    period: payload.period,
    clock: {state: clock.state, remainingMs: clock.remaining_ms, reason: clock.reason} as StatkeeperClockAnnotation,
    operatorNote: payload.operator_note,
    events: payload.events.map((event) => ({eventKey: event.event_key, outcomeKey: event.outcome_key,
      seasonTeamId: event.season_team_id, assignments: event.assignments.map((a) => ({roleKey: a.role_key, rosterMembershipId: a.roster_membership_id}))}))
  }), {revisionNumber: row.revisionNumber, previousOccurrenceRevisionId: payload.previous_occurrence_revision_id,
    correctionReason: payload.correction_reason});
  if (rebuilt.contentHash !== row.contentHash) invalid('Occurrence events differ from the immutable Profile expansion');
  if (payload.events.some((event) => event.assignments.length !== 1)) invalid('Projected Statistical Events require exactly one attributed actor');
  if (payload.capture_action_key) {
    const action = basis.profile.definition.captureActions.find((a) => a.actionKey === payload.capture_action_key);
    if (!action) invalid('Occurrence Capture Action is not in the Profile');
    const actors = new Map<string, string>();
    for (const event of payload.events) {
      const assignment = event.assignments[0]!;
      if (actors.has(assignment.role_key) && actors.get(assignment.role_key) !== assignment.player_id) invalid('An occurrence role has conflicting actors');
      actors.set(assignment.role_key, assignment.player_id);
    }
    if (!action.allowDuplicatePlayerAssignments && new Set(actors.values()).size !== actors.size) {
      invalid('Capture Action cannot assign the same Player to multiple roles');
    }
    const expected = action.eventEmissions.filter((e) => e.condition === 'always' || actors.has(e.actorRoleKey));
    if (expected.length !== payload.events.length || expected.some((e, i) => {
      const event = payload.events[i]!;
      return event.event_key !== e.eventKey || event.outcome_key !== e.outcomeKey || event.assignments[0]!.role_key !== e.actorRoleKey;
    })) invalid('Occurrence does not match its Capture Action emissions');
  }
  return payload;
}

export function projectStatkeeperRevision(basis: StatkeeperProjectionBasis) {
  const {context, profile} = basis;
  if (profile.contentHash !== context.profileContentHash) invalid('Profile snapshot hash differs from ledger');
  if (new Set(context.participants.map((p) => p.playerId)).size !== context.participants.length) invalid('Player participation must be unambiguous');
  if (new Set(basis.occurrences.map((o) => o.occurrenceId)).size !== basis.occurrences.length) invalid('Only one current revision per occurrence may be projected');
  for (const score of [basis.scores.home, basis.scores.away]) {
    if (!Number.isSafeInteger(score) || score < 0) invalid('Official scores must be nonnegative safe integers');
  }
  const declarations = normalizeStatkeeperCoverage(basis.coverage.declarations, profile);
  const sequences = normalizePossessionSequences(basis.possession.sequences);
  assertPossessionTeams(context, sequences);
  const occurrences = basis.occurrences.map((row) => ({row, payload: readOccurrence(row, basis)}))
    .sort((a, b) => compareOccurrences(a.payload, b.payload));
  const active = occurrences.filter((o) => o.row.disposition === 'active');
  const warnings: StatkeeperPreviewWarning[] = [];
  const coverageStale = basis.coverage.reviewedLedgerVersion !== null && basis.coverage.reviewedLedgerVersion !== context.ledgerVersion;
  if (coverageStale) warnings.push({code: 'coverage_stale'});
  for (const declaration of declarations) if (declaration.status === 'not_reviewed') {
    warnings.push({code: 'coverage_not_reviewed', coverageGroupKey: declaration.coverageGroupKey});
  }
  const participants = [...context.participants].sort((a, b) => compareStatkeeperKeys(a.playerId, b.playerId)
    || compareStatkeeperKeys(a.rosterMembershipId, b.rosterMembershipId));
  const values = new Map<string, Map<string, {sum: number; contributions: StatkeeperProjectedValue['contributions'][number][]}>>();
  for (const p of participants.filter((p) => p.participationStatus === 'appeared')) {
    values.set(p.playerId, new Map(profile.definition.projectedStatistics.map((s) => [s.statKey, {sum: 0, contributions: []}])));
  }
  for (const {payload} of active) {
    for (const event of payload.events) {
      const playerId = event.assignments[0]!.player_id;
      for (const contribution of event.contributions) {
        const target = values.get(playerId)?.get(contribution.stat_key);
        if (!target) invalid('Event contribution has no eligible Player/Statistic');
        if (!Number.isSafeInteger(target.sum + contribution.increment)) {
          throw new RuleViolation('statkeeper.projection.overflow', 'Projected sum exceeds the safe integer domain');
        }
        target.sum += contribution.increment;
        target.contributions.push({occurrenceId: payload.occurrence_id, occurrenceRevisionId: payload.occurrence_revision_id,
          eventId: event.id, increment: contribution.increment});
      }
    }
    if (payload.clock_annotation.state !== 'exact') warnings.push({code: payload.clock_annotation.state === 'estimated' ? 'clock_estimated' : 'clock_unavailable', occurrenceId: payload.occurrence_id});
    const at = payload.evidence_timestamp_ms;
    // At an automatic switch timestamp the causing play belongs to the preceding possession.
    const caused = sequences.find((s) => s.causingOccurrenceRevisionId === payload.occurrence_revision_id);
    const possession = caused
      ? sequences.find((s) => s.endMediaOffsetMs === at && s.sequenceId !== caused.sequenceId)
      : sequences.find((s) => s.startMediaOffsetMs <= at && (s.endMediaOffsetMs === null || s.endMediaOffsetMs > at));
    if (!possession) warnings.push({code: 'possession_missing', occurrenceId: payload.occurrence_id});
    else {
      const action = profile.definition.captureActions.find((a) => a.actionKey === payload.capture_action_key);
      if (action) {
        const mismatched = action.participantSlots.some((slot) => {
          const actor = payload.events.flatMap((e) => e.assignments).find((a) => a.role_key === slot.roleKey);
          if (!actor || slot.teamRelationship === 'either') return false;
          return (actor.season_team_id === possession.possessingSeasonTeamId) !== (slot.teamRelationship === 'possessing');
        });
        if (mismatched) warnings.push({code: 'possession_mismatch', occurrenceId: payload.occurrence_id});
      }
    }
  }
  for (let i = 1; i < active.length; i++) {
    const previous = active[i - 1]!.payload, current = active[i]!.payload;
    if (current.evidence_timestamp_ms < previous.evidence_timestamp_ms) warnings.push({code: 'media_order', occurrenceId: current.occurrence_id});
    if (previous.period.kind === current.period.kind && previous.period.ordinal === current.period.ordinal
      && previous.clock_annotation.remaining_ms !== null && current.clock_annotation.remaining_ms !== null
      && current.evidence_timestamp_ms > previous.evidence_timestamp_ms
      && current.clock_annotation.remaining_ms > previous.clock_annotation.remaining_ms) warnings.push({code: 'clock_order', occurrenceId: current.occurrence_id});
  }
  const points = profile.definition.projectedStatistics.find((s) => s.semanticRole === 'player_points')!;
  const teams = [context.homeSeasonTeamId, context.awaySeasonTeamId].sort(compareStatkeeperKeys).map((seasonTeamId) => {
    let recordedPoints = 0;
    for (const p of participants.filter((p) => p.seasonTeamId === seasonTeamId && p.participationStatus === 'appeared')) {
      recordedPoints += values.get(p.playerId)!.get(points.statKey)!.sum;
      if (!Number.isSafeInteger(recordedPoints)) throw new RuleViolation('statkeeper.projection.overflow', 'Team sum exceeds the safe integer domain');
    }
    const officialPoints = seasonTeamId === context.homeSeasonTeamId ? basis.scores.home : basis.scores.away;
    return {seasonTeamId, recordedPoints, officialPoints, matches: recordedPoints === officialPoints};
  });
  const discrepancyAcceptanceRequired = teams.some((team) => !team.matches);
  for (const team of teams.filter((t) => !t.matches)) warnings.push({code: 'scoring_discrepancy', seasonTeamId: team.seasonTeamId});
  const effectiveCoverage = declarations.map((d) => ({coverageGroupKey: d.coverageGroupKey,
    status: coverageStale || d.status === 'not_reviewed' ? 'not_reviewed' as const
      : d.coverageGroupKey === points.coverageGroupKey && discrepancyAcceptanceRequired ? 'partial' as const : d.status}));
  const playerLines = participants.filter((p) => p.participationStatus === 'appeared').map((p) => {
    const projectedValues: StatkeeperProjectedValue[] = profile.definition.projectedStatistics.map((s) => {
      const coverage = effectiveCoverage.find((d) => d.coverageGroupKey === s.coverageGroupKey)!.status;
      const folded = values.get(p.playerId)!.get(s.statKey)!;
      return {statKey: s.statKey, recordedValue: coverage === 'not_reviewed' ? null : folded.sum,
        coverageStatus: coverage === 'not_reviewed' ? 'not_recorded' : coverage, contributions: folded.contributions};
    });
    const visible = profile.definition.projectedStatistics.filter((s) => s.showOnBoxScore || s.showOnMemberGameLog);
    return {playerId: p.playerId, rosterMembershipId: p.rosterMembershipId, seasonTeamId: p.seasonTeamId,
      completeness: visible.every((s) => projectedValues.find((v) => v.statKey === s.statKey)!.coverageStatus === 'complete') ? 'complete' as const : 'partial' as const,
      verification: 'provisional' as const, values: projectedValues};
  });
  const ledgerValue = {
    capture_session_id: context.captureSessionId, working_revision_id: basis.workingRevisionId, ledger_version: context.ledgerVersion,
    game_id: context.gameId, season_id: basis.seasonId, profile_version_id: context.profileVersionId, profile_content_hash: profile.contentHash,
    media: {id: context.mediaId, provider: basis.media.provider, provider_asset_id: basis.media.providerAssetId},
    participation: participants.map((p) => ({player_id: p.playerId, roster_membership_id: p.rosterMembershipId,
      season_team_id: p.seasonTeamId, status: p.participationStatus})),
    possession: {basis_id: basis.possession.basisId, ledger_version: basis.possession.ledgerVersion,
      previous_basis_id: basis.possession.previousBasisId, operation: basis.possession.operation, sequences: possessionBasisValue(sequences)},
    occurrences: occurrences.map(({row, payload}) => ({...payload, verification_state: row.verificationState})),
    coverage_reviewed_ledger_version: basis.coverage.reviewedLedgerVersion,
    coverage: statkeeperCoverageValue(declarations),
    effective_coverage: effectiveCoverage.map((c) => ({coverage_group_key: c.coverageGroupKey, status: c.status})),
    scores: {home_season_team_id: context.homeSeasonTeamId, away_season_team_id: context.awaySeasonTeamId,
      home: basis.scores.home, away: basis.scores.away}
  };
  const ledgerBasisHash = statkeeperCanonicalHash(ledgerValue);
  const projectionValue = {ledger_basis_hash: ledgerBasisHash, projector_identity: STATKEEPER_PROJECTOR_IDENTITY,
    player_lines: playerLines.map((p) => ({player_id: p.playerId, roster_membership_id: p.rosterMembershipId, season_team_id: p.seasonTeamId,
      completeness: p.completeness, verification: p.verification,
      values: p.values.map((v) => ({stat_key: v.statKey, recorded_value: v.recordedValue, coverage_status: v.coverageStatus,
        contributions: v.contributions.map((c) => ({occurrence_id: c.occurrenceId, occurrence_revision_id: c.occurrenceRevisionId,
          event_id: c.eventId, increment: c.increment}))}))})),
    reconciliation: teams.map((t) => ({season_team_id: t.seasonTeamId, recorded_points: t.recordedPoints, official_points: t.officialPoints, matches: t.matches})),
    discrepancy_acceptance_required: discrepancyAcceptanceRequired};
  return {projector_identity: STATKEEPER_PROJECTOR_IDENTITY, ledgerVersion: context.ledgerVersion, ledgerBasisHash,
    projectionHash: statkeeperCanonicalHash(projectionValue), playerLines, teams, warnings, coverageStale,
    effectiveCoverage, discrepancyAcceptanceRequired, activeOccurrenceCount: active.length,
    readyForVerification: active.length > 0 && effectiveCoverage.every((c) => c.status !== 'not_reviewed'),
    canonicalLedgerJson: statkeeperCanonicalJson(ledgerValue), canonicalProjectionJson: statkeeperCanonicalJson(projectionValue)};
}

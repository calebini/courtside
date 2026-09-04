import {normalizeStatkeeperProfileDefinition} from '@/courtside/core/statkeeper-profile';
import {buildStatkeeperOccurrenceLedgerRecord, normalizeStatkeeperOccurrenceInput} from '@/courtside/core/statkeeper-event-ledger';
import type {StatkeeperProjectionBasis, StatkeeperProjectionOccurrence} from '@/courtside/core/statkeeper-projection';
import {statkeeperProfileFixture} from './statkeeper-profile';

export const projectionId = (n: number) => `aa000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
export function projectionBasis(): StatkeeperProjectionBasis {
  const profile = statkeeperProfileFixture();
  const normalized = normalizeStatkeeperProfileDefinition({...profile,
    coverageGroups: [...profile.coverageGroups, {coverageGroupKey: 'assists', label: {en: 'Assists', fr: 'Passes décisives'}, displayOrder: 1}],
    projectedStatistics: [...profile.projectedStatistics, {statKey: 'assists', fullLabel: {en: 'Assists', fr: 'Passes décisives'},
      shortLabel: {en: 'AST', fr: 'PDS'}, displayOrder: 1, coverageGroupKey: 'assists', aggregation: 'sum', semanticRole: null,
      showOnMemberGameLog: true, showOnBoxScore: true}],
    statisticalEvents: [...profile.statisticalEvents, {eventKey: 'assist', label: {en: 'Assist', fr: 'Passe décisive'},
      outcomes: [{outcomeKey: 'credited', label: {en: 'Credited', fr: 'Comptée'}, contributions: [{statKey: 'assists', increment: 1}]}]}],
    captureActions: [...profile.captureActions, {...profile.captureActions[0]!, actionKey: 'assisted_two', displayOrder: 2,
      participantSlots: [...profile.captureActions[0]!.participantSlots, {roleKey: 'assister', label: {en: 'Assister', fr: 'Passeur'},
        presence: 'required', teamRelationship: 'possessing', primary: false}],
      eventEmissions: [...profile.captureActions[0]!.eventEmissions, {eventKey: 'assist', outcomeKey: 'credited', actorRoleKey: 'assister', condition: 'always'}]}]
  });
  return {
    context: {captureSessionId: projectionId(1), gameId: projectionId(2), profileVersionId: projectionId(3), mediaId: projectionId(4),
      homeSeasonTeamId: projectionId(5), awaySeasonTeamId: projectionId(6), ledgerVersion: 4,
      profileContentHash: normalized.contentHash, regulationPeriodCount: 4, regulationPeriodDurationMs: 600000, overtimePeriodDurationMs: 300000,
      eventDefinitions: normalized.eventDefinitions,
      participants: [
        {playerId: projectionId(11), rosterMembershipId: projectionId(21), seasonTeamId: projectionId(5), participationStatus: 'appeared'},
        {playerId: projectionId(12), rosterMembershipId: projectionId(22), seasonTeamId: projectionId(5), participationStatus: 'appeared'},
        {playerId: projectionId(13), rosterMembershipId: projectionId(23), seasonTeamId: projectionId(6), participationStatus: 'appeared'},
        {playerId: projectionId(14), rosterMembershipId: projectionId(24), seasonTeamId: projectionId(6), participationStatus: 'did_not_play'},
        {playerId: projectionId(15), rosterMembershipId: projectionId(25), seasonTeamId: projectionId(5), participationStatus: 'appeared'}]},
    workingRevisionId: projectionId(7), seasonId: projectionId(8), profile: normalized,
    media: {provider: 'youtube', providerAssetId: 'fixture'}, scores: {home: 2, away: 0}, occurrences: [],
    possession: {basisId: projectionId(9), ledgerVersion: 2, previousBasisId: null, operation: 'manual_set', sequences: [{sequenceId: projectionId(10),
      possessingSeasonTeamId: projectionId(5), startMediaOffsetMs: 0, endMediaOffsetMs: null, endingReasonKey: null, transitionKind: 'manual',
      causingOccurrenceId: null, causingOccurrenceRevisionId: null}]},
    coverage: {reviewedLedgerVersion: 4, declarations: [{coverageGroupKey: 'scoring', status: 'complete', gaps: []}, {coverageGroupKey: 'assists', status: 'complete', gaps: []}]}
  };
}

export function projectionOccurrence(basis: StatkeeperProjectionBasis, options: {
  id?: number; shooter?: number; assisted?: boolean; revision?: number; previous?: string; timestamp?: number; remaining?: number; note?: string;
} = {}): StatkeeperProjectionOccurrence {
  const record = buildStatkeeperOccurrenceLedgerRecord(basis.context, projectionId(30), normalizeStatkeeperOccurrenceInput({
    occurrenceId: projectionId(options.id ?? 40), captureActionKey: options.assisted ? 'assisted_two' : 'made_two',
    period: {kind: 'regulation', ordinal: 1}, clock: {state: 'exact', remainingMs: options.remaining ?? 550000},
    evidenceTimestampMs: options.timestamp ?? 50000, evidenceWindow: null, operatorNote: options.note ?? null,
    events: [{eventKey: 'two_point_shot', outcomeKey: 'made', seasonTeamId: projectionId(5),
      assignments: [{roleKey: 'shooter', rosterMembershipId: projectionId(options.shooter ?? 21)}]},
    ...(options.assisted ? [{eventKey: 'assist', outcomeKey: 'credited', seasonTeamId: projectionId(5),
      assignments: [{roleKey: 'assister', rosterMembershipId: projectionId(22)}]}] : [])]
  }), {revisionNumber: options.revision ?? 1, previousOccurrenceRevisionId: options.previous ?? null});
  return {...record, verificationState: 'recorded'};
}

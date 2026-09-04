import {describe, expect, it} from 'vitest';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';
import {normalizeStatkeeperCoverage, statkeeperCoverageValue} from '@/courtside/core/statkeeper-coverage';
import {buildStatkeeperVoidRevision} from '@/courtside/core/statkeeper-event-ledger';
import {projectStatkeeperRevision, STATKEEPER_PROJECTOR_IDENTITY} from '@/courtside/core/statkeeper-projection';
import {projectionBasis, projectionId, projectionOccurrence} from '../fixtures/statkeeper-projection';
import canonicalFixture from '../fixtures/statkeeper-projection-canonical.json';
import {normalizeStatkeeperProfileDefinition} from '@/courtside/core/statkeeper-profile';

describe('Statkeeper review coverage and projection', () => {
  it('matches published canonical JSON, UTF-8 bytes and digests including normalized French and escaping', () => {
    for (const explanation of ['Séquence "floue" \\ caméra\n\tfin', 'Se\u0301quence "floue" \\ came\u0301ra\n\tfin']) {
      const basis = projectionBasis();
      const result = projectStatkeeperRevision({...basis, context: {...basis.context, participants: []}, scores: {home: 0, away: 0},
        possession: {basisId: null, ledgerVersion: null, previousBasisId: null, operation: null, sequences: []},
        coverage: {reviewedLedgerVersion: 4, declarations: [
          {coverageGroupKey: 'scoring', status: 'partial', gaps: [{reasonKey: 'other', explanation, period: null, clockRange: null, mediaRange: null}]},
          {coverageGroupKey: 'assists', status: 'complete', gaps: []}]}});
      expect(result.projector_identity).toBe(canonicalFixture.projector_identity);
      expect(result.canonicalLedgerJson).toBe(canonicalFixture.ledger.json);
      expect(Buffer.from(result.canonicalLedgerJson, 'utf8').toString('hex')).toBe(canonicalFixture.ledger.utf8Hex);
      expect(result.ledgerBasisHash).toBe(canonicalFixture.ledger.sha256);
      expect(result.canonicalProjectionJson).toBe(canonicalFixture.projection.json);
      expect(Buffer.from(result.canonicalProjectionJson, 'utf8').toString('hex')).toBe(canonicalFixture.projection.utf8Hex);
      expect(result.projectionHash).toBe(canonicalFixture.projection.sha256);
    }
  });

  it('rejects an overflowing aggregate even when each event increment is valid', () => {
    const basis = projectionBasis();
    const profile = normalizeStatkeeperProfileDefinition({...basis.profile.definition,
      statisticalEvents: basis.profile.definition.statisticalEvents.map((e) => e.eventKey === 'two_point_shot'
        ? {...e, outcomes: e.outcomes.map((o) => o.outcomeKey === 'made' ? {...o, contributions: [{statKey: 'points', increment: Number.MAX_SAFE_INTEGER}]} : o)} : e)});
    const input = {...basis, profile, context: {...basis.context, profileContentHash: profile.contentHash, eventDefinitions: profile.eventDefinitions}};
    expect(() => projectStatkeeperRevision({...input, occurrences: [projectionOccurrence(input), projectionOccurrence(input, {id: 41})]})).toThrow('safe integer');
  });
  it('attributes a compound occurrence, moves corrected points, preserves assists, and excludes DNP', () => {
    const basis = projectionBasis();
    const first = projectionOccurrence(basis, {assisted: true});
    const preview = projectStatkeeperRevision({...basis, occurrences: [first]});
    expect(preview.projector_identity).toBe(STATKEEPER_PROJECTOR_IDENTITY);
    expect(preview.playerLines).toHaveLength(4);
    expect(preview.playerLines[0]!.values[0]).toMatchObject({recordedValue: 2, coverageStatus: 'complete',
      contributions: [{occurrenceRevisionId: first.occurrenceRevisionId}]});
    expect(preview.playerLines[1]!.values[1]).toMatchObject({recordedValue: 1, coverageStatus: 'complete'});
    expect(preview.playerLines[2]!.values[0]).toMatchObject({recordedValue: 0, coverageStatus: 'complete'});
    const corrected = projectionOccurrence(basis, {assisted: true, shooter: 25, revision: 2, previous: first.occurrenceRevisionId});
    const next = projectStatkeeperRevision({...basis, occurrences: [corrected]});
    expect(next.playerLines[0]!.values[0].recordedValue).toBe(0);
    expect(next.playerLines[1]!.values.map((v) => v.recordedValue)).toEqual([0, 1]);
    expect(next.playerLines[3]!.values[0]).toMatchObject({recordedValue: 2, contributions: [{occurrenceRevisionId: corrected.occurrenceRevisionId}]});
    expect(next.projectionHash).not.toBe(preview.projectionHash);
    expect(() => projectStatkeeperRevision({...basis, occurrences: [first, corrected]})).toThrow('current revision');
  });

  it('void preserves hashed lineage but removes all contributions', () => {
    const basis = projectionBasis(), first = projectionOccurrence(basis);
    const voided = buildStatkeeperVoidRevision({context: basis.context, actorAccountId: projectionId(30),
      current: {...first, previousOccurrenceRevisionId: null, events: []}, revisionNumber: 2, reason: 'Erreur'});
    const result = projectStatkeeperRevision({...basis, scores: {home: 0, away: 0}, occurrences: [{...voided, verificationState: 'recorded'}]});
    expect(result.activeOccurrenceCount).toBe(0);
    expect(result.playerLines[0]!.values[0]).toEqual({statKey: 'points', recordedValue: 0, coverageStatus: 'complete', contributions: []});
    expect(result.canonicalLedgerJson).toContain(first.occurrenceRevisionId);
    expect(result.readyForVerification).toBe(false);
  });

  it('distinguishes unreviewed/stale unknowns, complete zero, and partial totals with scoring discrepancies', () => {
    const basis = projectionBasis(), occurrence = projectionOccurrence(basis);
    const result = projectStatkeeperRevision({...basis, occurrences: [occurrence], scores: {home: 80, away: 70}});
    expect(result.discrepancyAcceptanceRequired).toBe(true);
    expect(result.playerLines[0]!.values[0]).toMatchObject({recordedValue: 2, coverageStatus: 'partial'});
    expect(result.playerLines[0]!.values[1]).toMatchObject({recordedValue: 0, coverageStatus: 'complete'});
    const stale = projectStatkeeperRevision({...basis, occurrences: [occurrence], context: {...basis.context, ledgerVersion: 5}});
    expect(stale.coverageStale).toBe(true);
    expect(stale.readyForVerification).toBe(false);
    expect(stale.playerLines[0]!.values[0]).toMatchObject({recordedValue: null, coverageStatus: 'not_recorded'});
    expect(stale.teams[0]!.recordedPoints).toBe(2);
    const partial = projectStatkeeperRevision({...basis, occurrences: [occurrence], coverage: {...basis.coverage, declarations: [
      {coverageGroupKey: 'scoring', status: 'partial', gaps: [{reasonKey: 'missing_video', explanation: null, period: null, clockRange: null, mediaRange: null}]},
      {coverageGroupKey: 'assists', status: 'not_reviewed', gaps: []}]}});
    expect(partial.playerLines[0]!.values.map((v) => [v.recordedValue, v.coverageStatus])).toEqual([[2, 'partial'], [null, 'not_recorded']]);
  });

  it('is independent of storage order and hashes the complete possession, media, coverage, and score basis', () => {
    const basis = projectionBasis(), a = projectionOccurrence(basis), b = projectionOccurrence(basis, {id: 41, timestamp: 60000, remaining: 540000});
    const input = {...basis, occurrences: [a, b]};
    const first = projectStatkeeperRevision(input);
    const reordered = projectStatkeeperRevision({...input, occurrences: [b, a], context: {...basis.context, participants: [...basis.context.participants].reverse()},
      coverage: {...basis.coverage, declarations: [...basis.coverage.declarations].reverse()}});
    expect(reordered.projectionHash).toBe(first.projectionHash);
    const possession = {...basis.possession, sequences: [{...basis.possession.sequences[0]!, endMediaOffsetMs: 70000, endingReasonKey: 'manual_switch'},
      {...basis.possession.sequences[0]!, sequenceId: projectionId(50), startMediaOffsetMs: 70000, possessingSeasonTeamId: projectionId(6)}]};
    const closed = projectStatkeeperRevision({...input, possession});
    const changedClosed = projectStatkeeperRevision({...input, possession: {...possession, sequences: [{...possession.sequences[0]!, endingReasonKey: 'review_correction'}, possession.sequences[1]!]}});
    expect(closed.playerLines).toEqual(changedClosed.playerLines);
    expect(closed.ledgerBasisHash).not.toBe(changedClosed.ledgerBasisHash);
    for (const changed of [{...input, media: {...basis.media, providerAssetId: 'other'}}, {...input, scores: {home: 81, away: 70}}]) {
      expect(projectStatkeeperRevision(changed).projectionHash).not.toBe(first.projectionHash);
    }
  });

  it('orders occurrences by time before identity and returns clock and possession warnings', () => {
    const basis = projectionBasis();
    const earlier = projectionOccurrence(basis, {id: 42, timestamp: 30000, remaining: 500000});
    const later = projectionOccurrence(basis, {id: 40, timestamp: 60000, remaining: 550000});
    const preview = projectStatkeeperRevision({...basis, occurrences: [later, earlier], possession: {...basis.possession, sequences: []}});
    expect(preview.playerLines[0]!.values[0].contributions.map((c) => c.occurrenceId)).toEqual([earlier.occurrenceId, later.occurrenceId]);
    expect(preview.warnings).toContainEqual({code: 'clock_order', occurrenceId: later.occurrenceId});
    expect(preview.warnings.filter((w) => w.code === 'possession_missing')).toHaveLength(2);
  });

  it('rejects altered content, invalid contributions, and unresolved or DNP assignments', () => {
    const basis = projectionBasis(), occurrence = projectionOccurrence(basis);
    expect(() => projectStatkeeperRevision({...basis, occurrences: [{...occurrence, contentHash: '0'.repeat(64)}]})).toThrow('hash mismatch');
    expect(() => projectStatkeeperRevision({...basis, occurrences: [occurrence], context: {...basis.context, participants: basis.context.participants.map((p) =>
      p.playerId === projectionId(11) ? {...p, participationStatus: 'did_not_play'} : p)}})).toThrow('appeared');
    const payload = JSON.parse(occurrence.canonicalPayload);
    payload.events[0].contributions[0].increment = 3;
    expect(() => projectStatkeeperRevision({...basis, occurrences: [{...occurrence, canonicalPayload: JSON.stringify(payload), contentHash: statkeeperCanonicalHash(payload)}]})).toThrow('expansion');
  });

  it('canonicalizes NFC reasons and gap order without merging overlapping ranges', () => {
    const {profile} = projectionBasis();
    const gap = {reasonKey: 'other', explanation: '  Se\u0301quence "floue" \\ caméra\n  ', period: {kind: 'regulation', ordinal: 1},
      clockRange: {startMs: 550000, endMs: 500000}, mediaRange: {startMs: 1000, endMs: 3000}};
    const raw = [{coverageGroupKey: 'scoring', status: 'partial', gaps: [gap, {...gap, mediaRange: {startMs: 2000, endMs: 4000}}]},
      {coverageGroupKey: 'assists', status: 'complete', gaps: []}];
    const first = normalizeStatkeeperCoverage(raw, profile);
    expect(first[1]!.gaps).toHaveLength(2);
    expect(first[1]!.gaps[0]!.explanation).toBe('Séquence "floue" \\ caméra');
    const second = normalizeStatkeeperCoverage([...raw].reverse().map((r) => ({...r, gaps: [...r.gaps].reverse()})), profile);
    expect(statkeeperCanonicalHash(statkeeperCoverageValue(second))).toBe(statkeeperCanonicalHash(statkeeperCoverageValue(first)));
    expect(() => normalizeStatkeeperCoverage([{...raw[0], gaps: [gap, {...gap, explanation: 'Séquence "floue" \\ caméra'}]}, raw[1]], profile)).toThrow('Duplicate');
    expect(() => normalizeStatkeeperCoverage([{...raw[0], gaps: [{...gap, period: null}]}, raw[1]], profile)).toThrow('requires its Period');
    expect(() => normalizeStatkeeperCoverage([raw[0]], profile)).toThrow('Every Profile');
    expect(() => normalizeStatkeeperCoverage([{...raw[0], status: 'complete'}, raw[1]], profile)).toThrow('Only partial');
    expect(() => normalizeStatkeeperCoverage([{...raw[0], gaps: [{...gap, explanation: ' '}]}, raw[1]], profile)).toThrow('explanatory text');
    expect(() => normalizeStatkeeperCoverage([{...raw[0], gaps: [{...gap, explanation: '\ud800'}]}, raw[1]], profile)).toThrow('surrogate');
  });
});

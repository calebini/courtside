import {describe, expect, it} from 'vitest';

import {
  correctPossessionBasis, normalizePossessionSequences, possessionBasisHash, possessionBasisValue,
  setCurrentPossession, type StatkeeperPossessionSequence
} from '@/courtside/core/statkeeper-possession';

const id = (suffix: number) => `fa000000-0000-4000-8000-${suffix.toString().padStart(12, '0')}`;
const context = {homeSeasonTeamId: id(1), awaySeasonTeamId: id(2)};
const initial: StatkeeperPossessionSequence = {
  sequenceId: id(3), possessingSeasonTeamId: id(1), startMediaOffsetMs: 0,
  endMediaOffsetMs: null, endingReasonKey: null, transitionKind: 'manual',
  causingOccurrenceId: null, causingOccurrenceRevisionId: null
};
const automaticCause = {occurrenceId: id(5), occurrenceRevisionId: id(6)};
function switched() {
  return setCurrentPossession({context, sequences: [initial], sequenceId: id(4), seasonTeamId: id(2), mediaOffsetMs: 42_000, automaticCause});
}

describe('Statkeeper canonical possession basis', () => {
  it('starts, closes, and switches without mutating input or losing explicit provenance', () => {
    const empty: StatkeeperPossessionSequence[] = [];
    const first = setCurrentPossession({context, sequences: empty, sequenceId: id(3), seasonTeamId: id(1), mediaOffsetMs: 0});
    expect(first).toEqual([initial]);
    expect(empty).toEqual([]);
    const next = switched();
    expect(next[0]).toEqual({...initial, endMediaOffsetMs: 42_000, endingReasonKey: 'automatic_switch'});
    expect(next[1]).toMatchObject({sequenceId: id(4), transitionKind: 'automatic', causingOccurrenceId: id(5), causingOccurrenceRevisionId: id(6)});
    expect(initial.endMediaOffsetMs).toBeNull();
  });

  it('orders by offset/identity and preserves all fields in the versioned canonical hash', () => {
    const basis = switched();
    expect(normalizePossessionSequences([...basis].reverse())).toEqual(basis);
    expect(possessionBasisHash([...basis].reverse())).toBe(possessionBasisHash(basis));
    expect(possessionBasisValue([initial])).toEqual([{
      sequence_id: id(3), possessing_season_team_id: id(1), start_media_offset_ms: 0,
      end_media_offset_ms: null, ending_reason_key: null, transition_kind: 'manual',
      causing_occurrence_id: null, causing_occurrence_revision_id: null
    }]);
    // Fixed fixture: changes to the basis format/byte contract must be deliberate.
    expect(possessionBasisHash([])).toBe('3b9fd62662f80febf81096f78fced3a801caba64082261df8040904077e96365');
    const changes = [
      {...basis[0], sequenceId: id(8)},
      {...basis[0], possessingSeasonTeamId: id(2)},
      {...basis[0], startMediaOffsetMs: 1},
      {...basis[0], endMediaOffsetMs: 41_999},
      {...basis[0], endingReasonKey: 'manual_switch'},
      {...basis[0], endingReasonKey: null},
      {...basis[0], transitionKind: 'automatic' as const, causingOccurrenceId: id(5), causingOccurrenceRevisionId: id(6)}
    ];
    for (const changed of changes) expect(possessionBasisHash([changed, basis[1]])).not.toBe(possessionBasisHash(basis));
    for (const change of [{causingOccurrenceId: id(9)}, {causingOccurrenceRevisionId: id(9)}]) {
      expect(possessionBasisHash([basis[0], {...basis[1], ...change}])).not.toBe(possessionBasisHash(basis));
    }
  });

  it('allows gaps, closed-only/unknown bases and immediate switches at the same timestamp', () => {
    const first = setCurrentPossession({context, sequences: [initial], sequenceId: id(4), seasonTeamId: id(2), mediaOffsetMs: 0});
    // ID sorts before the earlier closure: chronology must not depend on random ID order.
    const second = setCurrentPossession({context, sequences: first, sequenceId: id(0), seasonTeamId: id(1), mediaOffsetMs: 0});
    const third = setCurrentPossession({context, sequences: second, sequenceId: id(8), seasonTeamId: id(2), mediaOffsetMs: 100});
    expect(third).toHaveLength(4);
    expect(normalizePossessionSequences([{...initial, endMediaOffsetMs: 100}, {...initial, sequenceId: id(4), startMediaOffsetMs: 200}])).toHaveLength(2);
    expect(correctPossessionBasis({context, previous: [initial], replacement: []})).toEqual([]);
    expect(normalizePossessionSequences([{...initial, endMediaOffsetMs: 100}])).toHaveLength(1);
  });

  it.each([
    [{...initial, startMediaOffsetMs: -1}],
    [{...initial, startMediaOffsetMs: 1.5}],
    [{...initial, startMediaOffsetMs: Number.MAX_SAFE_INTEGER + 1}],
    [{...initial, startMediaOffsetMs: 2, endMediaOffsetMs: 1}],
    [{...initial, endingReasonKey: 'open_cannot_end'}],
    [{...initial, transitionKind: 'invented'}],
    [{...initial, causingOccurrenceId: id(5)}],
    [{...initial, transitionKind: 'automatic'}],
    [{...initial, endMediaOffsetMs: 1, endingReasonKey: 'Not canonical'}],
    [initial, initial],
    [initial, {...initial, sequenceId: id(4)}],
    [{...initial, endMediaOffsetMs: 100}, {...initial, sequenceId: id(4), startMediaOffsetMs: 99}],
    [{...initial, endMediaOffsetMs: 100}, {...initial, sequenceId: id(4), startMediaOffsetMs: 99, endMediaOffsetMs: 150}]
  ])('rejects malformed or overlapping sequence basis %#', (...sequences) => {
    expect(() => normalizePossessionSequences(sequences)).toThrow();
  });

  it('rejects no-op and retroactive switches; historical changes must be explicit corrections', () => {
    expect(() => setCurrentPossession({context, sequences: [initial], sequenceId: id(7), seasonTeamId: id(1), mediaOffsetMs: 1})).toThrow(/already/);
    expect(() => setCurrentPossession({context, sequences: switched(), sequenceId: id(7), seasonTeamId: id(1), mediaOffsetMs: 41_999})).toThrow();
    expect(() => setCurrentPossession({context, sequences: [], sequenceId: id(7), seasonTeamId: id(1), mediaOffsetMs: 0, automaticCause})).toThrow(/established/);
    expect(() => setCurrentPossession({context, sequences: [], sequenceId: id(7), seasonTeamId: id(9), mediaOffsetMs: 0})).toThrow(/participating/);
    expect(() => correctPossessionBasis({context, previous: [initial], replacement: [initial]})).toThrow(/change/);
  });

  it('retains automatic provenance only for an unchanged start/cause; manual overrides cannot fabricate it', () => {
    const previous = switched();
    for (const change of [
      {sequenceId: id(7)}, {possessingSeasonTeamId: id(1)}, {startMediaOffsetMs: 42_001},
      {causingOccurrenceId: id(8)}, {causingOccurrenceRevisionId: id(8)}
    ]) {
      expect(() => correctPossessionBasis({context, previous, replacement: [previous[0], {...previous[1], ...change}]})).toThrow(/provenance/);
    }
    const replacement = [previous[0], {...previous[1], startMediaOffsetMs: 43_000, transitionKind: 'manual' as const,
      causingOccurrenceId: null, causingOccurrenceRevisionId: null}];
    expect(correctPossessionBasis({context, previous, replacement})).toEqual(replacement);
    // Closing an unchanged automatically-started interval preserves its actual start cause.
    expect(correctPossessionBasis({context, previous, replacement: [previous[0], {...previous[1], endMediaOffsetMs: 50_000, endingReasonKey: 'manual_switch'}]})).toHaveLength(2);
  });
});

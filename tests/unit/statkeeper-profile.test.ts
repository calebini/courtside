import {describe, expect, it} from 'vitest';

import {
  assertStatkeeperProfileLineageCompatibility,
  normalizeStatkeeperProfileDefinition
} from '@/courtside/core/statkeeper-profile';
import {statkeeperProfileFixture} from '../fixtures/statkeeper-profile';

describe('Statkeeper Profile Version', () => {
  it('normalizes localized declarative rules and compiles the ledger vocabulary', () => {
    const input = statkeeperProfileFixture();
    const normalized = normalizeStatkeeperProfileDefinition({
      ...input,
      statisticalEvents: [{
        ...input.statisticalEvents[0]!,
        label: {en: '  Two-point shot ', fr: ' Tir à deux points '}
      }]
    });

    expect(normalized.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(normalized.definition.statisticalEvents[0]!.label.fr).toBe('Tir à deux points');
    expect(normalized.eventDefinitions).toEqual([{
      eventKey: 'two_point_shot',
      participantRoleKeys: ['shooter'],
      outcomes: [
        {outcomeKey: 'made', contributions: [{statKey: 'points', increment: 2}]},
        {outcomeKey: 'missed', contributions: []}
      ]
    }]);
    expect(normalized.coverageGroupKeys).toEqual(['scoring']);
  });

  it('rejects executable/formula fields and unsupported projection primitives', () => {
    const input = statkeeperProfileFixture();
    expect(() => normalizeStatkeeperProfileDefinition({
      ...input,
      formula: 'made * 2'
    })).toThrow(/not a supported profile primitive/);
    expect(() => normalizeStatkeeperProfileDefinition({
      ...input,
      projectedStatistics: [{...input.projectedStatistics[0]!, aggregation: 'average'}]
    })).toThrow(/aggregation is unsupported/);
  });

  it('requires one points semantic and rejects broken profile references', () => {
    const input = statkeeperProfileFixture();
    expect(() => normalizeStatkeeperProfileDefinition({
      ...input,
      projectedStatistics: [{...input.projectedStatistics[0]!, semanticRole: null}]
    })).toThrow(/Exactly one projected Statistic/);
    expect(() => normalizeStatkeeperProfileDefinition({
      ...input,
      statisticalEvents: [{
        ...input.statisticalEvents[0]!,
        outcomes: [{
          ...input.statisticalEvents[0]!.outcomes[0]!,
          contributions: [{statKey: 'unknown', increment: 1}]
        }]
      }]
    })).toThrow(/unknown Statistic/);
  });

  it('allows relabeling established keys but rejects changing their behavior', () => {
    const prior = normalizeStatkeeperProfileDefinition(statkeeperProfileFixture());
    const fixture = statkeeperProfileFixture();
    const relabeled = {
      ...fixture,
      captureActions: [
        {...fixture.captureActions[0]!, label: {en: 'Basket for two', fr: 'Panier à deux points'}},
        ...fixture.captureActions.slice(1)
      ]
    };
    expect(() => assertStatkeeperProfileLineageCompatibility(
      [prior],
      normalizeStatkeeperProfileDefinition(relabeled)
    )).not.toThrow();

    const changed = {
      ...fixture,
      captureActions: [
        {...fixture.captureActions[0]!, possessionEffect: 'switch' as const},
        ...fixture.captureActions.slice(1)
      ]
    };
    expect(() => assertStatkeeperProfileLineageCompatibility(
      [prior],
      normalizeStatkeeperProfileDefinition(changed)
    )).toThrow(/changes established behavior/);
  });
});

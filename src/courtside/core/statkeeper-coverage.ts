import {RuleViolation} from './errors';
import {statkeeperCanonicalJson} from './statkeeper-canonical-json';
import type {StatkeeperPeriod} from './statkeeper-event-ledger';
import type {NormalizedStatkeeperProfile} from './statkeeper-profile';

export interface StatkeeperCoverageGap {
  readonly reasonKey: 'missing_video' | 'obscured_play' | 'operator_uncertainty' | 'other';
  readonly explanation: string | null;
  readonly period: StatkeeperPeriod | null;
  /** Countdown range in playback order: startMs >= endMs. Requires a Period. */
  readonly clockRange: {readonly startMs: number; readonly endMs: number} | null;
  readonly mediaRange: {readonly startMs: number; readonly endMs: number} | null;
}
export interface StatkeeperCoverageDeclaration {
  readonly coverageGroupKey: string;
  readonly status: 'not_reviewed' | 'complete' | 'partial';
  readonly gaps: readonly StatkeeperCoverageGap[];
}

export function compareStatkeeperKeys(left: string, right: string) {
  // UTF-8 byte order is Unicode scalar order, including supplementary characters.
  const a = [...left], b = [...right];
  for (let index = 0; index < Math.min(a.length, b.length); index++) {
    const delta = a[index]!.codePointAt(0)! - b[index]!.codePointAt(0)!;
    if (delta) return delta;
  }
  return a.length - b.length;
}

function fail(message: string): never { throw new RuleViolation('statkeeper.coverage.invalid', message); }
function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Coverage requires an object');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !keys.includes(key))) fail('Unsupported coverage field');
  return record;
}
function offset(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail('Coverage offsets must be nonnegative safe integers');
  return value as number;
}
function normalizeGap(raw: unknown, profile: NormalizedStatkeeperProfile): StatkeeperCoverageGap {
  const gap = object(raw, ['reasonKey', 'explanation', 'period', 'clockRange', 'mediaRange']);
  if (!['missing_video', 'obscured_play', 'operator_uncertainty', 'other'].includes(gap.reasonKey as string)) {
    fail('Coverage gap reason is unsupported');
  }
  if (gap.explanation != null && typeof gap.explanation !== 'string') fail('Gap explanation must be text');
  const explanation = typeof gap.explanation === 'string' ? gap.explanation.trim().normalize('NFC') || null : null;
  if (gap.reasonKey === 'other' && !explanation) fail('Other gaps require explanatory text');
  let period: StatkeeperPeriod | null = null;
  if (gap.period != null) {
    const candidate = object(gap.period, ['kind', 'ordinal']);
    const ordinal = offset(candidate.ordinal);
    if (!['regulation', 'overtime'].includes(candidate.kind as string) || ordinal === 0
      || (candidate.kind === 'regulation' && ordinal > profile.definition.regulationPeriodCount)) fail('Invalid coverage Period');
    period = {kind: candidate.kind as StatkeeperPeriod['kind'], ordinal};
  }
  function range(value: unknown) {
    if (value == null) return null;
    const candidate = object(value, ['startMs', 'endMs']);
    return {startMs: offset(candidate.startMs), endMs: offset(candidate.endMs)};
  }
  const clockRange = range(gap.clockRange), mediaRange = range(gap.mediaRange);
  if (mediaRange && mediaRange.startMs > mediaRange.endMs) fail('Media gap range must follow playback order');
  if (clockRange) {
    if (!period) fail('A clock range requires its Period');
    const duration = period.kind === 'regulation' ? profile.definition.regulationPeriodDurationMs : profile.definition.overtimePeriodDurationMs;
    if (clockRange.startMs < clockRange.endMs || clockRange.startMs > duration) fail('Clock gap range must fit the countdown Period');
  }
  return {reasonKey: gap.reasonKey as StatkeeperCoverageGap['reasonKey'], explanation, period, clockRange, mediaRange};
}

function nullableNumber(a: number | null | undefined, b: number | null | undefined) {
  return a == null ? b == null ? 0 : 1 : b == null ? -1 : a - b;
}
function compareGaps(a: StatkeeperCoverageGap, b: StatkeeperCoverageGap) {
  return nullableNumber(a.period ? a.period.kind === 'regulation' ? 0 : 1 : null, b.period ? b.period.kind === 'regulation' ? 0 : 1 : null)
    || nullableNumber(a.period?.ordinal, b.period?.ordinal)
    || nullableNumber(a.clockRange?.startMs, b.clockRange?.startMs)
    || nullableNumber(a.clockRange?.endMs, b.clockRange?.endMs)
    || nullableNumber(a.mediaRange?.startMs, b.mediaRange?.startMs)
    || nullableNumber(a.mediaRange?.endMs, b.mediaRange?.endMs)
    || compareStatkeeperKeys(a.reasonKey, b.reasonKey)
    || compareStatkeeperKeys(a.explanation ?? '', b.explanation ?? '');
}

export function normalizeStatkeeperCoverage(raw: unknown, profile: NormalizedStatkeeperProfile): StatkeeperCoverageDeclaration[] {
  if (!Array.isArray(raw)) fail('Coverage must be a complete declaration array');
  const seen = new Set<string>();
  const declarations = raw.map((value): StatkeeperCoverageDeclaration => {
    const row = object(value, ['coverageGroupKey', 'status', 'gaps']);
    if (typeof row.coverageGroupKey !== 'string' || !profile.coverageGroupKeys.includes(row.coverageGroupKey)
      || seen.has(row.coverageGroupKey)) fail('Coverage groups must appear exactly once and belong to the Profile');
    seen.add(row.coverageGroupKey);
    if (!['not_reviewed', 'complete', 'partial'].includes(row.status as string) || !Array.isArray(row.gaps)) fail('Invalid coverage declaration');
    const gaps = row.gaps.map((gap) => normalizeGap(gap, profile)).sort(compareGaps);
    if ((row.status === 'partial') !== (gaps.length > 0)) fail('Only partial coverage requires one or more gaps');
    const canonical = gaps.map((gap) => statkeeperCanonicalJson(gap));
    if (new Set(canonical).size !== gaps.length) fail('Duplicate canonical coverage gaps are not allowed');
    return {coverageGroupKey: row.coverageGroupKey, status: row.status as StatkeeperCoverageDeclaration['status'], gaps};
  });
  if (seen.size !== profile.coverageGroupKeys.length) fail('Every Profile Coverage Group must be declared');
  return declarations.sort((a, b) => compareStatkeeperKeys(a.coverageGroupKey, b.coverageGroupKey));
}

export function statkeeperCoverageValue(declarations: readonly StatkeeperCoverageDeclaration[]) {
  return declarations.map((row) => ({coverage_group_key: row.coverageGroupKey, status: row.status,
    gaps: row.gaps.map((gap) => ({reason_key: gap.reasonKey, explanation: gap.explanation, period: gap.period,
      clock_range: gap.clockRange ? {start_ms: gap.clockRange.startMs, end_ms: gap.clockRange.endMs} : null,
      media_range: gap.mediaRange ? {start_ms: gap.mediaRange.startMs, end_ms: gap.mediaRange.endMs} : null}))}));
}

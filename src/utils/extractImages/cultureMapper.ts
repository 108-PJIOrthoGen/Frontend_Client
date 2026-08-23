import {
  ExtractApplyCandidate,
  ExtractedCultureValue,
  ExtractedMedicalResult,
  ExtractedTestValue,
} from '@/types/extractImages';
import { IClinicFormState } from '@/types/types';
import {
  asRecord,
  getBooleanField,
  getNumberField,
  getStringField,
  hasExtractedValue,
  isRecord,
  nextExtractId,
  normalizeText,
} from './shared';

const CULTURE_CONTEXT_RE = /\b(vi sinh|nuoi cay|cay khuan|culture|vi khuan)\b/;

export function getCultureSourceName(culture: ExtractedCultureValue): string {
  return (
    getStringField(asRecord(culture), [
      'sourceName',
      'sampleName',
      'sample_name',
      'test',
      'test_name',
      'organismName',
      'organism_name',
      'organism',
      'name',
    ]) || 'Cay khuan'
  );
}

export function getCultureOrganismName(culture: ExtractedCultureValue): string | undefined {
  return getStringField(asRecord(culture), [
    'organismName',
    'organism_name',
    'organism',
    'bacteriaName',
    'bacteria_name',
  ]);
}

export function getCultureResult(culture: ExtractedCultureValue): string | undefined {
  return getStringField(asRecord(culture), ['result', 'value', 'status']);
}

function getCultureGramType(culture: ExtractedCultureValue): string | undefined {
  return getStringField(asRecord(culture), ['gramType', 'gram_type', 'gram']);
}

function getCultureNotes(culture: ExtractedCultureValue): string | undefined {
  return getStringField(asRecord(culture), ['notes', 'note', 'comment']);
}

function isCultureRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return [
    'result',
    'value',
    'status',
    'organismName',
    'organism_name',
    'organism',
    'gramType',
    'gram_type',
    'gram',
  ].some((key) => hasExtractedValue(value[key]));
}

function inferCultureOrganismName(culture: ExtractedCultureValue): string | undefined {
  const organismName = getCultureOrganismName(culture);
  if (organismName) return organismName;

  const result = getCultureResult(culture);
  return result && !normalizeCultureResult(result) ? result : undefined;
}

function normalizeCultureResult(raw?: string, organismName?: string): string | undefined {
  if (!raw && organismName) return 'POSITIVE';
  if (!raw) return undefined;
  const normalized = normalizeText(raw);
  if (!normalized) return undefined;
  if (/(am tinh|negative|khong moc)/.test(normalized)) return 'NO_GROWTH';
  if (/(dang cho|pending|cho ket qua)/.test(normalized)) return 'PENDING';
  if (/(duong tinh|positive|co moc|moc vi khuan)/.test(normalized)) return 'POSITIVE';
  if (/(nhiem ban|contaminated)/.test(normalized)) return 'CONTAMINATED';
  if (organismName) return 'POSITIVE';
  return undefined;
}

function normalizeGramType(raw?: string): string | undefined {
  if (!raw) return undefined;
  const normalized = normalizeText(raw);
  if (!normalized) return undefined;
  if (/gram (duong|positive|\+)/.test(normalized)) return 'GRAM_POSITIVE';
  if (/gram (am|negative|-)/.test(normalized)) return 'GRAM_NEGATIVE';
  return undefined;
}

function isBlankCultureSample(sample: IClinicFormState['cultureResults'][number]): boolean {
  return !sample.id
    && !hasExtractedValue(sample.name)
    && !hasExtractedValue(sample.result)
    && !hasExtractedValue(sample.gramType)
    && !hasExtractedValue(sample.notes)
    && sample.incubationDays == null;
}

export function buildCultureCandidate(
  culture: ExtractedCultureValue,
  sourceIndex: number,
): ExtractApplyCandidate | undefined {
  if (!hasExtractedValue(getCultureResult(culture)) && !hasExtractedValue(getCultureOrganismName(culture))) {
    return undefined;
  }

  const organismName = inferCultureOrganismName(culture);
  const result = getCultureResult(culture);
  const normalizedRes = normalizeCultureResult(result, organismName);
  const displayStatus =
    normalizedRes === 'POSITIVE'
      ? 'Dương tính'
      : normalizedRes === 'NO_GROWTH'
        ? 'Âm tính'
        : normalizedRes === 'PENDING'
          ? 'Đang chờ'
          : normalizedRes || result || '';

  const extractedValue = organismName
    ? `${organismName}${displayStatus ? ` (${displayStatus})` : ''}`
    : (displayStatus || 'Cấy khuẩn');

  return {
    id: nextExtractId(),
    sourceName: getCultureSourceName(culture),
    targetGroup: 'cultureResults',
    targetLabel: 'Kết quả cấy',
    sourceIndex,
    extractedValue,
    confidence: organismName ? 'high' : 'medium',
    selected: !!organismName || normalizedRes === 'POSITIVE' || normalizedRes === 'NO_GROWTH',
    conflict: false,
  };
}

export function applyCultureCandidate(
  cultureResults: IClinicFormState['cultureResults'],
  candidate: ExtractApplyCandidate,
  rawExtracted: ExtractedMedicalResult,
): IClinicFormState['cultureResults'] {
  const cultureSource =
    typeof candidate.sourceIndex === 'number'
      ? rawExtracted.cultures?.[candidate.sourceIndex]
      : (rawExtracted.cultures || []).find(
        (c) => getCultureSourceName(c) === candidate.sourceName,
      );
  if (!cultureSource) return cultureResults;

  const organismName = inferCultureOrganismName(cultureSource) || '';
  const cultureResult = getCultureResult(cultureSource);
  const cultureRecord = cultureSource as unknown as Record<string, unknown>;
  const cultureSample = {
    _tempId: candidate.id,
    name: organismName,
    result: normalizeCultureResult(cultureResult, organismName) || 'POSITIVE',
    gramType: normalizeGramType(getCultureGramType(cultureSource)) || '',
    incubationDays: getNumberField(cultureRecord, ['incubationDays', 'incubation_days']),
    antibioticed: getBooleanField(cultureRecord, [
      'antibioticed',
      'usedAntibioticBefore',
      'used_antibiotic_before',
    ]) ?? false,
    daysOffAntibio: getNumberField(cultureRecord, [
      'daysOffAntibio',
      'days_off_antibio',
      'daysOffAntibiotic',
      'days_off_antibiotic',
    ]) ?? 0,
    notes: getCultureNotes(cultureSource) || '',
  };

  // 1. Try filling a blank sample first
  const blankSampleIndex = cultureResults.findIndex(isBlankCultureSample);
  if (blankSampleIndex !== -1) {
    return cultureResults.map((sample, index) =>
      index === blankSampleIndex
        ? {
          ...sample,
          ...cultureSample,
          _tempId: sample._tempId || cultureSample._tempId,
          sampleNumber: sample.sampleNumber ?? index + 1,
        }
        : sample,
    );
  }

  // 2. Check if a sample with the same organism already exists (avoid duplicate rows)
  if (organismName) {
    const existingOrgIndex = cultureResults.findIndex(
      (s) => normalizeText(s.name || '') === normalizeText(organismName),
    );
    if (existingOrgIndex !== -1) {
      return cultureResults.map((sample, index) =>
        index === existingOrgIndex
          ? {
            ...sample,
            ...cultureSample,
            _tempId: sample._tempId || cultureSample._tempId,
            sampleNumber: sample.sampleNumber ?? index + 1,
          }
          : sample,
      );
    }
  }

  // 3. Otherwise append new sample
  return [
    ...cultureResults,
    {
      ...cultureSample,
      sampleNumber: cultureResults.length + 1,
    },
  ];
}

function getCultureIdentityKey(culture: ExtractedCultureValue): string {
  const organism = normalizeText(inferCultureOrganismName(culture) || '');
  if (organism) {
    return `org:${organism}`;
  }
  const result = normalizeText(getCultureResult(culture) || '');
  const source = normalizeText(getCultureSourceName(culture) || '');
  return `res:${result || 'unknown'}_${source}`;
}

function mergeCultureEntries(
  target: ExtractedCultureValue,
  source: ExtractedCultureValue,
): ExtractedCultureValue {
  const targetRecord = asRecord(target);
  const sourceRecord = asRecord(source);

  const organismName =
    target.organismName ||
    source.organismName ||
    inferCultureOrganismName(target) ||
    inferCultureOrganismName(source);

  const rawResult = target.result || source.result;
  const normalizedRes = normalizeCultureResult(rawResult, organismName);

  return {
    ...target,
    ...source,
    sourceName: target.sourceName || source.sourceName || 'Cấy khuẩn',
    organismName: organismName || undefined,
    result: normalizedRes || rawResult || undefined,
    gramType: target.gramType || source.gramType || undefined,
    incubationDays:
      target.incubationDays ??
      source.incubationDays ??
      getNumberField(targetRecord, ['incubationDays', 'incubation_days']) ??
      getNumberField(sourceRecord, ['incubationDays', 'incubation_days']),
    antibioticed:
      target.antibioticed ??
      source.antibioticed ??
      getBooleanField(targetRecord, ['antibioticed', 'usedAntibioticBefore', 'used_antibiotic_before']) ??
      getBooleanField(sourceRecord, ['antibioticed', 'usedAntibioticBefore', 'used_antibiotic_before']),
    daysOffAntibio:
      target.daysOffAntibio ??
      source.daysOffAntibio ??
      getNumberField(targetRecord, ['daysOffAntibio', 'days_off_antibio', 'daysOffAntibiotic', 'days_off_antibiotic']) ??
      getNumberField(sourceRecord, ['daysOffAntibio', 'days_off_antibio', 'daysOffAntibiotic', 'days_off_antibiotic']),
    notes: [target.notes, source.notes].filter(Boolean).join('; ') || undefined,
  };
}

export function extractCulturesFromTemplate(
  obj: Record<string, unknown>,
  tests: ExtractedTestValue[] = [],
): ExtractedCultureValue[] {
  const rawList: ExtractedCultureValue[] = [];

  // 1. Check explicit culture results / cultures array
  const cultureRoot = (obj.culture_results || obj.cultures) as Record<string, unknown> | undefined;
  if (cultureRoot) {
    const items = Array.isArray(cultureRoot)
      ? cultureRoot
      : isCultureRecord(cultureRoot)
        ? [cultureRoot]
        : Object.values(cultureRoot);
    for (const item of items) {
      if (!isRecord(item)) continue;
      rawList.push({
        sourceName: (item.sample_name || item.sourceName || item.test || item.name || 'Cấy khuẩn') as string,
        result: (item.result || item.value || item.status) as string | undefined,
        organismName: (item.organismName || item.organism || item.organism_name) as string | undefined,
        gramType: (item.gramType || item.gram || item.gram_type) as string | undefined,
        incubationDays: (item.incubationDays || item.incubation_days) as number | string | undefined,
        antibioticed: (item.antibioticed || item.usedAntibioticBefore || item.used_antibiotic_before) as
          | boolean
          | string
          | undefined,
        daysOffAntibio: (
          item.daysOffAntibio ||
          item.days_off_antibio ||
          item.daysOffAntibiotic ||
          item.days_off_antibiotic
        ) as
          | number
          | string
          | undefined,
        notes: (item.notes || item.note) as string | undefined,
      });
    }
  }

  // 2. Check abnormal flags summary POSITIVE_CULTURE
  const abnormalPositiveCultures = (obj.abnormal_flags_summary as Record<string, unknown> | undefined)
    ?.POSITIVE_CULTURE;
  if (Array.isArray(abnormalPositiveCultures)) {
    for (const item of abnormalPositiveCultures) {
      if (!isRecord(item)) continue;
      const organismName = getStringField(item, ['organism', 'organism_name', 'organismName']);
      if (!organismName) continue;
      rawList.push({
        sourceName: getStringField(item, ['test', 'test_name', 'sourceName']) || 'Cấy khuẩn',
        result: 'POSITIVE',
        organismName,
        notes: getStringField(item, ['notes', 'note']),
      });
    }
  }

  // 3. Check tests matching CULTURE_CONTEXT_RE (only if value exists)
  for (const test of tests) {
    if (!hasExtractedValue(test.value)) continue;
    const normalized = normalizeText(`${test.sourceName} ${test.groupName || ''}`);
    if (!CULTURE_CONTEXT_RE.test(normalized)) continue;
    rawList.push({
      sourceName: test.sourceName,
      result: String(test.value),
      notes: test.groupName,
    });
  }

  // 4. Deduplicate and merge by culture identity key
  const deduplicatedMap = new Map<string, ExtractedCultureValue>();
  for (const raw of rawList) {
    const key = getCultureIdentityKey(raw);
    const existing = deduplicatedMap.get(key);
    if (existing) {
      deduplicatedMap.set(key, mergeCultureEntries(existing, raw));
    } else {
      deduplicatedMap.set(key, normalizeCultureValue(raw));
    }
  }

  return Array.from(deduplicatedMap.values());
}

export function normalizeCultureValue(culture: ExtractedCultureValue): ExtractedCultureValue {
  const record = asRecord(culture);
  return {
    ...culture,
    sourceName: getCultureSourceName(culture),
    result: getCultureResult(culture),
    organismName: getCultureOrganismName(culture),
    gramType: getCultureGramType(culture),
    incubationDays: getNumberField(record, ['incubationDays', 'incubation_days']),
    antibioticed: getBooleanField(record, [
      'antibioticed',
      'usedAntibioticBefore',
      'used_antibiotic_before',
    ]),
    daysOffAntibio: getNumberField(record, [
      'daysOffAntibio',
      'days_off_antibio',
      'daysOffAntibiotic',
      'days_off_antibiotic',
    ]),
    notes: getCultureNotes(culture),
  };
}

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
  if (/(am tinh|negative|khong moc)/.test(normalized)) return 'NEGATIVE';
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

  return {
    id: nextExtractId(),
    sourceName: getCultureSourceName(culture),
    targetGroup: 'cultureResults',
    targetLabel: 'Ket qua cay',
    sourceIndex,
    extractedValue: [organismName, result].filter(Boolean).join(' / '),
    confidence: organismName ? 'high' : 'medium',
    selected: !!organismName,
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

  const organismName = inferCultureOrganismName(cultureSource);
  const cultureResult = getCultureResult(cultureSource);
  const cultureRecord = cultureSource as unknown as Record<string, unknown>;
  const cultureSample = {
    _tempId: candidate.id,
    name: organismName,
    result: normalizeCultureResult(cultureResult, organismName),
    gramType: normalizeGramType(getCultureGramType(cultureSource)),
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
    notes: getCultureNotes(cultureSource),
  };
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

  return [
    ...cultureResults,
    {
      ...cultureSample,
      sampleNumber: cultureResults.length + 1,
    },
  ];
}

export function extractCulturesFromTemplate(
  obj: Record<string, unknown>,
  tests: ExtractedTestValue[] = [],
): ExtractedCultureValue[] {
  const out: ExtractedCultureValue[] = [];
  const cultureRoot = (obj.culture_results || obj.cultures) as Record<string, unknown> | undefined;
  if (cultureRoot) {
    const items = Array.isArray(cultureRoot)
      ? cultureRoot
      : isCultureRecord(cultureRoot)
        ? [cultureRoot]
        : Object.values(cultureRoot);
    for (const item of items) {
      if (!isRecord(item)) continue;
      out.push({
        sourceName: (item.sample_name || item.sourceName || item.test || item.name || 'Cay khuan') as string,
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

  const abnormalPositiveCultures = (obj.abnormal_flags_summary as Record<string, unknown> | undefined)
    ?.POSITIVE_CULTURE;
  if (Array.isArray(abnormalPositiveCultures)) {
    for (const item of abnormalPositiveCultures) {
      if (!isRecord(item)) continue;
      const organismName = getStringField(item, ['organism', 'organism_name', 'organismName']);
      if (!organismName) continue;
      out.push({
        sourceName: getStringField(item, ['test', 'test_name', 'sourceName']) || 'Cay khuan',
        result: 'POSITIVE',
        organismName,
        notes: getStringField(item, ['notes', 'note']),
      });
    }
  }

  for (const test of tests) {
    const normalized = normalizeText(`${test.sourceName} ${test.groupName || ''}`);
    if (!CULTURE_CONTEXT_RE.test(normalized)) continue;
    out.push({
      sourceName: test.sourceName,
      result: test.value == null ? undefined : String(test.value),
      notes: test.groupName,
    });
  }
  return out;
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

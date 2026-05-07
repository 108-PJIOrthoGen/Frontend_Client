import { IClinicFormState, TestItem } from '@/types/types';
import {
  ExtractApplyCandidate,
  ExtractTargetGroup,
  ExtractedMedicalResult,
  ExtractedTestValue,
  ExtractedCultureValue,
} from '@/types/extractImages';

interface AliasEntry {
  targetGroup: ExtractTargetGroup;
  targetId: string;
  aliases: string[];
}

const TEST_ALIASES: AliasEntry[] = [
  { targetGroup: 'hematologyTests', targetId: 'ht_1', aliases: ['wbc', 'bach cau', 'white blood cell'] },
  { targetGroup: 'hematologyTests', targetId: 'ht_2', aliases: ['%neut', 'neut%', 'ty le bach cau trung tinh', 'neutrophil%'] },
  { targetGroup: 'hematologyTests', targetId: 'ht_4', aliases: ['%mono', 'mono%'] },
  { targetGroup: 'hematologyTests', targetId: 'ht_7', aliases: ['esr', 'mau lang', 'toc do mau lang'] },
  { targetGroup: 'hematologyTests', targetId: 'ht_9', aliases: ['rbc', 'hong cau'] },
  { targetGroup: 'hematologyTests', targetId: 'ht_12', aliases: ['mcv'] },
  { targetGroup: 'hematologyTests', targetId: 'ht_13', aliases: ['mch'] },

  { targetGroup: 'biochemistryTests', targetId: 'bc_4', aliases: ['glucose', 'dinh luong glucose', 'duong huyet'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_5', aliases: ['ure', 'ure mau', 'urea'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_6', aliases: ['creatinin', 'creatinine'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_7', aliases: ['albumin', 'alb'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_8', aliases: ['ast', 'got'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_9', aliases: ['alt', 'gpt'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_10', aliases: ['na+', 'natri', 'sodium'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_11', aliases: ['k+', 'kali', 'potassium'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_12', aliases: ['cl-', 'clo', 'chloride'] },
  { targetGroup: 'biochemistryTests', targetId: 'bc_13', aliases: ['hba1c'] },

  { targetGroup: 'fluidAnalysis', targetId: 'fa_1', aliases: ['cay khuan', 'nuoi cay', 'vi khuan nuoi cay', 'culture'] },
  { targetGroup: 'fluidAnalysis', targetId: 'fa_2', aliases: ['nhuom gram', 'gram'] },
  { targetGroup: 'fluidAnalysis', targetId: 'fa_3', aliases: ['bach cau dich', 'wbc dich', 'bach cau trong dich khop', 'bach cau', 'wbc'] },
  { targetGroup: 'fluidAnalysis', targetId: 'fa_5', aliases: ['crp dich', 'crp trong dich'] },
  { targetGroup: 'fluidAnalysis', targetId: 'fa_6', aliases: ['%pmn', 'pmn%', 'neutrophil dich', '%neut', 'neut%'] },
];

const VIETNAMESE_DIACRITICS_RE = /[̀-ͯ]/g;
const FLUID_CONTEXT_RE = /\b(dich|dich khop|joint fluid|te bao trong nuoc dich|nao tuy|mang tim|mang phoi|bung)\b/;
const CULTURE_CONTEXT_RE = /\b(vi sinh|nuoi cay|cay khuan|culture|vi khuan)\b/;

export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(VIETNAMESE_DIACRITICS_RE, '')
    .toLowerCase()
    .replace(/[^a-z0-9%+\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasExtractedValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function findTestAlias(test: ExtractedTestValue): AliasEntry | undefined {
  const normalized = normalizeText(`${test.sourceName} ${test.groupName || ''}`);
  if (!normalized) return undefined;
  const matches = TEST_ALIASES.filter((entry) =>
    entry.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      return normalized === normalizedAlias || normalized.includes(normalizedAlias);
    }),
  );
  if (FLUID_CONTEXT_RE.test(normalized)) {
    return matches.find((entry) => entry.targetGroup === 'fluidAnalysis') || matches[0];
  }
  return matches.find((entry) => entry.targetGroup !== 'fluidAnalysis') || matches[0];
}

function getTestItem(form: IClinicFormState, group: ExtractTargetGroup, id: string): TestItem | undefined {
  if (group === 'cultureResults') return undefined;
  const list = form[group] as TestItem[];
  return list.find((t) => t.id === id);
}

let candidateCounter = 0;
const nextId = () => `extract-${Date.now()}-${candidateCounter++}`;

export function buildCandidatesFromExtracted(
  result: ExtractedMedicalResult,
  form: IClinicFormState,
): ExtractApplyCandidate[] {
  const candidates: ExtractApplyCandidate[] = [];

  for (const test of result.tests || []) {
    if (!hasExtractedValue(test.value)) continue;
    candidates.push(buildTestCandidate(test, form));
  }

  for (const culture of result.cultures || []) {
    if (!hasExtractedValue(culture.result) && !hasExtractedValue(culture.organismName)) continue;
    candidates.push(buildCultureCandidate(culture));
  }

  return candidates;
}

function buildTestCandidate(test: ExtractedTestValue, form: IClinicFormState): ExtractApplyCandidate {
  const alias = findTestAlias(test);
  const extractedValue = test.value == null ? '' : String(test.value);

  if (!alias) {
    return {
      id: nextId(),
      sourceName: test.sourceName,
      extractedValue,
      unit: test.unit ?? undefined,
      referenceRange: test.referenceRange ?? undefined,
      confidence: 'low',
      selected: false,
      conflict: false,
    };
  }

  const target = getTestItem(form, alias.targetGroup, alias.targetId);
  const currentValue = target?.result ?? '';
  const conflict = !!currentValue && currentValue !== extractedValue;

  return {
    id: nextId(),
    sourceName: test.sourceName,
    targetGroup: alias.targetGroup,
    targetId: alias.targetId,
    targetLabel: target?.name,
    extractedValue,
    currentValue,
    unit: test.unit ?? target?.unit ?? undefined,
    referenceRange: test.referenceRange ?? target?.normalRange ?? undefined,
    confidence: 'high',
    selected: !currentValue,
    conflict,
  };
}

function buildCultureCandidate(culture: ExtractedCultureValue): ExtractApplyCandidate {
  return {
    id: nextId(),
    sourceName: culture.sourceName || culture.organismName || 'Cay khuan',
    targetGroup: 'cultureResults',
    targetLabel: 'Ket qua cay',
    extractedValue: [culture.organismName, culture.result].filter(Boolean).join(' / '),
    confidence: culture.organismName ? 'high' : 'medium',
    selected: !!culture.organismName,
    conflict: false,
  };
}

function normalizeCultureResult(raw?: string): string | undefined {
  if (!raw) return undefined;
  const normalized = normalizeText(raw);
  if (!normalized) return undefined;
  if (/(duong tinh|positive|moc)/.test(normalized)) return 'POSITIVE';
  if (/(am tinh|negative|khong moc)/.test(normalized)) return 'NEGATIVE';
  if (/(nhiem ban|contaminated)/.test(normalized)) return 'CONTAMINATED';
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

export function applyExtractCandidatesToClinicForm(
  form: IClinicFormState,
  candidates: ExtractApplyCandidate[],
  rawExtracted: ExtractedMedicalResult,
): IClinicFormState {
  const selected = candidates.filter((c) => c.selected);
  if (selected.length === 0) return form;

  const next: IClinicFormState = {
    ...form,
    hematologyTests: [...form.hematologyTests],
    biochemistryTests: [...form.biochemistryTests],
    fluidAnalysis: [...form.fluidAnalysis],
    cultureResults: [...form.cultureResults],
  };

  for (const candidate of selected) {
    if (!candidate.targetGroup) continue;

    if (candidate.targetGroup === 'cultureResults') {
      const cultureSource = (rawExtracted.cultures || []).find(
        (c) => (c.organismName || c.sourceName) === candidate.sourceName,
      );
      if (!cultureSource) continue;

      next.cultureResults = [
        ...next.cultureResults,
        {
          _tempId: candidate.id,
          name: cultureSource.organismName,
          result: normalizeCultureResult(cultureSource.result),
          gramType: normalizeGramType(cultureSource.gramType),
          notes: cultureSource.notes,
          sampleNumber: next.cultureResults.length + 1,
        },
      ];
      continue;
    }

    if (!candidate.targetId) continue;

    const list = next[candidate.targetGroup] as TestItem[];
    const idx = list.findIndex((t) => t.id === candidate.targetId);
    if (idx === -1) continue;

    const current = list[idx];
    list[idx] = {
      ...current,
      result: candidate.extractedValue,
      unit: current.unit || candidate.unit || current.unit,
      normalRange: current.normalRange || candidate.referenceRange || current.normalRange,
    };
  }

  return next;
}

export function normalizeUpstreamExtracted(raw: unknown): ExtractedMedicalResult {
  if (!raw || typeof raw !== 'object') {
    return { tests: [], cultures: [], raw };
  }
  const obj = raw as Record<string, unknown>;
  const tests = Array.isArray(obj.tests) ? (obj.tests as ExtractedTestValue[]) : extractTestsFromTemplate(obj);
  const cultures = Array.isArray(obj.cultures)
    ? (obj.cultures as ExtractedCultureValue[])
    : extractCulturesFromTemplate(obj, tests);

  return {
    document: obj.document as ExtractedMedicalResult['document'],
    patient: obj.patient as ExtractedMedicalResult['patient'],
    tests,
    cultures,
    raw,
  };
}

function extractTestsFromTemplate(obj: Record<string, unknown>): ExtractedTestValue[] {
  const out: ExtractedTestValue[] = [];
  const testResults = obj.test_results;
  if (!testResults) return out;

  collectTestsFromNode(testResults, 'test_results', out);
  return out;
}

function collectTestsFromNode(node: unknown, groupName: string, out: ExtractedTestValue[]): void {
  if (Array.isArray(node)) {
    appendTestItems(node, groupName, out);
    return;
  }
  if (!isRecord(node)) return;

  const ownGroupName = buildGroupName(node, groupName);
  if (Array.isArray(node.tests)) {
    appendTestItems(node.tests, ownGroupName, out, node);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'tests') continue;
    if (Array.isArray(value) || isRecord(value)) {
      collectTestsFromNode(value, `${groupName}.${key}`, out);
    }
  }
}

function buildGroupName(node: Record<string, unknown>, fallback: string): string {
  const category = typeof node.category === 'string' ? node.category : '';
  const department = typeof node.department === 'string' ? node.department : '';
  return [fallback, category, department].filter(Boolean).join(' ');
}

function appendTestItems(
  items: unknown[],
  groupName: string,
  out: ExtractedTestValue[],
  parent?: Record<string, unknown>,
): void {
  for (const item of items) {
    if (!isRecord(item)) continue;
    const name = (item.name || item.test_name || item.sourceName) as string | undefined;
    if (!name) continue;
    const value = (item.value ?? item.result ?? null) as ExtractedTestValue['value'];
    if (!hasExtractedValue(value)) continue;
    out.push({
      sourceName: name,
      value,
      unit: (item.unit ?? null) as string | null,
      referenceRange: (item.reference_range ?? item.normal_range ?? null) as string | null,
      flag: (item.flag ?? null) as string | null,
      groupName,
      collectedAt: (item.time_collected || parent?.time_collected) as string | undefined,
      resultedAt: (item.time_resulted || parent?.time_resulted) as string | undefined,
    });
  }
}

function extractCulturesFromTemplate(
  obj: Record<string, unknown>,
  tests: ExtractedTestValue[] = [],
): ExtractedCultureValue[] {
  const out: ExtractedCultureValue[] = [];
  const cultureRoot = (obj.culture_results || obj.cultures) as Record<string, unknown> | undefined;
  if (cultureRoot) {
    const items = Array.isArray(cultureRoot) ? cultureRoot : [cultureRoot];
    for (const item of items) {
      if (!isRecord(item)) continue;
      out.push({
        sourceName: (item.sample_name || item.sourceName || item.name || 'Cay khuan') as string,
        result: item.result as string | undefined,
        organismName: (item.organism || item.organism_name) as string | undefined,
        gramType: (item.gram || item.gram_type) as string | undefined,
        notes: item.notes as string | undefined,
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

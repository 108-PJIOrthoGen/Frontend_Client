import { ExtractApplyCandidate, ExtractTargetGroup, ExtractedTestValue } from '@/types/extractImages';
import { IClinicFormState, TestItem } from '@/types/types';
import { hasExtractedValue, nextExtractId, normalizeText } from './shared';

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

const FLUID_CONTEXT_RE = /\b(dich|dich khop|joint fluid|te bao trong nuoc dich|nao tuy|mang tim|mang phoi|bung)\b/;

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

export function buildTestCandidate(
  test: ExtractedTestValue,
  form: IClinicFormState,
): ExtractApplyCandidate | undefined {
  if (!hasExtractedValue(test.value)) return undefined;

  const alias = findTestAlias(test);
  const extractedValue = test.value == null ? '' : String(test.value);

  if (!alias) {
    return {
      id: nextExtractId(),
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
    id: nextExtractId(),
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

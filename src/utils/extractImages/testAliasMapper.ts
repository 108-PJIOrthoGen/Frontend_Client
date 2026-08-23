import { ExtractApplyCandidate, ExtractTargetGroup, ExtractedTestValue } from '@/types/extractImages';
import { IClinicFormState, TestItem } from '@/types/types';
import { CANONICAL_LABS } from '@/constants/canonicalLabRegistry';
import { hasExtractedValue, nextExtractId, normalizeText } from './shared';

interface AliasEntry {
  targetGroup: ExtractTargetGroup;
  targetId: string;
  aliases: string[];
}

const TEST_ALIASES: AliasEntry[] = CANONICAL_LABS.map((lab) => ({
  targetGroup: lab.group,
  targetId: lab.id,
  aliases: lab.aliases,
}));

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

  if (!alias || alias.targetId === 'fa_1' || alias.targetGroup === 'cultureResults') {
    return undefined;
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

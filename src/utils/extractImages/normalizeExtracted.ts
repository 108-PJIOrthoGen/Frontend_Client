import {
  ExtractedCultureValue,
  ExtractedMedicalResult,
  ExtractedTestValue,
} from '@/types/extractImages';
import { extractCulturesFromTemplate, normalizeCultureValue } from './cultureMapper';
import { hasExtractedValue, isRecord } from './shared';

export function normalizeUpstreamExtracted(raw: unknown): ExtractedMedicalResult {
  if (!raw || typeof raw !== 'object') {
    return { tests: [], cultures: [], raw };
  }
  const obj = raw as Record<string, unknown>;
  const tests = Array.isArray(obj.tests) ? (obj.tests as ExtractedTestValue[]) : extractTestsFromTemplate(obj);
  const cultures = Array.isArray(obj.cultures)
    ? (obj.cultures as ExtractedCultureValue[]).map(normalizeCultureValue)
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

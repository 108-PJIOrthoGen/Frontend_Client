import type { CitationData } from '@/types/treatmentType';
import type { IAiRagCitation } from '@/types/backend';

const snakeToCamelKey = (str: string): string =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export const snakeToCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeToCamelKey(k), snakeToCamel(v)]),
    );
  }
  return obj;
};

// Camel-case keys whose values must render as arrays. If the LLM drifts and
// emits a string (e.g. "monitoring": "Theo dõi CRP mỗi tuần"), coerce it so
// downstream `.map(...)` calls don't blow up the page. Stale items already
// persisted in localStorage / DB pass through this same path on read.
const ARRAY_FIELDS = new Set([
  'monitoring',
  'contraindications',
  'antibiotics',
  'phases',
  'stages',
  'risksAndComplications',
  'preconditions',
  'items',
  'warnings',
]);

export const coerceListFields = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(coerceListFields);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        const recursed = coerceListFields(v);
        if (ARRAY_FIELDS.has(k) && !Array.isArray(recursed)) {
          if (recursed === null || recursed === undefined || recursed === '') return [k, []];
          return [k, [recursed]];
        }
        return [k, recursed];
      }),
    );
  }
  return obj;
};

export const parseItemJson = (item: { itemJson?: Record<string, any> } | undefined) => {
  if (!item?.itemJson) return null;
  const raw = typeof item.itemJson === 'string' ? JSON.parse(item.itemJson) : item.itemJson;
  return coerceListFields(snakeToCamel(raw));
};

export const mapCitations = (citations?: IAiRagCitation[]): CitationData[] => {
  if (!citations?.length) return [];
  return citations.map((c) => ({
    sourceType: c.sourceType ?? '',
    sourceTitle: c.sourceTitle ?? '',
    sourceUri: c.sourceUri ?? '',
    snippet: c.snippet ?? '',
    relevanceScore: c.relevanceScore ?? 0,
    citedFor: c.citedFor ?? '',
  }));
};

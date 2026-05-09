const VIETNAMESE_DIACRITICS_RE = /[̀-ͯ]/g;

let candidateCounter = 0;

export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(VIETNAMESE_DIACRITICS_RE, '')
    .toLowerCase()
    .replace(/[^a-z0-9%+\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasExtractedValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function nextExtractId(): string {
  return `extract-${Date.now()}-${candidateCounter++}`;
}

export function getStringField(
  value: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const raw = value[key];
    if (hasExtractedValue(raw)) return String(raw).trim();
  }
  return undefined;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

export function getNumberField(
  value: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const raw = value[key];
    if (!hasExtractedValue(raw)) continue;
    const num = Number(raw);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export function getBooleanField(
  value: Record<string, unknown>,
  keys: string[],
): boolean | undefined {
  for (const key of keys) {
    const raw = value[key];
    if (typeof raw === 'boolean') return raw;
    if (!hasExtractedValue(raw)) continue;
    const normalized = normalizeText(String(raw));
    if (/^(true|yes|co|da|1)$/.test(normalized)) return true;
    if (/^(false|no|khong|chua|0)$/.test(normalized)) return false;
  }
  return undefined;
}

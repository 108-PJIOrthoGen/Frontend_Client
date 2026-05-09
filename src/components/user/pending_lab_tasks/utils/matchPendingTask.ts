import type { IPendingLabTask } from '@/types/backend';
import type { IClinicFormState } from '@/types/types';

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    // Strip Vietnamese diacritics so 'Tốc độ' matches 'toc do'
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[\s_\-./()%]+/g, '');

// Field-key → list of substring aliases that, when found in a TestItem.id or
// TestItem.name (after normalization), indicate the doctor has already entered
// the value the AI flagged as missing.
//
// This is intentionally a hand-curated whitelist, NOT a generic fuzzy match —
// the AI completeness agent emits free-text field keys, so silent fuzzy
// matching would mis-fire (e.g. `liver_function` substring-matching against
// any test row containing 'function'). Adding a new entry is a one-liner.
const FIELD_ALIASES: Record<string, string[]> = {
  serum_CRP: ['crp'],
  serum_ESR: ['esr', 'tocdomaulang', 'maulang'],
  serum_D_Dimer: ['ddimer'],
  serum_IL6: ['il6'],
  synovial_WBC: ['wbcdichkhop', 'bachcaudichkhop'],
  synovial_PMN: ['pmn'],
  synovial_alpha_defensin: ['alphadefensin'],
  synovial_LE: ['leukocyteesterase', 'le'],
  renal_function: ['creatinine'],
  liver_function: ['alt', 'ast'],
};

/** Resolve aliases for a task field, falling back to the trailing token. */
const aliasesFor = (field: string): string[] => {
  const explicit = FIELD_ALIASES[field];
  if (explicit) return explicit.map(normalize);
  // Fallback for unknown field keys: take the last underscore segment if it's
  // long enough to be meaningful (avoids 'function' / 'level' false positives).
  const parts = field.split(/[_\s]+/).filter(Boolean);
  const tail = parts[parts.length - 1];
  if (tail && tail.length >= 3 && !/^(function|level|test|value)$/i.test(tail)) {
    return [normalize(tail)];
  }
  return [];
};

export interface FilledLabEntry {
  id: string;
  name: string;
}

/**
 * Collect filled (non-empty result) lab entries across hematology, biochemistry,
 * and fluid-analysis sections of the active clinic form.
 */
export const collectFilledLabEntries = (form: IClinicFormState): FilledLabEntry[] => {
  const all = [
    ...(form.hematologyTests ?? []),
    ...(form.biochemistryTests ?? []),
    ...(form.fluidAnalysis ?? []),
  ];
  return all
    .filter((t) => t.result?.toString().trim().length > 0)
    .map((t) => ({ id: t.id, name: t.name }));
};

/**
 * Heuristic: returns true if a value matching this pending task's `field`
 * appears to have already been entered into the active clinic form.
 *
 * Caller is responsible for scoping this to tasks belonging to the active
 * episode — otherwise the comparison is meaningless (the form holds only one
 * episode's data at a time).
 */
export const isPendingTaskLikelyResolved = (
  task: IPendingLabTask,
  entries: FilledLabEntry[],
): boolean => {
  if (!task.field) return false;
  const aliases = aliasesFor(task.field);
  if (aliases.length === 0) return false;
  return entries.some((e) => {
    const haystack = normalize(`${e.name} ${e.id}`);
    return aliases.some((a) => haystack.includes(a));
  });
};

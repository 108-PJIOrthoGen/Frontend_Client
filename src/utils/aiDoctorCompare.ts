import type { LocalPlanData, SystemicPlanData } from '@/types/treatmentType';

/**
 * Shared helpers for comparing the AI recommendation with the doctor's final
 * diagnosis/plan. Used by the "Chẩn đoán bác sĩ" step (to compute
 * agreement_json at save time) and by the compare-result page (to render the
 * criterion-by-criterion table).
 */

export const PJI_CONCLUSION_LABELS: Record<string, string> = {
  INFECTED: 'Nhiễm trùng khớp giả (PJI)',
  NOT_INFECTED: 'Không nhiễm trùng',
  INCONCLUSIVE: 'Chưa kết luận được',
};

export const norm = (v?: string | null): string => (v ?? '').trim().toLowerCase();

/** Map the AI pji_probability vocabulary onto the doctor conclusion vocabulary. */
export const aiConclusionOf = (pjiProbability?: string): string => {
  switch ((pjiProbability ?? '').toUpperCase()) {
    case 'DEFINITE':
      return 'INFECTED';
    case 'UNLIKELY':
      return 'NOT_INFECTED';
    default:
      return 'INCONCLUSIVE'; // POSSIBLE / INCONCLUSIVE / unknown
  }
};

/** Normalized, sorted antibiotic names of a systemic plan (across phases). */
export const systemicAbxNames = (plan?: SystemicPlanData | null): string[] =>
  (plan?.phases ?? [])
    .flatMap((p) => p.antibiotics ?? [])
    .map((a) => norm(a.antibioticName))
    .filter(Boolean)
    .sort();

export const localAbxNames = (plan?: LocalPlanData | null): string[] =>
  (plan?.antibiotics ?? [])
    .map((a) => norm(a.antibioticName))
    .filter(Boolean)
    .sort();

export const sameSet = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

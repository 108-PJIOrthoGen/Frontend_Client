import { ExtractApplyCandidate, ExtractedMedicalResult } from '@/types/extractImages';
import { IClinicFormState } from '@/types/types';
import { buildCultureCandidate } from './cultureMapper';
import { buildTestCandidate } from './testAliasMapper';

export function buildCandidatesFromExtracted(
  result: ExtractedMedicalResult,
  form: IClinicFormState,
): ExtractApplyCandidate[] {
  const candidates: ExtractApplyCandidate[] = [];

  for (const test of result.tests || []) {
    const candidate = buildTestCandidate(test, form);
    if (candidate) candidates.push(candidate);
  }

  for (const [index, culture] of (result.cultures || []).entries()) {
    const candidate = buildCultureCandidate(culture, index);
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

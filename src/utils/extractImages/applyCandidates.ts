import { ExtractApplyCandidate, ExtractedMedicalResult } from '@/types/extractImages';
import { IClinicFormState, TestItem } from '@/types/types';
import { applyCultureCandidate } from './cultureMapper';

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
      next.cultureResults = applyCultureCandidate(next.cultureResults, candidate, rawExtracted);
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

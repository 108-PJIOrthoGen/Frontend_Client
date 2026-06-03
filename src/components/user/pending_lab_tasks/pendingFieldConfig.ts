import type { IClinicFormState } from '@/types/types';

/**
 * Explicit binding from a completeness `field` to the place in the clinic form
 * where its value lives. This replaces the old fuzzy `matchPendingTask`
 * heuristic — each field is wired to exactly one form location, so progress is
 * derived deterministically and entry writes straight into the shared form
 * (persisted by the episode "Lưu" action, then auto-fulfilled server-side).
 *
 * Lab ids/names mirror Backend `FIELD_TO_LAB_MAPPING` and the default clinic
 * form rows so a filled value merges into the canonical lab-table row.
 */

export type LabSection = 'hematology' | 'fluid' | 'biochemistry';

export interface LabFieldBinding {
  kind: 'lab';
  section: LabSection;
  id: string;
  name: string;
  unit: string;
  normalRange: string;
}

export type ClinicalControl = 'infectionType' | 'implantStability' | 'sinusTract' | 'allergy' | 'text';

export interface ClinicalFieldBinding {
  kind: 'clinical';
  control: ClinicalControl;
}

export interface CultureFieldBinding {
  kind: 'culture';
}

export type FieldBinding = LabFieldBinding | ClinicalFieldBinding | CultureFieldBinding;

const SLICE_TO_FORM_KEY: Record<LabSection, keyof Pick<IClinicFormState,
  'hematologyTests' | 'fluidAnalysis' | 'biochemistryTests'>> = {
  hematology: 'hematologyTests',
  fluid: 'fluidAnalysis',
  biochemistry: 'biochemistryTests',
};

export const formKeyForSection = (section: LabSection) => SLICE_TO_FORM_KEY[section];

export const LAB_FIELD_BINDINGS: Record<string, Omit<LabFieldBinding, 'kind' | 'unit' | 'normalRange'>> = {
  serum_CRP: { section: 'hematology', id: 'ht_extra_crp', name: 'CRP' },
  serum_ESR: { section: 'hematology', id: 'ht_7', name: 'Máu lắng' },
  serum_D_Dimer: { section: 'hematology', id: 'ht_17', name: 'D-dimer' },
  serum_IL6: { section: 'hematology', id: 'ht_18', name: 'Serum IL-6' },
  synovial_WBC: { section: 'fluid', id: 'fa_3', name: 'Bạch cầu (Dịch)' },
  synovial_PMN: { section: 'fluid', id: 'fa_6', name: '%PMN (Dịch)' },
  synovial_alpha_defensin: { section: 'fluid', id: 'fa_extra_alpha_defensin', name: 'Alpha Defensin (dịch)' },
  synovial_LE: { section: 'fluid', id: 'fa_extra_leukocyte_esterase', name: 'Leukocyte Esterase (dịch)' },
  renal_function: { section: 'biochemistry', id: 'bc_6', name: 'Định lượng Creatinin' },
  liver_function: { section: 'biochemistry', id: 'bc_9', name: 'Hoạt độ ALT' },
};

const CLINICAL_CONTROL_BY_FIELD: Record<string, ClinicalControl> = {
  infection_type: 'infectionType',
  implant_stability: 'implantStability',
  sinus_tract: 'sinusTract',
  allergies: 'allergy',
  positive_histology: 'text',
};

/**
 * Resolve the binding for a task. Lab fields prefer the static map but fall
 * back to the server-sent section so AI-proposed lab fields still render.
 */
export const resolveBinding = (
  field: string | undefined,
  inputType: string | undefined,
  section: string | undefined,
  unit: string | undefined,
  normalRange: string | undefined,
): FieldBinding => {
  if (inputType === 'culture') return { kind: 'culture' };
  if (inputType === 'clinical') {
    return { kind: 'clinical', control: (field && CLINICAL_CONTROL_BY_FIELD[field]) || 'text' };
  }
  // Default: lab
  const known = field ? LAB_FIELD_BINDINGS[field] : undefined;
  const resolvedSection: LabSection = known?.section
    ?? (section === 'fluid' ? 'fluid' : section === 'biochemical' ? 'biochemistry' : 'hematology');
  const slug = (field || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const prefix = resolvedSection === 'fluid' ? 'fa' : resolvedSection === 'biochemistry' ? 'bc' : 'ht';
  return {
    kind: 'lab',
    section: resolvedSection,
    id: known?.id ?? `${prefix}_extra_${slug}`,
    name: known?.name ?? field ?? 'Xét nghiệm',
    unit: unit ?? '',
    normalRange: normalRange ?? '',
  };
};

/** True when the form already holds a non-empty value for this lab binding. */
export const isLabBindingFilled = (form: IClinicFormState, binding: LabFieldBinding): boolean => {
  const rows = form[formKeyForSection(binding.section)] ?? [];
  return rows.some((r) => r.id === binding.id && r.result?.toString().trim().length > 0);
};

/** True when the form already holds a value for this clinical binding. */
export const isClinicalBindingFilled = (form: IClinicFormState, control: ClinicalControl): boolean => {
  const cr = form.clinicalRecord ?? {};
  switch (control) {
    case 'infectionType':
      return !!cr.suspectedInfectionType;
    case 'implantStability':
      return !!cr.implantStability;
    case 'sinusTract':
      // A boolean that has been explicitly set (true OR false) counts as answered.
      return cr.sinusTract === true || cr.sinusTract === false;
    case 'allergy':
      return form.medicalHistory?.isAllergy === true || form.medicalHistory?.isAllergy === false;
    case 'text':
    default:
      return !!(cr.notations && cr.notations.trim().length > 0);
  }
};

/** Culture criterion: at least two named culture samples. */
export const isCultureFilled = (form: IClinicFormState): boolean =>
  (form.cultureResults ?? []).filter((c) => (c.name ?? '').trim().length > 0).length >= 2;

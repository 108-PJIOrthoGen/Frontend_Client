import type { ExtractTargetGroup } from '@/types/extractImages';
import type { TestItem } from '@/types/types';

export type LabRole =
  | 'diagnostic_standard'
  | 'diagnostic_adjunct'
  | 'treatment_safety'
  | 'routine_support';

export interface CanonicalLab {
  id: string;
  field?: string;
  name: string;
  group: ExtractTargetGroup;
  aliases: string[];
  unit: string;
  normalRange: string;
  role: LabRole;
  pendingEligible: boolean;
}

export const CANONICAL_LABS: CanonicalLab[] = [
  { id: 'ht_1', name: 'WBC', group: 'hematologyTests', aliases: ['wbc', 'bach cau', 'white blood cell'], unit: 'G/L', normalRange: '', role: 'routine_support', pendingEligible: false },
  { id: 'ht_2', name: '%NEUT', group: 'hematologyTests', aliases: ['%neut', 'neut%', 'ty le bach cau trung tinh', 'neutrophil%'], unit: '%', normalRange: '40 - 74', role: 'routine_support', pendingEligible: false },
  { id: 'ht_3', name: '%LYMPH', group: 'hematologyTests', aliases: ['%lymph', 'lymph%', 'lymphocyte%'], unit: '%', normalRange: '19 - 48', role: 'routine_support', pendingEligible: false },
  { id: 'ht_4', name: '%MON', group: 'hematologyTests', aliases: ['%mon', '%mono', 'mon%', 'mono%'], unit: '%', normalRange: '3.4 - 9', role: 'routine_support', pendingEligible: false },
  { id: 'ht_5', name: '%EOS', group: 'hematologyTests', aliases: ['%eos', 'eos%', 'eosinophil%'], unit: '%', normalRange: '0 - 7', role: 'routine_support', pendingEligible: false },
  { id: 'ht_6', name: '%BASO', group: 'hematologyTests', aliases: ['%baso', 'baso%', 'basophil%'], unit: '%', normalRange: '0 - 1.5', role: 'routine_support', pendingEligible: false },
  { id: 'ht_8', name: '#NEUT', group: 'hematologyTests', aliases: ['#neut', 'neut#', 'absolute neutrophil'], unit: 'G/L', normalRange: '1.9 - 8', role: 'routine_support', pendingEligible: false },
  { id: 'ht_10', name: '#LYMPH', group: 'hematologyTests', aliases: ['#lymph', 'lymph#', 'absolute lymphocyte'], unit: 'G/L', normalRange: '0.9 - 5.2', role: 'routine_support', pendingEligible: false },
  { id: 'ht_11', name: '#MON', group: 'hematologyTests', aliases: ['#mon', '#mono', 'mon#', 'mono#'], unit: 'G/L', normalRange: '0.16 - 1', role: 'routine_support', pendingEligible: false },
  { id: 'ht_14', name: '#EOS', group: 'hematologyTests', aliases: ['#eos', 'eos#', 'absolute eosinophil'], unit: 'G/L', normalRange: '0 - 0.8', role: 'routine_support', pendingEligible: false },
  { id: 'ht_15', name: '#BASO', group: 'hematologyTests', aliases: ['#baso', 'baso#', 'absolute basophil'], unit: 'G/L', normalRange: '0 - 0.2', role: 'routine_support', pendingEligible: false },
  { id: 'ht_9', name: 'RBC', group: 'hematologyTests', aliases: ['rbc', 'hong cau'], unit: 'T/L', normalRange: '4.2 - 6', role: 'routine_support', pendingEligible: false },
  { id: 'ht_19', name: 'HGB', group: 'hematologyTests', aliases: ['hgb', 'hemoglobin', 'huyet sac to'], unit: 'g/L', normalRange: '130 - 170', role: 'routine_support', pendingEligible: false },
  { id: 'ht_21', name: 'HCT', group: 'hematologyTests', aliases: ['hct', 'hematocrit'], unit: 'L/L', normalRange: '0.335 - 0.45', role: 'routine_support', pendingEligible: false },
  { id: 'ht_12', name: 'MCV', group: 'hematologyTests', aliases: ['mcv'], unit: 'fL', normalRange: '79 - 97', role: 'routine_support', pendingEligible: false },
  { id: 'ht_13', name: 'MCH', group: 'hematologyTests', aliases: ['mch'], unit: 'pg', normalRange: '24 - 33', role: 'routine_support', pendingEligible: false },
  { id: 'ht_22', name: 'MCHC', group: 'hematologyTests', aliases: ['mchc'], unit: 'g/L', normalRange: '316 - 372', role: 'routine_support', pendingEligible: false },
  { id: 'ht_23', name: 'RDW', group: 'hematologyTests', aliases: ['rdw'], unit: '%', normalRange: '11.5 - 14.5', role: 'routine_support', pendingEligible: false },
  { id: 'ht_24', name: 'PLT', group: 'hematologyTests', aliases: ['plt', 'platelet', 'tieu cau'], unit: 'G/L', normalRange: '150 - 450', role: 'routine_support', pendingEligible: false },
  { id: 'ht_25', name: 'MPV', group: 'hematologyTests', aliases: ['mpv'], unit: 'fL', normalRange: '6 - 11', role: 'routine_support', pendingEligible: false },
  { id: 'ht_7', field: 'serum_ESR', name: 'Máu lắng (bằng máy tự động)', group: 'hematologyTests', aliases: ['esr', 'mau lang', 'toc do mau lang', 'mau lang bang may tu dong'], unit: 'mm', normalRange: '< 10', role: 'diagnostic_standard', pendingEligible: true },

  { id: 'bc_4', name: 'Định lượng Glucose', group: 'biochemistryTests', aliases: ['glucose', 'dinh luong glucose', 'duong huyet'], unit: 'mmol/l', normalRange: '4.1 - 5.6', role: 'routine_support', pendingEligible: false },
  { id: 'bc_5', name: 'Định lượng Urê máu', group: 'biochemistryTests', aliases: ['ure', 'ure mau', 'urea'], unit: 'mmol/l', normalRange: '2.8 - 7.2', role: 'routine_support', pendingEligible: false },
  { id: 'bc_6', field: 'renal_function', name: 'Định lượng Creatinin', group: 'biochemistryTests', aliases: ['creatinin', 'creatinine'], unit: 'µmol/l', normalRange: '59 - 104', role: 'treatment_safety', pendingEligible: true },
  { id: 'ht_20', field: 'renal_function', name: 'eGFR', group: 'biochemistryTests', aliases: ['egfr', 'estimated gfr'], unit: 'mL/min/1.73m²', normalRange: '>= 90', role: 'treatment_safety', pendingEligible: true },
  { id: 'bc_7', name: 'Định lượng Albumin', group: 'biochemistryTests', aliases: ['albumin', 'alb'], unit: 'g/L', normalRange: '35 - 52', role: 'routine_support', pendingEligible: false },
  { id: 'bc_8', field: 'liver_function', name: 'Hoạt độ AST', group: 'biochemistryTests', aliases: ['ast', 'got'], unit: 'U/L', normalRange: '35 - 52', role: 'treatment_safety', pendingEligible: true },
  { id: 'bc_9', field: 'liver_function', name: 'Hoạt độ ALT', group: 'biochemistryTests', aliases: ['alt', 'gpt'], unit: 'U/L', normalRange: '35 - 52', role: 'treatment_safety', pendingEligible: true },
  { id: 'bc_10', name: 'Na+', group: 'biochemistryTests', aliases: ['na+', 'natri', 'sodium'], unit: 'mmol/L', normalRange: '135 - 145', role: 'routine_support', pendingEligible: false },
  { id: 'bc_11', name: 'K+', group: 'biochemistryTests', aliases: ['k+', 'kali', 'potassium'], unit: 'mmol/L', normalRange: '3.5 - 5.0', role: 'routine_support', pendingEligible: false },
  { id: 'bc_12', name: 'Cl-', group: 'biochemistryTests', aliases: ['cl-', 'clo', 'chloride'], unit: 'mmol/L', normalRange: '', role: 'routine_support', pendingEligible: false },
  { id: 'bc_13', name: 'Định lượng HbA1c', group: 'biochemistryTests', aliases: ['hba1c'], unit: '%', normalRange: '4 - 6.2', role: 'routine_support', pendingEligible: false },

  { id: 'fa_1', name: 'Cấy khuẩn', group: 'fluidAnalysis', aliases: ['cay khuan', 'nuoi cay', 'vi khuan nuoi cay', 'culture'], unit: 'CFU/mL', normalRange: '', role: 'diagnostic_standard', pendingEligible: false },
  { id: 'fa_2', name: 'Nhuộm Gram', group: 'fluidAnalysis', aliases: ['nhuom gram', 'gram'], unit: '', normalRange: '', role: 'diagnostic_standard', pendingEligible: false },
  { id: 'fa_3', field: 'synovial_WBC', name: 'Bạch cầu (Dịch)', group: 'fluidAnalysis', aliases: ['bach cau dich', 'wbc dich', 'synovial wbc', 'bach cau trong dich khop'], unit: 'Tế bào/Vi trường', normalRange: '', role: 'diagnostic_standard', pendingEligible: true },
  { id: 'fa_5', field: 'synovial_CRP', name: 'Định lượng CRP (Dịch)', group: 'fluidAnalysis', aliases: ['crp dich', 'crp trong dich', 'synovial crp', 'dinh luong crp dich'], unit: 'mg/l', normalRange: '< 6.9', role: 'diagnostic_adjunct', pendingEligible: true },
  { id: 'fa_6', field: 'synovial_PMN', name: '%PMN (Dịch)', group: 'fluidAnalysis', aliases: ['%pmn', 'pmn%', 'pmn dich', 'synovial pmn', 'neutrophil dich'], unit: '%', normalRange: '', role: 'diagnostic_standard', pendingEligible: true },
  { id: 'fa_extra_alpha_defensin', field: 'synovial_alpha_defensin', name: 'Alpha Defensin (dịch)', group: 'fluidAnalysis', aliases: ['alpha defensin', 'alpha-defensin', 'alphadefensin', 'alpha defensin dich'], unit: 'ug/mL', normalRange: '< 0.12', role: 'diagnostic_adjunct', pendingEligible: true },
  { id: 'fa_extra_leukocyte_esterase', field: 'synovial_LE', name: 'Leukocyte Esterase (dịch)', group: 'fluidAnalysis', aliases: ['leukocyte esterase', 'leucocyte esterase', 'leukocyte esterase dich'], unit: 'LEU/µL', normalRange: '10 - 25', role: 'diagnostic_adjunct', pendingEligible: true },
];

export const labsForGroup = (group: ExtractTargetGroup): TestItem[] =>
  CANONICAL_LABS
    .filter((lab) => lab.group === group)
    .map(({ id, name, unit, normalRange }) => ({ id, name, unit, normalRange, result: '' }));

export const findLabById = (id: string): CanonicalLab | undefined =>
  CANONICAL_LABS.find((lab) => lab.id === id);

export const findPendingLab = (field: string): CanonicalLab | undefined =>
  CANONICAL_LABS.find((lab) => lab.pendingEligible && lab.field === field);

export const BIOCHEM_ID_TO_BACKEND_KEY: Record<string, string> = {
  bc_4: 'glucose',
  bc_5: 'ure',
  bc_6: 'creatinine',
  ht_20: 'eGFR',
  bc_7: 'albumin',
  bc_8: 'ast',
  bc_9: 'alt',
  bc_10: 'natri',
  bc_11: 'kali',
  bc_12: 'clo',
  bc_13: 'hba1c',
};

export const BIOCHEM_BACKEND_KEY_TO_ID = Object.fromEntries(
  Object.entries(BIOCHEM_ID_TO_BACKEND_KEY).map(([id, key]) => [key, id]),
) as Record<string, string>;

BIOCHEM_BACKEND_KEY_TO_ID.alb = 'bc_7';

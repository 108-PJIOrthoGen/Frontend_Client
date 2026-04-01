import { IClinicalRecord, ICultureResult, IMedicalHistory, ISurgery } from './backend';

export interface TestItem {
  id: string;
  name: string;
  result: string;
  normalRange: string;
  unit: string;
}

export interface TreatmentPlan {
  pathogen: string;
  resistance: string;
  ivDrug: string;
  ivDosage: string;
  ivDuration: string;
  oralDrug: string;
  oralDosage: string;
  oralDuration: string;
  citation: string;
  confidence: number;
}

export interface IClinicFormState {
  clinicalRecord: Partial<IClinicalRecord>;
  medicalHistory: Partial<IMedicalHistory>;
  surgeries: (Partial<ISurgery> & { _tempId?: string })[];
  cultureResults: (Partial<ICultureResult> & {
    _tempId?: string;
    sampleNumber?: number;
    antibioticed?: boolean;
    daysOffAntibio?: number | '';
  })[];
  formImages: { id: string; url: string; type: string; name: string; previewUrl?: string }[];
  imagingDescription: string;
  hematologyTests: TestItem[];
  biochemistryTests: TestItem[];
  fluidAnalysis: TestItem[];
  surgeryDate: string;
  isAcute: boolean;
}

export type RiskLevel = "Thấp" | "Trung bình" | "Cao";
export type SurgeryStatus = "Đề xuất" | "Bắt buộc" | "Tùy chọn";
export interface SurgeryStep {
  id: number;
  step: number;
  name: string;
  description: string;
  duration: string;
  surgeon: string;
  notes: string;
  risk: RiskLevel;
  status: SurgeryStatus;
}

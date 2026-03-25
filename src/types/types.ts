export interface CultureSample {
  id: string;
  sampleNumber: number;
  bacteriaName: string;
  incubation_days: number | '';
  used_antibiotic_before: boolean;
  days_off_antibiotic: number | '';
  gram_type: string;
  notes: string;
  result: 'POSITIVE' | 'NEGATIVE' | 'CONTAMINATED' | 'PENDING' | '';
}

export interface TestItem {
  id: string;
  name: string;
  result: string;
  normalRange: string;
  unit: string;
}

export interface ClinicalAssessment {
  major: {
    sinusTract: boolean;
    twoPositiveCultures: boolean;
  };
  examination?: {
    date_on_illness: string;
    whole_body: string;
    vessel: number | '';
    temperature: number | '';
    blood_press: string;
    breath: number | '';
    bmi: number | '';
    suspectedInfectionType?: string;
    softTissue?: string;
    implantStability?: string;
    prosthesisJoint?: string;
    daysSinceIndexArthroplasty?: number | '';
    notations?: string;
    hematogenousSuspected?: boolean;
    pmmaAllergy?: boolean;
  };
  symptoms: {
    fever: boolean;
    sinusTract: boolean;
    erythema: boolean;
    pain: boolean;
    swelling: boolean;
    hematogenousSuspected: boolean;
    pmmaAllergy: boolean;
  };
  imaging: {
    description: string;
    images: {
      id: string;
      url: string;
      type: 'X-ray' | 'CT' | 'Ultrasound';
      name: string;
    }[];
  };
  hematologyTests: TestItem[];
  biochemistryTests: TestItem[];
  fluidAnalysis: TestItem[];  // For Cấy khuẩn and Nhuộm Gram only
  cultureSamples: CultureSample[];
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
export interface SurgicalHistoryRow {
  id: string;
  surgeryDate: string;
  procedure: string;
  notes: string;
}

export interface RelatedCharacteristic {
  checked: boolean;
  note: string;
}

export interface Demographics {
  medicalHistory: string;
  pastMedicalHistory: string;
  antibioticHistory: string;
  surgeryDate: string;
  symptomDate: string;
  isAcute: boolean;
  dob: string;
  gender: string;
  relatedCharacteristics: {
    allergy: RelatedCharacteristic;
    drugs: RelatedCharacteristic;
    alcohol: RelatedCharacteristic;
    smoking: RelatedCharacteristic;
    other: RelatedCharacteristic;
  };
  surgicalHistory: SurgicalHistoryRow[];
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

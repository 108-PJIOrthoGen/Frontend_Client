export interface TemplateAntibiotic {
  antibioticName: string;
  dosage: string;
  frequency: string;
  route: string;
  role: string;
  notes: string;
}

export interface LocalPlanData {
  category: string;
  title: string;
  regimenName: string;
  indication: string;
  durationDays: number;
  durationNote: string;
  deliveryInfo: {
    deliveryMethod: string;
    spacerType: string;
    cementBrandSuggestion: string;
    mixingRatio: string;
  };
  antibiotics: TemplateAntibiotic[];
  monitoring: string[];
  contraindications: string[];
  notes: string;
}

export interface SystemicPhaseData {
  phaseName: string;
  phaseOrder: number;
  durationWeeks: number;
  durationNote: string;
  antibiotics: TemplateAntibiotic[];
}

export interface SystemicPlanData {
  category: string;
  title: string;
  regimenName: string;
  indication: string;
  totalDurationWeeks: number;
  phases: SystemicPhaseData[];
  monitoring: string[];
  contraindications: string[];
  notes: string;
}

export interface SurgeryStepData {
  stepOrder: number;
  stepName: string;
  description: string;
}

export interface SurgeryStageData {
  stageOrder: number;
  stageName: string;
  estimatedDurationMinutes: number;
}

export interface SurgeryPlanData {
  category: string;
  surgeryStrategyType: string;
  strategyRationale: string;
  priorityLevel: string;
  priorityNote: string;
  stages: SurgeryStageData[];
  estimatedTotalTreatmentTime: string;
  risksAndComplications: string[];
  notes: string;
}

export interface CitationData {
  sourceType: string;
  sourceTitle: string;
  sourceUri: string;
  snippet: string;
  relevanceScore: number;
  citedFor: string;
}


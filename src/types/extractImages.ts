export type ExtractImageJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExtractedTestValue {
  sourceName: string;
  value: string | number | null;
  unit?: string | null;
  referenceRange?: string | null;
  flag?: string | null;
  groupName?: string;
  collectedAt?: string;
  resultedAt?: string;
}

export interface ExtractedCultureValue {
  sourceName: string;
  result?: string;
  organismName?: string;
  gramType?: string;
  notes?: string;
}

export interface ExtractedMedicalResult {
  document?: {
    title?: string;
    hospital?: string;
    recordNumber?: string;
    examDate?: string;
  };
  patient?: {
    fullName?: string;
    age?: number;
    gender?: string;
  };
  tests: ExtractedTestValue[];
  cultures: ExtractedCultureValue[];
  raw?: unknown;
}

export interface IExtractImageJob {
  jobId: string;
  status: ExtractImageJobStatus;
  fileCount?: number;
  extracted?: Record<string, unknown>;
  error?: string;
}

export type ExtractTargetGroup =
  | 'hematologyTests'
  | 'biochemistryTests'
  | 'fluidAnalysis'
  | 'cultureResults';

export interface ExtractApplyCandidate {
  id: string;
  sourceName: string;
  targetGroup?: ExtractTargetGroup;
  targetId?: string;
  targetLabel?: string;
  extractedValue: string;
  currentValue?: string;
  unit?: string;
  referenceRange?: string;
  confidence: 'high' | 'medium' | 'low';
  selected: boolean;
  conflict: boolean;
}

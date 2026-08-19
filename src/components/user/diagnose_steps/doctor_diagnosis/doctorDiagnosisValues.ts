export const PJI_CONCLUSION_LABELS: Record<string, string> = {
  INFECTED: 'Nhiễm trùng khớp nhân tạo (PJI)',
  NOT_INFECTED: 'Không nhiễm trùng',
  INCONCLUSIVE: 'Chưa kết luận được',
};

export interface SystemDiagnosisSummary {
  pjiProbability?: string;
  overallAssessment?: string;
  primaryDiagnosis?: string;
  infectionClassification?: string;
  identifiedOrganism?: string;
}

interface DiagnosticPayload {
  assessmentJson?: unknown;
  itemJson?: unknown;
}

const parseRecord = (rawValue: unknown): Record<string, any> => {
  try {
    return typeof rawValue === 'string'
      ? JSON.parse(rawValue)
      : (rawValue as Record<string, any>) ?? {};
  } catch {
    return {};
  }
};

/** Map the rule-engine probability vocabulary onto the doctor conclusion vocabulary. */
export const systemConclusionOf = (pjiProbability?: string): string => {
  switch ((pjiProbability ?? '').toUpperCase()) {
    case 'DEFINITE':
    case 'INFECTED':
      return 'INFECTED';
    case 'UNLIKELY':
    case 'NOT_INFECTED':
      return 'NOT_INFECTED';
    default:
      return 'INCONCLUSIVE';
  }
};

export const systemDiagnosisOf = (diagnostic: DiagnosticPayload): SystemDiagnosisSummary => {
  const assessment = parseRecord(diagnostic.assessmentJson);
  const diagnosticJson = parseRecord(diagnostic.itemJson);
  const reasoning = diagnosticJson.ai_reasoning ?? diagnosticJson.aiReasoning ?? {};
  const identifiedOrganism = reasoning.identified_organism ?? reasoning.identifiedOrganism;

  return {
    pjiProbability: assessment.pji_probability ?? assessment.pjiProbability,
    overallAssessment: assessment.overall_assessment ?? assessment.overallAssessment,
    primaryDiagnosis: reasoning.primary_diagnosis ?? reasoning.primaryDiagnosis,
    infectionClassification: reasoning.infection_classification ?? reasoning.infectionClassification,
    identifiedOrganism: identifiedOrganism?.name,
  };
};

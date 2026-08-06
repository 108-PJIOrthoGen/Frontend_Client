export type CriterionStatus = 'unknown' | 'negative' | 'positive';

export type PjiDiagnosisConclusion =
  | 'INCOMPLETE'
  | 'INFECTED'
  | 'POSSIBLY_INFECTED'
  | 'NOT_INFECTED'
  | 'INCONCLUSIVE';

export interface DiagnosisCriterion {
  key: string;
  label: string;
  detail: string;
  points: number;
}

export interface PjiDiagnosisInput {
  major: Record<string, CriterionStatus>;
  minor: Record<string, CriterionStatus>;
  intraoperative: Record<string, CriterionStatus>;
}

export interface PjiDiagnosisResult {
  conclusion: PjiDiagnosisConclusion;
  phase: 'major' | 'preoperative' | 'combined';
  preoperativeScore: number;
  combinedScore?: number;
  completedPreoperativeCriteria: number;
  totalPreoperativeCriteria: number;
  positiveCriteria: DiagnosisCriterion[];
}

export const PJI_MAJOR_CRITERIA: DiagnosisCriterion[] = [
  {
    key: 'twoPositiveCultures',
    label: 'Hai mẫu cấy dương tính cùng một tác nhân',
    detail: 'Hai mẫu nuôi cấy riêng biệt phát hiện cùng một vi sinh vật.',
    points: 0,
  },
  {
    key: 'sinusTract',
    label: 'Đường rò thông với khớp hoặc thấy trực tiếp implant',
    detail: 'Sinus tract có bằng chứng thông với khớp hoặc nhìn thấy phục hình.',
    points: 0,
  },
];

export const PJI_MINOR_CRITERIA: DiagnosisCriterion[] = [
  {
    key: 'serumCrpOrDdimer',
    label: 'CRP huyết thanh hoặc D-dimer tăng',
    detail: 'CRP > 10 mg/L (1 mg/dL) hoặc D-dimer > 860 ng/mL.',
    points: 2,
  },
  {
    key: 'serumEsr',
    label: 'ESR tăng',
    detail: 'ESR > 30 mm/giờ.',
    points: 1,
  },
  {
    key: 'synovialWbcOrLe',
    label: 'WBC dịch khớp hoặc Leukocyte Esterase tăng',
    detail: 'WBC > 3.000 tế bào/µL hoặc Leukocyte Esterase mức ++.',
    points: 3,
  },
  {
    key: 'alphaDefensin',
    label: 'Alpha-defensin dịch khớp dương tính',
    detail: 'Tỷ lệ signal-to-cutoff > 1.',
    points: 3,
  },
  {
    key: 'synovialPmn',
    label: 'Tỷ lệ PMN dịch khớp tăng',
    detail: 'PMN > 80%.',
    points: 2,
  },
  {
    key: 'synovialCrp',
    label: 'CRP dịch khớp tăng',
    detail: 'CRP dịch khớp > 6,9 mg/L.',
    points: 1,
  },
];

export const PJI_INTRAOPERATIVE_CRITERIA: DiagnosisCriterion[] = [
  {
    key: 'positiveHistology',
    label: 'Mô bệnh học dương tính',
    detail: 'Kết quả mô học trong mổ phù hợp nhiễm trùng.',
    points: 3,
  },
  {
    key: 'purulence',
    label: 'Có mủ trong mổ',
    detail: 'Ghi nhận mủ tại vị trí phẫu thuật.',
    points: 3,
  },
  {
    key: 'singlePositiveCulture',
    label: 'Một mẫu cấy dương tính',
    detail: 'Chỉ một mẫu nuôi cấy trong mổ dương tính.',
    points: 2,
  },
];

const countCompleted = (
  criteria: DiagnosisCriterion[],
  values: Record<string, CriterionStatus>,
) => criteria.filter(criterion => values[criterion.key] !== 'unknown').length;

const positiveItems = (
  criteria: DiagnosisCriterion[],
  values: Record<string, CriterionStatus>,
) => criteria.filter(criterion => values[criterion.key] === 'positive');

const scoreItems = (criteria: DiagnosisCriterion[]) => (
  criteria.reduce((total, criterion) => total + criterion.points, 0)
);

export const createCriterionState = (
  criteria: DiagnosisCriterion[],
): Record<string, CriterionStatus> => Object.fromEntries(
  criteria.map(criterion => [criterion.key, 'unknown' as const]),
);

export const calculatePjiDiagnosis = (
  input: PjiDiagnosisInput,
): PjiDiagnosisResult => {
  const positiveMajor = positiveItems(PJI_MAJOR_CRITERIA, input.major);
  const positiveMinor = positiveItems(PJI_MINOR_CRITERIA, input.minor);
  const preoperativeScore = scoreItems(positiveMinor);
  const completedMajor = countCompleted(PJI_MAJOR_CRITERIA, input.major);
  const completedMinor = countCompleted(PJI_MINOR_CRITERIA, input.minor);
  const completedPreoperativeCriteria = completedMajor + completedMinor;
  const totalPreoperativeCriteria = PJI_MAJOR_CRITERIA.length + PJI_MINOR_CRITERIA.length;

  if (positiveMajor.length > 0) {
    return {
      conclusion: 'INFECTED',
      phase: 'major',
      preoperativeScore,
      completedPreoperativeCriteria,
      totalPreoperativeCriteria,
      positiveCriteria: [...positiveMajor, ...positiveMinor],
    };
  }

  // A known score of six or more is sufficient even if some lower-weight
  // criteria have not yet been entered.
  if (preoperativeScore >= 6) {
    return {
      conclusion: 'INFECTED',
      phase: 'preoperative',
      preoperativeScore,
      completedPreoperativeCriteria,
      totalPreoperativeCriteria,
      positiveCriteria: positiveMinor,
    };
  }

  if (completedPreoperativeCriteria < totalPreoperativeCriteria) {
    return {
      conclusion: 'INCOMPLETE',
      phase: 'preoperative',
      preoperativeScore,
      completedPreoperativeCriteria,
      totalPreoperativeCriteria,
      positiveCriteria: positiveMinor,
    };
  }

  if (preoperativeScore <= 1) {
    return {
      conclusion: 'NOT_INFECTED',
      phase: 'preoperative',
      preoperativeScore,
      completedPreoperativeCriteria,
      totalPreoperativeCriteria,
      positiveCriteria: positiveMinor,
    };
  }

  const completedIntraoperative = countCompleted(
    PJI_INTRAOPERATIVE_CRITERIA,
    input.intraoperative,
  );

  if (completedIntraoperative < PJI_INTRAOPERATIVE_CRITERIA.length) {
    return {
      conclusion: 'POSSIBLY_INFECTED',
      phase: 'preoperative',
      preoperativeScore,
      completedPreoperativeCriteria,
      totalPreoperativeCriteria,
      positiveCriteria: positiveMinor,
    };
  }

  const positiveIntraoperative = positiveItems(
    PJI_INTRAOPERATIVE_CRITERIA,
    input.intraoperative,
  );
  const combinedScore = preoperativeScore + scoreItems(positiveIntraoperative);
  const conclusion = combinedScore >= 6
    ? 'INFECTED'
    : combinedScore >= 4
      ? 'INCONCLUSIVE'
      : 'NOT_INFECTED';

  return {
    conclusion,
    phase: 'combined',
    preoperativeScore,
    combinedScore,
    completedPreoperativeCriteria,
    totalPreoperativeCriteria,
    positiveCriteria: [...positiveMinor, ...positiveIntraoperative],
  };
};

export type PjiRiskSex = 'female' | 'male';
export type PjiRiskInsurance = 'commercial' | 'government';
export type PjiRiskSurgery =
  | 'thaPrimary'
  | 'tkaPrimary'
  | 'thaRevision'
  | 'tkaRevision'
  | 'bothRevision';
export type PjiRiskPriorProcedures = 'none' | 'one' | 'two' | 'threeOrMore';

export interface PjiRiskInput {
  bmi?: number;
  sex?: PjiRiskSex;
  insurance?: PjiRiskInsurance;
  smoker?: boolean;
  drugAbuse?: boolean;
  surgery?: PjiRiskSurgery;
  priorProcedures?: PjiRiskPriorProcedures;
  comorbidities: string[];
}

export interface PjiRiskContribution {
  key: string;
  label: string;
  points: number;
}

export interface PjiRiskResult {
  rawScore: number;
  riskPercent: number;
  contributions: PjiRiskContribution[];
}

export const PJI_RISK_SURGERIES: Array<{
  value: PjiRiskSurgery;
  label: string;
  points: number;
}> = [
  { value: 'thaPrimary', label: 'THA nguyên phát', points: 18 },
  { value: 'tkaPrimary', label: 'TKA nguyên phát', points: 28 },
  { value: 'thaRevision', label: 'THA thay lại', points: 50 },
  { value: 'tkaRevision', label: 'TKA thay lại', points: 81 },
  { value: 'bothRevision', label: 'Thay lại cả THA và TKA', points: 87 },
];

export const PJI_RISK_PRIOR_PROCEDURES: Array<{
  value: PjiRiskPriorProcedures;
  label: string;
  points: number;
}> = [
  { value: 'none', label: 'Chưa từng phẫu thuật', points: 0 },
  { value: 'one', label: '1 lần trước đó', points: 60 },
  { value: 'two', label: '2 lần trước đó', points: 87 },
  { value: 'threeOrMore', label: 'Từ 3 lần trở lên', points: 100 },
];

export const PJI_RISK_COMORBIDITIES: Array<{
  value: string;
  label: string;
  points: number;
}> = [
  { value: 'coagulopathy', label: 'Rối loạn đông máu', points: 38 },
  { value: 'heartFailure', label: 'Suy tim sung huyết', points: 31 },
  { value: 'deficiencyAnemia', label: 'Thiếu máu do thiếu hụt', points: 19 },
  { value: 'diabetes', label: 'Đái tháo đường', points: 19 },
  { value: 'hivAids', label: 'HIV/AIDS', points: 49 },
  { value: 'liverDisease', label: 'Bệnh gan', points: 17 },
  { value: 'psychosis', label: 'Rối loạn loạn thần', points: 31 },
  { value: 'renalDisease', label: 'Bệnh thận', points: 35 },
  { value: 'rheumatologicDisease', label: 'Bệnh lý thấp khớp', points: 30 },
];

const findPoints = <T extends string>(
  options: Array<{ value: T; label: string; points: number }>,
  value: T,
) => options.find(option => option.value === value);

export const hasCompletePjiRiskInput = (
  input: PjiRiskInput,
): input is Required<Omit<PjiRiskInput, 'comorbidities'>> & Pick<PjiRiskInput, 'comorbidities'> => (
  typeof input.bmi === 'number'
  && Number.isFinite(input.bmi)
  && input.bmi > 0
  && input.sex != null
  && input.insurance != null
  && input.smoker != null
  && input.drugAbuse != null
  && input.surgery != null
  && input.priorProcedures != null
);

export const calculatePjiRisk = (input: PjiRiskInput): PjiRiskResult | null => {
  if (!hasCompletePjiRiskInput(input)) return null;

  const bmiPoints = Math.max(
    0,
    Math.round((0.0865 * input.bmi * input.bmi) - (5.072 * input.bmi) + 74.35),
  );
  const surgery = findPoints(PJI_RISK_SURGERIES, input.surgery);
  const priorProcedures = findPoints(PJI_RISK_PRIOR_PROCEDURES, input.priorProcedures);
  const selectedComorbidities = PJI_RISK_COMORBIDITIES.filter(
    item => input.comorbidities.includes(item.value),
  );

  const contributions: PjiRiskContribution[] = [
    { key: 'bmi', label: `BMI ${input.bmi}`, points: bmiPoints },
    { key: 'sex', label: input.sex === 'male' ? 'Nam' : 'Nữ', points: input.sex === 'male' ? 18 : 0 },
    {
      key: 'insurance',
      label: input.insurance === 'government' ? 'Bảo hiểm nhà nước' : 'Bảo hiểm thương mại',
      points: input.insurance === 'government' ? 7 : 0,
    },
    { key: 'smoker', label: input.smoker ? 'Có hút thuốc' : 'Không hút thuốc', points: input.smoker ? 10 : 0 },
    {
      key: 'drugAbuse',
      label: input.drugAbuse ? 'Có tiền sử lạm dụng chất' : 'Không lạm dụng chất',
      points: input.drugAbuse ? 62 : 0,
    },
    {
      key: 'surgery',
      label: surgery?.label ?? 'Loại phẫu thuật',
      points: surgery?.points ?? 0,
    },
    {
      key: 'priorProcedures',
      label: priorProcedures?.label ?? 'Phẫu thuật trước đó',
      points: priorProcedures?.points ?? 0,
    },
    ...selectedComorbidities.map(item => ({
      key: item.value,
      label: item.label,
      points: item.points,
    })),
  ];
  const rawScore = contributions.reduce((total, item) => total + item.points, 0);
  // Logistic conversion used by the ICM PJI Risk calculator derived from the
  // Tan et al. JBJS 2018 point model. Reference cases verified against the
  // official app: score 36 → 0.92%, score 446 → 99.75%.
  const riskPercent = 100 / (1 + Math.exp(-(-5.616 + (0.026 * rawScore))));

  return {
    rawScore,
    riskPercent: Number(
      Math.min(100, Math.max(0, riskPercent)).toFixed(2),
    ),
    contributions,
  };
};

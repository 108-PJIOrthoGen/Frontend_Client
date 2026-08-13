export type PjiDiagnosisConclusion =
  | 'INCOMPLETE'
  | 'NOT_APPLICABLE'
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

export type PjiCultureResult =
  | 'negative'
  | 'singlePositive'
  | 'multipleSameOrganism'
  | 'multipleDifferentOrganisms';

export type PjiLeukocyteEsterase =
  | 'notDone'
  | 'negative'
  | 'trace'
  | 'onePlus'
  | 'twoPlus';

export type PjiTernaryResult = 'notDone' | 'negative' | 'positive';

export interface PjiDiagnosisInput {
  previousArthroplasty?: boolean;
  sinusTract?: boolean;
  culturesPerformed?: boolean;
  cultureResult?: PjiCultureResult;
  daysSinceArthroplasty?: number;
  serumTests?: {
    esr?: number;
    crp?: number;
    dDimer?: number;
  };
  synovialTests?: {
    wbc?: number;
    pmn?: number;
  };
  leukocyteEsterase?: PjiLeukocyteEsterase;
  alphaDefensin?: PjiTernaryResult;
  histology?: PjiTernaryResult;
  purulence?: PjiTernaryResult;
}

export interface PjiDiagnosisResult {
  conclusion: PjiDiagnosisConclusion;
  phase: 'eligibility' | 'major' | 'preoperative' | 'combined';
  preoperativeScore: number;
  combinedScore?: number;
  positiveCriteria: DiagnosisCriterion[];
  isComplete: boolean;
  timing?: 'acute' | 'chronic';
  cautions: string[];
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
    detail: 'Cấp (<90 ngày): CRP > 100 mg/L. Mạn (≥90 ngày): CRP > 10 mg/L hoặc D-dimer > 860 ng/mL FEU.',
    points: 2,
  },
  {
    key: 'serumEsr',
    label: 'ESR tăng',
    detail: 'Không chấm ESR ở giai đoạn cấp. Giai đoạn mạn: ESR > 30 mm/giờ.',
    points: 1,
  },
  {
    key: 'synovialWbcLeOrAlphaDefensin',
    label: 'WBC dịch khớp, Leukocyte Esterase hoặc Alpha-defensin',
    detail: 'WBC > 10.000 tế bào/µL khi cấp hoặc > 3.000 tế bào/µL khi mạn; hoặc LE ++ / Alpha-defensin dương tính.',
    points: 3,
  },
  {
    key: 'synovialPmn',
    label: 'Tỷ lệ PMN dịch khớp tăng',
    detail: 'Giai đoạn cấp: PMN > 90%. Giai đoạn mạn: PMN > 80% theo tiêu chí đã thẩm định năm 2018.',
    points: 2,
  },
];

export const PJI_INTRAOPERATIVE_CRITERIA: DiagnosisCriterion[] = [
  {
    key: 'singlePositiveCulture',
    label: 'Một mẫu cấy dương tính',
    detail: 'Chỉ một mẫu nuôi cấy trong mổ dương tính.',
    points: 2,
  },
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
];

const scoreItems = (criteria: DiagnosisCriterion[]) => (
  criteria.reduce((total, criterion) => total + criterion.points, 0)
);

const criterionByKey = (criteria: DiagnosisCriterion[], key: string) => {
  const criterion = criteria.find(item => item.key === key);
  if (!criterion) throw new Error(`Unknown PJI criterion: ${key}`);
  return criterion;
};

const isFiniteNonNegative = (value: number | undefined): value is number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0
);

export const hasCompletePjiDiagnosisInput = (input: PjiDiagnosisInput): boolean => {
  if (input.previousArthroplasty === false) return true;
  if (input.previousArthroplasty !== true) return false;
  if (input.sinusTract == null) return false;
  if (input.culturesPerformed == null) return false;
  if (input.culturesPerformed && input.cultureResult == null) return false;
  if (!isFiniteNonNegative(input.daysSinceArthroplasty)) return false;
  if (input.serumTests == null || input.synovialTests == null) return false;
  return input.leukocyteEsterase != null
    && input.alphaDefensin != null
    && input.histology != null
    && input.purulence != null;
};

export const calculatePjiDiagnosis = (
  input: PjiDiagnosisInput,
): PjiDiagnosisResult => {
  if (input.previousArthroplasty == null) {
    return {
      conclusion: 'INCOMPLETE',
      phase: 'eligibility',
      preoperativeScore: 0,
      positiveCriteria: [],
      isComplete: false,
      cautions: [],
    };
  }

  if (input.previousArthroplasty === false) {
    return {
      conclusion: 'NOT_APPLICABLE',
      phase: 'eligibility',
      preoperativeScore: 0,
      positiveCriteria: [],
      isComplete: true,
      cautions: ['Tiêu chí này chỉ áp dụng cho khớp háng hoặc gối đã được thay khớp.'],
    };
  }

  const timing = isFiniteNonNegative(input.daysSinceArthroplasty)
    ? input.daysSinceArthroplasty < 90 ? 'acute' : 'chronic'
    : undefined;
  const positiveMajor: DiagnosisCriterion[] = [];
  if (input.sinusTract) {
    positiveMajor.push(criterionByKey(PJI_MAJOR_CRITERIA, 'sinusTract'));
  }
  if (input.culturesPerformed && input.cultureResult === 'multipleSameOrganism') {
    positiveMajor.push(criterionByKey(PJI_MAJOR_CRITERIA, 'twoPositiveCultures'));
  }

  if (positiveMajor.length > 0) {
    return {
      conclusion: 'INFECTED',
      phase: 'major',
      preoperativeScore: 0,
      positiveCriteria: positiveMajor,
      isComplete: true,
      timing,
      cautions: [],
    };
  }

  const cultureCautions = input.cultureResult === 'multipleDifferentOrganisms'
    ? ['Nhiều tác nhân khác nhau không thỏa tiêu chí chính “hai mẫu cùng một tác nhân” và cũng không được tự quy thành “một mẫu dương tính”; cần bác sĩ vi sinh đánh giá khả năng đa vi khuẩn hoặc nhiễm bẩn.']
    : [];

  const positiveMinor: DiagnosisCriterion[] = [];
  if (timing) {
    const crpPositive = isFiniteNonNegative(input.serumTests?.crp)
      && input.serumTests.crp > (timing === 'acute' ? 100 : 10);
    const dDimerPositive = timing === 'chronic'
      && isFiniteNonNegative(input.serumTests?.dDimer)
      && input.serumTests.dDimer > 860;
    if (crpPositive || dDimerPositive) {
      positiveMinor.push(criterionByKey(PJI_MINOR_CRITERIA, 'serumCrpOrDdimer'));
    }
    if (
      timing === 'chronic'
      && isFiniteNonNegative(input.serumTests?.esr)
      && input.serumTests.esr > 30
    ) {
      positiveMinor.push(criterionByKey(PJI_MINOR_CRITERIA, 'serumEsr'));
    }
    const wbcPositive = isFiniteNonNegative(input.synovialTests?.wbc)
      && input.synovialTests.wbc > (timing === 'acute' ? 10_000 : 3_000);
    if (
      wbcPositive
      || input.leukocyteEsterase === 'twoPlus'
      || input.alphaDefensin === 'positive'
    ) {
      // WBC, LE and alpha-defensin are alternative measurements of the same
      // three-point criterion and must never be added together.
      positiveMinor.push(criterionByKey(PJI_MINOR_CRITERIA, 'synovialWbcLeOrAlphaDefensin'));
    }
    if (
      isFiniteNonNegative(input.synovialTests?.pmn)
      && input.synovialTests.pmn > (timing === 'acute' ? 90 : 80)
    ) {
      positiveMinor.push(criterionByKey(PJI_MINOR_CRITERIA, 'synovialPmn'));
    }
  }

  const preoperativeScore = scoreItems(positiveMinor);
  const complete = hasCompletePjiDiagnosisInput(input);
  if (!complete) {
    return {
      conclusion: 'INCOMPLETE',
      phase: 'preoperative',
      preoperativeScore,
      positiveCriteria: positiveMinor,
      isComplete: false,
      timing,
      cautions: cultureCautions,
    };
  }

  if (preoperativeScore >= 6) {
    return {
      conclusion: 'INFECTED',
      phase: 'preoperative',
      preoperativeScore,
      positiveCriteria: positiveMinor,
      isComplete: true,
      timing,
      cautions: cultureCautions,
    };
  }

  if (preoperativeScore <= 1) {
    return {
      conclusion: 'NOT_INFECTED',
      phase: 'preoperative',
      preoperativeScore,
      positiveCriteria: positiveMinor,
      isComplete: true,
      timing,
      cautions: cultureCautions,
    };
  }

  const positiveIntraoperative: DiagnosisCriterion[] = [];
  if (
    input.culturesPerformed
    && input.cultureResult === 'singlePositive'
  ) {
    positiveIntraoperative.push(
      criterionByKey(PJI_INTRAOPERATIVE_CRITERIA, 'singlePositiveCulture'),
    );
  }
  if (input.histology === 'positive') {
    positiveIntraoperative.push(criterionByKey(PJI_INTRAOPERATIVE_CRITERIA, 'positiveHistology'));
  }
  if (input.purulence === 'positive') {
    positiveIntraoperative.push(criterionByKey(PJI_INTRAOPERATIVE_CRITERIA, 'purulence'));
  }
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
    positiveCriteria: [...positiveMinor, ...positiveIntraoperative],
    isComplete: true,
    timing,
    cautions: cultureCautions,
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

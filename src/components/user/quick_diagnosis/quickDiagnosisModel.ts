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

// ==========================================
// GENOMIC RESULTS INTERPRETATION TYPES
// ==========================================

export type PjiGenomicTechnology = 'targeted_qpcr' | 'ngs_16s' | 'both_qpcr_ngs';
export type PjiGenomicSpecimen = 'synovial_fluid' | 'periprosthetic_tissue' | 'sonication_fluid';
export type PjiGenomicDetection = 'negative' | 'positive' | 'notDone';
export type PjiGenomicMicrobialPattern = 'monomicrobial' | 'polymicrobial';
export type PjiGenomicAbundance = 'dominant' | 'moderate' | 'low_trace';
export type PjiGenomicOrganismGroup =
  | 'typical_high_virulence'
  | 'low_virulence_commensal'
  | 'fungal'
  | 'environmental_contaminant';

export type PjiGenomicAmrGene =
  | 'none'
  | 'mecA_mecC'
  | 'vanA_vanB'
  | 'carbapenemase'
  | 'erm_msr'
  | 'other';

export type PjiGenomicCultureConcordance =
  | 'concordant_same'
  | 'culture_negative'
  | 'discordant'
  | 'culture_not_done';

export type PjiGenomicClinicalSuspicion =
  | 'high_icm_positive'
  | 'intermediate'
  | 'low_aseptic';

export interface PjiGenomicInput {
  technology?: PjiGenomicTechnology;
  specimen?: PjiGenomicSpecimen;
  priorAntibiotics?: boolean;
  detection?: PjiGenomicDetection;
  microbialPattern?: PjiGenomicMicrobialPattern;
  abundance?: PjiGenomicAbundance;
  organismGroup?: PjiGenomicOrganismGroup;
  organismName?: string;
  amrGenes?: PjiGenomicAmrGene[];
  cultureConcordance?: PjiGenomicCultureConcordance;
  clinicalSuspicion?: PjiGenomicClinicalSuspicion;
}

export type PjiGenomicConclusion =
  | 'DEFINITE_PATHOGEN'
  | 'LIKELY_PATHOGEN_CULTURE_NEGATIVE'
  | 'POLYMICROBIAL_INFECTION'
  | 'POSSIBLE_CONTAMINATION'
  | 'NO_ORGANISM_DETECTED'
  | 'DISCORDANT_FINDINGS'
  | 'INCOMPLETE';

export type PjiGenomicConfidence = 'very_high' | 'high' | 'moderate' | 'low' | 'not_applicable';

export interface PjiGenomicResult {
  conclusion: PjiGenomicConclusion;
  confidence: PjiGenomicConfidence;
  title: string;
  summary: string;
  clinicalImplications: string[];
  antimicrobialGuidance: string[];
  recommendations: string[];
  cautions: string[];
  isComplete: boolean;
}

// ==========================================
// CROSS-VALIDATION / SYNTHESIS TYPES
// ==========================================

export type PjiCrossValidationScenario =
  | 'ICM_INFECTED_GENOMIC_POSITIVE'       // Kịch bản 1: Khẳng định PJI & Định danh căn nguyên vi sinh
  | 'ICM_NOT_INFECTED_GENOMIC_POSITIVE'   // Kịch bản 2: Cảnh báo Tạp nhiễm / Dương tính giả
  | 'ICM_INFECTED_GENOMIC_NEGATIVE'       // Kịch bản 3: Cảnh báo Âm tính giả của Genomic
  | 'ICM_NOT_INFECTED_GENOMIC_NEGATIVE'   // Kịch bản 4: Củng cố Lỏng khớp vô khuẩn
  | 'ICM_EQUIVOCAL_GENOMIC_CORRELATION'   // Kịch bản 5: Ca nghi ngờ (ICM 2-5 điểm)
  | 'GENOMIC_NOT_PERFORMED';              // Không làm xét nghiệm genomic

export interface PjiGenomicSynthesis {
  scenario: PjiCrossValidationScenario;
  scenarioTitle: string;
  scenarioBadge: string;
  scenarioType: 'success' | 'info' | 'warning' | 'error';
  summary: string;
  clinicalActions: string[];
  antimicrobialGuidance: string[];
  genomicDetail?: PjiGenomicResult;
}

export interface PjiDiagnosisInput {
  microgenTesting?: PjiGenomicInput; // Câu 1 trong luồng Interpret Genomic Results
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
  genomicSynthesis?: PjiGenomicSynthesis;
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

// ==========================================
// GENOMIC EVALUATION ENGINE
// ==========================================

export const calculatePjiGenomicInterpretation = (input: PjiGenomicInput): PjiGenomicResult => {
  if (!input.detection || input.detection === 'notDone') {
    return {
      conclusion: 'INCOMPLETE',
      confidence: 'not_applicable',
      title: 'Chưa có xét nghiệm genomic',
      summary: 'Không có dữ liệu xét nghiệm phân tử/genomic.',
      clinicalImplications: [],
      antimicrobialGuidance: [],
      recommendations: [],
      cautions: [],
      isComplete: false,
    };
  }

  // CASE 1: Negative genomic result
  if (input.detection === 'negative') {
    const isHighSuspicion = input.clinicalSuspicion === 'high_icm_positive';
    const cautions: string[] = [];

    if (input.priorAntibiotics) {
      cautions.push('Bệnh nhân đã dùng kháng sinh trước lấy mẫu: Mặc dù NGS nhạy hơn nuôi cấy khi có kháng sinh, tải lượng DNA quá thấp vẫn có thể dẫn tới kết quả âm tính dưới ngưỡng phát hiện (LOD).');
    }
    if (isHighSuspicion) {
      cautions.push('Lâm sàng hoặc tiêu chí ICM 2018 nghi ngờ cao / dương tính: Kết quả genomic âm tính KHÔNG được dùng để loại trừ PJI khi có đường rò, mủ hoặc các chỉ số sinh học (CRP, WBC, PMN) tăng rõ rệt.');
    }

    const confidence: PjiGenomicConfidence = input.clinicalSuspicion === 'low_aseptic' ? 'high' : 'moderate';

    return {
      conclusion: 'NO_ORGANISM_DETECTED',
      confidence,
      title: 'Không phát hiện tín hiệu DNA vi sinh vật vượt ngưỡng',
      summary: isHighSuspicion
        ? 'Genomic âm tính nhưng lâm sàng / chỉ điểm sinh học nghi ngờ cao. Cần thận trọng đánh giá nguyên nhân âm tính giả (ức chế PCR, tải lượng dưới ngưỡng, chất lượng mẫu).'
        : 'Kết quả phân tử âm tính, phù hợp với chẩn đoán nguy cơ nhiễm trùng thấp hoặc lỏng khớp vô khuẩn.',
      clinicalImplications: [
        'Không phát hiện DNA vi khuẩn (16S rRNA) hoặc vi nấm (ITS) vượt ngưỡng cắt tín hiệu nền.',
        isHighSuspicion
          ? 'Không tự động ngưng các biện pháp can thiệp nếu tiêu chuẩn ICM 2018 hoặc bằng chứng mổ xác định PJI.'
          : 'Ủng hộ khả năng không nhiễm trùng hoặc lỏng khớp vô khuẩn.',
      ],
      antimicrobialGuidance: [
        'Nếu không có bằng chứng nhiễm trùng lâm sàng, tránh lạm dụng kháng sinh phổ rộng theo kinh nghiệm kéo dài.',
      ],
      recommendations: [
        'Đối chiếu với kết quả nuôi cấy kéo dài (14 ngày đối với C. acnes / vi khuẩn kỵ khí).',
        'Kiểm tra lại toàn bộ tiêu chuẩn ICM 2018 trước khi đưa ra quyết định phẫu thuật hay điều trị.',
        ...(isHighSuspicion ? ['Cân nhắc lấy lại mẫu mô màng hoạt dịch trong mổ nếu triệu chứng viêm vẫn tiến triển.'] : []),
      ],
      cautions,
      isComplete: true,
    };
  }

  // CASE 2: Positive genomic result
  const isDominant = input.abundance === 'dominant';
  const isLowTrace = input.abundance === 'low_trace';
  const isHighVirulence = input.organismGroup === 'typical_high_virulence';
  const isCommensal = input.organismGroup === 'low_virulence_commensal';
  const isFungal = input.organismGroup === 'fungal';
  const isEnvironmental = input.organismGroup === 'environmental_contaminant';
  const isConcordant = input.cultureConcordance === 'concordant_same';
  const isCultureNeg = input.cultureConcordance === 'culture_negative';
  const isDiscordant = input.cultureConcordance === 'discordant';
  const isPolymicrobial = input.microbialPattern === 'polymicrobial';
  const isAsepticSuspicion = input.clinicalSuspicion === 'low_aseptic';
  const isHighIcm = input.clinicalSuspicion === 'high_icm_positive';

  let conclusion: PjiGenomicConclusion = 'DEFINITE_PATHOGEN';
  let confidence: PjiGenomicConfidence = 'high';
  let title = 'Phát hiện tác nhân vi sinh vật có ý nghĩa lâm sàng';
  let summary = '';

  if (isEnvironmental || (isCommensal && isLowTrace && isAsepticSuspicion)) {
    conclusion = 'POSSIBLE_CONTAMINATION';
    confidence = 'low';
    title = 'Nghi ngờ tạp nhiễm hoặc vi khuẩn thường trú nồng độ vết';
    summary = 'Tác nhân phát hiện có tỷ lệ đọc thấp (<20%) hoặc thuộc nhóm vi sinh vật môi trường/da, không tương quan với biểu hiện lâm sàng viêm.';
  } else if (isDiscordant) {
    conclusion = 'DISCORDANT_FINDINGS';
    confidence = 'moderate';
    title = 'Kết quả genomic không đồng nhất với nuôi cấy vi sinh';
    summary = 'Tác nhân giải trình tự gen khác với kết quả mọc cấy vi sinh truyền thống. Cần hội chẩn chuyên khoa Vi sinh và Truyền nhiễm.';
  } else if (isPolymicrobial) {
    conclusion = 'POLYMICROBIAL_INFECTION';
    confidence = isDominant || isConcordant || isHighIcm ? 'high' : 'moderate';
    title = 'Phát hiện tín hiệu nhiễm trùng đa vi sinh vật (Polymicrobial)';
    summary = 'Báo cáo genomic phát hiện từ 2 loài vi sinh vật trở lên. Cần phân biệt giữa nhiễm đa khuẩn thực sự và tạp nhiễm trong quá trình lấy/xử lý mẫu.';
  } else if (isCultureNeg) {
    conclusion = 'LIKELY_PATHOGEN_CULTURE_NEGATIVE';
    confidence = isDominant && (isHighVirulence || isHighIcm) ? 'high' : 'moderate';
    title = 'Phát hiện tác nhân tiềm tàng ở ca PJI cấy âm tính (Culture-Negative PJI)';
    summary = 'Genomic xác định được vi sinh vật chiếm ưu thế ở bệnh nhân có nuôi cấy âm tính (rất hữu ích khi đã dùng kháng sinh hoặc vi khuẩn khó nuôi cấy).';
  } else if (isConcordant) {
    conclusion = 'DEFINITE_PATHOGEN';
    confidence = 'very_high';
    title = 'Tác nhân gây bệnh xác định (Độ tin cậy rất cao)';
    summary = 'Kết quả genomic hoàn toàn trùng khớp với tác nhân phân lập được từ nuôi cấy vi sinh và phù hợp với tiêu chuẩn chẩn đoán lâm sàng.';
  } else {
    conclusion = 'DEFINITE_PATHOGEN';
    confidence = isDominant && isHighVirulence ? 'high' : 'moderate';
    title = 'Tác nhân có khả năng cao là nguyên nhân gây bệnh';
    summary = 'Tác nhân có tỷ lệ phong phú cao, độc lực phù hợp với bệnh cảnh nhiễm trùng khớp nhân tạo.';
  }

  const clinicalImplications: string[] = [];
  if (isDominant) {
    clinicalImplications.push('Tác nhân chiếm ưu thế lớn (>50% tổng số reads), củng cố mạnh mẽ vai trò là căn nguyên gây bệnh chính.');
  } else if (isLowTrace) {
    clinicalImplications.push('Tỷ lệ đọc thấp (<20%), cần cảnh giác khả năng tạp nhiễm từ da hoặc môi trường phòng xét nghiệm.');
  }

  if (isFungal) {
    clinicalImplications.push('Phát hiện vi nấm (Candida / Aspergillus): Nhiễm nấm quanh khớp nhân tạo là thể hiếm nhưng nghiêm trọng, đòi hỏi phác đồ kháng nấm đặc hiệu kéo dài và thường cần phẫu thuật 2 thì.');
  }

  if (isPolymicrobial) {
    clinicalImplications.push('Nhiễm trùng đa vi sinh vật thường liên quan đến đường rò mạn tính, can thiệp phẫu thuật nhiều lần hoặc mô mềm quanh khớp bị tổn thương nặng.');
  }

  if (isCultureNeg && input.priorAntibiotics) {
    clinicalImplications.push('Kháng sinh trước lấy mẫu ức chế nuôi cấy nhưng NGS vẫn nhận diện được DNA vi sinh vật, mở ra cơ hội tối ưu hóa kháng sinh đích.');
  }

  const amrList = input.amrGenes ?? [];
  const antimicrobialGuidance: string[] = [];

  if (amrList.includes('mecA_mecC')) {
    antimicrobialGuidance.push('⚠️ mecA / mecC dương tính: Đề kháng Methicillin/Oxacillin (MRSA/MRSE). Chống chỉ định dùng kháng sinh nhóm Beta-lactam thông thường (Oxacillin, Cefazolin). Ưu tiên Vancomycin, Daptomycin hoặc Teicoplanin.');
  }
  if (amrList.includes('vanA_vanB')) {
    antimicrobialGuidance.push('⚠️ vanA / vanB dương tính: Đề kháng Vancomycin (VRE). Xem xét Linezolid, Daptomycin liều cao (8-10 mg/kg) hoặc Tigecycline theo tư vấn chuyên gia Truyền nhiễm.');
  }
  if (amrList.includes('carbapenemase')) {
    antimicrobialGuidance.push('🚨 Carbapenemase dương tính (CRE): Đề kháng toàn bộ nhóm Carbapenem. Cần hội chẩn khẩn với Chuyên khoa Truyền nhiễm để chỉ định Ceftazidime-Avibactam, Meropenem-Vaborbactam hoặc phối hợp Colistin.');
  }
  if (amrList.includes('erm_msr')) {
    antimicrobialGuidance.push('⚠️ erm / msr dương tính: Đề kháng nhóm Macrolide-Lincosamide (MLSb). Cảnh giác nguy cơ thất bại điều trị khi dùng Clindamycin.');
  }
  if (amrList.includes('other')) {
    antimicrobialGuidance.push('Phát hiện các gen kháng thuốc khác (Fluoroquinolone / Aminoglycoside). Cần đối chiếu với kháng sinh đồ kiểu hình (phenotypic AST) nếu có.');
  }
  if (amrList.includes('none') || amrList.length === 0) {
    antimicrobialGuidance.push('Không phát hiện các gen kháng thuốc phổ biến trên panel. Vẫn cần theo dõi đáp ứng lâm sàng và kháng sinh đồ nuôi cấy kinh điển nếu có.');
  }

  const recommendations: string[] = [
    'Luôn hội chẩn với Bác sĩ chuyên khoa Bệnh Truyền nhiễm (Infectious Diseases) và Bác sĩ Vi sinh để lựa chọn phác đồ đích phù hợp.',
    'Đối chiếu kết quả phân tử với toàn bộ tiêu chí ICM 2018 (CRP, ESR, D-dimer, WBC dịch khớp, PMN%, mô bệnh học).',
    'Tham khảo hướng dẫn điều trị chuẩn (Sanford Guide, IDSA PJI Guidelines, Hướng dẫn Bộ Y tế).',
  ];

  const cautions: string[] = [
    'Xét nghiệm genomic/NGS là công cụ hỗ trợ quyết định chẩn đoán và xác định căn nguyên vi sinh, không thay thế hoàn toàn tiêu chuẩn định nghĩa PJI ICM 2018.',
    'Sự hiện diện của DNA vi sinh vật không khẳng định 100% vi khuẩn còn sống hoặc đang hoạt động gây bệnh nếu thiếu tương quan lâm sàng.',
  ];

  return {
    conclusion,
    confidence,
    title,
    summary,
    clinicalImplications,
    antimicrobialGuidance,
    recommendations,
    cautions,
    isComplete: true,
  };
};

// ==========================================
// SYNTHESIS & CROSS-VALIDATION ENGINE
// ==========================================

const synthesizeIcmAndGenomic = (
  icmConclusion: PjiDiagnosisConclusion,
  genomicInput?: PjiGenomicInput,
): PjiGenomicSynthesis | undefined => {
  if (!genomicInput || !genomicInput.detection || genomicInput.detection === 'notDone') {
    return undefined;
  }

  const isGenomicPositive = genomicInput.detection === 'positive';
  const isGenomicNegative = genomicInput.detection === 'negative';
  const genomicDetail = calculatePjiGenomicInterpretation(genomicInput);

  // Kịch bản 1: ICM Nhiễm + MicroGen Dương tính
  if (icmConclusion === 'INFECTED' && isGenomicPositive) {
    return {
      scenario: 'ICM_INFECTED_GENOMIC_POSITIVE',
      scenarioTitle: 'Khẳng định Nhiễm trùng PJI & Xác nhận Căn nguyên Vi sinh',
      scenarioBadge: 'PJI Xác Định + Căn Nguyên Đích',
      scenarioType: 'error',
      summary: 'Bệnh nhân thỏa tiêu chuẩn chẩn đoán ICM 2018 (Nhiễm PJI) và xét nghiệm phân tử MicroGen phát hiện DNA vi sinh vật. Kết quả phân tử củng cố mạnh mẽ vai trò định danh tác nhân đích xác và định hướng kháng sinh nhạy cảm.',
      clinicalActions: [
        'Tiến hành can thiệp phẫu thuật điều trị PJI (cắt lọc bảo tồn DAIR hoặc thay lại khớp 1 thì / 2 thì).',
        'Sử dụng kết quả định danh loài và gen kháng thuốc (AMR) để chỉ định kháng sinh đích.',
        'Hội chẩn chuyên khoa Bệnh Truyền nhiễm (ID) để tối ưu hóa liều và thời gian dùng kháng sinh.',
      ],
      antimicrobialGuidance: genomicDetail.antimicrobialGuidance,
      genomicDetail,
    };
  }

  // Kịch bản 2: ICM Không nhiễm + MicroGen Dương tính (Cảnh báo Tạp nhiễm)
  if (icmConclusion === 'NOT_INFECTED' && isGenomicPositive) {
    return {
      scenario: 'ICM_NOT_INFECTED_GENOMIC_POSITIVE',
      scenarioTitle: 'Cảnh báo Nguy cơ Tạp nhiễm / Vi khuẩn thường trú nồng độ thấp',
      scenarioBadge: 'Nghi Tạp Nhiễm (Contamination)',
      scenarioType: 'warning',
      summary: 'Điểm số và chỉ số sinh học của định nghĩa ICM 2018 hoàn toàn nằm trong ngưỡng KHÔNG nhiễm trùng, nhưng xét nghiệm MicroGen ghi nhận tín hiệu DNA. Cần đặc biệt thận trọng với nguy cơ tạp nhiễm phòng xét nghiệm hoặc phát hiện DNA vi sinh vật thoái hóa không còn hoạt tính. KHÔNG vội vã chỉ định phẫu thuật thay lại nhiễm trùng hoặc dùng kháng sinh kéo dài.',
      clinicalActions: [
        'Đánh giá lại triệu chứng cơ năng và khám lâm sàng thực thể.',
        'Tránh lạm dụng kháng sinh kéo dài nếu người bệnh không có triệu chứng viêm lâm sàng.',
        'Kiểm tra tỷ lệ đọc (% abundance): Nếu <20% của vi khuẩn da (CoNS, Corynebacterium), nhiều khả năng là tạp nhiễm.',
        'Theo dõi lâm sàng định kỳ hoặc chọc hút lại nếu triệu chứng đau khớp tái phát.',
      ],
      antimicrobialGuidance: [
        'Không khuyến cáo sử dụng kháng sinh phổ rộng theo kinh nghiệm kéo dài khi các chỉ số viêm huyết thanh và dịch khớp bình thường.',
      ],
      genomicDetail,
    };
  }

  // Kịch bản 3: ICM Nhiễm + MicroGen Âm tính (Cảnh báo Âm tính giả của Genomic)
  if (icmConclusion === 'INFECTED' && isGenomicNegative) {
    return {
      scenario: 'ICM_INFECTED_GENOMIC_NEGATIVE',
      scenarioTitle: 'Cảnh báo Âm tính giả của Phân tử — Vẫn điều trị PJI theo ICM 2018',
      scenarioBadge: 'PJI (Genomic Âm Giả)',
      scenarioType: 'error',
      summary: 'Bệnh nhân thỏa tiêu chuẩn vàng ICM 2018 (đường rò thông khớp hoặc tổng điểm ≥ 6), nhưng xét nghiệm MicroGen âm tính. Kết quả genomic âm tính KHÔNG được dùng để bác bỏ chẩn đoán PJI đã xác định.',
      clinicalActions: [
        'Vẫn tiến hành phác đồ điều trị PJI đầy đủ theo tiêu chuẩn ICM 2018.',
        'Xét các nguyên nhân âm tính giả: Ức chế phản ứng PCR, tải lượng vi khuẩn dưới ngưỡng phát hiện (LOD), lấy mẫu chưa đúng vị trí biofilm, hoặc bảo quản mẫu không đạt chuẩn.',
        'Lấy lại mẫu mô màng hoạt dịch trong mổ để nuôi cấy kéo dài (14 ngày đối với vi khuẩn kỵ khí).',
      ],
      antimicrobialGuidance: [
        'Chỉ định kháng sinh theo kinh nghiệm bao phủ Gram dương (kể cả MRSA) và trực khuẩn Gram âm trong khi chờ kết quả nuôi cấy trong mổ.',
      ],
      genomicDetail,
    };
  }

  // Kịch bản 4: ICM Không nhiễm + MicroGen Âm tính (Củng cố Lỏng khớp vô khuẩn)
  if (icmConclusion === 'NOT_INFECTED' && isGenomicNegative) {
    return {
      scenario: 'ICM_NOT_INFECTED_GENOMIC_NEGATIVE',
      scenarioTitle: 'Củng cố Chẩn đoán Lỏng khớp vô khuẩn (Aseptic Loosening)',
      scenarioBadge: 'Lỏng Khớp Vô Khuẩn',
      scenarioType: 'success',
      summary: 'Cả tiêu chuẩn lâm sàng/sinh học ICM 2018 và xét nghiệm vi sinh phân tử MicroGen đều âm tính. Củng cố vững chắc chẩn đoán tổn thương cơ học hoặc lỏng khớp vô khuẩn.',
      clinicalActions: [
        'An tâm lập kế hoạch thay lại khớp vô khuẩn theo nguyên nhân cơ học.',
        'Không cần chỉ định kháng sinh điều trị nhiễm trùng.',
      ],
      antimicrobialGuidance: [
        'Chỉ sử dụng kháng sinh dự phòng chu phẫu thông thường theo phẫu thuật chỉnh hình sạch.',
      ],
      genomicDetail,
    };
  }

  // Kịch bản 5: ICM Nghi ngờ / Chưa kết luận (2-5 điểm)
  return {
    scenario: 'ICM_EQUIVOCAL_GENOMIC_CORRELATION',
    scenarioTitle: 'Ca bệnh Nghi ngờ / Giáp ranh — Cần đánh giá đa chuyên khoa',
    scenarioBadge: 'Nghi Ngờ / Giáp Ranh',
    scenarioType: 'warning',
    summary: 'Điểm số tiền phẫu/trong mổ nằm ở vùng giáp ranh (2–5 điểm). Kết quả MicroGen cung cấp thêm dữ liệu tham khảo nhưng cần kết hợp chặt chẽ với diễn tiến lâm sàng và các xét nghiệm bổ sung.',
    clinicalActions: [
      'Hội chẩn hội đồng đa chuyên khoa (Chấn thương chỉnh hình, Bệnh truyền nhiễm, Vi sinh).',
      'Cân nhắc chọc hút lại dịch khớp hoặc làm thêm Alpha-defensin / mô bệnh học trong mổ.',
    ],
    antimicrobialGuidance: genomicDetail.antimicrobialGuidance,
    genomicDetail,
  };
};

// ==========================================
// MAIN PJI DIAGNOSIS CALCULATION
// ==========================================

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
      genomicSynthesis: synthesizeIcmAndGenomic('NOT_APPLICABLE', input.microgenTesting),
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
      genomicSynthesis: synthesizeIcmAndGenomic('INFECTED', input.microgenTesting),
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
      genomicSynthesis: synthesizeIcmAndGenomic('INFECTED', input.microgenTesting),
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
      genomicSynthesis: synthesizeIcmAndGenomic('NOT_INFECTED', input.microgenTesting),
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
    genomicSynthesis: synthesizeIcmAndGenomic(conclusion, input.microgenTesting),
  };
};

// ==========================================
// PJI RISK CALCULATOR MODEL & LOGIC
// ==========================================

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
  const riskPercent = 100 / (1 + Math.exp(-(-5.616 + (0.026 * rawScore))));

  return {
    rawScore,
    riskPercent: Number(
      Math.min(100, Math.max(0, riskPercent)).toFixed(2),
    ),
    contributions,
  };
};

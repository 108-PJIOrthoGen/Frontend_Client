import type {
  PjiCultureResult,
  PjiDiagnosisConclusion,
  PjiLeukocyteEsterase,
  PjiTernaryResult,
} from '../quickDiagnosisModel';

export type DiagnosisQuestionId =
  | 'microgenTesting'
  | 'previousArthroplasty'
  | 'sinusTract'
  | 'culturesPerformed'
  | 'cultureResult'
  | 'daysSinceArthroplasty'
  | 'serumTests'
  | 'synovialTests'
  | 'leukocyteEsterase'
  | 'alphaDefensin'
  | 'histology'
  | 'purulence';

export const BASE_DIAGNOSIS_QUESTIONS: DiagnosisQuestionId[] = [
  'previousArthroplasty',
  'sinusTract',
  'culturesPerformed',
  'daysSinceArthroplasty',
  'serumTests',
  'synovialTests',
  'leukocyteEsterase',
  'alphaDefensin',
  'histology',
  'purulence',
];

export const BASE_GENOMIC_DIAGNOSIS_QUESTIONS: DiagnosisQuestionId[] = [
  'microgenTesting',
  'previousArthroplasty',
  'sinusTract',
  'culturesPerformed',
  'daysSinceArthroplasty',
  'serumTests',
  'synovialTests',
  'leukocyteEsterase',
  'alphaDefensin',
  'histology',
  'purulence',
];

export const CONCLUSION_COPY: Record<PjiDiagnosisConclusion, {
  label: string;
  description: string;
  alertType: 'info' | 'success' | 'warning' | 'error';
  color: string;
}> = {
  INCOMPLETE: {
    label: 'Dữ liệu chưa đủ để phân loại',
    description: 'Tiếp tục trả lời các câu hỏi. Điểm đang hiển thị chưa phải là kết luận.',
    alertType: 'info',
    color: '#475569',
  },
  NOT_APPLICABLE: {
    label: 'Không áp dụng tiêu chí PJI này',
    description: 'Thuật toán ICM 2018 này chỉ áp dụng cho khớp háng hoặc gối đã được thay khớp.',
    alertType: 'warning',
    color: '#b45309',
  },
  INFECTED: {
    label: 'Phân loại: Nhiễm PJI',
    description: 'Đã thỏa tiêu chí chính hoặc đạt ngưỡng điểm của định nghĩa PJI 2018.',
    alertType: 'error',
    color: '#dc2626',
  },
  POSSIBLY_INFECTED: {
    label: 'Có thể nhiễm PJI',
    description: 'Điểm tiền phẫu 2–5 cần được kết hợp với dữ liệu trong mổ.',
    alertType: 'warning',
    color: '#b45309',
  },
  NOT_INFECTED: {
    label: 'Phân loại: Không nhiễm PJI',
    description: 'Không thỏa tiêu chí chính và tổng điểm nằm trong ngưỡng không nhiễm.',
    alertType: 'success',
    color: '#047857',
  },
  INCONCLUSIVE: {
    label: 'Phân loại: Chưa thể kết luận',
    description: 'Tổng điểm phối hợp là 4–5; cần đánh giá lâm sàng và xét nghiệm bổ sung.',
    alertType: 'warning',
    color: '#b45309',
  },
};

export const TERNARY_OPTIONS: Array<{ label: string; value: PjiTernaryResult }> = [
  { label: 'Không thực hiện / chưa có', value: 'notDone' },
  { label: 'Âm tính', value: 'negative' },
  { label: 'Dương tính', value: 'positive' },
];

export const CULTURE_RESULT_OPTIONS: Array<{ value: PjiCultureResult; label: string }> = [
  { value: 'negative', label: 'Tất cả mẫu cấy âm tính' },
  { value: 'singlePositive', label: 'Một mẫu cấy dương tính' },
  { value: 'multipleSameOrganism', label: 'Từ 2 mẫu dương tính với cùng một tác nhân' },
  { value: 'multipleDifferentOrganisms', label: 'Từ 2 mẫu dương tính với các tác nhân khác nhau' },
];

export const LEUKOCYTE_ESTERASE_OPTIONS: Array<{ label: string; value: PjiLeukocyteEsterase }> = [
  { label: 'Không thực hiện', value: 'notDone' },
  { label: 'Âm tính (−)', value: 'negative' },
  { label: 'Vết (trace)', value: 'trace' },
  { label: 'Dương tính (+)', value: 'onePlus' },
  { label: 'Dương tính mạnh (++)', value: 'twoPlus' },
];

export const SERUM_TESTS_CONFIG = [
  { key: 'esr', label: 'ESR', unit: 'mm/giờ' },
  { key: 'crp', label: 'CRP', unit: 'mg/L' },
  { key: 'dDimer', label: 'D-dimer', unit: 'ng/mL FEU' },
] as const;

export const SYNOVIAL_TESTS_CONFIG = [
  { key: 'wbc', label: 'WBC dịch khớp', unit: 'tế bào/µL' },
  { key: 'pmn', label: 'PMN dịch khớp', unit: '%' },
] as const;

export const DIAGNOSIS_QUESTION_COPY: Record<DiagnosisQuestionId, { title: string; description?: string }> = {
  microgenTesting: {
    title: '1. Kết quả xét nghiệm MicroGen Testing (qPCR / NGS) là gì?',
    description: 'Nhập kết quả xét nghiệm vi sinh phân tử. Kết quả này sẽ được đối chiếu chéo với toàn bộ tiêu chuẩn ICM 2018 bên dưới.',
  },
  previousArthroplasty: {
    title: '2. Người bệnh đã từng thay khớp háng hoặc khớp gối chưa?',
    description: 'Định nghĩa PJI 2018 ở đây chỉ dành cho nhiễm trùng quanh khớp nhân tạo háng và gối.',
  },
  sinusTract: {
    title: '3. Có đường rò thông với khớp nhân tạo hoặc nhìn thấy trực tiếp vật liệu cấy ghép không?',
    description: 'Đường rò phải có bằng chứng thông với khớp; đây là một tiêu chí chính của định nghĩa ICM.',
  },
  culturesPerformed: {
    title: '4. Đã thực hiện nuôi cấy vi sinh mô hoặc dịch khớp chưa?',
    description: 'Chỉ chọn “Có” khi đã có kết quả cấy để phân loại số mẫu và tác nhân.',
  },
  cultureResult: {
    title: 'Kết quả các mẫu nuôi cấy phù hợp với mô tả nào?',
    description: 'Hai mẫu riêng biệt phát hiện cùng một tác nhân là tiêu chí chính. Các tác nhân khác nhau cần đánh giá khả năng đa vi khuẩn hoặc nhiễm bẩn.',
  },
  daysSinceArthroplasty: {
    title: '5. Đã bao nhiêu ngày kể từ lần thay khớp gần nhất?',
    description: 'Thuật toán dùng ngưỡng <90 ngày cho giai đoạn cấp và ≥90 ngày cho giai đoạn mạn để chọn ngưỡng xét nghiệm.',
  },
  serumTests: {
    title: '6. Đã thực hiện những xét nghiệm huyết thanh nào?',
    description: 'Chọn từng xét nghiệm đã làm và nhập giá trị đúng đơn vị. Không chọn nếu chưa làm; không tự quy đổi D-dimer DDU sang FEU.',
  },
  synovialTests: {
    title: '7. Đã thực hiện những xét nghiệm dịch khớp nào?',
    description: 'Nhập WBC và PMN từ dịch khớp. Không dùng WBC máu ngoại vi ở bước này.',
  },
  leukocyteEsterase: {
    title: '8. Kết quả Leukocyte Esterase trong dịch khớp là gì?',
    description: 'Theo hệ điểm 2018, chỉ mức ++ thỏa tiêu chí ba điểm; vết hoặc + không được tính là dương tính theo ngưỡng này.',
  },
  alphaDefensin: {
    title: '9. Kết quả α-Defensin trong dịch khớp là gì?',
    description: 'Chọn “Không thực hiện / chưa có” nếu xét nghiệm không được làm hoặc chưa trả kết quả.',
  },
  histology: {
    title: '10. Kết quả mô bệnh học quanh khớp là gì?',
    description: 'Dùng kết luận mô bệnh học của bác sĩ giải phẫu bệnh; kết quả dương tính đóng góp ba điểm trong mổ.',
  },
  purulence: {
    title: '11. Trong mổ có quan sát thấy mủ trong khớp không?',
    description: 'Chọn “Không thực hiện / chưa có” nếu chưa phẫu thuật hoặc không có dữ liệu trong mổ.',
  },
};

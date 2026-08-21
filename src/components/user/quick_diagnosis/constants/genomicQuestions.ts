import type {
  PjiGenomicAbundance,
  PjiGenomicAmrGene,
  PjiGenomicClinicalSuspicion,
  PjiGenomicCultureConcordance,
  PjiGenomicMicrobialPattern,
  PjiGenomicOrganismGroup,
  PjiGenomicSpecimen,
  PjiGenomicTechnology,
} from '../quickDiagnosisModel';

export type GenomicQuestionId =
  | 'technology'
  | 'specimen'
  | 'priorAntibiotics'
  | 'detection'
  | 'microbialPattern'
  | 'abundance'
  | 'organismGroup'
  | 'organismName'
  | 'amrGenes'
  | 'cultureConcordance'
  | 'clinicalSuspicion';

export const GENOMIC_TECHNOLOGY_OPTIONS: Array<{ value: PjiGenomicTechnology; label: string; description: string }> = [
  {
    value: 'ngs_16s',
    label: 'Next-Generation Sequencing (NGS 16S / ITS)',
    description: 'Giải trình tự gen toàn diện vi khuẩn và vi nấm (>60.000 loài, phát hiện đa khuẩn & biofilm).',
  },
  {
    value: 'targeted_qpcr',
    label: 'Targeted qPCR (PCR định lượng mục tiêu)',
    description: 'Sàng lọc nhanh 24–48h cho các tác nhân và gen kháng thuốc phổ biến theo danh mục panel.',
  },
  {
    value: 'both_qpcr_ngs',
    label: 'Kết hợp cả qPCR và NGS (Quy trình 2 pha MicroGenDX)',
    description: 'Pha 1 qPCR trả nhanh + Pha 2 NGS toàn diện độ sâu.',
  },
];

export const GENOMIC_SPECIMEN_OPTIONS: Array<{ value: PjiGenomicSpecimen; label: string; description: string }> = [
  {
    value: 'synovial_fluid',
    label: 'Dịch khớp chọc hút (Synovial Fluid)',
    description: 'Lấy trước hoặc trong mổ, ưu tiên gửi trong lọ vô trùng không có chất chống đông heparin.',
  },
  {
    value: 'periprosthetic_tissue',
    label: 'Mô quanh khớp / Màng hoạt dịch (Periprosthetic Tissue)',
    description: 'Mô sinh thiết hoặc bệnh phẩm lấy tại vị trí tiếp giáp implant trong mổ.',
  },
  {
    value: 'sonication_fluid',
    label: 'Dịch siêu âm phục hình (Implant Sonication Fluid)',
    description: 'Dịch rửa sau khi rung siêu âm vật liệu cấy ghép đã tháo ra để phá vỡ biofilm.',
  },
];

export const GENOMIC_PATTERN_OPTIONS: Array<{ value: PjiGenomicMicrobialPattern; label: string; description: string }> = [
  {
    value: 'monomicrobial',
    label: 'Đơn vi sinh vật (Monomicrobial)',
    description: 'Chỉ phát hiện 1 loài vi sinh vật chiếm ưu thế rõ ràng.',
  },
  {
    value: 'polymicrobial',
    label: 'Đa vi sinh vật (Polymicrobial - từ 2 loài trở lên)',
    description: 'Báo cáo phát hiện quần thể gồm nhiều loài vi khuẩn/vi nấm đồng thời.',
  },
];

export const GENOMIC_ABUNDANCE_OPTIONS: Array<{ value: PjiGenomicAbundance; label: string; description: string }> = [
  {
    value: 'dominant',
    label: 'Ưu thế cao (> 50% tổng số reads)',
    description: 'Tác nhân chiếm đa số tuyệt đối chuỗi giải trình tự, độ tin cậy căn nguyên gây bệnh rất cao.',
  },
  {
    value: 'moderate',
    label: 'Trung bình (20% – 50% reads)',
    description: 'Tác nhân có lượng đọc đáng kể nhưng có thể đi kèm các loài phụ khác.',
  },
  {
    value: 'low_trace',
    label: 'Lượng vết / Thấp (< 20% reads)',
    description: 'Tải lượng thấp; cần thận trọng loại trừ khả năng tạp nhiễm từ da hoặc môi trường.',
  },
];

export const GENOMIC_ORGANISM_GROUP_OPTIONS: Array<{ value: PjiGenomicOrganismGroup; label: string; description: string }> = [
  {
    value: 'typical_high_virulence',
    label: 'Tác nhân độc lực cao điển hình PJI',
    description: 'S. aureus, Streptococcus spp., Enterobacteriaceae (E. coli, Klebsiella), Pseudomonas aeruginosa, Enterococcus faecalis.',
  },
  {
    value: 'low_virulence_commensal',
    label: 'Tác nhân độc lực thấp / Thường trú da',
    description: 'Coagulase-negative Staphylococci (S. epidermidis, S. lugdunensis), Cutibacterium acnes, Corynebacterium spp.',
  },
  {
    value: 'fungal',
    label: 'Vi nấm (Fungi)',
    description: 'Candida albicans, Candida parapsilosis, Aspergillus spp., nấm men hoặc nấm sợi.',
  },
  {
    value: 'environmental_contaminant',
    label: 'Nghi ngờ tạp nhiễm môi trường',
    description: 'Bacillus spp., Ralstonia, Sphingomonas, Micrococcus hoặc vi khuẩn đất/nước lượng thấp.',
  },
];

export const GENOMIC_AMR_GENE_OPTIONS: Array<{ value: PjiGenomicAmrGene; label: string; description: string }> = [
  {
    value: 'none',
    label: 'Không phát hiện gen kháng thuốc (No AMR genes detected)',
    description: 'Không có tín hiệu gen kháng thuốc trên panel xét nghiệm.',
  },
  {
    value: 'mecA_mecC',
    label: 'mecA / mecC (Kháng Methicillin / Oxacillin -> MRSA / MRSE)',
    description: 'Thay đổi PBP2a, kháng toàn bộ nhóm beta-lactam thông thường (ngoại trừ Ceftaroline/Ceftobiprole).',
  },
  {
    value: 'vanA_vanB',
    label: 'vanA / vanB (Kháng Vancomycin -> VRE)',
    description: 'Đề kháng Glycopeptide, đòi hỏi Daptomycin liều cao, Linezolid hoặc Tigecycline.',
  },
  {
    value: 'carbapenemase',
    label: 'Carbapenemase (blaKPC, blaNDM, blaOXA-48...)',
    description: 'Đề kháng Carbapenem ở vi khuẩn Gram âm, nguy cơ đa kháng thuốc cao.',
  },
  {
    value: 'erm_msr',
    label: 'erm (A/B/C) / msrA (Kháng Macrolide & Lincosamide - MLSb)',
    description: 'Đề kháng Clindamycin và Erythromycin (kháng cảm ứng hoặc cấu thành).',
  },
  {
    value: 'other',
    label: 'Gen kháng khác (Fluoroquinolone, Aminoglycoside, Tetracycline...)',
    description: 'Phát hiện các đột biến hoặc gen kháng kháng sinh bổ sung.',
  },
];

export const GENOMIC_CULTURE_CONCORDANCE_OPTIONS: Array<{ value: PjiGenomicCultureConcordance; label: string; description: string }> = [
  {
    value: 'concordant_same',
    label: 'Trùng khớp hoàn toàn (Cấy ra cùng tác nhân với Genomic)',
    description: 'Cả nuôi cấy vi sinh và genomic đều phát hiện cùng loài vi sinh vật (Độ tin cậy cao nhất).',
  },
  {
    value: 'culture_negative',
    label: 'Nuôi cấy âm tính (Culture-Negative PJI)',
    description: 'Nuôi cấy không mọc khuẩn nhưng genomic phát hiện tín hiệu DNA (giá trị cốt lõi của NGS).',
  },
  {
    value: 'discordant',
    label: 'Không trùng khớp (Genomic và cấy phát hiện các loài khác nhau)',
    description: 'Nuôi cấy và genomic đưa ra tác nhân khác nhau, cần đánh giá đa khuẩn hoặc tạp nhiễm.',
  },
  {
    value: 'culture_not_done',
    label: 'Chưa làm hoặc chưa có kết quả nuôi cấy',
    description: 'Chưa có dữ liệu nuôi cấy đối chứng tại thời điểm hiện tại.',
  },
];

export const GENOMIC_CLINICAL_SUSPICION_OPTIONS: Array<{ value: PjiGenomicClinicalSuspicion; label: string; description: string }> = [
  {
    value: 'high_icm_positive',
    label: 'Nghi ngờ cao / Thỏa tiêu chuẩn ICM 2018 (ICM ≥ 6 điểm hoặc có đường rò/mủ)',
    description: 'Bệnh nhân có biểu hiện lâm sàng viêm rõ, đường rò, hoặc các dấu ấn huyết thanh/dịch khớp tăng cao.',
  },
  {
    value: 'intermediate',
    label: 'Nghi ngờ trung bình / Chưa kết luận (ICM 2–5 điểm)',
    description: 'Có một số dấu hiệu viêm nhưng chưa đủ ngưỡng chẩn đoán xác định PJI.',
  },
  {
    value: 'low_aseptic',
    label: 'Nghi ngờ thấp / Nghi lỏng khớp vô khuẩn (Aseptic Loosening)',
    description: 'Thay lại khớp do nguyên nhân cơ học, không có dấu hiệu viêm trên lâm sàng và cận lâm sàng.',
  },
];

export const GENOMIC_QUESTION_COPY: Record<GenomicQuestionId, { title: string; description?: string }> = {
  technology: {
    title: 'Phương pháp xét nghiệm phân tử / genomic đã sử dụng là gì?',
    description: 'Lựa chọn công nghệ được ghi trên phiếu kết quả xét nghiệm (MicroGenDX, 16S NGS hoặc qPCR).',
  },
  specimen: {
    title: 'Loại bệnh phẩm được gửi làm xét nghiệm là gì?',
    description: 'Loại mẫu ảnh hưởng trực tiếp đến độ nhạy và nguy cơ tạp nhiễm vi khuẩn thường trú.',
  },
  priorAntibiotics: {
    title: 'Người bệnh có sử dụng kháng sinh trong vòng 2 tuần trước khi lấy mẫu không?',
    description: 'Kháng sinh ức chế khả năng nuôi cấy vi sinh nhưng DNA vi khuẩn vẫn có thể tồn tại để NGS/qPCR phát hiện.',
  },
  detection: {
    title: 'Kết quả phát hiện DNA vi sinh vật trên báo cáo là gì?',
    description: 'Chọn “Dương tính” nếu báo cáo phát hiện vi sinh vật vượt ngưỡng cắt; chọn “Âm tính” nếu không có tín hiệu DNA.',
  },
  microbialPattern: {
    title: 'Báo cáo ghi nhận đơn vi sinh vật hay đa vi sinh vật?',
    description: 'Phân loại số lượng loài được định danh trên báo cáo giải trình tự gen.',
  },
  abundance: {
    title: 'Tỷ lệ phong phú tương đối (% Relative Abundance) của tác nhân chính là bao nhiêu?',
    description: 'Tỷ lệ % reads giúp phân biệt tác nhân gây bệnh thực sự và tạp nhiễm nền.',
  },
  organismGroup: {
    title: 'Tác nhân phát hiện thuộc nhóm vi sinh vật nào?',
    description: 'Đánh giá độc lực và vai trò gây bệnh kinh điển trong nhiễm trùng khớp nhân tạo.',
  },
  organismName: {
    title: 'Tên vi sinh vật được phát hiện (tùy chọn)',
    description: 'Nhập tên khoa học của vi khuẩn hoặc vi nấm (ví dụ: Staphylococcus aureus, Cutibacterium acnes, Candida albicans...).',
  },
  amrGenes: {
    title: 'Có phát hiện gen kháng thuốc (Antimicrobial Resistance Genes) nào không?',
    description: 'Chọn tất cả các gen kháng kháng sinh được ghi nhận trên panel qPCR/NGS.',
  },
  cultureConcordance: {
    title: 'Tương quan giữa kết quả genomic và nuôi cấy vi sinh truyền thống?',
    description: 'Đối chiếu tác nhân trên genomic với kết quả nuôi cấy dịch khớp hoặc mô trong mổ.',
  },
  clinicalSuspicion: {
    title: 'Mức độ nghi ngờ lâm sàng và phân loại theo tiêu chuẩn ICM 2018?',
    description: 'Kết quả phân tử luôn phải được gắn liền với bệnh cảnh lâm sàng và hệ điểm ICM 2018.',
  },
};

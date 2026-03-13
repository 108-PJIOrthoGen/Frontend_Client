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
  intervalFromStage1?: string;
  preconditions?: string[];
  steps: SurgeryStepData[];
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

export const LOCAL_PLAN: LocalPlanData = {
  "category": "LOCAL_ANTIBIOTIC",
  "title": "Phác đồ kháng sinh tại chỗ - Vancomycin + Tobramycin cement spacer",
  "regimenName": "Antibiotic-loaded cement spacer (ALCS)",
  "indication": "Nhiễm trùng khớp giả háng phải do MRSA - giai đoạn spacer sau tháo khớp giả",
  "durationDays": 42,
  "durationNote": "6 tuần với spacer xi măng kháng sinh, đánh giá lại trước khi tháo spacer",
  "deliveryInfo": {
    "deliveryMethod": "CEMENT_SPACER",
    "spacerType": "ARTICULATING",
    "cementBrandSuggestion": "Palacos R+G hoặc tương đương",
    "mixingRatio": "Vancomycin 2g + Tobramycin 2.4g per 40g xi măng PMMA"
  },
  "antibiotics": [
    {
      "antibioticName": "Vancomycin (trong xi măng)",
      "dosage": "2g per 40g xi măng PMMA",
      "frequency": "Elution liên tục từ spacer",
      "route": "LOCAL_CEMENT",
      "role": "PRIMARY",
      "notes": "Nhạy cảm theo kháng sinh đồ (MIC = 1 μg/mL). Kháng sinh chính phủ vi khuẩn MRSA tại chỗ."
    },
    {
      "antibioticName": "Tobramycin (trong xi măng)",
      "dosage": "2.4g per 40g xi măng PMMA",
      "frequency": "Elution liên tục từ spacer",
      "route": "LOCAL_CEMENT",
      "role": "SYNERGISTIC",
      "notes": "Aminoglycoside bổ trợ, tăng phổ Gram âm, cải thiện tính chất cơ học xi măng."
    }
  ],
  "monitoring": [
    "Theo dõi dịch rỉ vết mổ hàng ngày",
    "CRP, ESR mỗi 2 tuần đánh giá đáp ứng",
    "X-quang kiểm tra vị trí spacer mỗi 2-4 tuần"
  ],
  "contraindications": [
    "Dị ứng thành phần xi măng PMMA ",
    "Dị ứng Aminoglycoside"
  ],
  "notes": "Bệnh nhân dị ứng Penicillin - không ảnh hưởng đến phác đồ này. Spacer khớp động (articulating) giúp duy trì chiều dài chi và giảm co rút."
}

export const SYSTEMIC_PLAN: SystemicPlanData = {
  "category": "SYSTEMIC_ANTIBIOTIC",
  "title": "Phác đồ kháng sinh toàn thân - Vancomycin IV → Rifampicin + TMP-SMX uống",
  "regimenName": "IV Vancomycin tấn công → Rifampicin + TMP-SMX duy trì uống",
  "indication": "Nhiễm trùng khớp giả do MRSA (Staphylococcus aureus kháng Oxacillin). Phác đồ 2 giai đoạn theo IDSA guidelines.",
  "totalDurationWeeks": 12,
  "phases": [
    {
      "phaseName": "Giai đoạn tấn công (Induction/IV phase)",
      "phaseOrder": 1,
      "durationWeeks": 6,
      "durationNote": "Bắt đầu ngay sau phẫu thuật tháo khớp giả, tối thiểu 4-6 tuần IV",
      "antibiotics": [
        {
          "antibioticName": "Vancomycin",
          "dosage": "15-20 mg/kg",
          "frequency": "Mỗi 8-12 giờ (q8-12h)",
          "route": "IV",
          "role": "PRIMARY",
          "notes": "Target trough 15-20 μg/mL hoặc AUC/MIC 400-600. Nhạy cảm theo kháng sinh đồ MIC = 1 μg/mL. Chỉnh liều theo chức năng thận (creatinine 95 μmol/L - hiện bình thường)."
        },
        {
          "antibioticName": "Rifampicin",
          "dosage": "300-450 mg",
          "frequency": "Mỗi 12 giờ (q12h)",
          "route": "ORAL",
          "role": "BIOFILM_AGENT",
          "notes": "BẮT BUỘC phối hợp - không dùng đơn trị để tránh kháng thuốc. Rifampicin có khả năng diệt vi khuẩn trong biofilm. Nhạy cảm MIC = 0.006 μg/mL. Bắt đầu sau 3-5 ngày hậu phẫu khi dẫn lưu giảm."
        }
      ]
    },
    {
      "phaseName": "Giai đoạn duy trì (Oral/Consolidation phase)",
      "phaseOrder": 2,
      "durationWeeks": 6,
      "durationNote": "Chuyển đổi sau khi hoàn thành giai đoạn IV, CRP có xu hướng giảm, lâm sàng cải thiện",
      "antibiotics": [
        {
          "antibioticName": "Trimethoprim-Sulfamethoxazole (TMP-SMX)",
          "dosage": "960 mg (DS tablet)",
          "frequency": "Mỗi 12 giờ (q12h)",
          "route": "ORAL",

          "role": "PRIMARY_ORAL",
          "notes": "Nhạy cảm theo kháng sinh đồ MIC <=0.5/9.5. Thay thế Vancomycin IV. Theo dõi công thức máu (giảm tiểu cầu, thiếu máu). Uống nhiều nước."
        },
        {
          "antibioticName": "Rifampicin",
          "dosage": "300-450 mg",
          "frequency": "Mỗi 12 giờ (q12h)",
          "route": "ORAL",

          "role": "BIOFILM_AGENT",
          "notes": "Tiếp tục phối hợp xuyên suốt cả 2 giai đoạn. Lưu ý tương tác thuốc: Rifampicin giảm tác dụng thuốc hạ đường huyết, thuốc huyết áp - cần theo dõi đường máu và huyết áp sát."
        }
      ]
    }
  ],
  "monitoring": [
    "Vancomycin trough hoặc AUC mỗi 3-5 ngày giai đoạn IV",
    "Creatinine, BUN mỗi tuần (theo dõi độc tính thận Vancomycin)",
    "CRP, ESR mỗi 1-2 tuần đánh giá đáp ứng điều trị",
    "Công thức máu mỗi 1-2 tuần (TMP-SMX có thể gây giảm tiểu cầu)",
    "Chức năng gan (AST, ALT) mỗi 2-4 tuần (Rifampicin gây độc gan)",
    "HbA1c & đường huyết (bệnh nhân tiểu đường, Rifampicin tương tác)"
  ],
  "contraindications": [
    "Dị ứng Penicillin (KHÔNG ảnh hưởng phác đồ này - không dùng beta-lactam)",
    "Suy thận nặng (cần chỉnh liều Vancomycin & TMP-SMX)",
    "Suy gan nặng (chống chỉ định Rifampicin)"
  ],
  "notes": "Phác đồ dựa trên kháng sinh đồ MRSA. Rifampicin là backbone chống biofilm - KHÔNG BAO GIỜ dùng đơn trị. Bệnh nhân có tiểu đường (HbA1c 7.8%) - Rifampicin có thể làm giảm tác dụng Metformin, cần theo dõi đường huyết chặt chẽ và có thể cần tăng liều thuốc hạ đường huyết."
};

export const SURGERY_PLAN: SurgeryPlanData = {
  category: 'SURGERY_PROCEDURE',
  surgeryStrategyType: 'TWO_STAGE_REVISION',
  strategyRationale:
    'PJI man tinh (>4 tuan trieu chung), khop gia long leo, MRSA: uu tien two-stage revision theo ICM/IDSA.',
  priorityLevel: 'HIGH',
  priorityNote:
    'Nen thuc hien giai doan 1 trong 1-2 tuan sau nhap vien. Khong cap cuu nhung khong nen tri hoan.',
  stages: [
    {
      stageOrder: 1,
      stageName: 'Giai doan 1 - Thao khop gia va dat spacer khang sinh',
      estimatedDurationMinutes: 180,
      steps: [
        {
          stepOrder: 1,
          stepName: 'Tiep can va boc lo',
          description: 'Rach da theo duong mo cu, lay 3-5 mau mo quanh khop gui nuoi cay va giai phau benh.',
        },
        {
          stepOrder: 2,
          stepName: 'Thao bo khop gia va xi mang',
          description: 'Thao bo toan bo implant va xi mang, bao ton stock xuong toi da.',
        },
        {
          stepOrder: 3,
          stepName: 'Cat loc triet de',
          description: 'Loai bo mo viem, mo hoai tu, biofilm. Rua xung NaCl 0.9% >= 6 lit.',
        },
        {
          stepOrder: 4,
          stepName: 'Dat spacer xi mang khang sinh',
          description: 'Tron PMMA voi Vancomycin + Tobramycin, tao articulating spacer va kiem tra do vung.',
        },
        {
          stepOrder: 5,
          stepName: 'Dan luu va dong vet mo',
          description: 'Dat dan luu hut kin 1-2 ong, dong vet mo theo lop, bang vo khuan.',
        },
      ],
    },
    {
      stageOrder: 2,
      stageName: 'Giai doan 2 - Thao spacer va thay khop gia moi',
      estimatedDurationMinutes: 210,
      intervalFromStage1: '8-12 tuan sau giai doan 1',
      preconditions: [
        'Het khang sinh toan than >= 2 tuan (antibiotic holiday)',
        'CRP ve binh thuong hoac giam dang ke',
        'Lam sang khong con dau hieu nhiem trung',
        'Choc hut dich khop am tinh, WBC dich khop < 3000',
      ],
      steps: [
        {
          stepOrder: 1,
          stepName: 'Tiep can va thao spacer',
          description: 'Thao spacer, lay >= 3 mau mo gui nuoi cay va frozen section.',
        },
        {
          stepOrder: 2,
          stepName: 'Danh gia va chuan bi',
          description: 'Danh gia stock xuong, cat loc mo ton luu, rua xung >= 3 lit, cho frozen section am tinh.',
        },
        {
          stepOrder: 3,
          stepName: 'Dat khop gia moi',
          description: 'Doa o coi, dat cup/stem moi, thu khop va kiem tra chieu dai chi.',
        },
        {
          stepOrder: 4,
          stepName: 'Dan luu va dong vet mo',
          description: 'Dat dan luu hut kin, dong vet mo theo lop, bang vo khuan.',
        },
      ],
    },
  ],
  estimatedTotalTreatmentTime: '4-6 thang (gom khoang cach 2 giai doan va phuc hoi chuc nang)',
  risksAndComplications: [
    'Nhiem trung tai phat (10-15%)',
    'Gay xuong quanh khop gia trong khi thao',
    'Trat spacer',
    'Thieu hut stock xuong nang can ghep xuong',
    'Chenh lech chieu dai chi',
  ],
  notes:
    'Can toi uu duong huyet truoc mo, danh gia dinh duong va nguy co tim mach. Di ung penicillin: can nhac thay doi khang sinh du phong.',
};

export const RAG_CITATIONS: CitationData[] = [
  {
    sourceType: 'GUIDELINE',
    sourceTitle:
      '2018 Definition of Periprosthetic Joint Infection (ICM 2018) - Musculoskeletal Infection Society',
    sourceUri: 'https://doi.org/10.1016/j.arth.2018.02.078',
    snippet:
      'Tong diem tieu chuan phu >= 6: Infected; 4-5: Inconclusive; <= 3: Not Infected.',
    relevanceScore: 0.98,
    citedFor: 'Nguong phan loai chan doan PJI theo he thong diem ICM',
  },
  {
    sourceType: 'GUIDELINE',
    sourceTitle: 'IDSA Clinical Practice Guidelines for PJI (2013, updated 2023)',
    sourceUri: 'https://doi.org/10.1093/cid/cis803',
    snippet:
      'Two-stage exchange duoc khuyen cao cho PJI man tinh, MRSA, va truong hop implant long leo.',
    relevanceScore: 0.97,
    citedFor: 'Chi dinh two-stage revision cho benh canh hien tai',
  },
  {
    sourceType: 'JOURNAL_ARTICLE',
    sourceTitle: 'Role of Rifampin Combination Therapy for Staphylococcal PJI - NEJM',
    sourceUri: 'https://doi.org/10.1056/NEJMoa040266',
    snippet:
      'Phoi hop co Rifampicin cai thien ty le khoi benh nho tac dong len vi khuan trong biofilm.',
    relevanceScore: 0.96,
    citedFor: 'Co so cho phoi hop Rifampicin trong phac do toan than',
  },
  {
    sourceType: 'CONSENSUS_STATEMENT',
    sourceTitle: 'ASHP/IDSA/SIDP Vancomycin Therapeutic Monitoring Guidelines (2020)',
    sourceUri: 'https://doi.org/10.1093/ofid/ofaa303',
    snippet: 'Uu tien theo doi AUC/MIC muc tieu 400-600 thay vi trough don thuan cho MRSA nang.',
    relevanceScore: 0.93,
    citedFor: 'Huong dan lieu va theo doi Vancomycin giai doan tan cong',
  },
  {
    sourceType: 'SYSTEMATIC_REVIEW',
    sourceTitle:
      'Antibiotic-Loaded Bone Cement in PJI Treatment: Elution Characteristics and Outcomes',
    sourceUri: 'https://doi.org/10.1302/0301-620X.102B10.BJJ-2020-0369',
    snippet:
      'Lieu tai >2g vancomycin/40g PMMA cho hieu qua elution 4-6 tuan voi doc tinh toan than thap.',
    relevanceScore: 0.92,
    citedFor: 'Co so lieu luong khang sinh trong xi mang spacer',
  },
];

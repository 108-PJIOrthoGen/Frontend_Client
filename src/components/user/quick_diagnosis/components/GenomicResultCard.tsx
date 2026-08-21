import React from 'react';
import { Alert, Button, Card, Divider, Space, Tag, Typography } from 'antd';
import {
  AlertOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type {
  PjiGenomicConclusion,
  PjiGenomicConfidence,
  PjiGenomicInput,
  PjiGenomicResult,
} from '../quickDiagnosisModel';

const { Link, Paragraph, Text, Title } = Typography;

const CONCLUSION_THEME: Record<
  PjiGenomicConclusion,
  {
    color: string;
    alertType: 'success' | 'info' | 'warning' | 'error';
    badgeText: string;
  }
> = {
  DEFINITE_PATHOGEN: {
    color: '#dc2626',
    alertType: 'error',
    badgeText: 'Tác nhân xác định',
  },
  LIKELY_PATHOGEN_CULTURE_NEGATIVE: {
    color: '#ea580c',
    alertType: 'warning',
    badgeText: 'Tác nhân cấy âm tính',
  },
  POLYMICROBIAL_INFECTION: {
    color: '#c026d3',
    alertType: 'warning',
    badgeText: 'Đa vi sinh vật',
  },
  POSSIBLE_CONTAMINATION: {
    color: '#b45309',
    alertType: 'info',
    badgeText: 'Nghi ngờ tạp nhiễm',
  },
  NO_ORGANISM_DETECTED: {
    color: '#047857',
    alertType: 'success',
    badgeText: 'Âm tính (Không phát hiện DNA)',
  },
  DISCORDANT_FINDINGS: {
    color: '#b45309',
    alertType: 'warning',
    badgeText: 'Không đồng nhất',
  },
  INCOMPLETE: {
    color: '#64748b',
    alertType: 'info',
    badgeText: 'Chưa hoàn thành',
  },
};

const CONFIDENCE_LABEL: Record<PjiGenomicConfidence, { label: string; color: string }> = {
  very_high: { label: 'Độ tin cậy: Rất cao', color: 'green' },
  high: { label: 'Độ tin cậy: Cao', color: 'blue' },
  moderate: { label: 'Độ tin cậy: Trung bình', color: 'orange' },
  low: { label: 'Độ tin cậy: Thấp', color: 'default' },
  not_applicable: { label: 'Chưa đánh giá', color: 'default' },
};

export interface GenomicResultCardProps {
  result: PjiGenomicResult;
  input: PjiGenomicInput;
  onReset: () => void;
  onBack: () => void;
}

export const GenomicResultCard: React.FC<GenomicResultCardProps> = ({
  result,
  input,
  onReset,
  onBack,
}) => {
  const theme = CONCLUSION_THEME[result.conclusion];
  const conf = CONFIDENCE_LABEL[result.confidence];

  return (
    <Card className="border-slate-200 shadow-sm" styles={{ body: { padding: 28 } }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
              Diễn giải kết quả Genomic & Vi sinh phân tử
            </Text>
            <Tag color={conf.color}>{conf.label}</Tag>
            <Tag color={theme.alertType === 'error' ? 'red' : theme.alertType === 'warning' ? 'orange' : 'cyan'}>
              {theme.badgeText}
            </Tag>
          </div>
          <Title level={2} style={{ color: theme.color, margin: '8px 0 0' }}>
            {result.title}
          </Title>
          {input.organismName ? (
            <div className="mt-1 text-base font-semibold text-slate-700">
              Tác nhân ghi nhận: <span className="italic text-slate-900">{input.organismName}</span>
            </div>
          ) : null}
        </div>
        <Button icon={<ReloadOutlined />} onClick={onReset}>
          Làm đánh giá mới
        </Button>
      </div>

      <Alert
        className="mt-5"
        showIcon
        type={theme.alertType}
        message={result.summary}
      />

      {/* Clinical Implications */}
      {result.clinicalImplications.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <ExperimentOutlined className="text-emerald-700" />
            <span>Ý nghĩa vi sinh và lâm sàng</span>
          </div>
          <div className="mt-3 space-y-2">
            {result.clinicalImplications.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircleOutlined className="mt-1 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Antimicrobial Guidance */}
      {result.antimicrobialGuidance.length > 0 ? (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex items-center gap-2 font-semibold text-blue-900">
            <MedicineBoxOutlined className="text-blue-700" />
            <span>Định hướng sử dụng kháng sinh & Gen kháng thuốc (AMR)</span>
          </div>
          <div className="mt-3 space-y-2">
            {result.antimicrobialGuidance.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-blue-950">
                <span className="font-bold text-blue-600">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recommendations */}
      {result.recommendations.length > 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <InfoCircleOutlined className="text-slate-700" />
            <span>Khuyến nghị lâm sàng & Hành động tiếp theo</span>
          </div>
          <div className="mt-3 space-y-2">
            {result.recommendations.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="font-bold text-slate-500">{idx + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Cautions */}
      {result.cautions.length > 0 ? (
        <div className="mt-5 space-y-3">
          {result.cautions.map((caution, idx) => (
            <Alert
              key={idx}
              showIcon
              icon={<AlertOutlined />}
              type="warning"
              message={caution}
            />
          ))}
        </div>
      ) : null}

      <Divider />
      <Paragraph type="secondary" className="!mb-3 text-xs leading-5">
        Lưu ý: Kết quả xét nghiệm genomic không nằm trong hệ điểm PJI 2018 chính thức. Đây là công cụ hỗ trợ
        quyết định lâm sàng nhằm định danh căn nguyên vi sinh và phát hiện gen kháng thuốc, không thay thế việc đọc toàn bộ báo cáo xét nghiệm và hội chẩn chuyên khoa.
      </Paragraph>

      <Space wrap size={16}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Xem lại câu trả lời
        </Button>
        <Link href="https://www.icmortho.org/pjidx" target="_blank" rel="noreferrer">
          Tham chiếu thuật toán PJIDx
        </Link>
        <Link href="https://microgendx.com" target="_blank" rel="noreferrer">
          Hướng dẫn báo cáo MicroGenDX
        </Link>
      </Space>
    </Card>
  );
};

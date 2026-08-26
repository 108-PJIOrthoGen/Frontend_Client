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
import type { PjiDiagnosisResult } from '../quickDiagnosisModel';
import { CONCLUSION_COPY } from '../constants/diagnosisQuestions';

const { Link, Paragraph, Text, Title } = Typography;

export interface DiagnosisResultCardProps {
  result: PjiDiagnosisResult;
  onReset: () => void;
  onBack: () => void;
}

export const DiagnosisResultCard: React.FC<DiagnosisResultCardProps> = ({
  result,
  onReset,
  onBack,
}) => {
  const conclusion = CONCLUSION_COPY[result.conclusion];
  const synthesis = result.genomicSynthesis;

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm" styles={{ body: { padding: 28 } }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
              Kết quả từ Backend · hồ sơ PJI_ICM_2018_VALIDATED_V1
            </Text>
            <Title level={2} style={{ color: conclusion.color, margin: '6px 0 0' }}>
              {conclusion.label}
            </Title>
          </div>
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            Làm đánh giá mới
          </Button>
        </div>

        <Alert className="mt-4" showIcon type={conclusion.alertType} message={conclusion.description} />

        {result.conclusion !== 'NOT_APPLICABLE' ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Text type="secondary" className="block text-xs">
                Điểm tiền phẫu
              </Text>
              <Text strong className="text-3xl text-slate-900">
                {result.preoperativeScore}
              </Text>
              <Text type="secondary"> / 8</Text>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Text type="secondary" className="block text-xs">
                Giai đoạn theo thời gian
              </Text>
              <Text strong className="text-lg text-slate-900">
                {result.timing === 'acute'
                  ? 'Cấp (<90 ngày)'
                  : result.timing === 'chronic'
                  ? 'Mạn (≥90 ngày)'
                  : 'Chưa xác định'}
              </Text>
            </div>
          </div>
        ) : null}

        {result.combinedScore != null ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Text type="secondary" className="block text-xs">
              Tổng điểm phối hợp tiền phẫu + trong mổ
            </Text>
            <Text strong className="text-3xl text-amber-800">
              {result.combinedScore}
            </Text>
          </div>
        ) : null}

        {result.positiveCriteria.length > 0 ? (
          <div className="mt-6">
            <Text strong>Tiêu chí đạt ngưỡng</Text>
            <div className="mt-3 space-y-2">
              {result.positiveCriteria.map(criterion => (
                <div key={criterion.key} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircleOutlined className="mt-1 text-emerald-600" />
                  <span>
                    {criterion.label}{' '}
                    {criterion.points > 0 ? `(+${criterion.points})` : '(tiêu chí chính)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {result.cautions.map(caution => (
          <Alert key={caution} className="mt-4" showIcon type="warning" message={caution} />
        ))}

        {result.missingEvidence.length > 0 ? (
          <Alert
            className="mt-4"
            showIcon
            type="info"
            message="Bằng chứng còn thiếu"
            description={(
              <ul className="mb-0 pl-5">
                {result.missingEvidence.map(item => <li key={item}>{item}</li>)}
              </ul>
            )}
          />
        ) : null}
      </Card>

      {/* SYNTHESIS & CROSS-VALIDATION CARD (If MicroGen Testing was performed) */}
      {synthesis ? (
        <Card className="border-emerald-200 bg-white shadow-md" styles={{ body: { padding: 28 } }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
                  Tổng hợp đối chiếu chéo: ICM 2018 & MicroGenDX Testing
                </Text>
                <Tag color={synthesis.scenarioType === 'error' ? 'red' : synthesis.scenarioType === 'warning' ? 'orange' : 'green'}>
                  {synthesis.scenarioBadge}
                </Tag>
              </div>
              <Title level={3} className="!mb-1 !mt-2 !text-slate-900">
                {synthesis.scenarioTitle}
              </Title>
              {synthesis.genomicDetail?.summary && synthesis.scenario !== 'ICM_NOT_INFECTED_GENOMIC_POSITIVE' ? (
                <div className="text-sm text-slate-600 mt-1">
                  Tác nhân: <span className="font-semibold text-slate-900">{synthesis.genomicDetail.title}</span>
                </div>
              ) : null}
            </div>
            <ExperimentOutlined className="text-3xl text-emerald-700 hidden sm:block" />
          </div>

          <Alert
            className="mt-4"
            showIcon
            type={synthesis.scenarioType}
            message={synthesis.summary}
          />

          {/* Action Checklist */}
          {synthesis.clinicalActions.length > 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <InfoCircleOutlined className="text-emerald-700" />
                <span>Khuyến nghị xử trí & Hành động lâm sàng</span>
              </div>
              <div className="mt-3 space-y-2">
                {synthesis.clinicalActions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="font-bold text-emerald-700">{idx + 1}.</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Antimicrobial Guidance */}
          {synthesis.antimicrobialGuidance.length > 0 ? (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
              <div className="flex items-center gap-2 font-semibold text-blue-900">
                <MedicineBoxOutlined className="text-blue-700" />
                <span>Định hướng sử dụng kháng sinh (AMR & Vi sinh)</span>
              </div>
              <div className="mt-3 space-y-2">
                {synthesis.antimicrobialGuidance.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-blue-950">
                    <span className="font-bold text-blue-600">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 text-xs text-slate-500 italic">
            * Nguyên lý ICM: Xét nghiệm MicroGen/NGS không cộng điểm vào thang điểm 2018 mà đóng vai trò hỗ trợ định danh tác nhân và đối chiếu chéo với tiêu chuẩn vàng.
          </div>
        </Card>
      ) : null}

      <Card className="border-slate-200 bg-slate-50 shadow-none" styles={{ body: { padding: 20 } }}>
        <Paragraph type="secondary" className="!mb-3 text-xs leading-5">
          Kết quả là công cụ hỗ trợ quyết định lâm sàng theo định nghĩa điểm PJI 2018, không phải chẩn đoán tự động và không thay thế đánh giá toàn diện của bác sĩ phẫu thuật và bác sĩ truyền nhiễm. Ngưỡng ca cấp là đề xuất chưa được thẩm định trong định nghĩa điểm 2018.
        </Paragraph>
        <Space wrap size={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Xem lại câu trả lời
          </Button>
          <Link href="https://www.icmortho.org/pjidx" target="_blank" rel="noreferrer">
            Tham chiếu thuật toán PJIDx (ICM Ortho)
          </Link>
          <Link href="https://pubmed.ncbi.nlm.nih.gov/29551303/" target="_blank" rel="noreferrer">
            Định nghĩa PJI 2018 đã thẩm định
          </Link>
        </Space>
      </Card>
    </div>
  );
};

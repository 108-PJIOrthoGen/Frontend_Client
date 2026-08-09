import React from 'react';
import { Alert, Button, Card, Descriptions, Empty, Select, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import type { IDoctorRecommendationReview } from '@/types/backend';

const { Text } = Typography;

interface DoctorConclusionTabProps {
  reviews: IDoctorRecommendationReview[];
  selectedReviewId?: string;
  selecting?: boolean;
  onReviewChange: (reviewId: string) => void;
  onSelectFinal: (reviewId: string) => void;
}

const reviewVersionLabel = (review: IDoctorRecommendationReview): string => {
  const version = review.run?.runNo ?? review.run?.id ?? review.runId ?? '?';
  return `Version ${version}${review.finalDecision ? ' — Final decision' : ''}`;
};

const DoctorConclusionTab: React.FC<DoctorConclusionTabProps> = ({
  reviews,
  selectedReviewId,
  selecting,
  onReviewChange,
  onSelectFinal,
}) => {
  if (!reviews.length) {
    return <Empty description="Chưa có review nào cho các version recommendation của bệnh án." />;
  }
  const review = reviews.find((item) => String(item.id) === selectedReviewId) ?? reviews[0];
  const diagnosis = review.doctorFinalDecision?.diagnosisJson ?? review.doctorDiagnosisJson;
  const surgery = review.doctorFinalDecision?.surgeryPlanJson
    ?? (review.modificationJson?.surgery as any);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card size="small">
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Text strong>Version recommendation</Text>
            <Select
              value={String(review.id)}
              style={{ width: 'min(100%, 320px)', minWidth: 0 }}
              options={reviews.map((item) => ({ value: String(item.id), label: reviewVersionLabel(item) }))}
              onChange={onReviewChange}
            />
          </Space>
          {review.finalDecision ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>Final decision</Tag>
          ) : (
            <Button type="primary" loading={selecting} onClick={() => onSelectFinal(String(review.id))}>
              Chọn version này làm final
            </Button>
          )}
        </Space>
      </Card>

      {!diagnosis ? (
        <Alert type="info" showIcon message="Version này chưa có kết luận của bác sĩ." />
      ) : (
        <Card title="Kết luận bác sĩ" size="small">
          <Descriptions bordered column={{ xs: 1, md: 2 }} size="small">
            <Descriptions.Item label="Kết luận PJI">{diagnosis.pji_conclusion ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Phân loại nhiễm trùng">{diagnosis.infection_classification ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Chẩn đoán chính" span={2}>{diagnosis.primary_diagnosis ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Vi khuẩn định danh" span={2}>{diagnosis.identified_organism ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Lập luận lâm sàng" span={2}>{diagnosis.clinical_reasoning ?? '—'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="Kế hoạch phẫu thuật" size="small">
        {surgery ? (
          <Descriptions bordered column={{ xs: 1, md: 2 }} size="small">
            <Descriptions.Item label="Chiến lược">{surgery.surgeryStrategyType ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ưu tiên">{surgery.priorityLevel ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Chỉ định và lý do" span={2}>{surgery.strategyRationale ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Tổng thời gian">{surgery.estimatedTotalTreatmentTime ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Số giai đoạn">{surgery.stages?.length ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Nguy cơ" span={2}>{surgery.risksAndComplications?.join(', ') || '—'}</Descriptions.Item>
          </Descriptions>
        ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kế hoạch phẫu thuật." />}
      </Card>
    </Space>
  );
};

export default DoctorConclusionTab;

import React from 'react';
import { Alert, Card, Col, Descriptions, Empty, Row, Space, Steps, Table, Tag, Typography } from 'antd';
import { ExperimentOutlined, SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import type { AntibioticCarePlanData } from '@/types/treatmentType';

const { Text } = Typography;

interface Props {
  plan?: AntibioticCarePlanData | null;
  compact?: boolean;
}

const AntibioticCarePlanPanel: React.FC<Props> = ({ plan, compact = false }) => {
  if (!plan) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kế hoạch theo dõi kháng sinh." />;
  }

  const phases = plan.phases ?? [];
  const monitoring = plan.monitoringSchedule ?? [];

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="Kế hoạch hỗ trợ ra quyết định"
        description="Hệ thống không tự thay đổi liều, không phát hành y lệnh và không gửi cảnh báo ra ngoài. Mọi thay đổi phải được dược sĩ đánh giá và ký xác nhận."
      />
      <Card size="small" title={<Space><ExperimentOutlined />Lộ trình điều trị</Space>}>
        <Steps
          responsive
          size="small"
          items={phases.map((phase) => ({
            title: phase.phaseName,
            description: [phase.careSetting, phase.therapies?.join(', ')]
              .filter(Boolean).join(' · '),
          }))}
        />
        {!compact && plan.treatmentGoal ? <Text type="secondary">Mục tiêu: {plan.treatmentGoal}</Text> : null}
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card size="small" title={<Space><SafetyCertificateOutlined />An toàn liều dùng</Space>} style={{ height: '100%' }}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Đánh giá thận">{plan.renalDosing?.assessment || 'Chưa đủ dữ liệu'}</Descriptions.Item>
              <Descriptions.Item label="Cockcroft–Gault">
                {plan.renalDosing?.creatinineClearanceMlMin != null ? `${plan.renalDosing.creatinineClearanceMlMin} mL/phút` : 'Chưa tính'}
              </Descriptions.Item>
              <Descriptions.Item label="Liều nạp">{plan.renalDosing?.loadingDoseNote || '—'}</Descriptions.Item>
              <Descriptions.Item label="Liều duy trì">{plan.renalDosing?.maintenanceDoseNote || '—'}</Descriptions.Item>
              <Descriptions.Item label="Quy tắc dừng">{plan.plannedStopDate || plan.plannedStopRule || 'Chưa xác định'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} xl={15}>
          <Card size="small" title="Lịch xét nghiệm và ngưỡng cần rà soát" style={{ height: '100%' }} styles={{ body: { padding: 0 } }}>
            <Table
              size="small"
              pagination={false}
              rowKey={(row) => `${row.testName}-${row.timing}`}
              dataSource={monitoring}
              columns={[
                { title: 'Chỉ số', dataIndex: 'testName', width: 130 },
                { title: 'Lịch', dataIndex: 'timing', width: 140 },
                { title: 'Mục đích', dataIndex: 'purpose' },
                { title: 'Hành động đề xuất', dataIndex: 'actionWhenAbnormal' },
              ]}
              scroll={{ x: 720 }}
              locale={{ emptyText: 'Chưa có lịch theo dõi' }}
            />
          </Card>
        </Col>
      </Row>
      {!compact && ((plan.interactionChecks?.length ?? 0) > 0 || (plan.allergyChecks?.length ?? 0) > 0) ? (
        <Card size="small" title={<Space><WarningOutlined />Tương tác và dị ứng cần rà soát</Space>}>
          <Space wrap>
            {plan.interactionChecks?.map((item) => <Tag color="volcano" key={item}>{item}</Tag>)}
            {plan.allergyChecks?.map((item) => <Tag color="gold" key={item}>{item}</Tag>)}
          </Space>
        </Card>
      ) : null}
    </Space>
  );
};

export default AntibioticCarePlanPanel;

import React from 'react';
import { Alert, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import {
  ClockCircleOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type {
  AntibioticCarePhaseData,
  AntibioticCarePlanData,
} from '@/types/treatmentType';
import './AntibioticCarePlanPanel.css';

const { Text } = Typography;

interface Props {
  plan?: AntibioticCarePlanData | null;
  compact?: boolean;
  patientName?: string;
  patientCode?: string;
  episodeId?: string | number;
}

const phaseTone = [
  { className: 'care-phase--inpatient', fallback: 'Nội trú', setting: 'INPATIENT' },
  { className: 'care-phase--outpatient', fallback: 'Ngoại trú', setting: 'OUTPATIENT' },
  { className: 'care-phase--monitoring', fallback: 'Giám sát', setting: 'MONITORING' },
];

const phaseGrid = [
  { start: 1, span: 6 },
  { start: 5, span: 9 },
  { start: 10, span: 9 },
];

const timelineLabels = [
  'Ngày 0', '1', '2', '3', '5', '7', '10', '14',
  'Tuần 3', '4', '6', '8', 'Tháng 3', '6', '9', '12', '18', '24',
];

const phaseByIndex = (
  phases: AntibioticCarePhaseData[],
  index: number,
): AntibioticCarePhaseData | undefined => phases.find((phase) => phase.phaseOrder === index + 1)
  ?? phases[index];

const AntibioticCarePlanPanel: React.FC<Props> = ({
  plan,
  compact = false,
  patientName,
  patientCode,
  episodeId,
}) => {
  if (!plan) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kế hoạch theo dõi kháng sinh." />;
  }

  const phases = plan.phases ?? [];
  const monitoring = plan.monitoringSchedule ?? [];

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="Hệ thống hỗ trợ ra quyết định"
        description="Hệ thống không tự thay đổi liều, không phát hành y lệnh và không gửi cảnh báo ra ngoài. Mọi thay đổi phải được dược sĩ đánh giá và xác nhận."
      />

      <div className="care-timeline-shell">
        <div className="care-timeline-scroll">
          <div className="care-timeline">
            <div className="care-timeline__patient">
              <strong>{patientName || 'Bệnh nhân đang điều trị'}</strong>
              <span>{patientCode || `Bệnh án #${episodeId ?? '—'}`}</span>
            </div>
            <div className="care-timeline__scale">
              <div className="care-timeline__scale-band">
                <span>Ngày</span><span>Tuần</span><span>Tháng</span>
              </div>
              <div className="care-timeline__ticks">
                {timelineLabels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
              </div>
            </div>

            {phaseTone.map((tone, index) => {
              const phase = phaseByIndex(phases, index);
              const position = phaseGrid[index];
              return (
                <React.Fragment key={tone.setting}>
                  <div className={`care-timeline__lane-label ${tone.className}`}>
                    <span>{index + 1}. {phase?.phaseName || tone.fallback}</span>
                    <small>({phase?.careSetting || tone.setting})</small>
                  </div>
                  <div className="care-timeline__lane">
                    <div
                      className={`care-timeline__phase ${tone.className}`}
                      style={{ gridColumn: `${position.start} / span ${position.span}` }}
                    >
                      <strong>{phase?.phaseName || tone.fallback}</strong>
                      <span>{phase?.therapies?.join(' · ') || 'Theo phác đồ dược sĩ đã ký'}</span>
                      {phase?.transitionCriteria?.length ? (
                        <small>{phase.transitionCriteria.slice(0, 2).join(' · ')}</small>
                      ) : null}
                    </div>
                    {monitoring.slice(0, 4).map((item, itemIndex) => (
                      <span
                        key={`${item.testName}-${item.timing}-${itemIndex}`}
                        className="care-timeline__milestone"
                        style={{ gridColumn: Math.min(17, 6 + (itemIndex * 3)) }}
                        title={`${item.testName}: ${item.timing}`}
                      >
                        <ExperimentOutlined /> {item.testName}
                      </span>
                    ))}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <Row gutter={[14, 14]}>
        <Col xs={24} xl={10}>
          <Card
            size="small"
            title={<Space><SafetyCertificateOutlined />An toàn liều dùng</Space>}
            style={{ height: '100%' }}
          >
            <div className="care-detail-list">
              <div><span>Đánh giá thận</span><strong>{plan.renalDosing?.inputsAvailable ? 'Đủ dữ liệu' : 'Chưa đủ dữ liệu'}</strong></div>
              <div><span>Cockcroft–Gault</span><strong>{plan.renalDosing?.creatinineClearanceMlMin != null ? `${plan.renalDosing.creatinineClearanceMlMin} mL/phút` : 'Chưa tính'}</strong></div>
              <div><span>Liều nạp</span><strong>{plan.renalDosing?.loadingDoseNote || 'Dược sĩ đánh giá'}</strong></div>
              <div><span>Liều duy trì</span><strong>{plan.renalDosing?.maintenanceDoseNote || 'Dược sĩ đánh giá'}</strong></div>
              <div><span>Quy tắc dừng</span><strong>{plan.plannedStopRule || 'Theo đáp ứng lâm sàng'}</strong></div>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card
            size="small"
            title={<Space><ClockCircleOutlined />Lịch xét nghiệm</Space>}
            style={{ height: '100%' }}
          >
            {monitoring.length ? (
              <div className="care-monitoring-list">
                {monitoring.map((item, index) => (
                  <div key={`${item.testName}-${item.timing}-${index}`}>
                    <ExperimentOutlined />
                    <div>
                      <strong>{item.testName}</strong>
                      <span>{item.timing}{item.purpose ? ` · ${item.purpose}` : ''}</span>
                      {item.actionIfAbnormal ? <small>{item.actionIfAbnormal}</small> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch xét nghiệm" />}
          </Card>
        </Col>
      </Row>

      {!compact && ((plan.interactionChecks?.length ?? 0) > 0
        || (plan.allergyChecks?.length ?? 0) > 0
        || (plan.tdmPlan?.length ?? 0) > 0) ? (
        <Card size="small" title={<Space><WarningOutlined />Tương tác, dị ứng và TDM cần rà soát</Space>}>
          <Space wrap size={[8, 8]}>
            {plan.interactionChecks?.map((item) => <Tag color="volcano" key={`interaction-${item}`}>{item}</Tag>)}
            {plan.allergyChecks?.map((item) => <Tag color="gold" key={`allergy-${item}`}>{item}</Tag>)}
            {plan.tdmPlan?.map((item, index) => (
              <Tag color="blue" key={`tdm-${item.drugName}-${index}`}>
                TDM {item.drugName}: {item.samplingTime || item.target || 'Dược sĩ rà soát'}
              </Tag>
            ))}
          </Space>
        </Card>
      ) : null}

      {plan.safetyNote ? <Text type="secondary">{plan.safetyNote}</Text> : null}
    </Space>
  );
};

export default AntibioticCarePlanPanel;

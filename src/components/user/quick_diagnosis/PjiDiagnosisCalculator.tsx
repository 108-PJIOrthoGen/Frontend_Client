import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Progress,
  Radio,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  calculatePjiDiagnosis,
  createCriterionState,
  PJI_INTRAOPERATIVE_CRITERIA,
  PJI_MAJOR_CRITERIA,
  PJI_MINOR_CRITERIA,
  type CriterionStatus,
  type DiagnosisCriterion,
  type PjiDiagnosisConclusion,
} from './quickDiagnosisModel';

const { Link, Paragraph, Text, Title } = Typography;

const STATUS_OPTIONS = [
  { label: 'Chưa có', value: 'unknown' },
  { label: 'Âm tính', value: 'negative' },
  { label: 'Dương tính', value: 'positive' },
];

const CONCLUSION_COPY: Record<PjiDiagnosisConclusion, {
  label: string;
  description: string;
  alertType: 'info' | 'success' | 'warning' | 'error';
  color: string;
}> = {
  INCOMPLETE: {
    label: 'Chưa đủ dữ liệu',
    description: 'Chọn trạng thái cho toàn bộ tiêu chí tiền phẫu để nhận kết luận.',
    alertType: 'info',
    color: '#2563eb',
  },
  INFECTED: {
    label: 'Nhiễm PJI',
    description: 'Đã thỏa tiêu chí chính hoặc đạt ngưỡng điểm chẩn đoán nhiễm PJI.',
    alertType: 'error',
    color: '#dc2626',
  },
  POSSIBLY_INFECTED: {
    label: 'Có thể nhiễm PJI',
    description: 'Điểm tiền phẫu từ 2–5; cần bổ sung tiêu chí trong mổ để xác nhận hoặc loại trừ.',
    alertType: 'warning',
    color: '#d97706',
  },
  NOT_INFECTED: {
    label: 'Không nhiễm PJI',
    description: 'Không thỏa tiêu chí chính và điểm nằm trong ngưỡng không nhiễm.',
    alertType: 'success',
    color: '#16a34a',
  },
  INCONCLUSIVE: {
    label: 'Chưa thể kết luận',
    description: 'Tổng điểm phối hợp trong mổ từ 4–5 theo định nghĩa ICM 2018.',
    alertType: 'warning',
    color: '#d97706',
  },
};

interface CriterionRowProps {
  criterion: DiagnosisCriterion;
  value: CriterionStatus;
  onChange: (value: CriterionStatus) => void;
}

const CriterionRow = ({ criterion, value, onChange }: CriterionRowProps) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <Text strong className="text-slate-800">{criterion.label}</Text>
          {criterion.points > 0 && <Tag color="blue">+{criterion.points}</Tag>}
        </div>
        <Text type="secondary" className="mt-1 block text-xs leading-5">
          {criterion.detail}
        </Text>
      </div>
      <Radio.Group
        aria-label={criterion.label}
        block
        buttonStyle="solid"
        optionType="button"
        options={STATUS_OPTIONS}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="shrink-0 xl:w-[318px]"
      />
    </div>
  </div>
);

export const PjiDiagnosisCalculator = () => {
  const [major, setMajor] = useState(() => createCriterionState(PJI_MAJOR_CRITERIA));
  const [minor, setMinor] = useState(() => createCriterionState(PJI_MINOR_CRITERIA));
  const [intraoperative, setIntraoperative] = useState(
    () => createCriterionState(PJI_INTRAOPERATIVE_CRITERIA),
  );

  const result = useMemo(
    () => calculatePjiDiagnosis({ major, minor, intraoperative }),
    [intraoperative, major, minor],
  );
  const conclusion = CONCLUSION_COPY[result.conclusion];
  const completeness = Math.round(
    (result.completedPreoperativeCriteria / result.totalPreoperativeCriteria) * 100,
  );
  const showIntraoperative = result.preoperativeScore >= 2
    && result.preoperativeScore <= 5
    && result.completedPreoperativeCriteria === result.totalPreoperativeCriteria;

  const updateCriterion = (
    setter: React.Dispatch<React.SetStateAction<Record<string, CriterionStatus>>>,
    key: string,
    value: CriterionStatus,
  ) => setter(previous => ({ ...previous, [key]: value }));

  const reset = () => {
    setMajor(createCriterionState(PJI_MAJOR_CRITERIA));
    setMinor(createCriterionState(PJI_MINOR_CRITERIA));
    setIntraoperative(createCriterionState(PJI_INTRAOPERATIVE_CRITERIA));
  };

  return (
    <div className="space-y-4">
      <Alert
        showIcon
        type="info"
        icon={<SafetyCertificateOutlined />}
        message="Chẩn đoán nhanh PJI theo định nghĩa ICM 2018 cho khớp háng và khớp gối"
        description="Dữ liệu chỉ được tính trong phiên hiện tại, không tạo bệnh nhân và không lưu vào bệnh án."
      />

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={16}>
          <Space direction="vertical" size={16} className="w-full">
            <Card
              title={(
                <Space>
                  <ExperimentOutlined className="text-red-500" />
                  <span>Tiêu chí chính</span>
                </Space>
              )}
              extra={<Tag color="red">Chỉ cần 1 tiêu chí dương tính</Tag>}
              styles={{ body: { padding: 16 } }}
            >
              <div className="space-y-3">
                {PJI_MAJOR_CRITERIA.map(criterion => (
                  <CriterionRow
                    key={criterion.key}
                    criterion={criterion}
                    value={major[criterion.key]}
                    onChange={value => updateCriterion(setMajor, criterion.key, value)}
                  />
                ))}
              </div>
            </Card>

            <Card
              title="Tiêu chí phụ tiền phẫu"
              extra={<Tag color="blue">{result.preoperativeScore}/12 điểm</Tag>}
              styles={{ body: { padding: 16 } }}
            >
              <div className="space-y-3">
                {PJI_MINOR_CRITERIA.map(criterion => (
                  <CriterionRow
                    key={criterion.key}
                    criterion={criterion}
                    value={minor[criterion.key]}
                    onChange={value => updateCriterion(setMinor, criterion.key, value)}
                  />
                ))}
              </div>
            </Card>

            {showIntraoperative && (
              <Card
                title="Tiêu chí bổ sung trong mổ"
                extra={<Tag color="gold">Dùng khi điểm tiền phẫu 2–5</Tag>}
                styles={{ body: { padding: 16 } }}
              >
                <Paragraph type="secondary">
                  Nếu chưa có dữ liệu trong mổ, giữ trạng thái “Chưa có” để dùng kết luận tiền phẫu.
                </Paragraph>
                <div className="space-y-3">
                  {PJI_INTRAOPERATIVE_CRITERIA.map(criterion => (
                    <CriterionRow
                      key={criterion.key}
                      criterion={criterion}
                      value={intraoperative[criterion.key]}
                      onChange={value => updateCriterion(setIntraoperative, criterion.key, value)}
                    />
                  ))}
                </div>
              </Card>
            )}
          </Space>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="xl:sticky xl:top-0" styles={{ body: { padding: 20 } }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
                  Kết quả ICM
                </Text>
                <Title level={3} style={{ color: conclusion.color, margin: '4px 0 0' }}>
                  {conclusion.label}
                </Title>
              </div>
              <Button icon={<ReloadOutlined />} onClick={reset}>
                Làm lại
              </Button>
            </div>

            <Divider className="my-4" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <Text type="secondary" className="block text-xs">Điểm tiền phẫu</Text>
                <Text strong className="text-2xl text-slate-900">
                  {result.preoperativeScore}
                </Text>
                <Text type="secondary"> / 12</Text>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <Text type="secondary" className="block text-xs">Đã nhập</Text>
                <Text strong className="text-2xl text-slate-900">
                  {result.completedPreoperativeCriteria}
                </Text>
                <Text type="secondary"> / {result.totalPreoperativeCriteria}</Text>
              </div>
            </div>

            {result.combinedScore != null && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Text type="secondary" className="block text-xs">Tổng điểm phối hợp trong mổ</Text>
                <Text strong className="text-2xl text-amber-700">{result.combinedScore}</Text>
              </div>
            )}

            <div className="mt-4">
              <div className="mb-1 flex justify-between">
                <Text type="secondary" className="text-xs">Mức hoàn thiện tiền phẫu</Text>
                <Text type="secondary" className="text-xs">{completeness}%</Text>
              </div>
              <Progress percent={completeness} showInfo={false} strokeColor="#2563eb" />
            </div>

            <Alert
              className="mt-4"
              showIcon
              type={conclusion.alertType}
              message={conclusion.description}
            />

            {result.positiveCriteria.length > 0 && (
              <div className="mt-4">
                <Text strong>Tiêu chí dương tính</Text>
                <div className="mt-2 space-y-2">
                  {result.positiveCriteria.map(criterion => (
                    <div key={criterion.key} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircleOutlined className="mt-1 text-emerald-500" />
                      <span>{criterion.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Divider className="my-4" />
            <Paragraph type="secondary" className="mb-1 text-xs leading-5">
              Công cụ hỗ trợ quyết định, không thay thế đánh giá lâm sàng. Thận trọng với phản ứng mô
              tại chỗ, bệnh lắng đọng tinh thể và vi sinh vật phát triển chậm.
            </Paragraph>
            <Link
              href="https://pubmed.ncbi.nlm.nih.gov/29551303/"
              target="_blank"
              rel="noreferrer"
              className="text-xs"
            >
              Nguồn: Parvizi và cộng sự, định nghĩa PJI 2018
            </Link>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

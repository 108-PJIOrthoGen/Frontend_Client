import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  InputNumber,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  calculatePjiRisk,
  hasCompletePjiRiskInput,
  PJI_RISK_COMORBIDITIES,
  PJI_RISK_PRIOR_PROCEDURES,
  PJI_RISK_SURGERIES,
  resolvePjiRiskBmi,
  type PjiRiskInput,
} from './quickDiagnosisModel';
import { calculateBmi, classifyBmi } from '@/utils/medicalCalculation';

const { Link, Paragraph, Text, Title } = Typography;

const EMPTY_INPUT: PjiRiskInput = {
  comorbidities: [],
};

interface BinaryQuestionProps {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
}

const BinaryQuestion = ({ label, value, onChange }: BinaryQuestionProps) => (
  <div>
    <Text strong className="mb-2 block text-slate-700">{label}</Text>
    <Radio.Group
      block
      buttonStyle="solid"
      optionType="button"
      value={value}
      onChange={event => onChange(event.target.value)}
      options={[
        { label: 'Không', value: false },
        { label: 'Có', value: true },
      ]}
    />
  </div>
);

export const PjiRiskCalculator = () => {
  const [input, setInput] = useState<PjiRiskInput>(EMPTY_INPUT);
  const result = useMemo(() => calculatePjiRisk(input), [input]);
  const isComplete = hasCompletePjiRiskInput(input);
  const effectiveBmi = resolvePjiRiskBmi(input);
  const bmiCategory = classifyBmi(effectiveBmi);

  const updateInput = <Key extends keyof PjiRiskInput>(
    key: Key,
    value: PjiRiskInput[Key],
  ) => setInput(previous => ({ ...previous, [key]: value }));

  const handleHeightChange = (height: number | null) => {
    const newHeight = height ?? undefined;
    const newBmi = calculateBmi(newHeight, input.weightKg);
    setInput(previous => ({
      ...previous,
      heightCm: newHeight,
      bmi: newBmi ?? (newHeight && input.weightKg ? undefined : previous.bmi),
    }));
  };

  const handleWeightChange = (weight: number | null) => {
    const newWeight = weight ?? undefined;
    const newBmi = calculateBmi(input.heightCm, newWeight);
    setInput(previous => ({
      ...previous,
      weightKg: newWeight,
      bmi: newBmi ?? (input.heightCm && newWeight ? undefined : previous.bmi),
    }));
  };

  return (
    <main className="h-full overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl space-y-4">
        <div>
          <Title level={2} className="!mb-1 !mt-0 !text-slate-950">PJI Risk Calculator</Title>
          <Paragraph type="secondary" className="!mb-0">
            Ước tính nguy cơ PJI trọn đời trước phẫu thuật thay khớp từ mô hình quần thể.
          </Paragraph>
        </div>
        <Alert
          showIcon
          type="info"
          icon={<SafetyCertificateOutlined />}
          message="Ước tính nguy cơ PJI trọn đời trước phẫu thuật thay khớp"
          description="Mô hình Tan và cộng sự (JBJS 2018). Dữ liệu chỉ được tính tại trình duyệt và không lưu vào hồ sơ."
        />

        <Row gutter={[16, 16]} align="top">
          <Col xs={24} xl={16}>
            <Card title="Thông tin đầu vào" styles={{ body: { padding: 20 } }}>
              <Title level={5} className="!mb-4 !mt-0">1. Nhân khẩu học</Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Text strong className="mb-2 block text-slate-700">Chiều cao (cm)</Text>
                  <InputNumber
                    aria-label="Chiều cao"
                    className="w-full"
                    min={0}
                    max={300}
                    placeholder="Ví dụ: 170"
                    value={input.heightCm}
                    onChange={handleHeightChange}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong className="mb-2 block text-slate-700">Cân nặng (kg)</Text>
                  <InputNumber
                    aria-label="Cân nặng"
                    className="w-full"
                    min={0}
                    max={500}
                    step={0.1}
                    placeholder="Ví dụ: 65"
                    value={input.weightKg}
                    onChange={handleWeightChange}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="mb-2 flex items-center justify-between">
                    <Text strong className="text-slate-700">BMI (kg/m²)</Text>
                    {bmiCategory && (
                      <Tag color={bmiCategory.color} className="m-0 text-xs">
                        {bmiCategory.label}
                      </Tag>
                    )}
                  </div>
                  <InputNumber
                    aria-label="BMI"
                    className="w-full"
                    min={1}
                    max={100}
                    step={0.01}
                    placeholder={input.heightCm && input.weightKg ? 'Tự động tính' : 'Nhập BMI'}
                    value={effectiveBmi}
                    readOnly={!!(input.heightCm && input.weightKg)}
                    onChange={value => updateInput('bmi', value ?? undefined)}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong className="mb-2 block text-slate-700">Giới tính</Text>
                  <Radio.Group
                    block
                    buttonStyle="solid"
                    optionType="button"
                    value={input.sex}
                    onChange={event => updateInput('sex', event.target.value)}
                    options={[
                      { label: 'Nữ', value: 'female' },
                      { label: 'Nam', value: 'male' },
                    ]}
                  />
                </Col>
              </Row>

              <Divider />
              <Title level={5} className="!mb-4 !mt-0">2. Yếu tố bệnh nhân</Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Text strong className="mb-2 block text-slate-700">Loại bảo hiểm</Text>
                  <Radio.Group
                    block
                    buttonStyle="solid"
                    optionType="button"
                    value={input.insurance}
                    onChange={event => updateInput('insurance', event.target.value)}
                    options={[
                      { label: 'Thương mại', value: 'commercial' },
                      { label: 'Nhà nước', value: 'government' },
                    ]}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <BinaryQuestion
                    label="Đang hút thuốc"
                    value={input.smoker}
                    onChange={value => updateInput('smoker', value)}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <BinaryQuestion
                    label="Tiền sử lạm dụng chất"
                    value={input.drugAbuse}
                    onChange={value => updateInput('drugAbuse', value)}
                  />
                </Col>
              </Row>

              <Divider />
              <Title level={5} className="!mb-4 !mt-0">3. Yếu tố phẫu thuật</Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong className="mb-2 block text-slate-700">Loại phẫu thuật dự kiến</Text>
                  <Select
                    aria-label="Loại phẫu thuật dự kiến"
                    className="w-full"
                    placeholder="Chọn loại phẫu thuật"
                    value={input.surgery}
                    options={PJI_RISK_SURGERIES}
                    onChange={value => updateInput('surgery', value)}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Text strong className="mb-2 block text-slate-700">Số phẫu thuật trước đó</Text>
                  <Select
                    aria-label="Số phẫu thuật trước đó"
                    className="w-full"
                    placeholder="Chọn số lần"
                    value={input.priorProcedures}
                    options={PJI_RISK_PRIOR_PROCEDURES}
                    onChange={value => updateInput('priorProcedures', value)}
                  />
                </Col>
              </Row>

              <Divider />
              <Title level={5} className="!mb-1 !mt-0">4. Bệnh lý nội khoa liên quan</Title>
              <Paragraph type="secondary">
                Có thể chọn nhiều mục; để trống nếu không có bệnh lý nội khoa liên quan trong danh sách.
              </Paragraph>
              <Checkbox.Group
                value={input.comorbidities}
                onChange={values => updateInput('comorbidities', values as string[])}
                className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3"
              >
                {PJI_RISK_COMORBIDITIES.map(item => (
                  <Checkbox
                    key={item.value}
                    value={item.value}
                    className="!m-0 rounded-lg border border-slate-200 p-3"
                  >
                    {item.label}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card className="xl:sticky xl:top-0" styles={{ body: { padding: 20 } }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">
                    PJI Risk
                  </Text>
                  <Title level={3} className="!mb-0 !mt-1">Nguy cơ ước tính</Title>
                </div>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setInput({ ...EMPTY_INPUT })}
                >
                  Làm lại
                </Button>
              </div>

              <Divider className="my-4" />
              {result ? (
                <>
                  <Statistic
                    value={result.riskPercent}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: '#2563eb', fontSize: 40, fontWeight: 800 }}
                  />
                  <Text type="secondary">Nguy cơ PJI trọn đời ước tính</Text>
                  <Progress
                    percent={Math.min(100, result.riskPercent)}
                    showInfo={false}
                    strokeColor="#2563eb"
                    className="mt-3"
                  />

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <Text type="secondary" className="block text-xs">Raw score</Text>
                    <Text strong className="text-2xl text-slate-900">{result.rawScore}</Text>
                  </div>

                  <div className="mt-4">
                    <Text strong>Thành phần điểm</Text>
                    <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
                      {result.contributions.map(item => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <Text className="text-sm">{item.label}</Text>
                          <Tag color={item.points > 0 ? 'blue' : 'default'} className="m-0">
                            +{item.points}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <InfoCircleOutlined className="text-4xl text-blue-400" />
                  <Title level={4} className="!mb-2 !mt-4">Chưa đủ thông tin</Title>
                  <Paragraph type="secondary">
                    Nhập đủ BMI, giới tính, bảo hiểm, hút thuốc, lạm dụng chất và yếu tố phẫu thuật.
                  </Paragraph>
                  <Tag color={isComplete ? 'success' : 'processing'}>Không lưu vào bệnh án</Tag>
                </div>
              )}

              <Divider className="my-4" />
              <Paragraph type="secondary" className="mb-1 text-xs leading-5">
                Đây là ước tính từ mô hình quần thể, không phải xác suất chắc chắn của từng cá nhân và
                không thay thế đánh giá, tối ưu hóa nguy cơ trước mổ của bác sĩ. Mô hình được phát triển
                và kiểm định trên dữ liệu thay khớp tại Hoa Kỳ.
              </Paragraph>
              <Space direction="vertical" size={0}>
                <Link
                  href="https://www.icmortho.org/pjiriskcal"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs"
                >
                  Tham chiếu ứng dụng PJI Risk của ICM
                </Link>
                <Link
                  href="https://pubmed.ncbi.nlm.nih.gov/29715226/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs"
                >
                  Nguồn mô hình: Tan và cộng sự, JBJS 2018
                </Link>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </main>
  );
};

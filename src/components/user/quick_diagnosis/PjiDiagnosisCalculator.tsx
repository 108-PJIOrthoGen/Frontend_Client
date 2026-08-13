import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Divider,
  InputNumber,
  Progress,
  Radio,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  calculatePjiDiagnosis,
  type PjiCultureResult,
  type PjiDiagnosisConclusion,
  type PjiDiagnosisInput,
  type PjiLeukocyteEsterase,
  type PjiTernaryResult,
} from './quickDiagnosisModel';

const { Link, Paragraph, Text, Title } = Typography;

type CalculatorMode = 'diagnosis' | 'genomic';
type QuestionId =
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

const BASE_QUESTIONS: QuestionId[] = [
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

const CONCLUSION_COPY: Record<PjiDiagnosisConclusion, {
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

const TERNARY_OPTIONS: Array<{ label: string; value: PjiTernaryResult }> = [
  { label: 'Không thực hiện / chưa có', value: 'notDone' },
  { label: 'Âm tính', value: 'negative' },
  { label: 'Dương tính', value: 'positive' },
];

interface QuestionFrameProps {
  current: number;
  total: number;
  statusLabel: string;
  statusColor: string;
  title: string;
  description?: string;
  onBack: () => void;
  onReset: () => void;
  children: React.ReactNode;
}

const QuestionFrame = ({
  current,
  total,
  statusLabel,
  statusColor,
  title,
  description,
  onBack,
  onReset,
  children,
}: QuestionFrameProps) => {
  const progress = Math.round((current / total) * 100);
  return (
    <Card className="border-slate-200 shadow-sm" styles={{ body: { padding: 0 } }}>
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Text strong className="shrink-0 text-slate-800">Câu {current} / {total}</Text>
          <Progress
            aria-label={`Tiến độ ${progress}%`}
            percent={progress}
            showInfo={false}
            strokeColor="#047857"
            className="!mb-0 max-w-md"
          />
          <Text type="secondary" className="hidden shrink-0 sm:inline">{progress}% hoàn thành</Text>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="text" icon={<ReloadOutlined />} onClick={onReset}>Đặt lại</Button>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Text type="secondary" className="mr-2 text-xs">Trạng thái</Text>
            <Text strong style={{ color: statusColor }} className="text-sm">{statusLabel}</Text>
          </div>
        </div>
      </div>

      <div className="px-5 py-7 lg:px-8 lg:py-10">
        <Title level={3} className="!mb-2 !mt-0 !text-slate-900">{title}</Title>
        {description ? (
          <Paragraph type="secondary" className="!mb-6 max-w-3xl leading-6">{description}</Paragraph>
        ) : null}
        {children}
        <Button
          type="text"
          className="mt-7 !px-0 !text-slate-500"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
        >
          Quay lại
        </Button>
      </div>
    </Card>
  );
};

interface BinaryAnswersProps {
  onAnswer: (value: boolean) => void;
}

const BinaryAnswers = ({ onAnswer }: BinaryAnswersProps) => (
  <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
    <Button className="h-20 !border-emerald-700 !text-xl !font-semibold !text-emerald-800" onClick={() => onAnswer(true)}>
      Có
    </Button>
    <Button className="h-20 !border-emerald-700 !text-xl !font-semibold !text-emerald-800" onClick={() => onAnswer(false)}>
      Không
    </Button>
  </div>
);

const isValidMeasurement = (value: number | undefined) => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0
);

export const PjiDiagnosisCalculator = () => {
  const [mode, setMode] = useState<CalculatorMode | null>(null);
  const [answers, setAnswers] = useState<PjiDiagnosisInput>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [genomicResult, setGenomicResult] = useState<'positive' | 'negative'>();

  const questions = useMemo(() => {
    if (!answers.culturesPerformed) return BASE_QUESTIONS;
    const next = [...BASE_QUESTIONS];
    next.splice(3, 0, 'cultureResult');
    return next;
  }, [answers.culturesPerformed]);
  const result = useMemo(() => calculatePjiDiagnosis(answers), [answers]);
  const conclusion = CONCLUSION_COPY[result.conclusion];
  const activeQuestion = questions[questionIndex];

  const reset = () => {
    setMode(null);
    setAnswers({});
    setQuestionIndex(0);
    setShowResult(false);
    setGenomicResult(undefined);
  };

  const goBack = () => {
    if (showResult) {
      setShowResult(false);
      return;
    }
    if (questionIndex === 0) {
      setMode(null);
      return;
    }
    setQuestionIndex(index => index - 1);
  };

  const goNext = () => {
    if (questionIndex >= questions.length - 1) setShowResult(true);
    else setQuestionIndex(index => index + 1);
  };

  const updateAnswer = <Key extends keyof PjiDiagnosisInput>(
    key: Key,
    value: PjiDiagnosisInput[Key],
  ) => setAnswers(previous => ({ ...previous, [key]: value }));

  const answerBinary = (key: 'previousArthroplasty' | 'sinusTract' | 'culturesPerformed', value: boolean) => {
    setAnswers(previous => ({
      ...previous,
      [key]: value,
      ...(key === 'culturesPerformed' && !value ? { cultureResult: undefined } : {}),
    }));
    if ((key === 'previousArthroplasty' && !value) || (key === 'sinusTract' && value)) {
      setShowResult(true);
      return;
    }
    goNext();
  };

  const updateMeasurement = (
    group: 'serumTests' | 'synovialTests',
    key: string,
    value: number | undefined,
  ) => setAnswers(previous => ({
    ...previous,
    [group]: { ...previous[group], [key]: value },
  }));

  const toggleMeasurement = (
    group: 'serumTests' | 'synovialTests',
    key: string,
    checked: boolean,
  ) => setAnswers(previous => {
    const next = { ...previous[group] } as Record<string, number | undefined>;
    if (checked) next[key] = undefined;
    else delete next[key];
    return { ...previous, [group]: next };
  });

  const selectedSerum = Object.keys(answers.serumTests ?? {});
  const selectedSynovial = Object.keys(answers.synovialTests ?? {});
  const serumReady = selectedSerum.every(key => (
    isValidMeasurement(answers.serumTests?.[key as keyof NonNullable<PjiDiagnosisInput['serumTests']>])
  ));
  const synovialReady = selectedSynovial.every(key => (
    isValidMeasurement(answers.synovialTests?.[key as keyof NonNullable<PjiDiagnosisInput['synovialTests']>])
  ));

  const renderQuestion = () => {
    switch (activeQuestion) {
      case 'previousArthroplasty':
        return (
          <BinaryAnswers onAnswer={value => answerBinary('previousArthroplasty', value)} />
        );
      case 'sinusTract':
        return <BinaryAnswers onAnswer={value => answerBinary('sinusTract', value)} />;
      case 'culturesPerformed':
        return <BinaryAnswers onAnswer={value => answerBinary('culturesPerformed', value)} />;
      case 'cultureResult': {
        const options: Array<{ value: PjiCultureResult; label: string }> = [
          { value: 'negative', label: 'Tất cả mẫu cấy âm tính' },
          { value: 'singlePositive', label: 'Một mẫu cấy dương tính' },
          { value: 'multipleSameOrganism', label: 'Từ 2 mẫu dương tính với cùng một tác nhân' },
          { value: 'multipleDifferentOrganisms', label: 'Từ 2 mẫu dương tính với các tác nhân khác nhau' },
        ];
        return (
          <div className="max-w-4xl space-y-3">
            {options.map(option => (
              <Button
                block
                key={option.value}
                className="h-auto min-h-14 !justify-start whitespace-normal !border-slate-300 !px-5 !py-3 !text-left !text-base"
                onClick={() => {
                  updateAnswer('cultureResult', option.value);
                  if (option.value === 'multipleSameOrganism') setShowResult(true);
                  else goNext();
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        );
      }
      case 'daysSinceArthroplasty':
        return (
          <div className="max-w-sm">
            <InputNumber
              aria-label="Số ngày từ lần thay khớp"
              className="w-full"
              min={0}
              precision={0}
              size="large"
              addonAfter="ngày"
              placeholder="Nhập số ngày"
              value={answers.daysSinceArthroplasty}
              onChange={value => updateAnswer('daysSinceArthroplasty', value ?? undefined)}
            />
            <Button
              type="primary"
              className="mt-4"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              disabled={!isValidMeasurement(answers.daysSinceArthroplasty)}
              onClick={goNext}
            >
              Tiếp tục
            </Button>
          </div>
        );
      case 'serumTests': {
        const tests = [
          { key: 'esr', label: 'ESR', unit: 'mm/giờ' },
          { key: 'crp', label: 'CRP', unit: 'mg/L' },
          { key: 'dDimer', label: 'D-dimer', unit: 'ng/mL FEU' },
        ] as const;
        return (
          <div className="max-w-4xl">
            <div className="space-y-3">
              {tests.map(test => {
                const selected = selectedSerum.includes(test.key);
                return (
                  <div key={test.key} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[180px_1fr] sm:items-center">
                    <Checkbox
                      checked={selected}
                      onChange={event => toggleMeasurement('serumTests', test.key, event.target.checked)}
                    >
                      <Text strong>{test.label}</Text>
                    </Checkbox>
                    {selected ? (
                      <InputNumber
                        aria-label={`Giá trị ${test.label}`}
                        min={0}
                        className="w-full"
                        addonAfter={test.unit}
                        value={answers.serumTests?.[test.key]}
                        onChange={value => updateMeasurement('serumTests', test.key, value ?? undefined)}
                      />
                    ) : <Text type="secondary">Không thực hiện</Text>}
                  </div>
                );
              })}
            </div>
            <Button
              type="primary"
              className="mt-4"
              disabled={!serumReady}
              onClick={() => {
                if (answers.serumTests == null) updateAnswer('serumTests', {});
                goNext();
              }}
            >
              Tiếp tục
            </Button>
          </div>
        );
      }
      case 'synovialTests': {
        const tests = [
          { key: 'wbc', label: 'WBC dịch khớp', unit: 'tế bào/µL' },
          { key: 'pmn', label: 'PMN dịch khớp', unit: '%' },
        ] as const;
        return (
          <div className="max-w-4xl">
            <div className="space-y-3">
              {tests.map(test => {
                const selected = selectedSynovial.includes(test.key);
                return (
                  <div key={test.key} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[180px_1fr] sm:items-center">
                    <Checkbox
                      checked={selected}
                      onChange={event => toggleMeasurement('synovialTests', test.key, event.target.checked)}
                    >
                      <Text strong>{test.label}</Text>
                    </Checkbox>
                    {selected ? (
                      <InputNumber
                        aria-label={`Giá trị ${test.label}`}
                        min={0}
                        max={test.key === 'pmn' ? 100 : undefined}
                        className="w-full"
                        addonAfter={test.unit}
                        value={answers.synovialTests?.[test.key]}
                        onChange={value => updateMeasurement('synovialTests', test.key, value ?? undefined)}
                      />
                    ) : <Text type="secondary">Không thực hiện</Text>}
                  </div>
                );
              })}
            </div>
            <Button
              type="primary"
              className="mt-4"
              disabled={!synovialReady}
              onClick={() => {
                if (answers.synovialTests == null) updateAnswer('synovialTests', {});
                goNext();
              }}
            >
              Tiếp tục
            </Button>
          </div>
        );
      }
      case 'leukocyteEsterase': {
        const options: Array<{ label: string; value: PjiLeukocyteEsterase }> = [
          { label: 'Không thực hiện', value: 'notDone' },
          { label: 'Âm tính (−)', value: 'negative' },
          { label: 'Vết (trace)', value: 'trace' },
          { label: 'Dương tính (+)', value: 'onePlus' },
          { label: 'Dương tính mạnh (++)', value: 'twoPlus' },
        ];
        return (
          <Radio.Group
            className="grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2"
            value={answers.leukocyteEsterase}
            onChange={event => {
              updateAnswer('leukocyteEsterase', event.target.value);
              goNext();
            }}
          >
            {options.map(option => (
              <Radio.Button key={option.value} value={option.value} className="!h-auto !min-h-14 !py-3 !text-center">
                {option.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        );
      }
      case 'alphaDefensin':
      case 'histology':
      case 'purulence':
        return (
          <Radio.Group
            className="grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3"
            value={answers[activeQuestion]}
            onChange={event => {
              updateAnswer(activeQuestion, event.target.value);
              goNext();
            }}
          >
            {TERNARY_OPTIONS.map(option => (
              <Radio.Button key={option.value} value={option.value} className="!h-auto !min-h-14 !py-3 !text-center">
                {option.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        );
      default:
        return null;
    }
  };

  const questionCopy: Record<QuestionId, { title: string; description?: string }> = {
    previousArthroplasty: {
      title: 'Người bệnh đã từng thay khớp háng hoặc khớp gối chưa?',
      description: 'Định nghĩa PJI 2018 ở đây chỉ dành cho nhiễm trùng quanh khớp nhân tạo háng và gối.',
    },
    sinusTract: {
      title: 'Có đường rò thông với khớp nhân tạo hoặc nhìn thấy trực tiếp vật liệu cấy ghép không?',
      description: 'Đường rò phải có bằng chứng thông với khớp; đây là một tiêu chí chính của định nghĩa ICM.',
    },
    culturesPerformed: {
      title: 'Đã thực hiện nuôi cấy vi sinh mô hoặc dịch khớp chưa?',
      description: 'Chỉ chọn “Có” khi đã có kết quả cấy để phân loại số mẫu và tác nhân.',
    },
    cultureResult: {
      title: 'Kết quả các mẫu nuôi cấy phù hợp với mô tả nào?',
      description: 'Hai mẫu riêng biệt phát hiện cùng một tác nhân là tiêu chí chính. Các tác nhân khác nhau cần đánh giá khả năng đa vi khuẩn hoặc nhiễm bẩn.',
    },
    daysSinceArthroplasty: {
      title: 'Đã bao nhiêu ngày kể từ lần thay khớp gần nhất?',
      description: 'Thuật toán dùng ngưỡng <90 ngày cho giai đoạn cấp và ≥90 ngày cho giai đoạn mạn để chọn ngưỡng xét nghiệm.',
    },
    serumTests: {
      title: 'Đã thực hiện những xét nghiệm huyết thanh nào?',
      description: 'Chọn từng xét nghiệm đã làm và nhập giá trị đúng đơn vị. Không chọn nếu chưa làm; không tự quy đổi D-dimer DDU sang FEU.',
    },
    synovialTests: {
      title: 'Đã thực hiện những xét nghiệm dịch khớp nào?',
      description: 'Nhập WBC và PMN từ dịch khớp. Không dùng WBC máu ngoại vi ở bước này.',
    },
    leukocyteEsterase: {
      title: 'Kết quả Leukocyte Esterase trong dịch khớp là gì?',
      description: 'Theo hệ điểm 2018, chỉ mức ++ thỏa tiêu chí ba điểm; vết hoặc + không được tính là dương tính theo ngưỡng này.',
    },
    alphaDefensin: {
      title: 'Kết quả α-Defensin trong dịch khớp là gì?',
      description: 'Chọn “Không thực hiện / chưa có” nếu xét nghiệm không được làm hoặc chưa trả kết quả.',
    },
    histology: {
      title: 'Kết quả mô bệnh học quanh khớp là gì?',
      description: 'Dùng kết luận mô bệnh học của bác sĩ giải phẫu bệnh; kết quả dương tính đóng góp ba điểm trong mổ.',
    },
    purulence: {
      title: 'Trong mổ có quan sát thấy mủ trong khớp không?',
      description: 'Chọn “Không thực hiện / chưa có” nếu chưa phẫu thuật hoặc không có dữ liệu trong mổ.',
    },
  };

  const renderDiagnosisResult = () => (
    <Card className="border-slate-200 shadow-sm" styles={{ body: { padding: 28 } }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">Kết quả hỗ trợ phân loại</Text>
          <Title level={2} style={{ color: conclusion.color, margin: '6px 0 0' }}>{conclusion.label}</Title>
        </div>
        <Button icon={<ReloadOutlined />} onClick={reset}>Làm đánh giá mới</Button>
      </div>
      <Alert className="mt-4" showIcon type={conclusion.alertType} message={conclusion.description} />

      {result.conclusion !== 'NOT_APPLICABLE' ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Text type="secondary" className="block text-xs">Điểm tiền phẫu</Text>
            <Text strong className="text-3xl text-slate-900">{result.preoperativeScore}</Text>
            <Text type="secondary"> / 8</Text>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Text type="secondary" className="block text-xs">Giai đoạn theo thời gian</Text>
            <Text strong className="text-lg text-slate-900">
              {result.timing === 'acute' ? 'Cấp (<90 ngày)' : result.timing === 'chronic' ? 'Mạn (≥90 ngày)' : 'Chưa xác định'}
            </Text>
          </div>
        </div>
      ) : null}

      {result.combinedScore != null ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Text type="secondary" className="block text-xs">Tổng điểm phối hợp tiền phẫu + trong mổ</Text>
          <Text strong className="text-3xl text-amber-800">{result.combinedScore}</Text>
        </div>
      ) : null}

      {result.positiveCriteria.length > 0 ? (
        <div className="mt-6">
          <Text strong>Tiêu chí đạt ngưỡng</Text>
          <div className="mt-3 space-y-2">
            {result.positiveCriteria.map(criterion => (
              <div key={criterion.key} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircleOutlined className="mt-1 text-emerald-600" />
                <span>{criterion.label} {criterion.points > 0 ? `(+${criterion.points})` : '(tiêu chí chính)'}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {result.cautions.map(caution => (
        <Alert key={caution} className="mt-4" showIcon type="warning" message={caution} />
      ))}
      <Divider />
      <Paragraph type="secondary" className="!mb-2 text-xs leading-5">
        Kết quả là công cụ hỗ trợ quyết định, không phải chẩn đoán tự động và không thay thế đánh giá của bác sĩ. Cần thận trọng khi có phản ứng mô tại chỗ, bệnh lắng đọng tinh thể, bệnh viêm hoặc vi sinh vật phát triển chậm.
      </Paragraph>
      <Space wrap size={16}>
        <Button icon={<ArrowLeftOutlined />} onClick={goBack}>Xem lại câu trả lời</Button>
        <Link href="https://pubmed.ncbi.nlm.nih.gov/29551303/" target="_blank" rel="noreferrer">
          Nguồn: định nghĩa PJI 2018 đã thẩm định
        </Link>
      </Space>
    </Card>
  );

  const renderGenomic = () => {
    if (genomicResult) {
      const positive = genomicResult === 'positive';
      return (
        <Card className="border-slate-200 shadow-sm" styles={{ body: { padding: 28 } }}>
          <Text type="secondary" className="text-xs font-semibold uppercase tracking-wide">Diễn giải kết quả genomic</Text>
          <Title level={2} className="!mb-3 !mt-2 !text-slate-900">
            {positive ? 'Phát hiện tín hiệu vi sinh vật' : 'Không phát hiện tín hiệu vi sinh vật'}
          </Title>
          <Alert
            showIcon
            type={positive ? 'warning' : 'info'}
            message={positive
              ? 'Kết quả dương tính không tự xác nhận PJI.'
              : 'Kết quả âm tính không loại trừ PJI.'}
            description={positive
              ? 'Cần đối chiếu tác nhân, tải lượng/độ phong phú, loại bệnh phẩm, kiểm soát nhiễm bẩn, biểu hiện lâm sàng, nuôi cấy và tiêu chí ICM.'
              : 'Kết quả có thể bị ảnh hưởng bởi tải lượng thấp, chất lượng bệnh phẩm, kháng sinh trước lấy mẫu và giới hạn phát hiện của xét nghiệm.'}
          />
          <Paragraph className="!mb-0 !mt-5 leading-6 text-slate-600">
            Xét nghiệm genomic không nằm trong hệ điểm PJI 2018 ở màn hình này. Không cộng hoặc trừ điểm dựa riêng trên kết quả molecular/genomic.
          </Paragraph>
          <Divider />
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => setGenomicResult(undefined)}>Quay lại</Button>
            <Button icon={<ReloadOutlined />} onClick={reset}>Về màn hình đầu</Button>
          </Space>
        </Card>
      );
    }
    return (
      <QuestionFrame
        current={1}
        total={1}
        statusLabel="Chưa diễn giải"
        statusColor="#475569"
        title="Kết quả Microgen Testing là gì?"
        description="Chọn đúng kết luận trên báo cáo xét nghiệm. Màn hình này không thay thế việc đọc toàn bộ báo cáo genomic."
        onBack={() => setMode(null)}
        onReset={reset}
      >
        <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Button className="h-20 !border-rose-300 !text-lg !font-semibold !text-rose-700" onClick={() => setGenomicResult('positive')}>
            Dương tính
          </Button>
          <Button className="h-20 !border-emerald-700 !text-lg !font-semibold !text-emerald-800" onClick={() => setGenomicResult('negative')}>
            Âm tính
          </Button>
        </div>
      </QuestionFrame>
    );
  };

  return (
    <main className="h-full overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Title level={2} className="!mb-1 !mt-0 !text-slate-950">Công cụ chẩn đoán PJI</Title>
            <Paragraph type="secondary" className="!mb-0 max-w-3xl leading-6">
              Trả lời tuần tự theo PJIDx và định nghĩa PJI 2018 cho khớp háng, khớp gối. Không lưu dữ liệu vào bệnh án.
            </Paragraph>
          </div>
          <Tag icon={<SafetyCertificateOutlined />} color="green" className="w-fit px-3 py-1">
            Hỗ trợ quyết định lâm sàng
          </Tag>
        </div>

        {mode == null ? (
          <Card className="border-slate-200 shadow-sm" styles={{ body: { padding: 28 } }}>
            <Alert
              showIcon
              type="info"
              message="Công cụ không thay thế đánh giá và quyết định của bác sĩ."
              description="Đơn vị xét nghiệm và ngưỡng biên phải được kiểm tra trước khi dùng kết quả để hỗ trợ quyết định điều trị."
              className="mb-6"
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode('diagnosis')}
                className="group flex min-h-36 items-center justify-between rounded-2xl border border-emerald-800 bg-emerald-800 px-6 py-5 text-left text-white transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
              >
                <span>
                  <ExperimentOutlined className="mb-3 block text-2xl" />
                  <span className="block text-xl font-semibold sm:text-2xl">PJI Diagnosis Algorithm</span>
                  <span className="mt-2 block text-sm text-emerald-50">Trả lời tuần tự và tính điểm ICM 2018</span>
                </span>
                <ArrowRightOutlined className="text-xl transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => setMode('genomic')}
                className="group flex min-h-36 items-center justify-between rounded-2xl border border-emerald-800 bg-white px-6 py-5 text-left text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
              >
                <span>
                  <FileSearchOutlined className="mb-3 block text-2xl" />
                  <span className="block text-xl font-semibold sm:text-2xl">Interpret Genomic Results</span>
                  <span className="mt-2 block text-sm text-slate-600">Diễn giải thận trọng kết quả Microgen</span>
                </span>
                <ArrowRightOutlined className="text-xl transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>Nguồn: 2018 Definition of Periprosthetic Hip and Knee Infection và PJIDx</span>
              <Link href="https://www.icmortho.org/pjidx" target="_blank" rel="noreferrer">Xem PJIDx của ICM</Link>
            </div>
          </Card>
        ) : mode === 'genomic' ? renderGenomic() : showResult ? renderDiagnosisResult() : (
          <QuestionFrame
            current={questionIndex + 1}
            total={questions.length}
            statusLabel={conclusion.label}
            statusColor={conclusion.color}
            title={questionCopy[activeQuestion].title}
            description={questionCopy[activeQuestion].description}
            onBack={goBack}
            onReset={reset}
          >
            {renderQuestion()}
          </QuestionFrame>
        )}
      </div>
    </main>
  );
};

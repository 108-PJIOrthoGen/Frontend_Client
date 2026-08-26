import { useMemo, useState } from 'react';
import { Alert, Tag, Typography } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import {
  mapBackendPjiDiagnosis,
  type PjiDiagnosisInput,
  type PjiDiagnosisResult,
} from './quickDiagnosisModel';
import { callEvaluateStatelessPjiDiagnostic } from '@/apis/api';
import {
  BASE_DIAGNOSIS_QUESTIONS,
  BASE_GENOMIC_DIAGNOSIS_QUESTIONS,
  CONCLUSION_COPY,
  DIAGNOSIS_QUESTION_COPY,
  type DiagnosisQuestionId,
} from './constants/diagnosisQuestions';
import { QuestionFrame } from './components/QuestionFrame';
import { ModeSelector, type CalculatorMode } from './components/ModeSelector';
import { DiagnosisQuestionStep } from './components/DiagnosisQuestionStep';
import { DiagnosisResultCard } from './components/DiagnosisResultCard';

const { Paragraph, Title } = Typography;

export const PjiDiagnosisCalculator = () => {
  const [mode, setMode] = useState<CalculatorMode | null>(null);
  const [answers, setAnswers] = useState<PjiDiagnosisInput>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<PjiDiagnosisResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Dynamic question list depending on mode & whether cultures were performed
  const questions = useMemo<DiagnosisQuestionId[]>(() => {
    const baseList =
      mode === 'genomic'
        ? [...BASE_GENOMIC_DIAGNOSIS_QUESTIONS]
        : [...BASE_DIAGNOSIS_QUESTIONS];

    if (!answers.culturesPerformed) {
      return baseList;
    }

    // Insert cultureResult right after culturesPerformed
    const cultureIndex = baseList.indexOf('culturesPerformed');
    if (cultureIndex >= 0) {
      baseList.splice(cultureIndex + 1, 0, 'cultureResult');
    }
    return baseList;
  }, [mode, answers.culturesPerformed]);

  const activeQuestion = questions[questionIndex] ?? questions[0];
  const conclusion = CONCLUSION_COPY[result?.conclusion ?? 'INCOMPLETE'];

  const reset = () => {
    setMode(null);
    setAnswers({});
    setQuestionIndex(0);
    setShowResult(false);
    setResult(null);
    setEvaluationError(null);
  };

  const handleSelectMode = (selectedMode: CalculatorMode) => {
    setMode(selectedMode);
    setAnswers({});
    setQuestionIndex(0);
    setShowResult(false);
    setResult(null);
    setEvaluationError(null);
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
    setQuestionIndex(idx => idx - 1);
  };

  const evaluate = async (input: PjiDiagnosisInput) => {
    if (evaluating) return;
    setEvaluating(true);
    setEvaluationError(null);
    try {
      const { microgenTesting: _supportingGenomicData, ...diagnosticInput } = input;
      const response = await callEvaluateStatelessPjiDiagnostic(diagnosticInput);
      if (!response.data) throw new Error('Backend không trả về kết quả chẩn đoán.');
      setResult(mapBackendPjiDiagnosis(response.data, input));
      setShowResult(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đánh giá PJI lúc này.';
      setEvaluationError(message);
    } finally {
      setEvaluating(false);
    }
  };

  const goNext = (currentAnswers: PjiDiagnosisInput = answers) => {
    if (questionIndex >= questions.length - 1) {
      void evaluate(currentAnswers);
    } else {
      setQuestionIndex(idx => idx + 1);
    }
  };

  const updateAnswer = <Key extends keyof PjiDiagnosisInput>(
    key: Key,
    value: PjiDiagnosisInput[Key],
  ) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const answerAndGoNext = <Key extends keyof PjiDiagnosisInput>(
    key: Key,
    value: PjiDiagnosisInput[Key],
  ) => {
    const nextAnswers = { ...answers, [key]: value };
    setAnswers(nextAnswers);
    goNext(nextAnswers);
  };

  const answerBinary = (
    key: 'previousArthroplasty' | 'sinusTract' | 'culturesPerformed',
    value: boolean,
  ) => {
    const nextAnswers: PjiDiagnosisInput = {
      ...answers,
      [key]: value,
      ...(key === 'culturesPerformed' && !value ? { cultureResult: undefined } : {}),
    };
    setAnswers(nextAnswers);

    // Early termination if not applicable or sinus tract present
    if ((key === 'previousArthroplasty' && !value) || (key === 'sinusTract' && value)) {
      void evaluate(nextAnswers);
      return;
    }
    goNext();
  };

  return (
    <main className="h-full overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Title level={2} className="!mb-1 !mt-0 !text-slate-950">
              Công cụ chẩn đoán PJI
            </Title>
            <Paragraph type="secondary" className="!mb-0 max-w-3xl leading-6">
              Thuật toán chẩn đoán số theo tiêu chuẩn ICM Ortho 2018 và đối chiếu vi sinh phân tử MicroGenDX / NGS.
            </Paragraph>
          </div>
          <Tag icon={<SafetyCertificateOutlined />} color="green" className="w-fit px-3 py-1">
            Hỗ trợ quyết định lâm sàng
          </Tag>
        </div>

        {mode == null ? (
          <ModeSelector onSelectMode={handleSelectMode} />
        ) : showResult && result ? (
          <DiagnosisResultCard
            result={result}
            onReset={reset}
            onBack={() => setShowResult(false)}
          />
        ) : (
          <QuestionFrame
            current={questionIndex + 1}
            total={questions.length}
            statusLabel={conclusion.label}
            statusColor={conclusion.color}
            title={DIAGNOSIS_QUESTION_COPY[activeQuestion].title}
            description={DIAGNOSIS_QUESTION_COPY[activeQuestion].description}
            onBack={goBack}
            onReset={reset}
          >
            {evaluationError ? (
              <Alert className="mb-4" showIcon type="error" message={evaluationError} />
            ) : null}
            {evaluating ? (
              <Alert className="mb-4" showIcon type="info" message="Backend đang đánh giá theo hồ sơ quy tắc PJI 2018…" />
            ) : null}
            <DiagnosisQuestionStep
              activeQuestion={activeQuestion}
              answers={answers}
              onUpdateAnswer={updateAnswer}
              onAnswerAndNext={answerAndGoNext}
              onAnswerBinary={answerBinary}
              onNext={goNext}
            />
          </QuestionFrame>
        )}
      </div>
    </main>
  );
};

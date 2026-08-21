import { useMemo, useState } from 'react';
import { Tag, Typography } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import {
  calculatePjiDiagnosis,
  type PjiDiagnosisInput,
} from './quickDiagnosisModel';
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

  const result = useMemo(() => calculatePjiDiagnosis(answers), [answers]);
  const activeQuestion = questions[questionIndex] ?? questions[0];
  const conclusion = CONCLUSION_COPY[result.conclusion];

  const reset = () => {
    setMode(null);
    setAnswers({});
    setQuestionIndex(0);
    setShowResult(false);
  };

  const handleSelectMode = (selectedMode: CalculatorMode) => {
    setMode(selectedMode);
    setAnswers({});
    setQuestionIndex(0);
    setShowResult(false);
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

  const goNext = () => {
    if (questionIndex >= questions.length - 1) {
      setShowResult(true);
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

  const answerBinary = (
    key: 'previousArthroplasty' | 'sinusTract' | 'culturesPerformed',
    value: boolean,
  ) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'culturesPerformed' && !value ? { cultureResult: undefined } : {}),
    }));

    // Early termination if not applicable or sinus tract present
    if ((key === 'previousArthroplasty' && !value) || (key === 'sinusTract' && value)) {
      setShowResult(true);
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
        ) : showResult ? (
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
            <DiagnosisQuestionStep
              activeQuestion={activeQuestion}
              answers={answers}
              onUpdateAnswer={updateAnswer}
              onAnswerBinary={answerBinary}
              onNext={goNext}
            />
          </QuestionFrame>
        )}
      </div>
    </main>
  );
};

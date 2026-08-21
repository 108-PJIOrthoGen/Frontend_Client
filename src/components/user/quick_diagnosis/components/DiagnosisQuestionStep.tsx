import React from 'react';
import { Button, Checkbox, Input, InputNumber, Radio, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import type {
  PjiDiagnosisInput,
  PjiGenomicAbundance,
  PjiGenomicAmrGene,
  PjiGenomicDetection,
  PjiTernaryResult,
} from '../quickDiagnosisModel';
import {
  CULTURE_RESULT_OPTIONS,
  LEUKOCYTE_ESTERASE_OPTIONS,
  SERUM_TESTS_CONFIG,
  SYNOVIAL_TESTS_CONFIG,
  TERNARY_OPTIONS,
  type DiagnosisQuestionId,
} from '../constants/diagnosisQuestions';
import { GENOMIC_AMR_GENE_OPTIONS } from '../constants/genomicQuestions';
import { BinaryAnswers } from './BinaryAnswers';

const { Text } = Typography;

const isValidMeasurement = (value: number | undefined): boolean => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0
);

export interface DiagnosisQuestionStepProps {
  activeQuestion: DiagnosisQuestionId;
  answers: PjiDiagnosisInput;
  onUpdateAnswer: <Key extends keyof PjiDiagnosisInput>(key: Key, value: PjiDiagnosisInput[Key]) => void;
  onAnswerBinary: (key: 'previousArthroplasty' | 'sinusTract' | 'culturesPerformed', value: boolean) => void;
  onNext: () => void;
}

export const DiagnosisQuestionStep: React.FC<DiagnosisQuestionStepProps> = ({
  activeQuestion,
  answers,
  onUpdateAnswer,
  onAnswerBinary,
  onNext,
}) => {
  const selectedSerum = Object.keys(answers.serumTests ?? {});
  const selectedSynovial = Object.keys(answers.synovialTests ?? {});

  const updateMeasurement = (
    group: 'serumTests' | 'synovialTests',
    key: string,
    value: number | undefined,
  ) => {
    onUpdateAnswer(group, { ...answers[group], [key]: value });
  };

  const toggleMeasurement = (
    group: 'serumTests' | 'synovialTests',
    key: string,
    checked: boolean,
  ) => {
    const next = { ...answers[group] } as Record<string, number | undefined>;
    if (checked) next[key] = undefined;
    else delete next[key];
    onUpdateAnswer(group, next);
  };

  const serumReady = selectedSerum.every(key => (
    isValidMeasurement(answers.serumTests?.[key as keyof NonNullable<PjiDiagnosisInput['serumTests']>])
  ));

  const synovialReady = selectedSynovial.every(key => (
    isValidMeasurement(answers.synovialTests?.[key as keyof NonNullable<PjiDiagnosisInput['synovialTests']>])
  ));

  switch (activeQuestion) {
    case 'microgenTesting': {
      const microgen = answers.microgenTesting ?? {};
      const detection = microgen.detection;

      const setDetection = (val: PjiGenomicDetection) => {
        onUpdateAnswer('microgenTesting', {
          ...microgen,
          detection: val,
          amrGenes: microgen.amrGenes ?? ['none'],
        });
      };

      const setPathogenName = (name: string) => {
        onUpdateAnswer('microgenTesting', { ...microgen, organismName: name });
      };

      const setAbundance = (ab: PjiGenomicAbundance) => {
        onUpdateAnswer('microgenTesting', { ...microgen, abundance: ab });
      };

      const toggleAmrGene = (gene: PjiGenomicAmrGene, checked: boolean) => {
        const currentAmr = microgen.amrGenes ?? [];
        let next: PjiGenomicAmrGene[];
        if (gene === 'none') {
          next = checked ? ['none'] : [];
        } else {
          const withoutNone = currentAmr.filter(g => g !== 'none');
          next = checked ? [...withoutNone, gene] : withoutNone.filter(g => g !== gene);
        }
        onUpdateAnswer('microgenTesting', { ...microgen, amrGenes: next });
      };

      return (
        <div className="max-w-4xl space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              className={`rounded-xl border p-4 text-left transition ${
                detection === 'positive'
                  ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setDetection('positive')}
            >
              <div className="text-lg font-bold text-rose-800">Dương tính (+)</div>
              <div className="text-xs text-rose-600 mt-1">Phát hiện DNA vi khuẩn / vi nấm</div>
            </button>

            <button
              type="button"
              className={`rounded-xl border p-4 text-left transition ${
                detection === 'negative'
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setDetection('negative')}
            >
              <div className="text-lg font-bold text-emerald-900">Âm tính (−)</div>
              <div className="text-xs text-emerald-700 mt-1">Không phát hiện tín hiệu DNA vượt ngưỡng</div>
            </button>

            <button
              type="button"
              className={`rounded-xl border p-4 text-left transition ${
                detection === 'notDone'
                  ? 'border-slate-600 bg-slate-100 ring-2 ring-slate-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setDetection('notDone')}
            >
              <div className="text-lg font-bold text-slate-800">Chưa có / Không làm</div>
              <div className="text-xs text-slate-500 mt-1">Chỉ tính toán theo tiêu chuẩn ICM 2018</div>
            </button>
          </div>

          {/* If Positive, show detailed inputs */}
          {detection === 'positive' ? (
            <div className="mt-5 space-y-4 rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
              <div>
                <Text strong className="text-slate-900">Tên vi sinh vật phát hiện (tùy chọn):</Text>
                <Input
                  className="mt-1 w-full"
                  placeholder="Ví dụ: Staphylococcus aureus, Cutibacterium acnes, Candida..."
                  value={microgen.organismName}
                  onChange={e => setPathogenName(e.target.value)}
                />
              </div>

              <div>
                <Text strong className="text-slate-900">Tỷ lệ phong phú tương đối (% Relative Abundance):</Text>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    className={`rounded-lg border p-2.5 text-center text-sm font-medium transition ${
                      microgen.abundance === 'dominant'
                        ? 'border-emerald-700 bg-emerald-100/70 text-emerald-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                    onClick={() => setAbundance('dominant')}
                  >
                    Ưu thế cao (&gt;50% reads)
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border p-2.5 text-center text-sm font-medium transition ${
                      microgen.abundance === 'moderate'
                        ? 'border-emerald-700 bg-emerald-100/70 text-emerald-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                    onClick={() => setAbundance('moderate')}
                  >
                    Trung bình (20% – 50%)
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border p-2.5 text-center text-sm font-medium transition ${
                      microgen.abundance === 'low_trace'
                        ? 'border-emerald-700 bg-emerald-100/70 text-emerald-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                    onClick={() => setAbundance('low_trace')}
                  >
                    Lượng vết (&lt;20% reads)
                  </button>
                </div>
              </div>

              <div>
                <Text strong className="text-slate-900">Gen kháng thuốc (AMR):</Text>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {GENOMIC_AMR_GENE_OPTIONS.map(gene => {
                    const isChecked = (microgen.amrGenes ?? []).includes(gene.value);
                    return (
                      <div key={gene.value} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                        <Checkbox
                          checked={isChecked}
                          onChange={e => toggleAmrGene(gene.value, e.target.checked)}
                        >
                          <span className="font-semibold">{gene.label}</span>
                        </Checkbox>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <Button
            type="primary"
            size="large"
            className="mt-4"
            disabled={!detection}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={onNext}
          >
            Tiếp tục sang câu hỏi ICM 2018
          </Button>
        </div>
      );
    }

    case 'previousArthroplasty':
      return <BinaryAnswers onAnswer={value => onAnswerBinary('previousArthroplasty', value)} />;

    case 'sinusTract':
      return <BinaryAnswers onAnswer={value => onAnswerBinary('sinusTract', value)} />;

    case 'culturesPerformed':
      return <BinaryAnswers onAnswer={value => onAnswerBinary('culturesPerformed', value)} />;

    case 'cultureResult':
      return (
        <div className="max-w-4xl space-y-3">
          {CULTURE_RESULT_OPTIONS.map(option => (
            <Button
              block
              key={option.value}
              className="h-auto min-h-14 !justify-start whitespace-normal !border-slate-300 !px-5 !py-3 !text-left !text-base"
              onClick={() => {
                onUpdateAnswer('cultureResult', option.value);
                onNext();
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      );

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
            onChange={value => onUpdateAnswer('daysSinceArthroplasty', value ?? undefined)}
          />
          <Button
            type="primary"
            className="mt-4"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            disabled={!isValidMeasurement(answers.daysSinceArthroplasty)}
            onClick={onNext}
          >
            Tiếp tục
          </Button>
        </div>
      );

    case 'serumTests':
      return (
        <div className="max-w-4xl">
          <div className="space-y-3">
            {SERUM_TESTS_CONFIG.map(test => {
              const selected = selectedSerum.includes(test.key);
              return (
                <div
                  key={test.key}
                  className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[180px_1fr] sm:items-center"
                >
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
                  ) : (
                    <Text type="secondary">Không thực hiện</Text>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            type="primary"
            className="mt-4"
            disabled={!serumReady}
            onClick={() => {
              if (answers.serumTests == null) onUpdateAnswer('serumTests', {});
              onNext();
            }}
          >
            Tiếp tục
          </Button>
        </div>
      );

    case 'synovialTests':
      return (
        <div className="max-w-4xl">
          <div className="space-y-3">
            {SYNOVIAL_TESTS_CONFIG.map(test => {
              const selected = selectedSynovial.includes(test.key);
              return (
                <div
                  key={test.key}
                  className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[180px_1fr] sm:items-center"
                >
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
                  ) : (
                    <Text type="secondary">Không thực hiện</Text>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            type="primary"
            className="mt-4"
            disabled={!synovialReady}
            onClick={() => {
              if (answers.synovialTests == null) onUpdateAnswer('synovialTests', {});
              onNext();
            }}
          >
            Tiếp tục
          </Button>
        </div>
      );

    case 'leukocyteEsterase':
      return (
        <Radio.Group
          className="grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2"
          value={answers.leukocyteEsterase}
          onChange={event => {
            onUpdateAnswer('leukocyteEsterase', event.target.value);
            onNext();
          }}
        >
          {LEUKOCYTE_ESTERASE_OPTIONS.map(option => (
            <Radio.Button
              key={option.value}
              value={option.value}
              className="!h-auto !min-h-14 !py-3 !text-center"
            >
              {option.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      );

    case 'alphaDefensin':
    case 'histology':
    case 'purulence':
      return (
        <Radio.Group
          className="grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3"
          value={answers[activeQuestion] as PjiTernaryResult}
          onChange={event => {
            onUpdateAnswer(activeQuestion, event.target.value);
            onNext();
          }}
        >
          {TERNARY_OPTIONS.map(option => (
            <Radio.Button
              key={option.value}
              value={option.value}
              className="!h-auto !min-h-14 !py-3 !text-center"
            >
              {option.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      );

    default:
      return null;
  }
};

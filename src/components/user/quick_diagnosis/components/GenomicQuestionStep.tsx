import React from 'react';
import { Button, Checkbox, Input, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import type {
  PjiGenomicAmrGene,
  PjiGenomicInput,
} from '../quickDiagnosisModel';
import {
  GENOMIC_ABUNDANCE_OPTIONS,
  GENOMIC_AMR_GENE_OPTIONS,
  GENOMIC_CLINICAL_SUSPICION_OPTIONS,
  GENOMIC_CULTURE_CONCORDANCE_OPTIONS,
  GENOMIC_ORGANISM_GROUP_OPTIONS,
  GENOMIC_PATTERN_OPTIONS,
  GENOMIC_SPECIMEN_OPTIONS,
  GENOMIC_TECHNOLOGY_OPTIONS,
  type GenomicQuestionId,
} from '../constants/genomicQuestions';
import { BinaryAnswers } from './BinaryAnswers';

const { Text } = Typography;

export interface GenomicQuestionStepProps {
  activeQuestion: GenomicQuestionId;
  answers: PjiGenomicInput;
  onUpdateAnswer: <Key extends keyof PjiGenomicInput>(key: Key, value: PjiGenomicInput[Key]) => void;
  onNext: () => void;
}

export const GenomicQuestionStep: React.FC<GenomicQuestionStepProps> = ({
  activeQuestion,
  answers,
  onUpdateAnswer,
  onNext,
}) => {
  switch (activeQuestion) {
    case 'technology':
      return (
        <div className="max-w-4xl space-y-3">
          {GENOMIC_TECHNOLOGY_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              className={`w-full rounded-xl border p-4 text-left transition ${
                answers.technology === option.value
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
              }`}
              onClick={() => {
                onUpdateAnswer('technology', option.value);
                onNext();
              }}
            >
              <div className="font-semibold text-slate-900">{option.label}</div>
              <div className="mt-1 text-sm text-slate-500">{option.description}</div>
            </button>
          ))}
        </div>
      );

    case 'specimen':
      return (
        <div className="max-w-4xl space-y-3">
          {GENOMIC_SPECIMEN_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              className={`w-full rounded-xl border p-4 text-left transition ${
                answers.specimen === option.value
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
              }`}
              onClick={() => {
                onUpdateAnswer('specimen', option.value);
                onNext();
              }}
            >
              <div className="font-semibold text-slate-900">{option.label}</div>
              <div className="mt-1 text-sm text-slate-500">{option.description}</div>
            </button>
          ))}
        </div>
      );

    case 'priorAntibiotics':
      return (
        <BinaryAnswers
          onAnswer={value => {
            onUpdateAnswer('priorAntibiotics', value);
            onNext();
          }}
          yesLabel="Có (đã dùng kháng sinh)"
          noLabel="Không (chưa dùng kháng sinh)"
        />
      );

    case 'detection':
      return (
        <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Button
            className="h-24 !border-rose-300 !bg-rose-50/50 !text-left !text-rose-800 hover:!bg-rose-100/50"
            onClick={() => {
              onUpdateAnswer('detection', 'positive');
              onNext();
            }}
          >
            <div>
              <div className="text-xl font-bold">Dương tính (+)</div>
              <div className="text-xs text-rose-600 font-normal mt-1">
                Phát hiện tín hiệu DNA vi khuẩn / vi nấm
              </div>
            </div>
          </Button>
          <Button
            className="h-24 !border-emerald-700 !bg-emerald-50/50 !text-left !text-emerald-900 hover:!bg-emerald-100/50"
            onClick={() => {
              onUpdateAnswer('detection', 'negative');
              onNext();
            }}
          >
            <div>
              <div className="text-xl font-bold">Âm tính (−)</div>
              <div className="text-xs text-emerald-700 font-normal mt-1">
                Không phát hiện tín hiệu DNA vượt ngưỡng
              </div>
            </div>
          </Button>
        </div>
      );

    case 'microbialPattern':
      return (
        <div className="max-w-4xl space-y-3">
          {GENOMIC_PATTERN_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              className={`w-full rounded-xl border p-4 text-left transition ${
                answers.microbialPattern === option.value
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
              }`}
              onClick={() => {
                onUpdateAnswer('microbialPattern', option.value);
                onNext();
              }}
            >
              <div className="font-semibold text-slate-900">{option.label}</div>
              <div className="mt-1 text-sm text-slate-500">{option.description}</div>
            </button>
          ))}
        </div>
      );

    case 'abundance':
      return (
        <div className="max-w-4xl space-y-3">
          {GENOMIC_ABUNDANCE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              className={`w-full rounded-xl border p-4 text-left transition ${
                answers.abundance === option.value
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
              }`}
              onClick={() => {
                onUpdateAnswer('abundance', option.value);
                onNext();
              }}
            >
              <div className="font-semibold text-slate-900">{option.label}</div>
              <div className="mt-1 text-sm text-slate-500">{option.description}</div>
            </button>
          ))}
        </div>
      );

    case 'organismGroup':
      return (
        <div className="max-w-4xl space-y-3">
          {GENOMIC_ORGANISM_GROUP_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              className={`w-full rounded-xl border p-4 text-left transition ${
                answers.organismGroup === option.value
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
              }`}
              onClick={() => {
                onUpdateAnswer('organismGroup', option.value);
                onNext();
              }}
            >
              <div className="font-semibold text-slate-900">{option.label}</div>
              <div className="mt-1 text-sm text-slate-500">{option.description}</div>
            </button>
          ))}
        </div>
      );

    case 'organismName':
      return (
        <div className="max-w-xl">
          <Input
            size="large"
            placeholder="Ví dụ: Staphylococcus aureus, Cutibacterium acnes..."
            value={answers.organismName}
            onChange={e => onUpdateAnswer('organismName', e.target.value)}
            className="w-full"
          />
          <div className="mt-2 text-xs text-slate-500">
            Có thể để trống nếu không có tên cụ thể hoặc chưa rõ.
          </div>
          <Button
            type="primary"
            className="mt-4"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={onNext}
          >
            Tiếp tục
          </Button>
        </div>
      );

    case 'amrGenes': {
      const selected = answers.amrGenes ?? [];
      const handleToggle = (geneValue: PjiGenomicAmrGene, checked: boolean) => {
        let next: PjiGenomicAmrGene[];
        if (geneValue === 'none') {
          next = checked ? ['none'] : [];
        } else {
          const withoutNone = selected.filter(g => g !== 'none');
          next = checked ? [...withoutNone, geneValue] : withoutNone.filter(g => g !== geneValue);
        }
        onUpdateAnswer('amrGenes', next);
      };

      return (
        <div className="max-w-4xl">
          <div className="space-y-3">
            {GENOMIC_AMR_GENE_OPTIONS.map(option => {
              const isChecked = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`rounded-xl border p-4 transition ${
                    isChecked ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={e => handleToggle(option.value, e.target.checked)}
                  >
                    <Text strong className="text-slate-900">
                      {option.label}
                    </Text>
                  </Checkbox>
                  <div className="mt-1 pl-6 text-xs text-slate-500">{option.description}</div>
                </div>
              );
            })}
          </div>
          <Button
            type="primary"
            className="mt-5"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={onNext}
          >
            Tiếp tục
          </Button>
        </div>
      );
    }

    case 'cultureConcordance':
      return (
        <div className="max-w-4xl space-y-3">
          {GENOMIC_CULTURE_CONCORDANCE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              className={`w-full rounded-xl border p-4 text-left transition ${
                answers.cultureConcordance === option.value
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
              }`}
              onClick={() => {
                onUpdateAnswer('cultureConcordance', option.value);
                onNext();
              }}
            >
              <div className="font-semibold text-slate-900">{option.label}</div>
              <div className="mt-1 text-sm text-slate-500">{option.description}</div>
            </button>
          ))}
        </div>
      );

    case 'clinicalSuspicion':
      return (
        <div className="max-w-4xl space-y-3">
          {GENOMIC_CLINICAL_SUSPICION_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              className={`w-full rounded-xl border p-4 text-left transition ${
                answers.clinicalSuspicion === option.value
                  ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
              }`}
              onClick={() => {
                onUpdateAnswer('clinicalSuspicion', option.value);
                onNext();
              }}
            >
              <div className="font-semibold text-slate-900">{option.label}</div>
              <div className="mt-1 text-sm text-slate-500">{option.description}</div>
            </button>
          ))}
        </div>
      );

    default:
      return null;
  }
};

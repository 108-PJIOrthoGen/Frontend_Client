import React from 'react';
import { Button } from 'antd';

export interface BinaryAnswersProps {
  onAnswer: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}

export const BinaryAnswers: React.FC<BinaryAnswersProps> = ({
  onAnswer,
  yesLabel = 'Có',
  noLabel = 'Không',
}) => (
  <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
    <Button
      className="h-20 !border-emerald-700 !text-xl !font-semibold !text-emerald-800"
      onClick={() => onAnswer(true)}
    >
      {yesLabel}
    </Button>
    <Button
      className="h-20 !border-emerald-700 !text-xl !font-semibold !text-emerald-800"
      onClick={() => onAnswer(false)}
    >
      {noLabel}
    </Button>
  </div>
);

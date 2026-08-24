import React from 'react';
import { Button } from 'antd';
import type { RecommendationScope } from '@/types/backend';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  canContinue?: boolean;
  nextLabel?: string;
  recommendationScope?: RecommendationScope;
}

const TreatmentPlanHeader: React.FC<Props> = ({
  onPrev,
  onNext,
  canContinue = true,
  nextLabel = 'Tiếp tục',
  recommendationScope = 'SURGERY',
}) => {
  return (
    <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b justify-between border-slate-200/60 px-6 py-4 flex items-center shadow-sm z-20 sticky top-0 w-full transition-all">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600"></div>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center shadow-md shadow-emerald-400/30">
          <span className="material-symbols-outlined text-green text-2xl">psychology</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {recommendationScope === 'ANTIBIOTIC' ? 'Gợi ý phác đồ kháng sinh' : 'Gợi ý phác đồ phẫu thuật'}
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Kết quả của AI chỉ mang tính tham khảo vì có thể đưa ra sai sót.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all bg-white border border-slate-300 shadow-sm rounded-xl hover:shadow hover:bg-slate-50"
        >
          Quay lại
        </button>
        <Button
          size="large"
          type="primary"
          onClick={onNext}
          disabled={!canContinue}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none shadow-md shadow-emerald-500/30 rounded-xl font-bold px-6 h-[42px] flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
        >
          {nextLabel} <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Button>
      </div>
    </header>
  );
};

export default TreatmentPlanHeader;

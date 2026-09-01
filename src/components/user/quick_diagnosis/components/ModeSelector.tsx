import React from 'react';
import { Alert, Card, Typography } from 'antd';
import { ArrowRightOutlined, ExperimentOutlined, FileSearchOutlined } from '@ant-design/icons';

export type CalculatorMode = 'diagnosis' | 'genomic';

export interface ModeSelectorProps {
  onSelectMode: (mode: CalculatorMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <Card className="border-slate-200 shadow-sm" styles={{ body: { padding: 28 } }}>
      <Alert
        showIcon
        type="info"
        message="Công cụ chẩn đoán PJI theo đồng thuận quốc tế ICM Ortho 2018."
        description="Lựa chọn phương thức đánh giá phù hợp với dữ liệu lâm sàng và xét nghiệm của người bệnh."
        className="mb-6"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectMode('diagnosis')}
          className="group flex min-h-36 items-center justify-between rounded-2xl border border-emerald-800 bg-emerald-800 px-6 py-5 text-left text-white transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
        >
          <span>
            <ExperimentOutlined className="mb-3 block text-2xl" />
            <span className="block text-xl font-semibold sm:text-2xl">Sàng lọc nhanh nhiễm trùng khớp</span>
            <span className="mt-2 block text-sm text-emerald-50">
            Theo tiêu chuẩn ICM 2018
            </span>
          </span>
          <ArrowRightOutlined className="text-xl transition-transform group-hover:translate-x-1" />
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('genomic')}
          className="group flex min-h-36 items-center justify-between rounded-2xl border border-emerald-800 bg-white px-6 py-5 text-left text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
        >
          <span>
            <FileSearchOutlined className="mb-3 block text-2xl" />
            <span className="block text-xl font-semibold sm:text-2xl">Phiên giải kết quả gen</span>
            <span className="mt-2 block text-sm text-slate-600">
              Đánh giá MicroGen Testing kết hợp toàn bộ tiêu chuẩn ICM 2018 (Đối chiếu chéo)
            </span>
          </span>
          <ArrowRightOutlined className="text-xl transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </Card>
  );
};

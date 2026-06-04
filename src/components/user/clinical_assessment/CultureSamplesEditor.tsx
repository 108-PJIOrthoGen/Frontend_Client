import React from 'react';
import { Checkbox, Input, InputNumber, Select } from 'antd';
import { useClinicForm } from '@/redux/hook';

/**
 * Editable list of culture (vi khuẩn) samples bound to
 * `clinicForm.cultureResults`. Extracted verbatim from the original
 * MicrobiologyTestsTable "Cấy khuẩn" cell so the same form can be reused both
 * inside the microbiology table and in the pending-lab follow-up tab.
 */
const CultureSamplesEditor: React.FC = () => {
  const { form: clinicForm, setForm } = useClinicForm();

  return (
    <div className="p-4 space-y-4">
      {clinicForm.cultureResults?.map((sample, sampleIdx) => (
        <div
          key={sample._tempId || sample.id || sampleIdx}
          className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-sm">
              Mẫu {sample.sampleNumber}
            </span>
            <button
              type="button"
              onClick={() => {
                const newSamples = clinicForm.cultureResults.filter(
                  (_, idx) => idx !== sampleIdx,
                );
                const renumbered = newSamples.map((s, idx) => ({
                  ...s,
                  sampleNumber: idx + 1,
                }));
                setForm((prev) => ({ ...prev, cultureResults: renumbered }));
              }}
              className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Xóa
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Kết quả</label>
              <Select
                value={sample.result || undefined}
                onChange={(val) => {
                  const newSamples = [...clinicForm.cultureResults];
                  newSamples[sampleIdx] = { ...newSamples[sampleIdx], result: val };
                  setForm((prev) => ({ ...prev, cultureResults: newSamples }));
                }}
                placeholder="-- Chọn kết quả --"
                className="w-full"
                options={[
                  { value: 'POSITIVE', label: 'Dương tính' },
                  { value: 'NEGATIVE', label: 'Âm tính' },
                  { value: 'CONTAMINATED', label: 'Nhiễm bẩn' },
                  { value: 'PENDING', label: 'Đang chờ kết quả' },
                ]}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Tên vi khuẩn</label>
              <Input
                value={sample.name || ''}
                onChange={(e) => {
                  const newSamples = [...clinicForm.cultureResults];
                  newSamples[sampleIdx] = {
                    ...newSamples[sampleIdx],
                    name: e.target.value,
                  };
                  setForm((prev) => ({ ...prev, cultureResults: newSamples }));
                }}
                placeholder="Nhập tên..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Nhuộm Gram</label>
              <Select
                value={sample.gramType || undefined}
                onChange={(val) => {
                  const newSamples = [...clinicForm.cultureResults];
                  newSamples[sampleIdx] = { ...newSamples[sampleIdx], gramType: val };
                  setForm((prev) => ({ ...prev, cultureResults: newSamples }));
                }}
                placeholder="-- Chọn loại --"
                className="w-full"
                options={[
                  { value: 'GRAM_POSITIVE', label: 'Gram Dương' },
                  { value: 'GRAM_NEGATIVE', label: 'Gram Âm' },
                  { value: 'UNKNOWN', label: 'Chưa rõ' },
                  { value: 'Gram Dương', label: 'Gram Dương' },
                  { value: 'Gram Âm', label: 'Gram Âm' },
                  { value: 'Chưa rõ', label: 'Chưa rõ' },
                ]}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Số ngày ủ (incubationDays)
              </label>
              <InputNumber
                value={sample.incubationDays}
                onChange={(val) => {
                  const newSamples = [...clinicForm.cultureResults];
                  newSamples[sampleIdx] = {
                    ...newSamples[sampleIdx],
                    incubationDays: val ?? undefined,
                  };
                  setForm((prev) => ({ ...prev, cultureResults: newSamples }));
                }}
                placeholder="VD: 3"
                className="w-full"
                min={0}
                controls={false}
              />
            </div>

            <div className="flex flex-col justify-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={sample.antibioticed || false}
                  onChange={(e) => {
                    const newSamples = [...clinicForm.cultureResults];
                    newSamples[sampleIdx] = {
                      ...newSamples[sampleIdx],
                      antibioticed: e.target.checked,
                    };
                    setForm((prev) => ({ ...prev, cultureResults: newSamples }));
                  }}
                />
                <span className="text-sm font-medium text-slate-700">
                  Đã dùng KS trước đó
                </span>
              </label>
            </div>

            {sample.antibioticed && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Số ngày ngưng KS (daysOffAntibiotic)
                </label>
                <InputNumber
                  value={sample.daysOffAntibio}
                  onChange={(val) => {
                    const newSamples = [...clinicForm.cultureResults];
                    newSamples[sampleIdx] = {
                      ...newSamples[sampleIdx],
                      daysOffAntibio: val ?? 0,
                    };
                    setForm((prev) => ({ ...prev, cultureResults: newSamples }));
                  }}
                  placeholder="VD: 7"
                  className="w-full"
                  min={0}
                  controls={false}
                />
              </div>
            )}

            <div
              className={`flex flex-col gap-1.5 ${sample.antibioticed ? '' : 'md:col-span-2'}`}
            >
              <label className="text-xs font-semibold text-slate-700">Ghi chú (notes)</label>
              <Input
                value={sample.notes || ''}
                onChange={(e) => {
                  const newSamples = [...clinicForm.cultureResults];
                  newSamples[sampleIdx] = {
                    ...newSamples[sampleIdx],
                    notes: e.target.value,
                  };
                  setForm((prev) => ({ ...prev, cultureResults: newSamples }));
                }}
                placeholder="note..."
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          const newSample = {
            _tempId: Math.random().toString(36).substring(2, 11),
            sampleNumber: (clinicForm.cultureResults?.length || 0) + 1,
            name: '',
            incubationDays: undefined,
            result: '',
            notes: '',
            gramType: '',
            antibioticed: false,
            daysOffAntibio: 0,
          };
          setForm((prev) => ({
            ...prev,
            cultureResults: [...(prev.cultureResults || []), newSample],
          }));
        }}
        className="w-full py-2 border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-2"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Thêm mẫu vi khuẩn mới
      </button>
    </div>
  );
};

export default CultureSamplesEditor;

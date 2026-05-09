import React from 'react';
import { Checkbox, Input, InputNumber, Select } from 'antd';
import { useClinicForm } from '@/redux/hook';

const MicrobiologyTestsTable: React.FC = () => {
  const { form: clinicForm, setForm } = useClinicForm();

  const addCustomRow = () => {
    const newId = `fa_custom_${Date.now()}`;
    setForm((prev) => ({
      ...prev,
      fluidAnalysis: [
        ...prev.fluidAnalysis,
        { id: newId, name: '', result: '', normalRange: '', unit: '' },
      ],
    }));
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-amber-50 to-slate-50 px-6 py-3 border-b border-amber-100 flex items-center justify-between">
        <h4 className="text-amber-900 font-bold text-base flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-500/10 text-amber-600 text-xs font-bold">
            3
          </span>
          Xét nghiệm vi sinh
        </h4>
        <button
          type="button"
          onClick={addCustomRow}
          className="text-amber-600 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Thêm xét nghiệm
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-700">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200">Tên xét nghiệm</th>
              <th className="px-4 py-3 border-r border-slate-200">Kết quả</th>
              <th className="px-4 py-3 border-r border-slate-200 w-32">Chỉ số BT</th>
              <th className="px-4 py-3 border-r border-slate-200">Đơn vị</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clinicForm.fluidAnalysis?.map((test, index) => {
              if (test.name === 'Nhuộm Gram') return null;
              const isCustom = test.id.startsWith('fa_custom_');
              return (
                <tr key={test.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">
                    {isCustom ? (
                      <Input
                        type="text"
                        value={test.name}
                        placeholder="Tên xét nghiệm"
                        onChange={(e) => {
                          const newTests = clinicForm.fluidAnalysis.map((t, i) =>
                            i === index ? { ...t, name: e.target.value } : t,
                          );
                          setForm((prev) => ({ ...prev, fluidAnalysis: newTests }));
                        }}
                        className="w-full border-none bg-transparent px-0"
                      />
                    ) : (
                      test.name
                    )}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 p-0">
                    {test.name === 'Cấy khuẩn' ? (
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
                                  placeholder="-- Chon ket qua --"
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
                    ) : (
                      <Input
                        type="text"
                        value={test.result}
                        onChange={(e) => {
                          const newTests = (clinicForm.fluidAnalysis || []).map((t, i) =>
                            i === index ? { ...t, result: e.target.value } : t,
                          );
                          setForm((prev) => ({ ...prev, fluidAnalysis: newTests }));
                        }}
                        className="w-full h-full px-4 py-2 border-none bg-transparent"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-700">
                    {isCustom ? (
                      <Input
                        type="text"
                        value={test.normalRange}
                        placeholder="VD: 40 - 74"
                        onChange={(e) => {
                          const newTests = clinicForm.fluidAnalysis.map((t, i) =>
                            i === index ? { ...t, normalRange: e.target.value } : t,
                          );
                          setForm((prev) => ({ ...prev, fluidAnalysis: newTests }));
                        }}
                        className="w-full border-none bg-transparent px-0"
                      />
                    ) : (
                      test.normalRange
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500 bg-slate-50/30 border-r border-slate-200">
                    {isCustom ? (
                      <Input
                        type="text"
                        value={test.unit}
                        placeholder="VD: mg/L"
                        onChange={(e) => {
                          const newTests = clinicForm.fluidAnalysis.map((t, i) =>
                            i === index ? { ...t, unit: e.target.value } : t,
                          );
                          setForm((prev) => ({ ...prev, fluidAnalysis: newTests }));
                        }}
                        className="w-full border-none bg-transparent px-0"
                      />
                    ) : (
                      test.unit
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            fluidAnalysis: prev.fluidAnalysis.filter((_, i) => i !== index),
                          }));
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Xóa xét nghiệm"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MicrobiologyTestsTable;

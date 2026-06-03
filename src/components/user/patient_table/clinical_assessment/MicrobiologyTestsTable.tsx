import React from 'react';
import { Input } from 'antd';
import { useClinicForm } from '@/redux/hook';
import { getTestRowKind } from './utils/testRowKind';
import CultureSamplesEditor from '../../clinical_assessment/CultureSamplesEditor';

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
              const kind = getTestRowKind(test.id);
              const isCustom = kind === 'custom';
              const isExtra = kind === 'extra';
              return (
                <tr key={test.id ?? `row-${index}`} className="hover:bg-slate-50/50">
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
                      <span className="flex items-center gap-2">
                        {test.name}
                        {isExtra && (
                          <span
                            title="Xét nghiệm do AI đề xuất, không thuộc bảng chuẩn"
                            className="text-[10px] font-bold uppercase tracking-wide bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded"
                          >
                            AI
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 p-0">
                    {test.name === 'Cấy khuẩn' ? (
                      <CultureSamplesEditor />
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

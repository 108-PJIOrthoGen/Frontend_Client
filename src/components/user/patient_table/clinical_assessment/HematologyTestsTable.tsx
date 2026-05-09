import React from 'react';
import { Input } from 'antd';
import { useClinicForm } from '@/redux/hook';
import { getTestStatus } from './utils/testStatus';

const HematologyTestsTable: React.FC = () => {
  const { form: clinicForm, setForm } = useClinicForm();

  const addCustomRow = () => {
    const newId = `ht_custom_${Date.now()}`;
    setForm((prev) => ({
      ...prev,
      hematologyTests: [
        ...prev.hematologyTests,
        { id: newId, name: '', result: '', normalRange: '', unit: '' },
      ],
    }));
  };

  return (
    <div className="border-b border-slate-200">
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
        <h4 className="text-blue-900 font-bold text-base flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-blue-500/10 text-blue-600 text-xs font-bold">
            1
          </span>
          Xét nghiệm huyết học
        </h4>
        <button
          type="button"
          onClick={addCustomRow}
          className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-green-600">add_circle</span>
          Thêm xét nghiệm
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-700">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200">Tên xét nghiệm</th>
              <th className="px-4 py-3 border-r border-slate-200 w-32">Kết quả</th>
              <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">Ghi chú</th>
              <th className="px-4 py-3 border-r border-slate-200 w-32">Chỉ số BT</th>
              <th className="px-4 py-3 border-r border-slate-200">Đơn vị</th>
              <th className="px-4 py-3 w-16">Sửa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clinicForm.hematologyTests?.map((test, index) => {
              const isCustom = test.id.startsWith('ht_custom_');
              return (
                <tr key={test.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">
                    {isCustom ? (
                      <Input
                        type="text"
                        value={test.name}
                        placeholder="Tên xét nghiệm"
                        onChange={(e) => {
                          const newTests = clinicForm.hematologyTests.map((t, i) =>
                            i === index ? { ...t, name: e.target.value } : t,
                          );
                          setForm((prev) => ({ ...prev, hematologyTests: newTests }));
                        }}
                        className="w-full border-none bg-transparent px-0"
                      />
                    ) : (
                      test.name
                    )}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 p-0">
                    <Input
                      type="text"
                      value={test.result}
                      onChange={(e) => {
                        const newTests = clinicForm.hematologyTests.map((t, i) =>
                          i === index ? { ...t, result: e.target.value } : t,
                        );
                        setForm((prev) => ({ ...prev, hematologyTests: newTests }));
                      }}
                      className="w-full h-full px-4 py-2 border-none bg-transparent"
                    />
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center font-bold">
                    {(() => {
                      const status = getTestStatus(test.result, test.normalRange);
                      return status ? (
                        <span className={status === 'H' ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'}>
                          {status}
                        </span>
                      ) : null;
                    })()}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-700">
                    {isCustom ? (
                      <Input
                        type="text"
                        value={test.normalRange}
                        placeholder="VD: 40 - 74"
                        onChange={(e) => {
                          const newTests = clinicForm.hematologyTests.map((t, i) =>
                            i === index ? { ...t, normalRange: e.target.value } : t,
                          );
                          setForm((prev) => ({ ...prev, hematologyTests: newTests }));
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
                          const newTests = clinicForm.hematologyTests.map((t, i) =>
                            i === index ? { ...t, unit: e.target.value } : t,
                          );
                          setForm((prev) => ({ ...prev, hematologyTests: newTests }));
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
                            hematologyTests: prev.hematologyTests.filter((_, i) => i !== index),
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

export default HematologyTestsTable;

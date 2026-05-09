import React from 'react';
import { Checkbox } from 'antd';
import { useClinicForm } from '@/redux/hook';
import { IClinicalRecord } from '@/types/backend';

const SYMPTOM_CHECKBOXES: { key: keyof IClinicalRecord; label: string }[] = [
  { key: 'fever', label: 'Sốt' },
  { key: 'sinusTract', label: 'Đường rò' },
  { key: 'erythema', label: 'Tấy đỏ' },
  { key: 'pain', label: 'Đau' },
  { key: 'swelling', label: 'Sưng nề' },
  { key: 'pmmaAllergy', label: 'Dị ứng PMMA' },
  { key: 'hematogenousSuspected', label: 'Nhiễm trùng huyết' },
];

const SymptomsChecklist: React.FC = () => {
  const { form: clinicForm, setForm } = useClinicForm();

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
            1
          </span>
          Triệu chứng & Khám lâm sàng
        </h3>
      </div>
      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SYMPTOM_CHECKBOXES.map((item) => (
          <label
            key={item.key as string}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer"
          >
            <Checkbox
              checked={!!clinicForm.clinicalRecord[item.key]}
              onChange={() =>
                setForm((prev) => ({
                  ...prev,
                  clinicalRecord: {
                    ...prev.clinicalRecord,
                    [item.key]: !prev.clinicalRecord[item.key],
                  },
                }))
              }
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
};

export default SymptomsChecklist;

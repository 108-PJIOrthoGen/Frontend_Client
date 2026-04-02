import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { ICultureResult, ISensitivityResult } from '@/types/backend';

export interface AntibioticRow {
  name: string;
  mic: string;
  interpretation: string;
  notes: string;
}

interface StepProps {
  onNext?: () => void;
  onPrev?: () => void;
  mode?: 'wizard' | 'standalone';
  cultureResults?: ICultureResult[];
  sensitivityMap?: Record<string, ISensitivityResult[]>;
  onAntibioticsChange?: (rows: AntibioticRow[]) => void;
}

const initialAntibiotics: AntibioticRow[] = [
  { name: '', mic: '', interpretation: '', notes: '' },
];

export const Antibiogram: React.FC<StepProps> = ({
  mode = 'wizard',
  cultureResults,
  sensitivityMap,
  onAntibioticsChange,
}) => {
  const [form] = Form.useForm<{ antibiotics: AntibioticRow[] }>();
  const [activeCulture, setActiveCulture] = useState<ICultureResult | null>(null);

  // Populate from API data
  useEffect(() => {
    if (cultureResults && cultureResults.length > 0) {
      setActiveCulture(cultureResults[0]);
      const firstCultureId = cultureResults[0].id;
      if (firstCultureId && sensitivityMap?.[firstCultureId]) {
        const rows = sensitivityMap[firstCultureId].map((s) => ({
          name: s.antibioticName ?? '',
          mic: s.micValue ?? '',
          interpretation: s.sensitivityCode ?? '',
          notes: '',
        }));
        const antibioticsData = rows.length > 0 ? rows : initialAntibiotics;
        form.setFieldsValue({ antibiotics: antibioticsData });
      } else {
        form.setFieldsValue({ antibiotics: initialAntibiotics });
      }
    } else {
      setActiveCulture(null);
      form.setFieldsValue({ antibiotics: initialAntibiotics });
    }
  }, [cultureResults, sensitivityMap, form]);

  // Handle form value changes and notify parent
  const handleValuesChange = () => {
    const values = form.getFieldsValue();
    onAntibioticsChange?.(values.antibiotics || []);
  };

  const requiredRule = { required: true, message: 'Truong nay la bat buoc' };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      {mode === 'wizard' && (
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bang Khang Sinh Do</h1>
            <p className="text-slate-500 text-sm mt-1">Ket qua dinh danh vi khuan va muc do nhay cam tu dong</p>
          </div>
        </header>
      )}

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Vi khuan phan lap:{' '}
                  {activeCulture?.name ? (
                    <span className="text-red-600">{activeCulture.name}</span>
                  ) : (
                    <span className="text-slate-400">Chua co du lieu</span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ngay cay: {activeCulture?.createdAt?.slice(0, 10) || '\u2014'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span>S (Susceptible)
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></span>I (Intermediate)
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span>R (Resistant)
                </div>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleValuesChange}
              initialValues={{ antibiotics: initialAntibiotics }}
            >
              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 border-r border-slate-200">
                        Ten khang sinh <span className="text-red-500">*</span>
                      </th>
                      <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">MIC (ug/mL)</th>
                      <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">Bien luan</th>
                      <th className="px-4 py-3 text-center w-24">Hanh dong</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <Form.List name="antibiotics">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <tr key={key} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2 border-r border-slate-200">
                                <Form.Item
                                  {...restField}
                                  name={[name, 'name']}
                                  rules={[requiredRule]}
                                  className="mb-0"
                                >
                                  <Input
                                    placeholder="Ten khang sinh"
                                    className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  />
                                </Form.Item>
                              </td>
                              <td className="px-4 py-2 border-r border-slate-200 text-center">
                                <Form.Item {...restField} name={[name, 'mic']} className="mb-0">
                                  <Input
                                    placeholder="VD: >=4"
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  />
                                </Form.Item>
                              </td>
                              <td className="px-4 py-2 border-r border-slate-200 text-center">
                                <Form.Item {...restField} name={[name, 'interpretation']} className="mb-0">
                                  <Select
                                    placeholder="Chon"
                                    className="w-full text-xs font-bold"
                                    options={[
                                      { value: 'S', label: 'S' },
                                      { value: 'I', label: 'I' },
                                      { value: 'R', label: 'R' },
                                    ]}
                                    allowClear
                                  />
                                </Form.Item>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <Button
                                  type="link"
                                  danger
                                  onClick={() => remove(name)}
                                  className="text-xs underline"
                                >
                                  Xoa
                                </Button>
                              </td>
                            </tr>
                          ))}
                          <tr
                            className="hover:bg-slate-50/50 cursor-pointer"
                            onClick={() => add({ name: 'Khang sinh moi', mic: '', interpretation: '', notes: '' })}
                          >
                            <td className="px-4 py-3 text-sm font-medium text-blue-600 text-center" colSpan={4}>
                              + Them khang sinh moi
                            </td>
                          </tr>
                        </>
                      )}
                    </Form.List>
                  </tbody>
                </table>
              </div>
            </Form>
          </section>
        </div>
      </div>
    </div>
  );
};

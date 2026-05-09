import React, { useState, useEffect, useRef } from 'react';
import { AutoComplete, Form, Input, Select, Button } from 'antd';
import { ICultureResult, ISensitivityResult } from '@/types/backend';

export interface AntibioticRow {
  id?: string;
  name: string;
  mic: string;
  interpretation: string;
  notes: string;
}

// Standard antibiotics commonly used in PJI (prosthetic joint infection) treatment.
// Doctors can pick from the list or type a custom name.
const COMMON_PJI_ANTIBIOTICS: string[] = [
  'Vancomycin',
  'Daptomycin',
  'Linezolid',
  'Rifampicin',
  'Cefazolin',
  'Ceftriaxone',
  'Cefepime',
  'Ceftazidime',
  'Ciprofloxacin',
  'Levofloxacin',
  'Moxifloxacin',
  'Clindamycin',
  'Trimethoprim/Sulfamethoxazole',
  'Doxycycline',
  'Minocycline',
  'Gentamicin',
  'Meropenem',
  'Piperacillin/Tazobactam',
  'Ampicillin/Sulbactam',
  'Oxacillin',
];

const ANTIBIOTIC_OPTIONS = COMMON_PJI_ANTIBIOTICS.map((name) => ({ value: name, label: name }));

type CultureItem = Partial<ICultureResult> & {
  _tempId?: string;
  sampleNumber?: number;
};

interface StepProps {
  onNext?: () => void;
  onPrev?: () => void;
  mode?: 'wizard' | 'standalone';
  cultureResults?: CultureItem[];
  sensitivityMap?: Record<string, ISensitivityResult[]>;
  onAntibioticsChange?: (data: Record<string, AntibioticRow[]>) => void;
}

const emptyRow: AntibioticRow = { name: '', mic: '', interpretation: '', notes: '' };

const getCultureKey = (c: CultureItem): string => String(c.id || c._tempId || '');

const getCultureLabel = (c: CultureItem, idx: number): string => {
  const num = c.sampleNumber ?? idx + 1;
  const name = c.name || 'Chưa định danh';
  return `Mẫu ${num}: ${name}`;
};

export const Antibiogram: React.FC<StepProps> = ({
  mode = 'wizard',
  cultureResults,
  sensitivityMap,
  onAntibioticsChange,
}) => {
  const [form] = Form.useForm<{ antibiotics: AntibioticRow[] }>();
  const [activeCultureKey, setActiveCultureKey] = useState<string>('');
  const mapRef = useRef<Record<string, AntibioticRow[]>>({});

  // Sync with props: populate from sensitivityMap, preserve user edits
  useEffect(() => {
    if (!cultureResults || cultureResults.length === 0) {
      setActiveCultureKey('');
      mapRef.current = {};
      form.setFieldsValue({ antibiotics: [{ ...emptyRow }] });
      onAntibioticsChange?.({});
      return;
    }

    const validKeys = new Set(cultureResults.map(getCultureKey));
    const current = { ...mapRef.current };

    // Remove entries for deleted cultures
    Object.keys(current).forEach((k) => {
      if (!validKeys.has(k)) delete current[k];
    });

    // Add entries for new cultures (preserve existing user edits)
    cultureResults.forEach((c) => {
      const key = getCultureKey(c);
      if (current[key]) return;

      const dbId = c.id;
      if (dbId && sensitivityMap?.[dbId]?.length) {
        current[key] = sensitivityMap[dbId].map((s) => ({
          id: String(s.id),
          name: s.antibioticName ?? '',
          mic: s.micValue ?? '',
          interpretation: s.sensitivityCode ?? '',
          notes: '',
        }));
      } else {
        current[key] = [{ ...emptyRow }];
      }
    });

    mapRef.current = current;

    // Set active culture if current one is gone
    const needNewActive = !activeCultureKey || !validKeys.has(activeCultureKey);
    const activeKey = needNewActive ? getCultureKey(cultureResults[0]) : activeCultureKey;

    if (needNewActive) setActiveCultureKey(activeKey);
    form.setFieldsValue({ antibiotics: current[activeKey] || [{ ...emptyRow }] });
    onAntibioticsChange?.(current);
  }, [cultureResults, sensitivityMap]);

  const switchCulture = (newKey: string) => {
    if (newKey === activeCultureKey) return;

    // Persist current form data before switching
    const currentValues = form.getFieldsValue();
    mapRef.current[activeCultureKey] = currentValues.antibiotics || [];

    setActiveCultureKey(newKey);
    form.setFieldsValue({ antibiotics: mapRef.current[newKey] || [{ ...emptyRow }] });
    onAntibioticsChange?.({ ...mapRef.current });
  };

  const handleValuesChange = () => {
    const values = form.getFieldsValue();
    mapRef.current[activeCultureKey] = values.antibiotics || [];
    onAntibioticsChange?.({ ...mapRef.current });
  };

  const activeCulture = cultureResults?.find((c) => getCultureKey(c) === activeCultureKey);
  const hasCultures = cultureResults && cultureResults.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24">
      {mode === 'wizard' && (
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bảng kháng sinh đồ</h1>
            <p className="text-slate-500 text-sm mt-1">Kết quả định danh vi khuẩn và mức độ nhạy cảm</p>
          </div>
        </header>
      )}

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {!hasCultures ? (
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">science</span>
              Chưa có mẫu cấy khuẩn. Vui lòng thêm mẫu cấy ở tab &quot;Xét nghiệm lâm sàng&quot; trước.
            </section>
          ) : (
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Culture selector tabs */}
              {cultureResults!.length > 1 && (
                <div className="flex gap-0 border-b border-slate-200 bg-slate-50 overflow-x-auto">
                  {cultureResults!.map((c, idx) => {
                    const key = getCultureKey(c);
                    const isActive = key === activeCultureKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => switchCulture(key)}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          isActive
                            ? 'border-blue-600 text-blue-600 bg-white'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {getCultureLabel(c, idx)}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="p-6">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Vi khuẩn phân lập:{' '}
                      {activeCulture?.name ? (
                        <span className="text-red-600">{activeCulture.name}</span>
                      ) : (
                        <span className="text-slate-400">Chưa có dữ liệu</span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Ngày cấy: {activeCulture?.createdAt?.slice(0, 10) || '\u2014'}
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
                  initialValues={{ antibiotics: [{ ...emptyRow }] }}
                >
                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 border-r border-slate-200">
                            Tên kháng sinh <span className="text-red-500">*</span>
                          </th>
                          <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">MIC (ug/mL)</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">Biện luận</th>
                          <th className="px-4 py-3 text-center w-24">Hành động</th>
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
                                      rules={[{ required: true, message: 'Trường này là bắt buộc' }]}
                                      className="mb-0"
                                    >
                                      <AutoComplete
                                        options={ANTIBIOTIC_OPTIONS}
                                        placeholder="Chọn hoặc nhập tên kháng sinh"
                                        allowClear
                                        filterOption={(input, option) =>
                                          (option?.value as string)
                                            ?.toLowerCase()
                                            .includes(input.toLowerCase())
                                        }
                                        className="w-full text-sm"
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
                                        placeholder="Chọn"
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
                                      Xóa
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                              <tr
                                className="hover:bg-slate-50/50 cursor-pointer"
                                onClick={() => add({ ...emptyRow })}
                              >
                                <td className="px-4 py-3 text-sm font-medium text-blue-600 text-center" colSpan={4}>
                                  + Thêm KS mới
                                </td>
                              </tr>
                            </>
                          )}
                        </Form.List>
                      </tbody>
                    </table>
                  </div>
                </Form>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

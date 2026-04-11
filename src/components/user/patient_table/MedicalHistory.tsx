import React, { useEffect } from 'react';
import { Form, Input, Checkbox, DatePicker, Button } from 'antd';
import { useClinicForm } from '@/redux/hook';
import { IMedicalHistory, ISurgery } from '@/types/backend';
import { stringToDayjs } from '@/config/utils';

const { TextArea } = Input;

interface MedicalHistoryProps {
  onNext?: () => void;
  onPrev?: () => void;
  mode?: 'wizard' | 'standalone';
  medicalHistoryData?: IMedicalHistory | null;
  surgeriesData?: ISurgery[];
}

interface SurgeryFormRow extends ISurgery {
  _tempId?: string;
}

interface MedicalHistoryFormValues {
  process: string;
  medicalHistory: string;
  antibioticHistory: string;
  characteristics: {
    isAllergy: boolean;
    allergyNote: string;
    isDrug: boolean;
    drugNote: string;
    isAlcohol: boolean;
    alcoholNote: string;
    isSmoking: boolean;
    smokingNote: string;
    isOther: boolean;
    otherNote: string;
  };
  surgeries: SurgeryFormRow[];
}

export const MedicalHistoryPage: React.FC<MedicalHistoryProps> = ({
  mode = 'wizard',
  medicalHistoryData,
  surgeriesData,
}) => {
  const { setForm } = useClinicForm();
  const [form] = Form.useForm<MedicalHistoryFormValues>();

  // When data is loaded from API, populate both Redux and Ant Form
  useEffect(() => {
    if (medicalHistoryData || (surgeriesData && surgeriesData.length > 0)) {
      const mh = medicalHistoryData ?? {};

      // Update Redux store
      setForm((prev) => ({
        ...prev,
        medicalHistory: {
          ...prev.medicalHistory,
          process: mh.process ?? '',
          medicalHistory: mh.medicalHistory ?? '',
          antibioticHistory: mh.antibioticHistory ?? '',
          isAllergy: mh.isAllergy ?? false,
          allergyNote: mh.allergyNote ?? '',
          isDrug: mh.isDrug ?? false,
          drugNote: mh.drugNote ?? '',
          isAlcohol: mh.isAlcohol ?? false,
          alcoholNote: mh.alcoholNote ?? '',
          isSmoking: mh.isSmoking ?? false,
          smokingNote: mh.smokingNote ?? '',
          isOther: mh.isOther ?? false,
          otherNote: mh.otherNote ?? '',
        },
        surgeries:
          surgeriesData && surgeriesData.length > 0
            ? surgeriesData.map((s) => ({
              ...s,
              id: s.id ?? undefined,
              _tempId: String(s.id ?? Date.now()),
            }))
            : [{ _tempId: '1', surgeryDate: '', surgeryType: '', findings: '' }],
      }));

      // Update Ant Design Form
      form.setFieldsValue({
        process: mh.process ?? '',
        medicalHistory: mh.medicalHistory ?? '',
        antibioticHistory: mh.antibioticHistory ?? '',
        characteristics: {
          isAllergy: mh.isAllergy ?? false,
          allergyNote: mh.allergyNote ?? '',
          isDrug: mh.isDrug ?? false,
          drugNote: mh.drugNote ?? '',
          isAlcohol: mh.isAlcohol ?? false,
          alcoholNote: mh.alcoholNote ?? '',
          isSmoking: mh.isSmoking ?? false,
          smokingNote: mh.smokingNote ?? '',
          isOther: mh.isOther ?? false,
          otherNote: mh.otherNote ?? '',
        },
        surgeries:
          surgeriesData && surgeriesData.length > 0
            ? surgeriesData.map((s) => ({
              ...s,
              _tempId: String(s.id ?? Date.now()),
            }))
            : [{ _tempId: '1', surgeryDate: '', surgeryType: '', findings: '' }],
      });
    }
  }, [medicalHistoryData, surgeriesData, form, setForm]);

  // Sync Ant Form changes to Redux
  const handleValuesChange = (_changedValues: Partial<MedicalHistoryFormValues>, allValues: MedicalHistoryFormValues) => {
    setForm((prev) => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        process: allValues.process ?? '',
        medicalHistory: allValues.medicalHistory ?? '',
        antibioticHistory: allValues.antibioticHistory ?? '',
        isAllergy: allValues.characteristics?.isAllergy ?? false,
        allergyNote: allValues.characteristics?.allergyNote ?? '',
        isDrug: allValues.characteristics?.isDrug ?? false,
        drugNote: allValues.characteristics?.drugNote ?? '',
        isAlcohol: allValues.characteristics?.isAlcohol ?? false,
        alcoholNote: allValues.characteristics?.alcoholNote ?? '',
        isSmoking: allValues.characteristics?.isSmoking ?? false,
        smokingNote: allValues.characteristics?.smokingNote ?? '',
        isOther: allValues.characteristics?.isOther ?? false,
        otherNote: allValues.characteristics?.otherNote ?? '',
      },
      surgeries: allValues.surgeries ?? [],
    }));
  };

  const characteristicsList: {
    checkedField: keyof MedicalHistoryFormValues['characteristics'];
    noteField: keyof MedicalHistoryFormValues['characteristics'];
    label: string;
    code: string;
    notePlaceholder?: string;
  }[] = [
      { checkedField: 'isAllergy', noteField: 'allergyNote', label: 'Dị ứng', code: '01', notePlaceholder: '(Dị nguyên)' },
      { checkedField: 'isDrug', noteField: 'drugNote', label: 'Ma túy', code: '02' },
      { checkedField: 'isAlcohol', noteField: 'alcoholNote', label: 'Rượu bia', code: '03' },
      { checkedField: 'isSmoking', noteField: 'smokingNote', label: 'Hút thuốc', code: '04' },
      { checkedField: 'isOther', noteField: 'otherNote', label: 'Khác', code: '05' },
    ];

  return (
    <>
      {mode === 'wizard' && (
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nhập thông tin bệnh án</h1>
            <p className="text-slate-500 text-sm mt-1">Lữu trữ thông tin về bệnh án & tiền sử bệnh</p>
          </div>
        </header>
      )}
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          initialValues={{
            process: '',
            medicalHistory: '',
            antibioticHistory: '',
            characteristics: {
              isAllergy: false,
              allergyNote: '',
              isDrug: false,
              drugNote: '',
              isAlcohol: false,
              alcoholNote: '',
              isSmoking: false,
              smokingNote: '',
              isOther: false,
              otherNote: '',
            },
            surgeries: [{ _tempId: '1', surgeryDate: '', surgeryType: '', findings: '' }],
          }}
        >
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Medical History Context */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tiền sử bệnh</h1>
                  <p className="text-slate-500 text-sm mt-1">Ghi nhận tiền sử bệnh</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 gap-6">
                <Form.Item
                  name="process"
                  label={<span className="text-sm font-medium text-slate-700">Quá trình bệnh lý</span>}
                >
                  <TextArea
                    rows={4}
                    placeholder="Mo ta chi tiet qua trinh benh ly..."
                    className="rounded-lg border-slate-300"
                  />
                </Form.Item>

                <Form.Item
                  name="medicalHistory"
                  label={<span className="text-sm font-medium text-slate-700">Tiền sử bệnh</span>}
                >
                  <TextArea
                    rows={4}
                    placeholder="Cac benh ly nen, di ung, phau thuat truoc day..."
                    className="rounded-lg border-slate-300"
                  />
                </Form.Item>

                <Form.Item
                  name="antibioticHistory"
                  label={<span className="text-sm font-medium text-slate-700">Tiền sử điều trị kháng sinh</span>}
                >
                  <TextArea
                    rows={4}
                    placeholder="Cac loai khang sinh dung truoc day..."
                    className="rounded-lg border-slate-300"
                  />
                </Form.Item>

                {/* Related Characteristics Table */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Đặc điểm liên quan bệnh:</span>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-center w-12 border-r border-slate-200">TT</th>
                          <th className="px-3 py-2 border-r border-slate-200">Ký hiệu</th>
                          <th className="px-3 py-2 w-16 text-center border-r border-slate-200">Chọn</th>
                          <th className="px-3 py-2">Thời gian (tính theo tháng) / Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {characteristicsList.map((item) => (
                          <Form.Item
                            key={item.code}
                            noStyle
                            shouldUpdate={(prevValues, currentValues) =>
                              prevValues.characteristics?.[item.checkedField] !==
                              currentValues.characteristics?.[item.checkedField]
                            }
                          >
                            {({ getFieldValue }) => {
                              const isChecked = getFieldValue(['characteristics', item.checkedField]);
                              return (
                                <tr className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-200">
                                    {item.code}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-slate-900 border-r border-slate-200">
                                    {item.label}
                                  </td>
                                  <td className="px-3 py-2 text-center border-r border-slate-200">
                                    <Form.Item
                                      name={['characteristics', item.checkedField]}
                                      valuePropName="checked"
                                      className="mb-0"
                                    >
                                      <Checkbox className="accent-primary" />
                                    </Form.Item>
                                  </td>
                                  <td className="px-3 py-2">
                                    <Form.Item name={['characteristics', item.noteField]} className="mb-0">
                                      <Input
                                        disabled={!isChecked}
                                        placeholder={item.notePlaceholder || 'Hơn 12 tháng...'}
                                        className="w-full text-sm disabled:bg-slate-50 disabled:text-slate-400"
                                      />
                                    </Form.Item>
                                  </td>
                                </tr>
                              );
                            }}
                          </Form.Item>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Surgical History Table */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">surgical</span>
                  Tiền sử phẫu thuật
                </h2>
              </div>
              <div className="p-6">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-center w-16 border-r border-slate-200">Lần PT</th>
                        <th className="px-3 py-2 w-32 border-r border-slate-200">Thời gian</th>
                        <th className="px-3 py-2 border-r border-slate-200">Phương pháp phẫu thuật</th>
                        <th className="px-3 py-2 border-r border-slate-200">Ghi chú</th>
                        <th className="px-3 py-2 text-center w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <Form.List name="surgeries">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }, index) => (
                              <tr key={key} className="group hover:bg-slate-50/50">
                                <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-200 bg-slate-50">
                                  {index + 1}
                                </td>
                                <td className="p-0 border-r border-slate-200">
                                  <Form.Item
                                    getValueProps={(val) => ({ value: stringToDayjs(val) })}
                                    {...restField} name={[name, 'surgeryDate']} className="mb-0">
                                    <DatePicker
                                      className="w-full border-none"
                                      placeholder="dd/mm/yyyy"
                                      format="DD-MM-YYYY"
                                    />
                                  </Form.Item>
                                </td>
                                <td className="px-3 py-2 border-r border-slate-200">
                                  <Form.Item {...restField} name={[name, 'surgeryType']} className="mb-0">
                                    <Input
                                      placeholder="cắt lọc khớp giữ nguyên khớp (DAIR)..."
                                    />
                                  </Form.Item>
                                </td>
                                <td className="px-3 py-2 border-r border-slate-200">
                                  <Form.Item {...restField} name={[name, 'findings']} className="mb-0">
                                    <Input
                                      className="w-full px-3 py-2"
                                      placeholder="Thêm..."
                                    />
                                  </Form.Item>
                                </td>
                                <td className="px-3 py-2 flex items-center justify-center gap-1 opacity-100 transition-opacity">
                                  <Button
                                    type="link"
                                    onClick={() =>
                                      add(
                                        { _tempId: Date.now().toString(), surgeryDate: '', surgeryType: '', findings: '' },
                                        index + 1
                                      )
                                    }
                                    className="p-1 text-blue-600 hover:bg-blue-100"
                                    title="Thêm hàng"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                  </Button>
                                  <Button
                                    type="link"
                                    danger
                                    onClick={() => remove(name)}
                                    className="p-1 hover:bg-red-100"
                                    title="Xoa hang"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </Form.List>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </Form>
      </div>
    </>
  );
};

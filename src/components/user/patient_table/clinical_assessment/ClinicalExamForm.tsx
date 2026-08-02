import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Tag } from 'antd';
import { useClinicForm } from '@/redux/hook';
import { IClinicalRecord } from '@/types/backend';

const ONSET_TIMING_OPTIONS = [
  { value: 'EARLY', label: 'Sớm (3 tháng)' },
  { value: 'DELAYED_SUBACUTE', label: 'Chậm/bán cấp (3–24 tháng)' },
  { value: 'LATE', label: 'Muộn (>24 tháng)' },
];

const TRANSMISSION_ROUTE_OPTIONS = [
  { value: 'PERIOPERATIVE_LOCAL', label: 'Quanh phẫu thuật/tại chỗ' },
  { value: 'HEMATOGENOUS', label: 'Đường máu' },
  { value: 'CONTIGUOUS_SPREAD', label: 'Lan từ mô kế cận' },
  { value: 'UNKNOWN', label: 'Chưa rõ' },
];

// WHO international BMI classification (kg/m²).
const classifyBmi = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Thiếu cân', color: 'blue' };
  if (bmi < 25) return { label: 'Bình thường', color: 'green' };
  if (bmi < 30) return { label: 'Thừa cân', color: 'gold' };
  if (bmi < 35) return { label: 'Béo phì độ I', color: 'orange' };
  if (bmi < 40) return { label: 'Béo phì độ II', color: 'volcano' };
  return { label: 'Béo phì độ III', color: 'red' };
};

const ClinicalExamForm: React.FC = () => {
  const { form: clinicForm, setForm } = useClinicForm();

  // Height/weight are persisted alongside the derived BMI so each episode
  // keeps the raw anthropometric inputs (no longer left blank).
  const heightCm = clinicForm.clinicalRecord.heightCm;
  const weightKg = clinicForm.clinicalRecord.weightKg;

  const handleChange = (field: keyof IClinicalRecord, value: any) => {
    setForm((prev) => ({
      ...prev,
      clinicalRecord: { ...prev.clinicalRecord, [field]: value },
    }));
  };

  // Auto-calculate BMI
  useEffect(() => {
    if (heightCm && weightKg && heightCm > 0) {
      const meters = heightCm / 100;
      const bmi = Math.round((weightKg / (meters * meters)) * 100) / 100;
      if (Number.isFinite(bmi) && bmi !== clinicForm.clinicalRecord.bmi) {
        handleChange('bmi', bmi);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightCm, weightKg]);

  const bmiValue = clinicForm.clinicalRecord.bmi;
  const bmiCategory = typeof bmiValue === 'number' ? classifyBmi(bmiValue) : null;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
            1.1
          </span>
          Khám lâm sàng chi tiết
        </h3>
      </div>
      <Form layout="vertical" className="p-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-0 md:grid-cols-2 xl:grid-cols-3">
          <Form.Item label={<span className=" font-medium text-slate-700">Chiều cao (cm)</span>}>
            <InputNumber
              placeholder="Ví dụ: 170"
              value={heightCm}
              onChange={(val) => handleChange('heightCm', val)}
              className="w-full h-11 rounded-lg"
              min={0}
              max={300}
              controls={false}
            />
          </Form.Item>

          <Form.Item label={<span className=" font-medium text-slate-700">Cân nặng (kg)</span>}>
            <InputNumber
              placeholder="Ví dụ: 65"
              value={weightKg}
              onChange={(val) => handleChange('weightKg', val)}
              className="w-full h-11 rounded-lg"
              min={0}
              max={500}
              step={0.1}
              controls={false}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className=" font-medium text-slate-700">
                BMI <span className="text-xs text-slate-400 font-normal">(tự động tính)</span>
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <InputNumber
                step={0.01}
                placeholder="Nhập chiều cao & cân nặng"
                value={bmiValue}
                onChange={(val) => handleChange('bmi', val)}
                className="flex-1 h-11 rounded-lg"
                controls={false}
                readOnly={!!(heightCm && weightKg)}
              />
              {bmiCategory && (
                <Tag color={bmiCategory.color} className="m-0 whitespace-nowrap">
                  {bmiCategory.label}
                </Tag>
              )}
            </div>
          </Form.Item>

          <Form.Item label={<span className=" font-medium text-slate-700">Thời điểm khởi phát (so với phẫu thuật gần nhất)</span>}>
            <Select
              value={clinicForm.clinicalRecord.onsetTiming ?? undefined}
              onChange={(val) => handleChange('onsetTiming', val)}
              placeholder="Chọn thời điểm khởi phát"
              className="h-11 rounded-lg"
              options={ONSET_TIMING_OPTIONS}
            />
          </Form.Item>

          <Form.Item label={<span className=" font-medium text-slate-700">Đường lây nhiễm nghi ngờ</span>}>
            <Select
              value={clinicForm.clinicalRecord.suspectedTransmissionRoute ?? undefined}
              onChange={(val) => handleChange('suspectedTransmissionRoute', val)}
              placeholder="Chọn đường lây nhiễm"
              className="h-11 rounded-lg"
              options={TRANSMISSION_ROUTE_OPTIONS}
            />
          </Form.Item>

          <Form.Item label={<span className=" font-medium text-slate-700">Độ ổn định cấy ghép</span>}>
            <Select
              value={clinicForm.clinicalRecord.implantStability ?? ''}
              onChange={(val) => handleChange('implantStability', val)}
              placeholder="Chọn tình trạng"
              className="h-11 rounded-lg"
              options={[
                { value: 'STABLE', label: 'Ổn định' },
                { value: 'POSSIBLY_LOOSE', label: 'Nghi ngờ lỏng' },
                { value: 'LOOSE', label: 'Lỏng lẻo' },
                { value: 'UNKNOWN', label: 'Chưa rõ' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={<span className=" font-medium text-slate-700">Tình trạng mô mềm</span>}
            className="md:col-span-2 xl:col-span-3"
          >
            <Input
              placeholder="Ví dụ: sưng, đau, chảy dịch, hoại tử..."
              value={clinicForm.clinicalRecord.softTissue ?? ''}
              onChange={(e) => handleChange('softTissue', e.target.value)}
              className="h-11 rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label={<span className=" font-medium text-slate-700">Khám toàn thân</span>}
            className="md:col-span-2 xl:col-span-3"
          >
            <Input
              placeholder="Ví dụ: Toàn trạng, dấu hiệu sinh tồn và các bất thường khi khám..."
              value={clinicForm.clinicalRecord.generalExam ?? ''}
              onChange={(e) => handleChange('generalExam', e.target.value)}
              className="h-11 rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label={<span className=" font-medium text-slate-700">Bệnh ngoại khoa</span>}
            className="md:col-span-2 xl:col-span-3"
          >
            <Input
              placeholder="Ví dụ: Mô tả bệnh ngoại khoa..."
              value={clinicForm.clinicalRecord.surgicalDisease ?? ''}
              onChange={(e) => handleChange('surgicalDisease', e.target.value)}
              className="h-11 rounded-lg"
            />
          </Form.Item>
        </div>
      </Form>
    </section>
  );
};

export default ClinicalExamForm;

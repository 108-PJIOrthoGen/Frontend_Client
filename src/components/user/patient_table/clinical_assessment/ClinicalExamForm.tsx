import React from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { useClinicForm } from '@/redux/hook';
import { IClinicalRecord } from '@/types/backend';

const ClinicalExamForm: React.FC = () => {
  const { form: clinicForm, setForm } = useClinicForm();

  const handleChange = (field: keyof IClinicalRecord, value: any) => {
    setForm((prev) => ({
      ...prev,
      clinicalRecord: { ...prev.clinicalRecord, [field]: value },
    }));
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Form.Item label={<span className="text-sm font-medium text-slate-700">Ngày khởi phát triệu chứng</span>}>
            <Input
              type="date"
              value={clinicForm.clinicalRecord.illnessOnsetDate ?? ''}
              onChange={(e) => handleChange('illnessOnsetDate', e.target.value)}
              className="w-full rounded-lg h-11"
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-500">
                Phân loại:{' '}
                <span className={`font-bold ${clinicForm.isAcute ? 'text-danger' : 'text-warning'}`}>
                  {clinicForm.isAcute ? 'Cấp tính (<3 tuần)' : 'Mãn tính (>3 tuần)'}
                </span>
              </span>
            </div>
          </Form.Item>

          <Form.Item label={<span className="text-sm font-medium text-slate-700">BMI</span>}>
            <InputNumber
              step={0.01}
              placeholder="Vi du: 25.71"
              value={clinicForm.clinicalRecord.bmi}
              onChange={(val) => handleChange('bmi', val)}
              className="w-full h-11 rounded-lg"
              controls={false}
            />
          </Form.Item>

          <Form.Item label={<span className="text-sm font-medium text-slate-700">Loại nhiễm trùng nghi ngờ</span>}>
            <Select
              value={clinicForm.clinicalRecord.suspectedInfectionType ?? ''}
              onChange={(val) => handleChange('suspectedInfectionType', val)}
              placeholder="Chọn tình trạng"
              className="h-11 rounded-lg"
              options={[
                { value: 'EARLY_POSTOPERATIVE', label: 'Nhiễm trùng hậu phẫu sớm' },
                { value: 'DELAYED', label: 'Nhiễm trùng muộn / trì hoãn' },
                { value: 'LATE_HEMATOGENOUS', label: 'Nhiễm trùng đường máu (hơn 24 tháng)' },
                { value: 'ACUTE_HEMATOGENOUS', label: 'Nhiễm trùng cấp đường máu' },
                { value: 'CHRONIC', label: 'Nhiễm trung mãn tính' },
                { value: 'UNKNOWN', label: 'Chưa rõ' },
              ]}
            />
          </Form.Item>

          <Form.Item label={<span className="text-sm font-medium text-slate-700">Tình trạng mô mềm</span>}>
            <Input
              placeholder="Ví dụ:"
              value={clinicForm.clinicalRecord.softTissue ?? ''}
              onChange={(e) => handleChange('softTissue', e.target.value)}
              className="h-11 rounded-lg"
            />
          </Form.Item>

          <Form.Item label={<span className="text-sm font-medium text-slate-700">Độ ổn định cấy ghép</span>}>
            <Select
              value={clinicForm.clinicalRecord.implantStability ?? ''}
              onChange={(val) => handleChange('implantStability', val)}
              placeholder="Chọn tình trạng"
              className="h-11 rounded-lg"
              options={[
                { value: 'STABLE', label: 'Ổn định' },
                { value: 'POSSIBLY_LOOSE', label: 'Có thể lỏng' },
                { value: 'LOOSE', label: 'Lỏng lẻo' },
                { value: 'UNKNOWN', label: 'Chưa rõ' },
              ]}
            />
          </Form.Item>

          <Form.Item label={<span className="text-sm font-medium text-slate-700">Số ngày từ lần thay khớp đầu</span>}>
            <InputNumber
              placeholder="Ví dụ: 70"
              value={clinicForm.clinicalRecord.daysSinceIndexArthroplasty}
              onChange={(val) => handleChange('daysSinceIndexArthroplasty', val)}
              className="w-full h-11 rounded-lg"
              min={0}
              controls={false}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm font-medium text-slate-700">Khớp nhân tạo</span>}
            className="col-span-3"
          >
            <Input
              placeholder="Ví dụ: Mô tả về vị trí khớp, có phải mổ lại không, phương pháp cố định..."
              value={clinicForm.clinicalRecord.prosthesisJoint ?? ''}
              onChange={(e) => handleChange('prosthesisJoint', e.target.value)}
              className="h-11 rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm font-medium text-slate-700">Khám bệnh toàn thân</span>}
            className="col-span-3"
          >
            <Input
              placeholder="Ví dụ: Tỉnh táo, tiếp xúc tốt..."
              value={clinicForm.clinicalRecord.notations ?? ''}
              onChange={(e) => handleChange('notations', e.target.value)}
              className="h-11 rounded-lg"
            />
          </Form.Item>
        </div>
      </Form>
    </section>
  );
};

export default ClinicalExamForm;

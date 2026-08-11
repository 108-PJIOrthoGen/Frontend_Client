import React from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { IDoctorDiagnosis } from '@/types/backend';
import type { SurgeryPlanData, SurgeryStageData } from '@/types/treatmentType';
import { PJI_CONCLUSION_LABELS } from './doctorDiagnosisModel';

const { TextArea } = Input;
const { Text } = Typography;

export interface DoctorDecisionForm extends IDoctorDiagnosis {
  surgeryStrategyType?: string;
  strategyRationale?: string;
  priorityLevel?: string;
  priorityNote?: string;
  stages?: SurgeryStageData[];
  estimatedTotalTreatmentTime?: string;
  risksAndComplications?: string[];
  surgeryNotes?: string;
}

const PJI_CONCLUSION_OPTIONS = Object.entries(PJI_CONCLUSION_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const INFECTION_CLASSIFICATION_OPTIONS = [
  { value: 'ACUTE', label: 'Cấp tính' },
  { value: 'CHRONIC', label: 'Mạn tính' },
  { value: 'EARLY_POSTOPERATIVE', label: 'Sớm sau mổ' },
  { value: 'DELAYED', label: 'Muộn' },
  { value: 'ACUTE_HEMATOGENOUS', label: 'Cấp theo đường máu' },
  { value: 'LATE_HEMATOGENOUS', label: 'Muộn theo đường máu' },
  { value: 'UNKNOWN', label: 'Chưa rõ' },
];

const SURGERY_STRATEGY_OPTIONS = [
  { value: 'DAIR', label: 'DAIR' },
  { value: 'ONE_STAGE_REVISION', label: 'Thay lại một thì' },
  { value: 'TWO_STAGE_REVISION', label: 'Thay lại hai thì' },
  { value: 'RESECTION_ARTHROPLASTY', label: 'Cắt bỏ khớp' },
  { value: 'AMPUTATION', label: 'Cắt cụt chi' },
  { value: 'NON_OPERATIVE', label: 'Điều trị bảo tồn' },
];

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'Cao' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'LOW', label: 'Thấp' },
];

export const toDoctorDecisionFormValues = (
  diagnosis?: IDoctorDiagnosis,
  surgery?: SurgeryPlanData,
): Partial<DoctorDecisionForm> => ({
  ...diagnosis,
  surgeryStrategyType: surgery?.surgeryStrategyType,
  strategyRationale: surgery?.strategyRationale,
  priorityLevel: surgery?.priorityLevel,
  priorityNote: surgery?.priorityNote,
  stages: surgery?.stages,
  estimatedTotalTreatmentTime: surgery?.estimatedTotalTreatmentTime,
  risksAndComplications: surgery?.risksAndComplications,
  surgeryNotes: surgery?.notes,
});

export const toDoctorSurgeryPlan = (values: DoctorDecisionForm): SurgeryPlanData | null => {
  const hasContent = Boolean(
    values.surgeryStrategyType
    || values.strategyRationale
    || values.priorityLevel
    || values.stages?.length
    || values.estimatedTotalTreatmentTime
    || values.risksAndComplications?.length
    || values.surgeryNotes,
  );
  if (!hasContent) return null;
  return {
    category: 'SURGERY_PROCEDURE',
    surgeryStrategyType: values.surgeryStrategyType,
    strategyRationale: values.strategyRationale,
    priorityLevel: values.priorityLevel,
    priorityNote: values.priorityNote,
    stages: values.stages?.map((stage, index) => ({
      ...stage,
      stageOrder: index + 1,
      estimatedDurationMinutes: Number(stage.estimatedDurationMinutes || 0),
    })),
    estimatedTotalTreatmentTime: values.estimatedTotalTreatmentTime,
    risksAndComplications: values.risksAndComplications,
    notes: values.surgeryNotes,
  };
};

export const DoctorDecisionFormFields: React.FC = () => (
  <>
    <Card title="Chẩn đoán lâm sàng" size="small">
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name="pji_conclusion" label="Kết luận PJI" rules={[{ required: true, message: 'Chọn kết luận' }]}>
            <Select options={PJI_CONCLUSION_OPTIONS} placeholder="Chọn kết luận" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="infection_classification" label="Phân loại nhiễm trùng">
            <Select options={INFECTION_CLASSIFICATION_OPTIONS} allowClear placeholder="Chọn phân loại" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="primary_diagnosis" label="Chẩn đoán chính" rules={[{ required: true, message: 'Nhập chẩn đoán chính' }]}>
        <Input placeholder="Nhập chẩn đoán chính của bác sĩ" />
      </Form.Item>
      <Form.Item name="identified_organism" label="Vi khuẩn định danh"><Input /></Form.Item>
      <Form.Item name="clinical_reasoning" label="Lập luận lâm sàng"><TextArea rows={4} /></Form.Item>
    </Card>

    <Card title="Kế hoạch phẫu thuật của bác sĩ" size="small" style={{ marginTop: 16 }}>
      <Alert type="info" showIcon message="Kháng sinh toàn thân và tại chỗ được quản lý ở tab Kháng sinh đồ." style={{ marginBottom: 16 }} />
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name="surgeryStrategyType" label="Chiến lược phẫu thuật">
            <Select options={SURGERY_STRATEGY_OPTIONS} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="priorityLevel" label="Mức ưu tiên">
            <Select options={PRIORITY_OPTIONS} allowClear />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="strategyRationale" label="Chỉ định và lý do"><TextArea rows={3} /></Form.Item>
      <Form.Item name="priorityNote" label="Ghi chú ưu tiên"><Input /></Form.Item>
      <Form.List name="stages">
        {(fields, { add, remove }) => (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Text strong>Các giai đoạn phẫu thuật</Text>
            {fields.map((field, index) => (
              <Card key={field.key} size="small" extra={<Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}>
                <Row gutter={12}>
                  <Col xs={24} md={16}>
                    <Form.Item name={[field.name, 'stageName']} label={`Tên giai đoạn ${index + 1}`} rules={[{ required: true, message: 'Nhập tên giai đoạn' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name={[field.name, 'estimatedDurationMinutes']} label="Thời lượng (phút)">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ stageOrder: fields.length + 1, stageName: '', estimatedDurationMinutes: 0 })} block>
              Thêm giai đoạn
            </Button>
          </Space>
        )}
      </Form.List>
      <Row gutter={12} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Form.Item name="estimatedTotalTreatmentTime" label="Tổng thời gian điều trị"><Input /></Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="risksAndComplications" label="Nguy cơ và biến chứng">
            <Select mode="tags" tokenSeparators={[',']} open={false} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="surgeryNotes" label="Ghi chú phẫu thuật"><TextArea rows={3} /></Form.Item>
    </Card>
  </>
);

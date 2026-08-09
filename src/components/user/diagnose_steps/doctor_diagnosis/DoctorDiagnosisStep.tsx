import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { clearCurrentCase } from '@/redux/features/patients/patientSlice';
import { callCreateDoctorReview } from '@/apis/api';
import type { IDoctorDiagnosis, IPermission } from '@/types/backend';
import type { SurgeryPlanData, SurgeryStageData } from '@/types/treatmentType';
import {
  TREATMENT_REVIEW_WRITE_PERMISSION,
  hasPermission,
  normalizeIdentity,
} from '../treatment_plan/utils/permissions';
import SuccessModal from '../treatment_plan/components/SuccessModal';
import { PJI_CONCLUSION_LABELS, aiConclusionOf } from '@/utils/aiDoctorCompare';
import {
  buildDoctorModificationJson,
  calculateAgreement,
  clearDiagnosisWorkflowStorage,
  loadDoctorDiagnosisModel,
} from './doctorDiagnosisModel';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  onPrev: () => void;
  onBackToFirstStep: () => void;
}

interface DoctorDecisionForm extends IDoctorDiagnosis {
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
  { value: 'ACUTE', label: 'Cấp tính (Acute)' },
  { value: 'CHRONIC', label: 'Mạn tính (Chronic)' },
  { value: 'EARLY_POSTOPERATIVE', label: 'Sớm sau mổ (Early postoperative)' },
  { value: 'DELAYED', label: 'Muộn (Delayed)' },
  { value: 'ACUTE_HEMATOGENOUS', label: 'Cấp đường máu (Acute hematogenous)' },
  { value: 'LATE_HEMATOGENOUS', label: 'Đường máu muộn (Late hematogenous)' },
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

const toFormValues = (
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

const toSurgeryPlan = (values: DoctorDecisionForm): SurgeryPlanData | null => {
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

const DoctorDiagnosisStep: React.FC<Props> = ({ onPrev, onBackToFirstStep }) => {
  const dispatch = useDispatch();
  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const currentUser = useSelector((state: RootState) => state.account.user);
  const episodeId = currentCase?.episode?.id;
  const permissions = currentUser.role.permissions as IPermission[] | undefined;
  const roleName = currentUser.role.name?.toUpperCase() ?? '';
  const isAdmin = roleName === 'ADMIN' || roleName === 'SUPER_ADMIN';
  const patientCreatedBy = currentCase?.patient?.createdBy;
  const ownsPatientRecord = !patientCreatedBy
    || normalizeIdentity(patientCreatedBy) === normalizeIdentity(currentUser.email);
  const canWriteReview = hasPermission(permissions, TREATMENT_REVIEW_WRITE_PERMISSION)
    && (ownsPatientRecord || isAdmin);

  const [form] = Form.useForm<DoctorDecisionForm>();
  const [decision, setDecision] = useState<'ACCEPTED' | 'MODIFIED' | 'REJECTED'>('ACCEPTED');
  const [selectAsFinal, setSelectAsFinal] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiDiagnosis, setAiDiagnosis] = useState<Record<string, string | undefined>>({});
  const [aiSurgery, setAiSurgery] = useState<SurgeryPlanData | null>(null);
  const runIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const model = await loadDoctorDiagnosisModel();
        if (cancelled) return;
        runIdRef.current = model.runId;
        setAiDiagnosis(model.aiDiagnosis);
        setAiSurgery(model.aiSurgery);
        setReviewNote(model.reviewNote);
        setRejectionReason(model.rejectionReason);
        setSelectAsFinal(model.finalDecision);
        if (model.reviewDecision) setDecision(model.reviewDecision);
        form.setFieldsValue(toFormValues(model.previousDiagnosis, model.previousSurgery));
      } catch (error: any) {
        if (!cancelled) setLoadError(error?.message || 'Lỗi khi tải dữ liệu.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [form]);

  const aiConclusion = useMemo(
    () => aiConclusionOf(aiDiagnosis.pjiProbability),
    [aiDiagnosis.pjiProbability],
  );

  const handleSave = async () => {
    if (!canWriteReview) {
      message.warning('Chỉ bác sĩ phụ trách hồ sơ này mới được lưu chẩn đoán.');
      return;
    }
    if (!episodeId || !runIdRef.current) {
      message.error('Thiếu thông tin bệnh án hoặc lần gợi ý AI.');
      return;
    }
    let values: DoctorDecisionForm;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối gợi ý AI.');
      return;
    }

    const diagnosis: IDoctorDiagnosis = {
      pji_conclusion: values.pji_conclusion,
      infection_classification: values.infection_classification,
      primary_diagnosis: values.primary_diagnosis,
      clinical_reasoning: values.clinical_reasoning,
      identified_organism: values.identified_organism,
    };
    const surgery = toSurgeryPlan(values);
    setIsSaving(true);
    try {
      await callCreateDoctorReview(String(episodeId), {
        runId: Number(runIdRef.current),
        reviewStatus: decision,
        reviewNote: reviewNote || undefined,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined,
        doctorDiagnosisJson: diagnosis as Record<string, any>,
        modificationJson: buildDoctorModificationJson(surgery),
        agreementJson: calculateAgreement({
          aiConclusion,
          aiDiagnosis,
          aiSurgery,
          diagnosis,
          doctorSurgery: surgery,
        }),
        doctorFinalDecision: {
          diagnosisJson: diagnosis as Record<string, any>,
          surgeryPlanJson: surgery as Record<string, any> | undefined,
        },
        selectAsFinalDecision: selectAsFinal,
      });
      setIsSuccessOpen(true);
    } catch {
      message.error('Lỗi khi lưu kết luận của bác sĩ.');
    } finally {
      setIsSaving(false);
    }
  };

  const backToHomepage = () => {
    clearDiagnosisWorkflowStorage();
    dispatch(clearCurrentCase());
    onBackToFirstStep();
  };

  if (isLoading) {
    return <div style={{ minHeight: 420, display: 'grid', placeItems: 'center' }}><Spin size="large" /></div>;
  }
  if (loadError) {
    return <Alert type="warning" showIcon message={loadError} action={<Button onClick={onPrev}>Quay lại</Button>} />;
  }

  return (
    <div style={{ background: '#f6f8fb', minHeight: '100%', paddingBottom: 48 }}>
      <Card
        size="small"
        style={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 10 }}
        styles={{ body: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 } }}
      >
        <Space>
          <UserOutlined style={{ fontSize: 22, color: '#2563eb' }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>Kết luận của bác sĩ</Text>
            <div><Text type="secondary">Form độc lập cho version AI #{runIdRef.current}</Text></div>
          </div>
        </Space>
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>Quay lại</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={isSaving} disabled={!canWriteReview} onClick={handleSave}>
            Lưu kết luận
          </Button>
        </Space>
      </Card>

      <div style={{ maxWidth: 1480, margin: '0 auto', padding: 24 }}>
        {!canWriteReview ? (
          <Alert type="info" showIcon message="Chế độ chỉ xem" description="Bạn không có quyền lưu review của bệnh án này." style={{ marginBottom: 16 }} />
        ) : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={8}>
            <Card title={<Space><RobotOutlined />Kết quả AI để đối chiếu</Space>} size="small">
              <Alert type="info" showIcon message="Chỉ dùng để tham khảo" description="Form bác sĩ không được khởi tạo từ nội dung phác đồ AI." style={{ marginBottom: 16 }} />
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Kết luận PJI">
                  <Tag color={aiConclusion === 'INFECTED' ? 'red' : aiConclusion === 'NOT_INFECTED' ? 'green' : 'gold'}>
                    {PJI_CONCLUSION_OPTIONS.find((option) => option.value === aiConclusion)?.label ?? 'Chưa rõ'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Phân loại">{aiDiagnosis.infectionClassification ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Chẩn đoán chính">{aiDiagnosis.primaryDiagnosis ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Vi khuẩn">{aiDiagnosis.identifiedOrganism ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Chiến lược mổ">{aiSurgery?.surgeryStrategyType ?? '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="Review version AI" size="small" style={{ marginTop: 16 }}>
              <Radio.Group value={decision} onChange={(event) => setDecision(event.target.value)} disabled={!canWriteReview}>
                <Space direction="vertical">
                  <Radio value="ACCEPTED"><CheckCircleOutlined /> Đồng thuận</Radio>
                  <Radio value="MODIFIED"><EditOutlined /> Điều chỉnh</Radio>
                  <Radio value="REJECTED"><CloseCircleOutlined /> Từ chối</Radio>
                </Space>
              </Radio.Group>
              <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                <Checkbox checked={selectAsFinal} onChange={(event) => setSelectAsFinal(event.target.checked)} disabled={!canWriteReview}>
                  Chọn version này làm final decision
                </Checkbox>
                <TextArea rows={2} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Ghi chú review" disabled={!canWriteReview} />
                {decision === 'REJECTED' ? (
                  <TextArea rows={2} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Lý do từ chối *" disabled={!canWriteReview} />
                ) : null}
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={16}>
            <Form form={form} layout="vertical" disabled={!canWriteReview}>
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
                <Alert type="info" showIcon message="Kháng sinh toàn thân và tại chỗ được nhập ở phần quyết định của dược sĩ." style={{ marginBottom: 16 }} />
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="surgeryStrategyType" label="Chiến lược phẫu thuật">
                      <Select options={SURGERY_STRATEGY_OPTIONS} allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="priorityLevel" label="Mức ưu tiên">
                      <Select options={['HIGH', 'MEDIUM', 'LOW'].map((value) => ({ value, label: value }))} allowClear />
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
            </Form>
          </Col>
        </Row>
      </div>
      <SuccessModal open={isSuccessOpen} onClose={backToHomepage} />
    </div>
  );
};

export default DoctorDiagnosisStep;

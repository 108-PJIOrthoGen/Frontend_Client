import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Radio,
  Row,
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
  EditOutlined,
  RobotOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { clearCurrentCase } from '@/redux/features/patients/patientSlice';
import { callCreateDoctorReview } from '@/apis/api';
import type { IDoctorDiagnosis, IPermission } from '@/types/backend';
import type { SurgeryPlanData } from '@/types/treatmentType';
import {
  TREATMENT_REVIEW_WRITE_PERMISSION,
  hasPermission,
  normalizeIdentity,
} from '../treatment_plan/utils/permissions';
import SuccessModal from '../treatment_plan/components/SuccessModal';
import {
  aiConclusionOf,
  buildDoctorModificationJson,
  clearDiagnosisWorkflowStorage,
  loadDoctorDiagnosisModel,
} from './doctorDiagnosisModel';
import type { AiDiagnosisSummary } from './doctorDiagnosisModel';
import { createDiagnosisWorkflowScope } from '@/features/diagnosis/diagnosisWorkflowSession';
import {
  DoctorDecisionFormFields,
  toDoctorDecisionFormValues,
  toDoctorSurgeryPlan,
  type DoctorDecisionForm,
} from './DoctorDecisionFormFields';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  onPrev: () => void;
  onBackToFirstStep: () => void;
}

const DoctorDiagnosisStep: React.FC<Props> = ({ onPrev, onBackToFirstStep }) => {
  const dispatch = useDispatch();
  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const currentUser = useSelector((state: RootState) => state.account.user);
  const episodeId = currentCase?.episode?.id;
  const patientId = currentCase?.patient?.id;
  const workflowScope = useMemo(
    () => createDiagnosisWorkflowScope(patientId, episodeId),
    [episodeId, patientId],
  );
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
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiDiagnosis, setAiDiagnosis] = useState<AiDiagnosisSummary>({});
  const [aiSurgery, setAiSurgery] = useState<SurgeryPlanData | null>(null);
  const runIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        if (!workflowScope) {
          throw new Error('Không xác định được bệnh án đang mở.');
        }
        const model = await loadDoctorDiagnosisModel(workflowScope);
        if (cancelled) return;
        runIdRef.current = model.runId;
        setAiDiagnosis(model.aiDiagnosis);
        setAiSurgery(model.aiSurgery);
        setReviewNote(model.reviewNote);
        setRejectionReason(model.rejectionReason);
        if (model.reviewDecision) setDecision(model.reviewDecision);
        form.setFieldsValue(toDoctorDecisionFormValues(model.previousDiagnosis, model.previousSurgery));
      } catch (error: any) {
        if (!cancelled) setLoadError(error?.message || 'Lỗi khi tải dữ liệu.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [form, workflowScope]);

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
    const surgery = toDoctorSurgeryPlan(values);
    setIsSaving(true);
    try {
      await callCreateDoctorReview(String(episodeId), {
        runId: Number(runIdRef.current),
        reviewStatus: decision,
        reviewNote: reviewNote || undefined,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined,
        doctorDiagnosisJson: diagnosis as Record<string, any>,
        modificationJson: buildDoctorModificationJson(surgery),
        doctorFinalDecision: {
          diagnosisJson: diagnosis as Record<string, any>,
          surgeryPlanJson: surgery as Record<string, any> | undefined,
        },
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
            <div><Text type="secondary">Biểu mẫu độc lập cho phiên bản AI #{runIdRef.current}</Text></div>
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
                    {aiConclusion === 'INFECTED' ? 'Nhiễm trùng khớp nhân tạo (PJI)' : aiConclusion === 'NOT_INFECTED' ? 'Không nhiễm trùng' : 'Chưa rõ'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Phân loại">{aiDiagnosis.infectionClassification ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Chẩn đoán chính">{aiDiagnosis.primaryDiagnosis ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Vi khuẩn">{aiDiagnosis.identifiedOrganism ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Chiến lược mổ">{aiSurgery?.surgeryStrategyType ?? '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="Đánh giá phiên bản AI" size="small" style={{ marginTop: 16 }}>
              <Radio.Group value={decision} onChange={(event) => setDecision(event.target.value)} disabled={!canWriteReview}>
                <Space direction="vertical">
                  <Radio value="ACCEPTED"><CheckCircleOutlined /> Đồng thuận</Radio>
                  <Radio value="MODIFIED"><EditOutlined /> Điều chỉnh</Radio>
                  <Radio value="REJECTED"><CloseCircleOutlined /> Từ chối</Radio>
                </Space>
              </Radio.Group>
              <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                <TextArea rows={2} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Ghi chú đánh giá" disabled={!canWriteReview} />
                {decision === 'REJECTED' ? (
                  <TextArea rows={2} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Lý do từ chối *" disabled={!canWriteReview} />
                ) : null}
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={16}>
            <Form form={form} layout="vertical" disabled={!canWriteReview}>
              <DoctorDecisionFormFields />
            </Form>
          </Col>
        </Row>
      </div>
      <SuccessModal open={isSuccessOpen} onClose={backToHomepage} />
    </div>
  );
};

export default DoctorDiagnosisStep;

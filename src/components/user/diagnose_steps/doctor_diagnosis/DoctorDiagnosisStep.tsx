import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileDoneOutlined,
  RobotOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { clearCurrentCase } from '@/redux/features/patients/patientSlice';
import { callSaveDoctorClinicalDecision, callSignDoctorClinicalDecision } from '@/apis/api';
import type { IDoctorDiagnosis } from '@/types/backend';
import type { SurgeryPlanData } from '@/types/treatmentType';
import SuccessModal from '../treatment_plan/components/SuccessModal';
import {
  clearDiagnosisWorkflowStorage,
  loadDoctorDiagnosisModel,
} from './doctorDiagnosisModel';
import {
  systemConclusionOf,
  type SystemDiagnosisSummary,
} from './doctorDiagnosisValues';
import { createDiagnosisWorkflowScope } from '@/features/diagnosis/diagnosisWorkflowSession';
import {
  DoctorDecisionFormFields,
  toDoctorDecisionFormValues,
  toDoctorSurgeryPlan,
  type DoctorDecisionForm,
} from './DoctorDecisionFormFields';

const { Text } = Typography;

interface Props {
  onPrev: () => void;
  onBackToFirstStep: () => void;
}

const DoctorDiagnosisStep: React.FC<Props> = ({ onPrev, onBackToFirstStep }) => {
  const dispatch = useDispatch();
  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const episodeId = currentCase?.episode?.id;
  const patientId = currentCase?.patient?.id;
  const workflowScope = useMemo(
    () => createDiagnosisWorkflowScope(patientId, episodeId, 'SURGERY'),
    [episodeId, patientId],
  );
  const [form] = Form.useForm<DoctorDecisionForm>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [systemDiagnosis, setSystemDiagnosis] = useState<SystemDiagnosisSummary>({});
  const [aiSurgery, setAiSurgery] = useState<SurgeryPlanData | null>(null);
  const [revision, setRevision] = useState(0);
  const [decisionStatus, setDecisionStatus] = useState<'DRAFT' | 'SIGNED'>();
  const [canEditDoctor, setCanEditDoctor] = useState(false);
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
        setSystemDiagnosis(model.systemDiagnosis);
        setAiSurgery(model.aiSurgery);
        setRevision(model.revision);
        setDecisionStatus(model.status);
        setCanEditDoctor(model.canEditDoctor);
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

  const systemConclusion = useMemo(
    () => systemConclusionOf(systemDiagnosis.pjiProbability),
    [systemDiagnosis.pjiProbability],
  );

  const persistDraft = async () => {
    if (!canEditDoctor || decisionStatus === 'SIGNED') {
      message.warning('Bạn không phải bác sĩ sở hữu quyết định này hoặc quyết định đã được ký.');
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
      const response = await callSaveDoctorClinicalDecision(runIdRef.current, {
        diagnosisJson: diagnosis as Record<string, any>,
        surgeryPlanJson: surgery as Record<string, any> | undefined,
        revision,
      });
      const savedRevision = response?.data?.doctorDecision?.revision;
      if (savedRevision == null) throw new Error('Không nhận được dữ liệu quyết định.');
      setRevision(savedRevision);
      setDecisionStatus(response.data?.doctorDecision?.status);
      return response.data;
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Lỗi khi lưu kết luận của bác sĩ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const saved = await persistDraft();
    if (saved) message.success('Đã lưu bản nháp kết luận bác sĩ.');
  };

  const handleSign = async () => {
    const saved = await persistDraft();
    const runId = runIdRef.current;
    if (!saved || !runId) return;
    setIsSaving(true);
    try {
      const response = await callSignDoctorClinicalDecision(runId, saved.doctorDecision?.revision ?? revision);
      setRevision(response?.data?.doctorDecision?.revision ?? revision);
      setDecisionStatus('SIGNED');
      setCanEditDoctor(false);
      setIsSuccessOpen(true);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể ký kết luận bác sĩ.');
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
          <Button icon={<SaveOutlined />} loading={isSaving} disabled={!canEditDoctor || decisionStatus === 'SIGNED'} onClick={handleSave}>
            Lưu nháp
          </Button>
          <Popconfirm title="Ký xác nhận kết luận?" description="Sau khi ký, nội dung sẽ bị khóa."
            okText="Ký xác nhận" cancelText="Hủy" onConfirm={handleSign}>
            <Button type="primary" icon={<FileDoneOutlined />} loading={isSaving}
              disabled={!canEditDoctor || decisionStatus === 'SIGNED'}>Ký xác nhận</Button>
          </Popconfirm>
        </Space>
      </Card>

      <div style={{ maxWidth: 1480, margin: '0 auto', padding: 24 }}>
        {!canEditDoctor ? (
          <Alert type="info" showIcon message="Chế độ chỉ xem"
            description={decisionStatus === 'SIGNED' ? 'Kết luận đã được ký và không thể chỉnh sửa.' : 'Chỉ bác sĩ tạo phiên bản AI này được lập kết luận.'}
            style={{ marginBottom: 16 }} />
        ) : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={8}>
            <Card title={<Space><RobotOutlined />Kết quả hệ thống theo snapshot của phiên bản</Space>} size="small">
              <Alert type="info" showIcon message="Chỉ dùng để tham khảo" description="Kết quả rule engine này được khóa theo snapshot của phiên bản; biểu mẫu bác sĩ không tự sao chép dữ liệu hệ thống." style={{ marginBottom: 16 }} />
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Kết luận PJI">
                  <Tag color={systemConclusion === 'INFECTED' ? 'red' : systemConclusion === 'NOT_INFECTED' ? 'green' : 'gold'}>
                    {systemConclusion === 'INFECTED' ? 'Nhiễm trùng khớp nhân tạo (PJI)' : systemConclusion === 'NOT_INFECTED' ? 'Không nhiễm trùng' : 'Chưa rõ'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Phân loại">{systemDiagnosis.infectionClassification ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Chẩn đoán chính">{systemDiagnosis.primaryDiagnosis ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Vi khuẩn">{systemDiagnosis.identifiedOrganism ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Chiến lược mổ">{aiSurgery?.surgeryStrategyType ?? '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} xl={16}>
            <Form form={form} layout="vertical" disabled={!canEditDoctor || decisionStatus === 'SIGNED'}>
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

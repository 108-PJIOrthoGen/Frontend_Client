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
  EditOutlined,
  CloseCircleOutlined,
  RobotOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { clearCurrentCase } from '@/redux/slice/patientSlice';
import {
  callCreateDoctorReview,
  callFetchAiRecommendationRunDetail,
  callFetchDoctorReviewByRunId,
} from '@/apis/api';
import type {
  IAiRecommendationRunDetail,
  IDoctorDiagnosis,
  IPermission,
} from '@/types/backend';
import type { LocalPlanData, SurgeryPlanData, SystemicPlanData } from '@/types/treatmentType';
import { parseItemJson } from './treatment_plan/utils/itemJson';
import {
  TREATMENT_REVIEW_WRITE_PERMISSION,
  hasPermission,
  normalizeIdentity,
} from './treatment_plan/utils/permissions';
import SurgerySection from '../rag_diagnose/rag_surgery/SurgerySection';
import type { SurgerySectionHandle } from '../rag_diagnose/rag_surgery/SurgerySection';
import { SystemicAntibioticTreatment } from '../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import type { SystemicAntibioticTreatmentHandle } from '../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import LocalAntibioticTreatment from '../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import type { LocalAntibioticTreatmentHandle } from '../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import SuccessModal from './treatment_plan/SuccessModal';
import {
  PJI_CONCLUSION_LABELS,
  aiConclusionOf,
  localAbxNames,
  norm,
  sameSet,
  systemicAbxNames,
} from '@/utils/aiDoctorCompare';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  onPrev: () => void;
  onBackToFirstStep: () => void;
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

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 300;
const TREATMENT_CATEGORIES = [
  'SURGERY_PROCEDURE',
  'SYSTEMIC_ANTIBIOTIC',
  'LOCAL_ANTIBIOTIC',
];

const hasTreatmentItems = (detail: IAiRecommendationRunDetail | null): boolean => {
  const categories = new Set(detail?.items?.map((item) => item.category));
  return TREATMENT_CATEGORIES.every((category) => categories.has(category));
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Step "Chẩn đoán bác sĩ" — the single place where the doctor records their own
 * final diagnosis + treatment plan and decides on the AI recommendation.
 * The template mirrors what the AI returns (assessment + 3 plan categories) so
 * compare-result can put them side by side and the model can later learn from
 * the doctor's final word.
 */
const DoctorDiagnosisStep: React.FC<Props> = ({ onPrev, onBackToFirstStep }) => {
  const dispatch = useDispatch();
  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const currentUser = useSelector((state: RootState) => state.account.user);
  const episodeId = currentCase?.episode?.id;

  // Same write-gate as the old TreatmentPlan review flow: only the doctor who
  // owns this medical record (or an admin) may write the DoctorReview.
  const permissions = currentUser.role.permissions as IPermission[] | undefined;
  const roleName = currentUser.role.name?.toUpperCase() ?? '';
  const isAdmin = roleName === 'ADMIN' || roleName === 'SUPER_ADMIN';
  const patientCreatedBy = currentCase?.patient?.createdBy;
  const ownsPatientRecord =
    !patientCreatedBy || normalizeIdentity(patientCreatedBy) === normalizeIdentity(currentUser.email);
  const canWriteReview =
    hasPermission(permissions, TREATMENT_REVIEW_WRITE_PERMISSION) && (ownsPatientRecord || isAdmin);

  const [form] = Form.useForm<IDoctorDiagnosis>();
  const [decision, setDecision] = useState<'ACCEPTED' | 'MODIFIED' | 'REJECTED'>('ACCEPTED');
  // Kept outside the antd Form: the diagnosis card owns the `form` instance and
  // an antd Form instance must not be bound to two <Form> elements.
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // AI side (read-only reference)
  const [aiDiagnosis, setAiDiagnosis] = useState<{
    pjiProbability?: string;
    overallAssessment?: string;
    primaryDiagnosis?: string;
    infectionClassification?: string;
    identifiedOrganism?: string;
  }>({});
  const [aiSurgery, setAiSurgery] = useState<SurgeryPlanData | null>(null);
  const [aiSystemic, setAiSystemic] = useState<SystemicPlanData | null>(null);
  const [aiLocal, setAiLocal] = useState<LocalPlanData | null>(null);

  // Doctor plan editors (prefilled with previous review's plan, else AI plan)
  const [doctorSurgeryInit, setDoctorSurgeryInit] = useState<SurgeryPlanData | null>(null);
  const [doctorSystemicInit, setDoctorSystemicInit] = useState<SystemicPlanData | null>(null);
  const [doctorLocalInit, setDoctorLocalInit] = useState<LocalPlanData | null>(null);

  const surgeryRef = useRef<SurgerySectionHandle>(null);
  const systemicRef = useRef<SystemicAntibioticTreatmentHandle>(null);
  const localRef = useRef<LocalAntibioticTreatmentHandle>(null);
  const runIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchUntilTreatmentReady = async (runId: string) => {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const res = await callFetchAiRecommendationRunDetail(runId);
        const detail = res?.data ?? null;
        const status = detail?.run?.status;

        if (hasTreatmentItems(detail)) return detail;
        if (status === 'FAILED' || status === 'TIMEOUT') {
          throw new Error(detail?.run?.errorMessage || 'AI tạo phác đồ thất bại.');
        }
        if (status === 'CANCELLED') {
          throw new Error('Lần tạo phác đồ AI đã bị huỷ.');
        }
        if ((status === 'SUCCESS' || status === 'PARTIAL') && !hasTreatmentItems(detail)) {
          throw new Error('AI chưa trả đủ 3 phác đồ điều trị.');
        }

        await wait(POLL_INTERVAL_MS);
      }
      throw new Error('AI tạo phác đồ quá lâu. Vui lòng quay lại sau.');
    };

    const load = async () => {
      setIsLoading(true);
      try {
        let detail: IAiRecommendationRunDetail | null = null;
        const cached = localStorage.getItem('pji_aiRunDetail');
        const runId = localStorage.getItem('pji_aiRunId');
        if (cached) {
          detail = JSON.parse(cached);
        }
        if ((!detail || !hasTreatmentItems(detail)) && runId) {
          detail = await fetchUntilTreatmentReady(runId);
          if (detail) {
            localStorage.setItem('pji_aiRunDetail', JSON.stringify(detail));
            localStorage.removeItem('pending_pji_aiRunId');
            localStorage.removeItem('pending_pji_thoughtLogs');
          }
        }
        if (!detail?.items?.length || !detail.run?.id) {
          setLoadError('Không tìm thấy dữ liệu gợi ý AI. Vui lòng quay lại bước trước.');
          return;
        }
        runIdRef.current = String(detail.run.id);

        // --- AI reference values -------------------------------------------
        let assessment: Record<string, any> = {};
        try {
          const raw: any = detail.run.assessmentJson;
          assessment = typeof raw === 'string' ? JSON.parse(raw) : raw ?? {};
        } catch { /* keep empty */ }

        const diagnosticItem = detail.items.find((i) => i.category === 'DIAGNOSTIC_TEST');
        const diagJson: any = diagnosticItem ? parseItemJson(diagnosticItem) : null;
        const aiReasoning = diagJson?.aiReasoning ?? {};

        setAiDiagnosis({
          pjiProbability: assessment?.pji_probability ?? assessment?.pjiProbability,
          overallAssessment: assessment?.overall_assessment ?? assessment?.overallAssessment,
          primaryDiagnosis: aiReasoning?.primaryDiagnosis,
          infectionClassification: aiReasoning?.infectionClassification,
          identifiedOrganism: aiReasoning?.identifiedOrganism?.name,
        });

        const surgeryItem = detail.items.find((i) => i.category === 'SURGERY_PROCEDURE');
        const systemicItem = detail.items.find((i) => i.category === 'SYSTEMIC_ANTIBIOTIC');
        const localItem = detail.items.find((i) => i.category === 'LOCAL_ANTIBIOTIC');
        const aiSurgeryPlan = surgeryItem ? (parseItemJson(surgeryItem) as SurgeryPlanData) : null;
        const aiSystemicPlan = systemicItem ? (parseItemJson(systemicItem) as SystemicPlanData) : null;
        const aiLocalPlan = localItem ? (parseItemJson(localItem) as LocalPlanData) : null;
        setAiSurgery(aiSurgeryPlan);
        setAiSystemic(aiSystemicPlan);
        setAiLocal(aiLocalPlan);

        // --- Prefill doctor side from a previous review, else from AI ------
        let previousPlan: Record<string, any> | null = null;
        try {
          const reviewRes = await callFetchDoctorReviewByRunId(String(detail.run.id));
          const review = reviewRes?.data;
          if (review) {
            previousPlan = review.modificationJson ?? null;
            const dd = review.doctorDiagnosisJson;
            if (dd) {
              form.setFieldsValue({
                pji_conclusion: dd.pji_conclusion,
                infection_classification: dd.infection_classification,
                primary_diagnosis: dd.primary_diagnosis,
                clinical_reasoning: dd.clinical_reasoning,
                identified_organism: dd.identified_organism,
              });
            }
            if (review.reviewStatus === 'ACCEPTED' || review.reviewStatus === 'MODIFIED'
              || review.reviewStatus === 'REJECTED') {
              setDecision(review.reviewStatus);
            }
            setReviewNote(review.reviewNote ?? '');
            setRejectionReason(review.rejectionReason ?? '');
          }
        } catch { /* no previous review — fine */ }

        setDoctorSurgeryInit((previousPlan?.surgery as SurgeryPlanData) ?? aiSurgeryPlan);
        setDoctorSystemicInit((previousPlan?.systemicAntibiotic as SystemicPlanData) ?? aiSystemicPlan);
        setDoctorLocalInit((previousPlan?.localAntibiotic as LocalPlanData) ?? aiLocalPlan);

        // Sensible defaults for the diagnosis form when no previous review.
        if (!form.getFieldValue('pji_conclusion')) {
          form.setFieldsValue({
            pji_conclusion: aiConclusionOf(assessment?.pji_probability),
            infection_classification: aiReasoning?.infectionClassification,
            primary_diagnosis: aiReasoning?.primaryDiagnosis,
            identified_organism: aiReasoning?.identifiedOrganism?.name,
          });
        }
      } catch (err: any) {
        setLoadError(err?.message || 'Lỗi khi tải dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aiConclusion = useMemo(
    () => aiConclusionOf(aiDiagnosis.pjiProbability),
    [aiDiagnosis.pjiProbability],
  );

  const computeAgreement = (
    diagnosis: IDoctorDiagnosis,
    doctorSurgery: SurgeryPlanData | null,
    doctorSystemic: SystemicPlanData | null,
    doctorLocal: LocalPlanData | null,
  ) => {
    const checks: Record<string, boolean> = {};
    checks.diagnosis_conclusion = norm(diagnosis.pji_conclusion) === norm(aiConclusion);
    if (aiDiagnosis.infectionClassification || diagnosis.infection_classification) {
      checks.infection_classification =
        norm(diagnosis.infection_classification) === norm(aiDiagnosis.infectionClassification);
    }
    if (aiSurgery || doctorSurgery) {
      checks.surgery_strategy =
        norm(doctorSurgery?.surgeryStrategyType) === norm(aiSurgery?.surgeryStrategyType);
    }
    if (aiSystemic || doctorSystemic) {
      checks.systemic_antibiotics = sameSet(systemicAbxNames(doctorSystemic), systemicAbxNames(aiSystemic));
    }
    if (aiLocal || doctorLocal) {
      checks.local_antibiotics = sameSet(localAbxNames(doctorLocal), localAbxNames(aiLocal));
    }
    const values = Object.values(checks);
    const agreed = values.filter(Boolean).length;
    const agreement_rate = values.length > 0 ? Math.round((agreed / values.length) * 100) : 100;
    return { ...checks, agreement_rate };
  };

  const handleSave = async () => {
    if (!canWriteReview) {
      message.warning('Chỉ bác sĩ phụ trách hồ sơ này mới được lưu chẩn đoán.');
      return;
    }
    if (!episodeId || !runIdRef.current) {
      message.error('Thiếu thông tin bệnh án hoặc lần gợi ý AI.');
      return;
    }
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      return; // inline errors already shown
    }
    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối gợi ý AI.');
      return;
    }

    setIsSaving(true);
    try {
      const doctorSurgery = surgeryRef.current?.getData() ?? null;
      const doctorSystemic = systemicRef.current?.getData() ?? null;
      const doctorLocal = localRef.current?.getData() ?? null;

      const doctorDiagnosisJson: IDoctorDiagnosis = {
        pji_conclusion: values.pji_conclusion,
        infection_classification: values.infection_classification,
        primary_diagnosis: values.primary_diagnosis,
        clinical_reasoning: values.clinical_reasoning,
        identified_organism: values.identified_organism,
      };
      const agreementJson = computeAgreement(
        doctorDiagnosisJson, doctorSurgery, doctorSystemic, doctorLocal,
      );

      const modificationJson: Record<string, any> = {};
      if (doctorSurgery) modificationJson.surgery = doctorSurgery;
      if (doctorSystemic) modificationJson.systemicAntibiotic = doctorSystemic;
      if (doctorLocal) modificationJson.localAntibiotic = doctorLocal;

      await callCreateDoctorReview(String(episodeId), {
        runId: Number(runIdRef.current),
        reviewStatus: decision,
        reviewNote: reviewNote || undefined,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined,
        modificationJson,
        doctorDiagnosisJson: doctorDiagnosisJson as Record<string, any>,
        agreementJson,
      });
      setIsSuccessOpen(true);
    } catch {
      message.error('Lỗi khi lưu chẩn đoán của bác sĩ.');
    } finally {
      setIsSaving(false);
    }
  };

  const backToHomepage = () => {
    localStorage.removeItem('pji_aiRunId');
    localStorage.removeItem('pji_aiRunDetail');
    localStorage.removeItem('pji_diagnosticResult');
    localStorage.removeItem('pji_selectedPatientId');
    localStorage.removeItem('pji_selectedExamId');
    dispatch(clearCurrentCase());
    onBackToFirstStep();
  };

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 48 }}>
        <Alert
          type="warning"
          showIcon
          message={loadError}
          action={<Button onClick={onPrev}>Quay lại</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ background: '#f6f8fb', minHeight: '100%', paddingBottom: 48 }}>
      {/* Header */}
      <Card
        size="small"
        style={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 10 }}
        styles={{ body: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }}
      >
        <Space>
          <UserOutlined style={{ fontSize: 22, color: '#2563eb' }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>Chẩn đoán bác sĩ</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Nhập chẩn đoán + phác đồ của bạn — hệ thống sẽ so sánh với AI và dùng để cải thiện mô hình
              </Text>
            </div>
          </div>
        </Space>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>Quay lại</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            disabled={!canWriteReview}
            onClick={handleSave}
          >
            Lưu chẩn đoán & hoàn tất
          </Button>
        </Space>
      </Card>

      <div style={{ maxWidth: 1600, margin: '0 auto', padding: 24 }}>
        {!canWriteReview && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Chế độ chỉ xem"
            description="Chỉ bác sĩ phụ trách hồ sơ này (người tạo bệnh án) hoặc quản trị viên mới được lưu chẩn đoán & phác đồ."
          />
        )}

        <Row gutter={[16, 16]}>
          {/* AI reference panel */}
          <Col xs={24} lg={8}>
            <Card
              title={<Space><RobotOutlined style={{ color: '#2563eb' }} />Kết luận của AI (tham chiếu)</Space>}
              size="small"
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Kết luận PJI">
                  <Tag color={aiConclusion === 'INFECTED' ? 'red' : aiConclusion === 'NOT_INFECTED' ? 'green' : 'gold'}>
                    {PJI_CONCLUSION_OPTIONS.find((o) => o.value === aiConclusion)?.label}
                  </Tag>
                  {aiDiagnosis.pjiProbability && (
                    <Text type="secondary" style={{ fontSize: 12 }}> ({aiDiagnosis.pjiProbability})</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Phân loại nhiễm trùng">
                  {aiDiagnosis.infectionClassification ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Chẩn đoán chính">
                  {aiDiagnosis.primaryDiagnosis ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Vi khuẩn định danh">
                  {aiDiagnosis.identifiedOrganism ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Đánh giá tổng thể">
                  {aiDiagnosis.overallAssessment ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Chiến lược phẫu thuật">
                  {aiSurgery?.surgeryStrategyType ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="KS toàn thân">
                  {systemicAbxNames(aiSystemic).join(', ') || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="KS tại chỗ">
                  {localAbxNames(aiLocal).join(', ') || '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Decision */}
            <Card
              title="Quyết định với gợi ý AI"
              size="small"
              style={{ marginTop: 16 }}
            >
              <Radio.Group
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                disabled={!canWriteReview}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <Radio value="ACCEPTED">
                  <Space><CheckCircleOutlined style={{ color: '#10b981' }} />Đồng thuận với AI</Space>
                </Radio>
                <Radio value="MODIFIED">
                  <Space><EditOutlined style={{ color: '#f59e0b' }} />Chỉnh sửa / ghi đè một phần</Space>
                </Radio>
                <Radio value="REJECTED">
                  <Space><CloseCircleOutlined style={{ color: '#ef4444' }} />Từ chối gợi ý AI</Space>
                </Radio>
              </Radio.Group>

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <Text strong style={{ fontSize: 13 }}>Ghi chú</Text>
                  <TextArea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    disabled={!canWriteReview}
                    placeholder="Ghi chú thêm cho quyết định này..."
                  />
                </div>
                {decision === 'REJECTED' && (
                  <div>
                    <Text strong style={{ fontSize: 13 }}>Lý do từ chối <Text type="danger">*</Text></Text>
                    <TextArea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      disabled={!canWriteReview}
                      placeholder="Vì sao gợi ý AI không phù hợp?"
                    />
                  </div>
                )}
              </div>
            </Card>
          </Col>

          {/* Doctor input panel */}
          <Col xs={24} lg={16}>
            <Card
              title={<Space><UserOutlined style={{ color: '#7c3aed' }} />Chẩn đoán của bác sĩ</Space>}
              size="small"
            >
              <Form form={form} layout="vertical" disabled={!canWriteReview}>
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="pji_conclusion"
                      label="Kết luận PJI"
                      rules={[{ required: true, message: 'Chọn kết luận' }]}
                    >
                      <Select options={PJI_CONCLUSION_OPTIONS} placeholder="-- Kết luận --" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="infection_classification" label="Phân loại nhiễm trùng">
                      <Select
                        options={INFECTION_CLASSIFICATION_OPTIONS}
                        placeholder="-- Phân loại --"
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="primary_diagnosis"
                  label="Chẩn đoán chính"
                  rules={[{ required: true, message: 'Nhập chẩn đoán chính' }]}
                >
                  <Input placeholder="VD: Nhiễm trùng khớp háng giả mạn tính do S. aureus" />
                </Form.Item>
                <Form.Item name="identified_organism" label="Vi khuẩn định danh (nếu có)">
                  <Input placeholder="VD: Staphylococcus aureus (MRSA)" />
                </Form.Item>
                <Form.Item name="clinical_reasoning" label="Lập luận lâm sàng">
                  <TextArea
                    rows={3}
                    placeholder="Cơ sở lâm sàng/xét nghiệm dẫn tới kết luận của bạn..."
                  />
                </Form.Item>
              </Form>
            </Card>

            <Card
              title="Phác đồ của bác sĩ"
              size="small"
              style={{ marginTop: 16 }}
              extra={<Text type="secondary" style={{ fontSize: 12 }}>Khởi tạo từ phác đồ AI — chỉnh trực tiếp bên dưới</Text>}
            >
              <div className="space-y-8">
                {doctorSurgeryInit && (
                  <SurgerySection ref={surgeryRef} surgeryPlan={doctorSurgeryInit} readOnly={!canWriteReview} />
                )}
                {doctorSystemicInit && (
                  <SystemicAntibioticTreatment
                    ref={systemicRef}
                    guidelinePlan={doctorSystemicInit}
                    readOnly={!canWriteReview}
                  />
                )}
                {doctorLocalInit && (
                  <LocalAntibioticTreatment ref={localRef} localPlan={doctorLocalInit} readOnly={!canWriteReview} />
                )}
                {!doctorSurgeryInit && !doctorSystemicInit && !doctorLocalInit && (
                  <Alert type="info" showIcon message="Không có dữ liệu phác đồ AI để khởi tạo." />
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <SuccessModal open={isSuccessOpen} onClose={backToHomepage} />
    </div>
  );
};

export default DoctorDiagnosisStep;

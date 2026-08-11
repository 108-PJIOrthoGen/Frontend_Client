import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Form, Input, Radio, Select, Space, Spin, Table, Tag, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { callCreateDoctorReview, callFetchAiRecommendationRunDetail } from '@/apis/api';
import type { IAiRecommendationRunDetail, IDoctorDiagnosis, IDoctorRecommendationReview } from '@/types/backend';
import type { LocalPlanData, SurgeryPlanData, SystemicPlanData, TemplateAntibiotic } from '@/types/treatmentType';
import {
  DoctorDecisionFormFields,
  toDoctorDecisionFormValues,
  toDoctorSurgeryPlan,
  type DoctorDecisionForm,
} from '@/components/user/diagnose_steps/doctor_diagnosis/DoctorDecisionFormFields';
import { buildDoctorModificationJson } from '@/components/user/diagnose_steps/doctor_diagnosis/doctorDiagnosisModel';
import { parseItemJson } from '@/components/user/diagnose_steps/treatment_plan/utils/itemJson';

const { TextArea } = Input;

type ReviewStatus = 'ACCEPTED' | 'MODIFIED' | 'REJECTED';

interface AiPlanRow {
  key: string;
  category: string;
  proposal: React.ReactNode;
}

const antibioticLabel = (antibiotic: TemplateAntibiotic): string => (
  [
    antibiotic.antibioticName,
    antibiotic.dosage,
    antibiotic.frequency,
    antibiotic.route,
    antibiotic.role ? `(${antibiotic.role})` : undefined,
  ].filter(Boolean).join(' · ')
);

const planRowsOf = (detail?: IAiRecommendationRunDetail): AiPlanRow[] => {
  if (!detail?.items?.length) return [];
  const item = (category: string) => detail.items?.find((candidate) => candidate.category === category);
  const diagnostic = parseItemJson(item('DIAGNOSTIC_TEST')) as Record<string, any> | null;
  const surgery = parseItemJson(item('SURGERY_PROCEDURE')) as SurgeryPlanData | null;
  const systemic = parseItemJson(item('SYSTEMIC_ANTIBIOTIC')) as SystemicPlanData | null;
  const local = parseItemJson(item('LOCAL_ANTIBIOTIC')) as LocalPlanData | null;
  const rows: AiPlanRow[] = [];
  const diagnosisSummary = diagnostic?.aiReasoning?.primaryDiagnosis
    ?? diagnostic?.ai_reasoning?.primary_diagnosis
    ?? diagnostic?.title;
  if (diagnosisSummary) {
    rows.push({ key: 'diagnosis', category: 'Chẩn đoán AI', proposal: String(diagnosisSummary) });
  }
  if (surgery) {
    const stages = surgery.stages?.map((stage) => stage.stageName).filter(Boolean).join(' → ');
    rows.push({
      key: 'surgery',
      category: 'Phẫu thuật',
      proposal: (
        <Space direction="vertical" size={0}>
          <strong>{surgery.surgeryStrategyType ?? 'Chưa nêu chiến lược'}</strong>
          {surgery.strategyRationale ? <span>{surgery.strategyRationale}</span> : null}
          {stages ? <span>Các giai đoạn: {stages}</span> : null}
        </Space>
      ),
    });
  }
  if (systemic) {
    const phases = systemic.phases?.map((phase) => (
      <div key={`${phase.phaseOrder}-${phase.phaseName}`}>
        <strong>{phase.phaseName}</strong>{phase.durationWeeks ? ` · ${phase.durationWeeks} tuần` : ''}
        {phase.antibiotics?.length ? `: ${phase.antibiotics.map(antibioticLabel).join('; ')}` : ''}
      </div>
    ));
    rows.push({
      key: 'systemic',
      category: 'Kháng sinh toàn thân',
      proposal: (
        <Space direction="vertical" size={0}>
          <strong>{systemic.regimenName || systemic.title || 'Phác đồ kháng sinh toàn thân'}</strong>
          {systemic.indication ? <span>{systemic.indication}</span> : null}
          {phases}
        </Space>
      ),
    });
  }
  if (local) {
    const antibiotics = local.antibiotics?.map(antibioticLabel).join('; ');
    rows.push({
      key: 'local',
      category: 'Kháng sinh tại chỗ',
      proposal: (
        <Space direction="vertical" size={0}>
          <strong>{local.regimenName || local.title || 'Phác đồ kháng sinh tại chỗ'}</strong>
          {local.indication ? <span>{local.indication}</span> : null}
          {antibiotics ? <span>{antibiotics}</span> : null}
          {local.deliveryInfo?.deliveryMethod ? <span>Cách đưa thuốc: {local.deliveryInfo.deliveryMethod}</span> : null}
        </Space>
      ),
    });
  }
  return rows;
};

interface DoctorConclusionTabProps {
  active?: boolean;
  episodeId?: string;
  reviews: IDoctorRecommendationReview[];
  selectedReviewId?: string;
  selecting?: boolean;
  onReviewChange: (reviewId: string) => void;
  onReviewSaved: (review: IDoctorRecommendationReview) => void;
  onSelectFinal: (reviewId: string) => void;
}

const reviewVersionLabel = (review: IDoctorRecommendationReview): string => {
  const version = review.run?.runNo ?? review.run?.id ?? review.runId ?? '?';
  return `Phiên bản AI #${version}${review.finalDecision ? ' — Kết luận cuối cùng' : ''}`;
};

const isReviewStatus = (value?: string): value is ReviewStatus => (
  value === 'ACCEPTED' || value === 'MODIFIED' || value === 'REJECTED'
);

const DoctorConclusionTab: React.FC<DoctorConclusionTabProps> = ({
  active,
  episodeId,
  reviews,
  selectedReviewId,
  selecting,
  onReviewChange,
  onReviewSaved,
  onSelectFinal,
}) => {
  const [form] = Form.useForm<DoctorDecisionForm>();
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('ACCEPTED');
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [runDetails, setRunDetails] = useState<Record<string, IAiRecommendationRunDetail>>({});
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planLoadError, setPlanLoadError] = useState<string>();
  const warnedEpisodeRef = useRef<string>();

  const review = useMemo(
    () => reviews.find((item) => String(item.id) === selectedReviewId) ?? reviews[0],
    [reviews, selectedReviewId],
  );
  const hasFinalDecision = reviews.some((item) => item.finalDecision);
  const runId = review?.runId ?? review?.run?.id;
  const runDetail = runId ? runDetails[String(runId)] : undefined;
  const planRows = useMemo(() => planRowsOf(runDetail), [runDetail]);

  useEffect(() => {
    if (!review) return;
    const diagnosis = review.doctorFinalDecision?.diagnosisJson ?? review.doctorDiagnosisJson;
    const surgery = review.doctorFinalDecision?.surgeryPlanJson
      ?? (review.modificationJson?.surgery as any);
    form.resetFields();
    form.setFieldsValue(toDoctorDecisionFormValues(diagnosis, surgery));
    setReviewStatus(isReviewStatus(review.reviewStatus) ? review.reviewStatus : 'ACCEPTED');
    setReviewNote(review.reviewNote ?? '');
    setRejectionReason(review.rejectionReason ?? '');
  }, [form, review]);

  useEffect(() => {
    const warningScope = `${episodeId ?? ''}:${reviews.map((item) => item.id).join(',')}`;
    if (!active || !reviews.length || hasFinalDecision || warnedEpisodeRef.current === warningScope) return;
    warnedEpisodeRef.current = warningScope;
    message.warning('Bệnh án này chưa chọn phiên bản nào làm kết luận cuối cùng. Bạn vẫn có thể lưu chỉnh sửa trước khi chọn.');
  }, [active, episodeId, hasFinalDecision, reviews]);

  useEffect(() => {
    if (!runId || runDetail) return;
    let cancelled = false;
    setIsPlanLoading(true);
    setPlanLoadError(undefined);
    void callFetchAiRecommendationRunDetail(String(runId))
      .then((response) => {
        if (cancelled || !response?.data) return;
        setRunDetails((current) => ({ ...current, [String(runId)]: response.data }));
      })
      .catch(() => {
        if (!cancelled) setPlanLoadError('Không thể tải phác đồ AI của phiên bản này.');
      })
      .finally(() => {
        if (!cancelled) setIsPlanLoading(false);
      });
    return () => { cancelled = true; };
  }, [runDetail, runId]);

  const handleSave = async () => {
    if (!episodeId || !runId) {
      message.error('Thiếu thông tin bệnh án hoặc phiên bản AI.');
      return;
    }
    let values: DoctorDecisionForm;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (reviewStatus === 'REJECTED' && !rejectionReason.trim()) {
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

    setSaving(true);
    try {
      const response = await callCreateDoctorReview(episodeId, {
        runId: Number(runId),
        reviewStatus,
        reviewNote: reviewNote || undefined,
        rejectionReason: reviewStatus === 'REJECTED' ? rejectionReason : undefined,
        doctorDiagnosisJson: diagnosis as Record<string, any>,
        modificationJson: buildDoctorModificationJson(surgery),
        agreementJson: review.agreementJson,
        doctorFinalDecision: {
          diagnosisJson: diagnosis as Record<string, any>,
          surgeryPlanJson: surgery as Record<string, any> | undefined,
        },
      });
      if (!response?.data) throw new Error('Không nhận được kết quả lưu.');
      onReviewSaved(response.data);
      message.success('Đã lưu kết luận bác sĩ cho phiên bản AI này.');
    } catch {
      message.error('Không thể lưu kết luận bác sĩ.');
    } finally {
      setSaving(false);
    }
  };

  if (!reviews.length) {
    return <Empty description="Chưa có đánh giá bác sĩ cho các phiên bản gợi ý AI của bệnh án." />;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {!hasFinalDecision ? (
        <Alert
          type="warning"
          showIcon
          message="Chưa chọn kết luận cuối cùng"
          description="Hãy rà soát và chọn một phiên bản làm kết luận cuối cùng khi phù hợp. Việc này không bắt buộc để lưu chỉnh sửa."
        />
      ) : null}

      <Card
        size="small"
        style={review?.finalDecision ? { borderColor: '#22c55e', background: '#f0fdf4' } : undefined}
      >
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <strong>Phiên bản gợi ý AI</strong>
            <Select
              value={String(review.id)}
              style={{ width: 'min(100%, 360px)', minWidth: 0 }}
              options={reviews.map((item) => ({ value: String(item.id), label: reviewVersionLabel(item) }))}
              onChange={onReviewChange}
            />
          </Space>
          {review.finalDecision ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>Kết luận cuối cùng đang được chọn</Tag>
          ) : (
            <Button type="primary" loading={selecting} onClick={() => onSelectFinal(String(review.id))}>
              Chọn làm kết luận cuối cùng
            </Button>
          )}
        </Space>
      </Card>

      <Card
        title="Phác đồ AI đề xuất cho phiên bản này"
        size="small"
        extra={review?.run?.runNo ? <Tag color="blue">Phiên bản AI #{review.run.runNo}</Tag> : undefined}
      >
        {isPlanLoading ? (
          <div style={{ minHeight: 120, display: 'grid', placeItems: 'center' }}><Spin tip="Đang tải phác đồ AI..." /></div>
        ) : planLoadError ? (
          <Alert type="warning" showIcon message={planLoadError} />
        ) : planRows.length ? (
          <Table<AiPlanRow>
            size="small"
            pagination={false}
            rowKey="key"
            columns={[
              { title: 'Hạng mục', dataIndex: 'category', width: 220 },
              { title: 'AI đề xuất', dataIndex: 'proposal' },
            ]}
            dataSource={planRows}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Phiên bản này chưa có dữ liệu phác đồ AI." />
        )}
      </Card>

      <Card title="Đánh giá phiên bản AI" size="small">
        <Radio.Group value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
          <Space direction="vertical">
            <Radio value="ACCEPTED"><CheckCircleOutlined /> Đồng thuận</Radio>
            <Radio value="MODIFIED"><EditOutlined /> Điều chỉnh</Radio>
            <Radio value="REJECTED"><CloseCircleOutlined /> Từ chối</Radio>
          </Space>
        </Radio.Group>
        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
          <TextArea rows={2} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Ghi chú đánh giá" />
          {reviewStatus === 'REJECTED' ? (
            <TextArea rows={2} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Lý do từ chối *" />
          ) : null}
        </Space>
      </Card>

      <Form form={form} layout="vertical">
        <DoctorDecisionFormFields />
      </Form>

      <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
        Lưu kết luận bác sĩ cho phiên bản này
      </Button>
    </Space>
  );
};

export default DoctorConclusionTab;

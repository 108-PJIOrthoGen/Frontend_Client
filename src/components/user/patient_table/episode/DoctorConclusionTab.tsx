import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Form, Popconfirm, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, FileDoneOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import {
  callFetchAiRecommendationRunDetail,
  callSaveDoctorClinicalDecision,
  callSelectFinalClinicalDecisionRun,
  callSignDoctorClinicalDecision,
} from '@/apis/api';
import type { IAiRecommendationRunDetail, IDoctorDiagnosis, IRunClinicalDecision } from '@/types/backend';
import type { LocalPlanData, SurgeryPlanData, SystemicPlanData, TemplateAntibiotic } from '@/types/treatmentType';
import {
  DoctorDecisionFormFields,
  toDoctorDecisionFormValues,
  toDoctorSurgeryPlan,
  type DoctorDecisionForm,
} from '@/components/user/diagnose_steps/doctor_diagnosis/DoctorDecisionFormFields';
import { parseItemJson } from '@/components/user/diagnose_steps/treatment_plan/utils/itemJson';
import DecisionVersionRail from './DecisionVersionRail';

const { Text } = Typography;

interface AiPlanRow {
  key: string;
  category: string;
  proposal: React.ReactNode;
}

interface DoctorConclusionTabProps {
  episodeId?: string;
  runs: IRunClinicalDecision[];
  selectedRunId?: string;
  onRunChange: (runId: string) => void;
  onDecisionUpdated: (run: IRunClinicalDecision) => void;
}

const antibioticLabel = (antibiotic: TemplateAntibiotic): string => (
  [antibiotic.antibioticName, antibiotic.dosage, antibiotic.frequency, antibiotic.route]
    .filter(Boolean)
    .join(' · ')
);

const planRowsOf = (detail?: IAiRecommendationRunDetail): AiPlanRow[] => {
  if (!detail?.items?.length) return [];
  const item = (category: NonNullable<IAiRecommendationRunDetail['items']>[number]['category']) => (
    detail.items?.find((candidate) => candidate.category === category)
  );
  const surgery = parseItemJson(item('SURGERY_PROCEDURE')) as SurgeryPlanData | null;
  const systemic = parseItemJson(item('SYSTEMIC_ANTIBIOTIC')) as SystemicPlanData | null;
  const local = parseItemJson(item('LOCAL_ANTIBIOTIC')) as LocalPlanData | null;
  const rows: AiPlanRow[] = [];
  if (surgery) {
    const stages = surgery.stages?.map((stage) => stage.stageName).filter(Boolean).join(' → ');
    rows.push({
      key: 'surgery',
      category: 'Phẫu thuật',
      proposal: (
        <Space orientation="vertical" size={0}>
          <strong>{surgery.surgeryStrategyType ?? 'Chưa nêu chiến lược'}</strong>
          {surgery.strategyRationale ? <span>{surgery.strategyRationale}</span> : null}
          {stages ? <span>Các giai đoạn: {stages}</span> : null}
        </Space>
      ),
    });
  }
  if (systemic) {
    rows.push({
      key: 'systemic',
      category: 'Kháng sinh toàn thân',
      proposal: (
        <Space orientation="vertical" size={0}>
          <strong>{systemic.regimenName || systemic.title}</strong>
          {systemic.phases?.map((phase) => (
            <span key={`${phase.phaseOrder}-${phase.phaseName}`}>
              {phase.phaseName}{phase.durationWeeks ? ` · ${phase.durationWeeks} tuần` : ''}
              {phase.antibiotics?.length ? `: ${phase.antibiotics.map(antibioticLabel).join('; ')}` : ''}
            </span>
          ))}
        </Space>
      ),
    });
  }
  if (local) {
    rows.push({
      key: 'local',
      category: 'Kháng sinh tại chỗ',
      proposal: (
        <Space orientation="vertical" size={0}>
          <strong>{local.regimenName || local.title}</strong>
          {local.antibiotics?.length ? <span>{local.antibiotics.map(antibioticLabel).join('; ')}</span> : null}
        </Space>
      ),
    });
  }
  return rows;
};

const apiErrorMessage = (error: any, fallback: string): string => (
  error?.response?.data?.message || fallback
);

const DoctorConclusionTab: React.FC<DoctorConclusionTabProps> = ({
  episodeId,
  runs,
  selectedRunId,
  onRunChange,
  onDecisionUpdated,
}) => {
  const [form] = Form.useForm<DoctorDecisionForm>();
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [runDetails, setRunDetails] = useState<Record<string, IAiRecommendationRunDetail>>({});
  const [loadingPlan, setLoadingPlan] = useState(false);

  const selected = useMemo(
    () => runs.find((candidate) => String(candidate.run.id) === selectedRunId) ?? runs[0],
    [runs, selectedRunId],
  );
  const runId = selected?.run.id != null ? String(selected.run.id) : undefined;
  const runDetail = runId ? runDetails[runId] : undefined;
  const planRows = useMemo(() => planRowsOf(runDetail), [runDetail]);
  const doctorDecision = selected?.doctorDecision;
  const signed = doctorDecision?.status === 'SIGNED';

  useEffect(() => {
    if (!selected) return;
    form.resetFields();
    form.setFieldsValue(toDoctorDecisionFormValues(
      doctorDecision?.diagnosisJson,
      doctorDecision?.surgeryPlanJson,
    ));
  }, [doctorDecision, form, selected]);

  useEffect(() => {
    if (!runId || runDetail) return;
    let cancelled = false;
    setLoadingPlan(true);
    void callFetchAiRecommendationRunDetail(runId)
      .then((response) => {
        if (!cancelled && response?.data) {
          setRunDetails((current) => ({ ...current, [runId]: response.data }));
        }
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoadingPlan(false); });
    return () => { cancelled = true; };
  }, [runDetail, runId]);

  const persistDraft = async (): Promise<IRunClinicalDecision | undefined> => {
    if (!runId || !selected?.canEditDoctor) return undefined;
    const values = await form.validateFields();
    const diagnosis: IDoctorDiagnosis = {
      pji_conclusion: values.pji_conclusion,
      infection_classification: values.infection_classification,
      primary_diagnosis: values.primary_diagnosis,
      clinical_reasoning: values.clinical_reasoning,
      identified_organism: values.identified_organism,
    };
    const surgery = toDoctorSurgeryPlan(values);
    const response = await callSaveDoctorClinicalDecision(runId, {
      diagnosisJson: diagnosis as Record<string, any>,
      surgeryPlanJson: surgery as Record<string, any> | undefined,
      revision: doctorDecision?.revision ?? 0,
    });
    if (!response?.data) throw new Error('Không nhận được dữ liệu quyết định.');
    onDecisionUpdated(response.data);
    return response.data;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistDraft();
      message.success('Đã lưu bản nháp kết luận bác sĩ.');
    } catch (error: any) {
      message.error(apiErrorMessage(error, 'Không thể lưu kết luận bác sĩ.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!runId) return;
    setSigning(true);
    try {
      const saved = await persistDraft();
      if (!saved) return;
      const response = await callSignDoctorClinicalDecision(runId, saved.doctorDecision?.revision ?? 0);
      if (!response?.data) throw new Error('Không nhận được dữ liệu quyết định.');
      onDecisionUpdated(response.data);
      message.success('Đã ký xác nhận kết luận bác sĩ.');
    } catch (error: any) {
      message.error(apiErrorMessage(error, 'Không thể ký kết luận bác sĩ.'));
    } finally {
      setSigning(false);
    }
  };

  const handleSelectFinal = async () => {
    if (!episodeId || !runId) return;
    setSelecting(true);
    try {
      const response = await callSelectFinalClinicalDecisionRun(episodeId, runId);
      if (!response?.data) throw new Error('Không nhận được dữ liệu quyết định.');
      onDecisionUpdated(response.data);
      message.success('Đã chọn phiên bản làm phác đồ cuối cùng.');
    } catch (error: any) {
      message.error(apiErrorMessage(error, 'Không thể chọn phiên bản cuối cùng.'));
    } finally {
      setSelecting(false);
    }
  };

  return (
    <DecisionVersionRail runs={runs} selectedRunId={runId} onRunChange={onRunChange}>
      {selected ? (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Card size="small">
            <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <UserOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                <div>
                  <Text strong>Kết luận bác sĩ · Phiên bản #{selected.run.runNo ?? selected.run.id}</Text>
                  <div>
                    <Text type="secondary">
                      {doctorDecision?.author?.fullName || doctorDecision?.author?.email || 'Chưa có người lập quyết định'}
                    </Text>
                  </div>
                </div>
              </Space>
              <Space wrap>
                {signed ? <Tag color="green" icon={<CheckCircleOutlined />}>Đã ký · chỉ đọc</Tag> : null}
                {selected.finalSelection ? <Tag color="green">Phác đồ cuối cùng</Tag> : null}
                {selected.canSelectFinal && !selected.finalSelection ? (
                  <Button loading={selecting} onClick={handleSelectFinal}>Chọn làm cuối cùng</Button>
                ) : null}
              </Space>
            </Space>
          </Card>

          {!selected.canEditDoctor && !signed ? (
            <Alert
              type="info"
              showIcon
              title="Chế độ chỉ xem"
              description={doctorDecision
                ? 'Quyết định này thuộc một bác sĩ khác.'
                : 'Chỉ bác sĩ đã tạo phiên bản AI này mới được lập kết luận.'}
            />
          ) : null}

          <Card title="Phác đồ AI đề xuất cho phiên bản này" size="small">
            <Spin spinning={loadingPlan}>
              {planRows.length ? (
                <Table<AiPlanRow>
                  size="small"
                  pagination={false}
                  rowKey="key"
                  columns={[
                    { title: 'Hạng mục', dataIndex: 'category', width: 210 },
                    { title: 'AI đề xuất', dataIndex: 'proposal' },
                  ]}
                  dataSource={planRows}
                />
              ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu phác đồ AI." />}
            </Spin>
          </Card>

          <fieldset disabled={!selected.canEditDoctor || signed} style={{ border: 0, padding: 0, margin: 0 }}>
            <Form form={form} layout="vertical">
              <DoctorDecisionFormFields />
            </Form>
          </fieldset>

          {selected.canEditDoctor && !signed ? (
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button icon={<SaveOutlined />} loading={saving} onClick={handleSave}>Lưu nháp</Button>
              <Popconfirm
                title="Ký xác nhận kết luận?"
                description="Sau khi ký, nội dung sẽ bị khóa và không thể chỉnh sửa trực tiếp."
                okText="Ký xác nhận"
                cancelText="Hủy"
                onConfirm={handleSign}
              >
                <Button type="primary" icon={<FileDoneOutlined />} loading={signing}>Ký xác nhận</Button>
              </Popconfirm>
            </Space>
          ) : null}
        </Space>
      ) : null}
    </DecisionVersionRail>
  );
};

export default DoctorConclusionTab;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Button, Card, Col, Empty, Input, Popconfirm, Row, Space, Spin, Table, Tag, Typography, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined, CopyOutlined, FileDoneOutlined, MedicineBoxOutlined, RobotOutlined, SaveOutlined,
} from '@ant-design/icons';
import {
  callFetchAiRecommendationRunDetail,
  callSelectFinalClinicalDecisionRun,
  callSavePharmacistClinicalDecision,
  callSignPharmacistClinicalDecision,
} from '@/apis/api';
import type {
  IAiRecommendationRunDetail, ICultureResult, IRunClinicalDecision, ISensitivityResult,
} from '@/types/backend';
import type { AntibioticCarePlanData, LocalPlanData, SystemicPlanData, TemplateAntibiotic } from '@/types/treatmentType';
import AntibioticCarePlanPanel from '../../antibiotic/AntibioticCarePlanPanel';
import { parseItemJson } from '../../diagnose_steps/treatment_plan/utils/itemJson';
import LocalAntibioticTreatment, {
  type LocalAntibioticTreatmentHandle,
} from '../../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import { SystemicAntibioticTreatment, type SystemicAntibioticTreatmentHandle } from '../../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import { Antibiogram } from './Antibiogram';
import DecisionVersionRail from './DecisionVersionRail';

const { Text } = Typography;

interface AntibiogramAiVersionTabProps {
  episodeId?: string | number;
  runs: IRunClinicalDecision[];
  selectedRunId?: string;
  onRunChange: (runId: string) => void;
  onDecisionUpdated: (run: IRunClinicalDecision) => void;
  cultureResults: ICultureResult[];
  sensitivityMap: Record<string, ISensitivityResult[]>;
}

interface AiAntibioticRow {
  key: string;
  treatmentType: 'SYSTEMIC' | 'LOCAL';
  regimen: string;
  phase: string;
  antibiotic: TemplateAntibiotic;
  duration: string;
}

const emptySystemicPlan = (): SystemicPlanData => ({
  category: 'SYSTEMIC_ANTIBIOTIC', title: 'Quyết định kháng sinh toàn thân', regimenName: 'Phác đồ dược sĩ',
  indication: '', totalDurationWeeks: 0, phases: [], monitoring: [], contraindications: [], notes: '',
});

const emptyLocalPlan = (): LocalPlanData => ({
  category: 'LOCAL_ANTIBIOTIC', title: 'Quyết định kháng sinh tại chỗ', regimenName: 'Phác đồ dược sĩ',
  indication: '', durationDays: 0, durationNote: '', antibiotics: [], monitoring: [], contraindications: [], notes: '',
});

const clonePlan = <T,>(plan: T): T => JSON.parse(JSON.stringify(plan)) as T;

const parsePlan = <T,>(detail: IAiRecommendationRunDetail | undefined, category: string): T | undefined => {
  const item = detail?.items?.find((candidate) => candidate.category === category);
  if (!item) return undefined;
  try {
    return parseItemJson(item) as T;
  } catch {
    return undefined;
  }
};

const buildRows = (systemic?: SystemicPlanData, local?: LocalPlanData): AiAntibioticRow[] => {
  const rows: AiAntibioticRow[] = [];
  systemic?.phases?.forEach((phase, phaseIndex) => {
    phase.antibiotics?.forEach((antibiotic, antibioticIndex) => rows.push({
      key: `systemic-${phaseIndex}-${antibioticIndex}`,
      treatmentType: 'SYSTEMIC',
      regimen: systemic.regimenName || 'Phác đồ toàn thân',
      phase: phase.phaseName || `Giai đoạn ${phase.phaseOrder || phaseIndex + 1}`,
      antibiotic,
      duration: phase.durationWeeks ? `${phase.durationWeeks} tuần` : phase.durationNote || '—',
    }));
  });
  local?.antibiotics?.forEach((antibiotic, antibioticIndex) => rows.push({
    key: `local-${antibioticIndex}`,
    treatmentType: 'LOCAL',
    regimen: local.regimenName || 'Phác đồ tại chỗ',
    phase: 'Tại chỗ',
    antibiotic,
    duration: local.durationDays ? `${local.durationDays} ngày` : local.durationNote || '—',
  }));
  return rows;
};

const columns: ColumnsType<AiAntibioticRow> = [
  {
    title: 'Nhóm', dataIndex: 'treatmentType', width: 105,
    render: (value: AiAntibioticRow['treatmentType']) => (
      <Tag color={value === 'SYSTEMIC' ? 'blue' : 'cyan'}>{value === 'SYSTEMIC' ? 'Toàn thân' : 'Tại chỗ'}</Tag>
    ),
  },
  { title: 'Phác đồ', dataIndex: 'regimen', width: 180 },
  { title: 'Giai đoạn', dataIndex: 'phase', width: 140 },
  { title: 'Kháng sinh', width: 160, render: (_, row) => <Text strong>{row.antibiotic.antibioticName || '—'}</Text> },
  { title: 'Liều', width: 130, render: (_, row) => row.antibiotic.dosage || '—' },
  { title: 'Tần suất', width: 120, render: (_, row) => row.antibiotic.frequency || '—' },
  { title: 'Đường dùng', width: 120, render: (_, row) => row.antibiotic.route || '—' },
  { title: 'Thời lượng', dataIndex: 'duration', width: 120 },
];

const apiErrorMessage = (error: any, fallback: string): string => error?.response?.data?.message || fallback;

const AntibiogramAiVersionTab: React.FC<AntibiogramAiVersionTabProps> = ({
  runs, selectedRunId, onRunChange, onDecisionUpdated, cultureResults, sensitivityMap,
}) => {
  const systemicRef = useRef<SystemicAntibioticTreatmentHandle>(null);
  const localRef = useRef<LocalAntibioticTreatmentHandle>(null);
  const [runDetails, setRunDetails] = useState<Record<string, IAiRecommendationRunDetail>>({});
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [notes, setNotes] = useState('');
  const [systemicPlan, setSystemicPlan] = useState<SystemicPlanData>(emptySystemicPlan);
  const [localPlan, setLocalPlan] = useState<LocalPlanData>(emptyLocalPlan);
  const [carePlan, setCarePlan] = useState<AntibioticCarePlanData>();
  const [editorKey, setEditorKey] = useState(0);
  const successfulRuns = useMemo(
    () => runs.filter((candidate) => candidate.run.status === 'SUCCESS'),
    [runs],
  );

  const selected = useMemo(
    () => successfulRuns.find((candidate) => String(candidate.run.id) === selectedRunId) ?? successfulRuns[0],
    [selectedRunId, successfulRuns],
  );
  const runId = selected?.run.id != null ? String(selected.run.id) : undefined;
  const detail = runId ? runDetails[runId] : undefined;
  const aiSystemic = useMemo(() => parsePlan<SystemicPlanData>(detail, 'SYSTEMIC_ANTIBIOTIC'), [detail]);
  const aiLocal = useMemo(() => parsePlan<LocalPlanData>(detail, 'LOCAL_ANTIBIOTIC'), [detail]);
  const aiCare = useMemo(() => parsePlan<AntibioticCarePlanData>(detail, 'ANTIBIOTIC_CARE_PLAN'), [detail]);
  const rows = useMemo(() => buildRows(aiSystemic, aiLocal), [aiLocal, aiSystemic]);
  const decision = selected?.pharmacistDecision;
  const signed = decision?.status === 'SIGNED';

  useEffect(() => {
    setSystemicPlan(clonePlan(decision?.systemicAntibioticPlanJson ?? emptySystemicPlan()));
    setLocalPlan(clonePlan(decision?.localAntibioticPlanJson ?? emptyLocalPlan()));
    setCarePlan(decision?.carePlanJson ? clonePlan(decision.carePlanJson) : undefined);
    setNotes(decision?.notes ?? '');
    setEditorKey((current) => current + 1);
  }, [decision, runId]);

  useEffect(() => {
    if (!runId || detail) return;
    let cancelled = false;
    setLoadingPlan(true);
    void callFetchAiRecommendationRunDetail(runId)
      .then((response) => {
        if (!cancelled && response?.data) setRunDetails((current) => ({ ...current, [runId]: response.data }));
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoadingPlan(false); });
    return () => { cancelled = true; };
  }, [detail, runId]);

  const copyAiProposal = () => {
    if (!aiSystemic && !aiLocal) return;
    setSystemicPlan(clonePlan(aiSystemic ?? emptySystemicPlan()));
    setLocalPlan(clonePlan(aiLocal ?? emptyLocalPlan()));
    setCarePlan(aiCare ? clonePlan(aiCare) : undefined);
    setEditorKey((current) => current + 1);
    message.success('Đã sao chép đề xuất AI vào bản nháp của dược sĩ.');
  };

  const persistDraft = async (): Promise<IRunClinicalDecision | undefined> => {
    if (!runId || !selected?.canEditPharmacist) return undefined;
    const response = await callSavePharmacistClinicalDecision(runId, {
      systemicAntibioticPlanJson: systemicRef.current?.getData() as Record<string, any>,
      localAntibioticPlanJson: localRef.current?.getData() as Record<string, any>,
      carePlanJson: carePlan as unknown as Record<string, any> | undefined,
      notes,
      revision: decision?.revision ?? 0,
    });
    if (!response?.data) throw new Error('Không nhận được dữ liệu quyết định.');
    onDecisionUpdated(response.data);
    return response.data;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistDraft();
      message.success('Đã lưu bản nháp của dược sĩ.');
    } catch (error: any) {
      message.error(apiErrorMessage(error, 'Không thể lưu quyết định của dược sĩ.'));
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
      const response = await callSignPharmacistClinicalDecision(runId, saved.pharmacistDecision?.revision ?? 0);
      if (!response?.data) throw new Error('Không nhận được dữ liệu quyết định.');
      onDecisionUpdated(response.data);
      message.success('Đã ký xác nhận phác đồ kháng sinh.');
    } catch (error: any) {
      message.error(apiErrorMessage(error, 'Không thể ký quyết định của dược sĩ.'));
    } finally {
      setSigning(false);
    }
  };

  const handleSelectFinal = async () => {
    if (!runId || !selected?.run.episodeId) return;
    try {
      const response = await callSelectFinalClinicalDecisionRun(String(selected.run.episodeId), runId);
      if (response?.data) onDecisionUpdated(response.data);
      message.success('Đã chọn phác đồ kháng sinh cuối cùng cho bệnh án.');
    } catch (error: any) {
      message.error(apiErrorMessage(error, 'Không thể chọn phiên bản kháng sinh cuối cùng.'));
    }
  };

  return (
    <DecisionVersionRail runs={successfulRuns} selectedRunId={runId} onRunChange={onRunChange}>
      {selected ? (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Card size="small">
            <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <MedicineBoxOutlined style={{ color: '#0891b2', fontSize: 20 }} />
                <div>
                  <Text strong>Dược lâm sàng · Phiên bản #{selected.run.runNo ?? selected.run.id}</Text>
                  <div><Text type="secondary">{decision?.author?.fullName || decision?.author?.email || 'Chưa có dược sĩ nhận quyết định'}</Text></div>
                </div>
              </Space>
              <Space wrap>
                {signed ? <Tag color="green" icon={<CheckCircleOutlined />}>Đã ký · chỉ đọc</Tag> : null}
                {selected.finalSelection ? <Tag color="green">Phác đồ cuối cùng</Tag> : null}
              </Space>
            </Space>
          </Card>

          {!selected.canEditPharmacist && !signed ? (
            <Alert type="info" showIcon title="Chế độ chỉ xem"
              description={decision ? 'Quyết định này thuộc một dược sĩ khác.' : 'Chỉ tài khoản dược sĩ được lập phác đồ kháng sinh.'} />
          ) : null}

          <Card title="Kháng sinh đồ của bệnh án" size="small" styles={{ body: { padding: 0 } }}>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <div style={{ minWidth: 720 }}>
                <Antibiogram readOnly cultureResults={cultureResults.map((culture) => ({ ...culture, _tempId: String(culture.id) }))}
                  sensitivityMap={sensitivityMap} />
              </div>
            </div>
          </Card>

          <Card title={<Space><RobotOutlined />Phác đồ kháng sinh AI đề xuất</Space>} size="small"
            extra={selected.canEditPharmacist && !signed ? (
              <Button icon={<CopyOutlined />} disabled={!rows.length} onClick={copyAiProposal}>Sao chép đề xuất AI</Button>
            ) : null}>
            <Alert type="info" showIcon title="Nội dung tham khảo"
              description="AI không tự ghi đè quyết định. Dược sĩ phải chủ động sao chép, hiệu chỉnh và ký xác nhận." style={{ marginBottom: 16 }} />
            <Spin spinning={loadingPlan}>
              {rows.length ? <Table rowKey="key" size="small" pagination={false} columns={columns} dataSource={rows} scroll={{ x: 1075 }} />
                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Phiên bản này chưa có đề xuất kháng sinh." />}
            </Spin>
          </Card>

          <Card title="Kế hoạch chăm sóc kháng sinh" size="small">
            <AntibioticCarePlanPanel plan={carePlan ?? aiCare} />
          </Card>

          <Card title="Quyết định của dược sĩ" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <SystemicAntibioticTreatment key={`systemic-${editorKey}`} ref={systemicRef} guidelinePlan={systemicPlan}
                  readOnly={!selected.canEditPharmacist || signed} />
              </Col>
              <Col xs={24} xl={12}>
                <LocalAntibioticTreatment key={`local-${editorKey}`} ref={localRef} localPlan={localPlan}
                  readOnly={!selected.canEditPharmacist || signed} />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text strong>Nhận xét dược lâm sàng</Text>
              <Input.TextArea value={notes} disabled={!selected.canEditPharmacist || signed}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ghi chú về lựa chọn kháng sinh, chỉnh liều, tương tác hoặc theo dõi..."
                autoSize={{ minRows: 3, maxRows: 8 }} style={{ marginTop: 8 }} />
            </div>
          </Card>

          {selected.canEditPharmacist && !signed ? (
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button icon={<SaveOutlined />} loading={saving} onClick={handleSave}>Lưu nháp</Button>
              <Popconfirm title="Ký xác nhận phác đồ kháng sinh?"
                description="Sau khi ký, nội dung sẽ bị khóa và không thể chỉnh sửa trực tiếp."
                okText="Ký xác nhận" cancelText="Hủy" onConfirm={handleSign}>
                <Button type="primary" icon={<FileDoneOutlined />} loading={signing}>Ký xác nhận</Button>
              </Popconfirm>
            </Space>
          ) : null}
          {signed && selected.canSelectFinal && !selected.finalSelection ? (
            <div style={{ textAlign: 'right' }}>
              <Popconfirm title="Chọn phiên bản kháng sinh này làm quyết định cuối cùng?" onConfirm={handleSelectFinal}>
                <Button type="primary" icon={<CheckCircleOutlined />}>Chọn phác đồ cuối cùng</Button>
              </Popconfirm>
            </div>
          ) : null}
        </Space>
      ) : null}
    </DecisionVersionRail>
  );
};

export default AntibiogramAiVersionTab;

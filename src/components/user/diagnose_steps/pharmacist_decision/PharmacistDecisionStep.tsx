import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Form, Input, Popconfirm, Row, Space, Spin, Typography, message } from 'antd';
import { ArrowLeftOutlined, CopyOutlined, FileDoneOutlined, MedicineBoxOutlined, RobotOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppSelector } from '@/redux/hook';
import {
  callFetchRunClinicalDecision,
  callSavePharmacistClinicalDecision,
  callSignPharmacistClinicalDecision,
} from '@/apis/api';
import type { IAiRecommendationRunDetail } from '@/types/backend';
import type { AntibioticCarePlanData, LocalPlanData, SystemicPlanData } from '@/types/treatmentType';
import { createDiagnosisWorkflowScope, getDiagnosisWorkflowSnapshot } from '@/features/diagnosis/diagnosisWorkflowSession';
import { parseItemJson } from '../treatment_plan/utils/itemJson';
import LocalAntibioticTreatment, { type LocalAntibioticTreatmentHandle } from '../../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import { SystemicAntibioticTreatment, type SystemicAntibioticTreatmentHandle } from '../../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import AntibioticCarePlanPanel from '../../antibiotic/AntibioticCarePlanPanel';

const { Text } = Typography;

interface Props {
  onPrev: () => void;
  onBackToFirstStep: () => void;
}

const emptySystemic = (): SystemicPlanData => ({
  category: 'SYSTEMIC_ANTIBIOTIC', title: 'Quyết định kháng sinh toàn thân', regimenName: 'Phác đồ dược sĩ',
  indication: '', totalDurationWeeks: 0, phases: [], monitoring: [], contraindications: [], notes: '',
});
const emptyLocal = (): LocalPlanData => ({
  category: 'LOCAL_ANTIBIOTIC', title: 'Quyết định kháng sinh tại chỗ', regimenName: 'Phác đồ dược sĩ',
  indication: '', durationDays: 0, durationNote: '', antibiotics: [], monitoring: [], contraindications: [], notes: '',
});
const emptyCare = (): AntibioticCarePlanData => ({ category: 'ANTIBIOTIC_CARE_PLAN', title: 'Kế hoạch chăm sóc kháng sinh', phases: [], monitoringSchedule: [] });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const itemOf = <T,>(detail: IAiRecommendationRunDetail, category: string): T | undefined => {
  const item = detail.items?.find((candidate) => candidate.category === category);
  return item ? parseItemJson(item) as T : undefined;
};

const PharmacistDecisionStep: React.FC<Props> = ({ onPrev, onBackToFirstStep }) => {
  const currentCase = useAppSelector((state) => state.patient.currentCase);
  const workflowScope = useMemo(() => createDiagnosisWorkflowScope(
    currentCase?.patient?.id, currentCase?.episode?.id, 'ANTIBIOTIC',
  ), [currentCase?.episode?.id, currentCase?.patient?.id]);
  const systemicRef = useRef<SystemicAntibioticTreatmentHandle>(null);
  const localRef = useRef<LocalAntibioticTreatmentHandle>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<IAiRecommendationRunDetail>();
  const [systemic, setSystemic] = useState<SystemicPlanData>(emptySystemic);
  const [local, setLocal] = useState<LocalPlanData>(emptyLocal);
  const [care, setCare] = useState<AntibioticCarePlanData>(emptyCare);
  const [notes, setNotes] = useState('');
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<'DRAFT' | 'SIGNED'>();
  const [canEdit, setCanEdit] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const aiSystemic = detail ? itemOf<SystemicPlanData>(detail, 'SYSTEMIC_ANTIBIOTIC') : undefined;
  const aiLocal = detail ? itemOf<LocalPlanData>(detail, 'LOCAL_ANTIBIOTIC') : undefined;
  const aiCare = detail ? itemOf<AntibioticCarePlanData>(detail, 'ANTIBIOTIC_CARE_PLAN') : undefined;
  const runId = detail?.run?.id ? String(detail.run.id) : undefined;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const snapshot = workflowScope ? getDiagnosisWorkflowSnapshot(workflowScope) : null;
        const recommendationDetail = snapshot?.recommendationDetail;
        if (!recommendationDetail?.run?.id) throw new Error('Không tìm thấy phiên bản kháng sinh AI đang mở.');
        if (cancelled) return;
        setDetail(recommendationDetail);
        const response = await callFetchRunClinicalDecision(String(recommendationDetail.run.id));
        if (cancelled) return;
        const decision = response.data?.pharmacistDecision;
        setSystemic(clone(decision?.systemicAntibioticPlanJson ?? emptySystemic()));
        setLocal(clone(decision?.localAntibioticPlanJson ?? emptyLocal()));
        setCare(clone(decision?.carePlanJson ?? emptyCare()));
        setNotes(decision?.notes ?? '');
        setRevision(decision?.revision ?? 0);
        setStatus(decision?.status);
        setCanEdit(response.data?.canEditPharmacist ?? false);
        setEditorKey((value) => value + 1);
      } catch (error: any) {
        message.error(error?.response?.data?.message || error?.message || 'Không thể tải workspace dược sĩ.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [workflowScope]);

  const copyAi = () => {
    setSystemic(clone(aiSystemic ?? emptySystemic()));
    setLocal(clone(aiLocal ?? emptyLocal()));
    setCare(clone(aiCare ?? emptyCare()));
    setEditorKey((value) => value + 1);
    message.success('Đã sao chép đề xuất AI vào bản nháp của dược sĩ.');
  };

  const persist = async () => {
    if (!runId || !canEdit || status === 'SIGNED') return undefined;
    const response = await callSavePharmacistClinicalDecision(runId, {
      systemicAntibioticPlanJson: systemicRef.current?.getData() as Record<string, any>,
      localAntibioticPlanJson: localRef.current?.getData() as Record<string, any>,
      carePlanJson: care as unknown as Record<string, any>, notes, revision,
    });
    const decision = response.data?.pharmacistDecision;
    if (!decision) throw new Error('Không nhận được quyết định đã lưu.');
    setRevision(decision.revision);
    setStatus(decision.status);
    return decision;
  };

  const save = async () => {
    setSaving(true);
    try { await persist(); message.success('Đã lưu bản nháp của dược sĩ.'); }
    catch (error: any) { message.error(error?.response?.data?.message || error?.message || 'Không thể lưu quyết định.'); }
    finally { setSaving(false); }
  };

  const sign = async () => {
    setSaving(true);
    try {
      const saved = await persist();
      if (!saved || !runId) return;
      const response = await callSignPharmacistClinicalDecision(runId, saved.revision);
      setRevision(response.data?.pharmacistDecision?.revision ?? saved.revision);
      setStatus('SIGNED'); setCanEdit(false);
      message.success('Đã ký quyết định dược sĩ. Phiên bản hiện ở chế độ chỉ đọc.');
    } catch (error: any) { message.error(error?.response?.data?.message || 'Không thể ký quyết định.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ minHeight: 440, display: 'grid', placeItems: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ minHeight: '100%', background: '#f4f8fb', paddingBottom: 40 }}>
      <Card size="small" style={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 10 }} styles={{ body: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' } }}>
        <Space><MedicineBoxOutlined style={{ color: '#0891b2', fontSize: 22 }} /><div><Text strong>Quyết định của dược sĩ</Text><div><Text type="secondary">Phiên bản kháng sinh #{runId}</Text></div></div></Space>
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>Quay lại</Button>
          <Button icon={<SaveOutlined />} disabled={!canEdit || status === 'SIGNED'} loading={saving} onClick={save}>Lưu nháp</Button>
          <Popconfirm title="Ký xác nhận quyết định dược sĩ?" description="Sau khi ký, phiên bản sẽ bị khóa." onConfirm={sign}>
            <Button type="primary" icon={<FileDoneOutlined />} disabled={!canEdit || status === 'SIGNED'} loading={saving}>Ký xác nhận</Button>
          </Popconfirm>
        </Space>
      </Card>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: 24 }}>
        {!canEdit ? <Alert showIcon type="info" message="Chế độ chỉ xem" description={status === 'SIGNED' ? 'Quyết định đã ký và không thể sửa.' : 'Phiên bản này thuộc dược sĩ khác.'} style={{ marginBottom: 16 }} /> : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={10}>
            <Card size="small" title={<Space><RobotOutlined />Đề xuất AI · chỉ đọc</Space>} extra={canEdit && status !== 'SIGNED' ? <Button icon={<CopyOutlined />} onClick={copyAi}>Sao chép sang quyết định</Button> : null}>
              <AntibioticCarePlanPanel plan={aiCare} />
            </Card>
          </Col>
          <Col xs={24} xl={14}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <Card size="small" title="Phác đồ chính thức do dược sĩ sở hữu">
                <Row gutter={[16, 16]}>
                  <Col xs={24} xxl={12}><SystemicAntibioticTreatment key={`s-${editorKey}`} ref={systemicRef} guidelinePlan={systemic} readOnly={!canEdit || status === 'SIGNED'} /></Col>
                  <Col xs={24} xxl={12}><LocalAntibioticTreatment key={`l-${editorKey}`} ref={localRef} localPlan={local} readOnly={!canEdit || status === 'SIGNED'} /></Col>
                </Row>
              </Card>
              <Card size="small" title="Kế hoạch chăm sóc và theo dõi">
                <Form layout="vertical">
                  <Row gutter={12}>
                    <Col xs={24} md={8}><Form.Item label="Ngày dự kiến dừng"><DatePicker style={{ width: '100%' }} disabled={!canEdit || status === 'SIGNED'} value={care.plannedStopDate ? dayjs(care.plannedStopDate) : null} onChange={(date) => setCare((value) => ({ ...value, plannedStopDate: date?.format('YYYY-MM-DD') }))} /></Form.Item></Col>
                    <Col xs={24} md={16}><Form.Item label="Đánh giá chỉnh liều theo thận"><Input disabled={!canEdit || status === 'SIGNED'} value={care.renalDosing?.assessment} onChange={(event) => setCare((value) => ({ ...value, renalDosing: { ...value.renalDosing, assessment: event.target.value } }))} /></Form.Item></Col>
                  </Row>
                  <Form.Item label="Nhận xét dược lâm sàng"><Input.TextArea autoSize={{ minRows: 3, maxRows: 7 }} disabled={!canEdit || status === 'SIGNED'} value={notes} onChange={(event) => setNotes(event.target.value)} /></Form.Item>
                </Form>
                <AntibioticCarePlanPanel plan={care} compact />
              </Card>
            </Space>
          </Col>
        </Row>
        {status === 'SIGNED' ? <div style={{ marginTop: 20, textAlign: 'right' }}><Button type="primary" onClick={onBackToFirstStep}>Hoàn tất</Button></div> : null}
      </div>
    </div>
  );
};

export default PharmacistDecisionStep;

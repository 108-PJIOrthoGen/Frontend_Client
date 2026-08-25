import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, Breadcrumb, Button, Card, Popconfirm, Space, Steps, Tag, Typography } from 'antd';
import {
  ArrowLeftOutlined, CalendarOutlined, HomeOutlined, LogoutOutlined,
  MedicineBoxOutlined, RightOutlined, SwapOutlined, UserOutlined,
} from '@ant-design/icons';
import { Step1PatientSelection } from '@/components/user/diagnose_steps/select_object/PatientSelection';
import { S5AssessmentPji } from '@/components/user/diagnose_steps/assessment_pji/AssessmentPji';
import { TreatmentPlan } from '@/components/user/diagnose_steps/treatment_plan/TreatmentPlan';
import DataCompletenessStep from '@/components/user/diagnose_steps/check_completeness/DataCompletenessStep';
import PharmacistDecisionStep from '@/components/user/diagnose_steps/pharmacist_decision/PharmacistDecisionStep';
import AntibioticCarePlanWorkspace from '@/components/user/antibiotic/AntibioticCarePlanWorkspace';
import { useDiagnosisWorkflow } from './hooks/useDiagnosisWorkflow';
import antibioticRecommendationImage from '@/assets/images/antibio-logo1.png';
import antibioticMonitoringImage from '@/assets/images/antibio-logo2.png';

const { Paragraph, Text, Title } = Typography;
type WorkspaceMode = 'GENERATE' | 'MONITOR' | null;

const AntibioticCarePlanner: React.FC = () => {
  const location = useLocation();
  const linkedRunId = useMemo(
    () => new URLSearchParams(location.search).get('runId'),
    [location.search],
  );
  const [mode, setMode] = useState<WorkspaceMode>(() => linkedRunId ? 'GENERATE' : null);
  const workflow = useDiagnosisWorkflow('ANTIBIOTIC');
  const { currentCase, currentStep } = workflow;

  useEffect(() => {
    if (linkedRunId) setMode('GENERATE');
  }, [linkedRunId]);

  const generationSteps = useMemo(() => [
    { title: 'Chọn hồ sơ', content: <Step1PatientSelection recommendationScope="ANTIBIOTIC" onNext={workflow.next} autoOpenSearch={workflow.autoOpenSearch} onAutoSearchConsumed={workflow.consumeAutoOpenSearch} /> },
    { title: 'Đánh giá vi sinh', content: <S5AssessmentPji recommendationScope="ANTIBIOTIC" onNext={workflow.next} onPrev={workflow.prev} /> },
    { title: 'Phác đồ kháng sinh', content: <TreatmentPlan recommendationScope="ANTIBIOTIC" onPrev={workflow.prev} onNext={workflow.next} /> },
    { title: 'Bổ sung dữ liệu', content: <DataCompletenessStep recommendationScope="ANTIBIOTIC" onNext={workflow.next} onPrev={workflow.prev} /> },
    { title: 'Quyết định dược sĩ', content: <PharmacistDecisionStep onPrev={workflow.prev} onBackToFirstStep={workflow.backToFirstStep} /> },
  ], [workflow]);

  const leaveWorkspace = () => {
    workflow.backToFirstStep();
    setMode(null);
  };

  if (!mode) {
    return (
      <div className="h-full overflow-y-auto bg-[#f4f8fb] px-6 py-10">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-8">
            <Tag color="cyan" icon={<MedicineBoxOutlined />}>Workspace dược lâm sàng</Tag>
            <Title level={2} style={{ margin: '14px 0 8px' }}>Hoạch định kháng sinh toàn diện</Title>
            <Paragraph type="secondary" style={{ maxWidth: 760, fontSize: 15 }}>
              Sinh phác đồ đúng phạm vi dược sĩ, ký quyết định độc lập theo từng phiên bản và theo dõi lộ trình điều trị từ nội trú đến OPAT/chuyển uống.
            </Paragraph>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card hoverable className="h-full overflow-hidden" styles={{ body: { height: '100%', padding: 0 } }} onClick={() => setMode('GENERATE')}>
              <div className="grid h-full min-h-[292px] grid-cols-[minmax(120px,0.85fr)_minmax(0,1.35fr)] sm:grid-cols-[minmax(160px,0.85fr)_minmax(0,1.35fr)]">
                <div className="flex min-w-0 items-center justify-center bg-[#f0edff] p-4 sm:p-6">
                  <img className="h-full max-h-[250px] w-full object-contain" src={antibioticRecommendationImage} alt="Minh họa khuyến nghị phác đồ kháng sinh" decoding="async" />
                </div>
                <div className="flex min-w-0 flex-col justify-between gap-6 p-5 sm:p-7">
                  <div>
                    <Title level={3} style={{ marginTop: 0 }}>Khuyến nghị phác đồ kháng sinh</Title>
                    <Paragraph type="secondary">Quy trình 5 bước: chọn hồ sơ, đánh giá, sinh đề xuất kháng sinh, rà soát dữ liệu và quyết định dược sĩ.</Paragraph>
                  </div>
                  <Button type="primary" size="large" icon={<RightOutlined />}>Bắt đầu sinh phác đồ</Button>
                </div>
              </div>
            </Card>
            <Card hoverable className="h-full overflow-hidden" styles={{ body: { height: '100%', padding: 0 } }} onClick={() => setMode('MONITOR')}>
              <div className="grid h-full min-h-[292px] grid-cols-[minmax(120px,0.85fr)_minmax(0,1.35fr)] sm:grid-cols-[minmax(160px,0.85fr)_minmax(0,1.35fr)]">
                <div className="min-w-0 overflow-hidden bg-emerald-50">
                  <img className="h-full w-full object-cover" src={antibioticMonitoringImage} alt="Minh họa theo dõi điều trị kháng sinh" decoding="async" />
                </div>
                <div className="flex min-w-0 flex-col justify-between gap-6 p-5 sm:p-7">
                  <div>
                    <Title level={3} style={{ marginTop: 0 }}>Theo dõi điều trị</Title>
                    <Paragraph type="secondary">Xem 3 giai đoạn, ngày dừng thuốc, chỉnh liều theo thận, TDM, tương tác và lịch xét nghiệm an toàn.</Paragraph>
                  </div>
                  <Button size="large" icon={<CalendarOutlined />}>Mở kế hoạch theo dõi</Button>
                </div>
              </div>
            </Card>
          </div>
          <Alert style={{ marginTop: 24 }} showIcon type="info" message="Ranh giới an toàn" description="AI chỉ tạo đề xuất. Dược sĩ là người sao chép, hiệu chỉnh và ký; hệ thống không tự phát hành y lệnh hoặc tự đổi liều." />
        </div>
      </div>
    );
  }

  if (mode === 'MONITOR') {
    return <AntibioticCarePlanWorkspace onBack={leaveWorkspace} />;
  }

  const items = generationSteps.map((step, index) => ({ title: step.title, disabled: index > currentStep }));
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-50">
      <div className="z-10 border-b border-slate-200 bg-white px-8 py-5 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-4">
          <Breadcrumb items={[{ title: <HomeOutlined />, onClick: leaveWorkspace }, { title: 'Hoạch định kháng sinh' }, { title: <span className="text-primary">Bước {currentStep + 1}</span> }]} />
          {currentCase?.patient && currentStep > 0 ? (
            <Space wrap>
              <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5"><UserOutlined /><b>{currentCase.patient.fullName}</b>{currentCase.patient.patientCode ? <Tag color="cyan">{currentCase.patient.patientCode}</Tag> : null}</div>
              <Button icon={<SwapOutlined />} onClick={workflow.changePatient}>Đổi bệnh nhân</Button>
              <Popconfirm title="Thoát workspace hiện tại?" onConfirm={leaveWorkspace}><Button danger icon={<LogoutOutlined />}>Thoát</Button></Popconfirm>
            </Space>
          ) : <Button icon={<ArrowLeftOutlined />} onClick={leaveWorkspace}>Về workspace</Button>}
        </div>
        <Steps current={currentStep} items={items} onChange={workflow.selectStep} size="small" className="mt-4" />
      </div>
      <div className="relative flex-1 overflow-y-auto">{generationSteps[currentStep]?.content}</div>
    </div>
  );
};

export default AntibioticCarePlanner;
